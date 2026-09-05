# Design Document — reports-multi-department

## Overview

เอกสารออกแบบนี้กำหนดวิธีแก้ไขหน้ารายงาน (`ReportsPage`) ของ mockup ระบบสารบรรณ Phase 2 ให้ "เรียกข้อมูลถูกต้อง" ตามข้อเท็จจริงว่า **เอกสาร 1 ฉบับเกี่ยวข้องกับหลายฝ่ายพร้อมกัน** ผ่านงานย่อย (Sub-assignment) โดย:

1. เพิ่มฟังก์ชันช่วย (helpers) แบบ **บริสุทธิ์ (pure) และ Deterministic** ใน `src/mock.ts` เพื่อคำนวณฝ่ายที่เกี่ยวข้อง (Involved Departments), ผลรวมรายฝ่ายแบบนับหลายฝ่าย (By-Department Aggregate) และผลรวมประสิทธิภาพการรับงานจาก Sub-assignment จริง (Receive Performance Aggregate)
2. แก้ไข `src/pages/ReportsPage.tsx` ให้เลิกใช้ `Math.random()` และค่าคงที่ที่ตายตัว หันมาใช้ helpers เหล่านั้น พร้อมทำให้ตัวกรอง (`dateFrom`/`dateTo`/`filterDept`/`filterDirection`) และปุ่ม "แสดงรายงาน" ทำงานจริง
3. ปรับปรุงเอกสารวิเคราะห์ `P2026-040_Analysis.md` (documentation-only) ให้ระบุกติกาการนับหลายฝ่าย + Change Log (Draft 1.8.8 → 1.8.9) โดย **คงเนื้อหา State Machine เดิมไว้**

ขอบเขตเป็น **frontend-only** (React + TypeScript + Tailwind + Vite) ใช้ mock data เท่านั้น ไม่มี backend / database / auth จริง และ **ไม่มี test framework** การตรวจสอบความถูกต้องทำผ่าน `pnpm build` และ `pnpm exec tsc --noEmit` คงธีม Deves (Navy `#012169` + Gold `#FFCD00`) และภาษาไทยใน UI ตามเดิม

### Non-Goals

- ไม่เพิ่ม backend, API, หรือฐานข้อมูลจริง
- ไม่เพิ่ม test framework (property/unit tests) — Correctness Properties เป็นส่วน **optional** เพื่อการอ้างอิงเชิงตรรกะและงานในอนาคต
- ไม่เปลี่ยนโครงสร้าง `types.ts`, `DOCUMENTS`, `SUB_ASSIGNMENTS`, `DEPARTMENTS` (ใช้ข้อมูลเดิม)
- ไม่แก้ State Machine ในเอกสารวิเคราะห์

## Architecture

### Data-derivation flow

```
                 ┌────────────────────────────────────────────┐
                 │              src/mock.ts (data)             │
                 │  DOCUMENTS[]   SUB_ASSIGNMENTS{}   DEPARTMENTS[] │
                 └───────────────┬────────────────────────────┘
                                 │  (pure, deterministic helpers)
                 ┌───────────────▼────────────────────────────┐
                 │  getInvolvedDepartments(docId)              │
                 │  getDocumentsInvolvingDepartment(dept)      │
                 │  reportByDepartment(docs?)                  │
                 │  reportReceivePerformance(docs?)            │
                 └───────────────┬────────────────────────────┘
                                 │  import
                 ┌───────────────▼────────────────────────────┐
                 │        src/pages/ReportsPage.tsx            │
                 │  Report_Filters (state) ──► filteredDocuments │
                 │            │                                 │
                 │            ├─ volume   → MONTHLY_DATA (+dir)  │
                 │            ├─ overdue  → filtered + chips     │
                 │            ├─ by-dept  → reportByDepartment() │
                 │            ├─ receive  → reportReceivePerf()  │
                 │            └─ performance → PERFORMANCE_DATA  │
                 └─────────────────────────────────────────────┘

  P2026-040_Analysis.md  ── (documentation-only, independent) ──►  RPT-01..06 semantics
```

หลักการสำคัญ: **helpers เป็นแหล่งความจริงเดียว (single source of truth)** สำหรับตรรกะการนับ ส่วน `ReportsPage` ทำหน้าที่เพียง "กรอง → ส่งเข้า helper → เรนเดอร์" ทำให้ตรรกะทดสอบ/ตรวจสอบได้แยกจาก UI

### File-level parallelism

| ลำดับ | ไฟล์ | สถานะพึ่งพา |
| --- | --- | --- |
| 1 (foundational) | `src/mock.ts` | ต้องทำก่อน — เพิ่ม helpers |
| 2 | `src/pages/ReportsPage.tsx` | พึ่งพา helpers ใน (1) |
| อิสระ | `Phase2_in_out_document/P2026-040_Analysis.md` | ทำขนานได้ ไม่พึ่งพาโค้ด |

## Components and Interfaces

### 1. `src/mock.ts` — helper functions (วางต่อจาก `SUB_ASSIGNMENTS`)

Helpers ทั้งหมดเป็นฟังก์ชันบริสุทธิ์ (ไม่มี side-effect, ไม่ใช้ `Math.random`, ไม่ใช้ `Date.now()`) และอ่านจาก `DOCUMENTS`, `SUB_ASSIGNMENTS`, `DEPARTMENTS` ที่อยู่ในโมดูลเดียวกัน

#### 1.1 `getInvolvedDepartments`

```ts
/**
 * REQ 1 — คืนเซตฝ่ายที่เอกสารหนึ่งฉบับเกี่ยวข้อง (Involved Departments) แบบไม่ซ้ำ
 * union ของ:
 *   - department ของทุก Sub_Assignment (ทุกสถานะ) ของเอกสารนั้น
 *   - doc.department (ฝ่ายที่รับผิดชอบ)
 *   - doc.originDepartment (ฝ่ายต้นทาง)
 * ถ้าไม่มี Sub_Assignment → [doc.department, doc.originDepartment] (dedup)
 * ถ้าไม่พบ docId → [] (graceful)
 * Deterministic, ไม่มี randomness
 */
export function getInvolvedDepartments(docId: string): string[]
```

พฤติกรรม:
- `const doc = DOCUMENTS.find(d => d.id === docId)` ถ้า `!doc` → คืน `[]`
- `const subs = SUB_ASSIGNMENTS[docId] ?? []`
- รวมค่า: `[...subs.map(s => s.department), doc.department, doc.originDepartment]`
- dedup ด้วยลำดับที่เสถียร: ใช้ `Array.from(new Set(list))` (คงลำดับการพบครั้งแรก → deterministic)
- กรองค่าว่าง/undefined ออก (safety): `.filter(Boolean)`

> หมายเหตุ: เมื่อไม่มี subs รายการที่ได้คือ `[doc.department, doc.originDepartment]` (dedup) ซึ่งครอบคลุมกรณี REQ 1.4 (`[doc.department]`) เมื่อ `department === originDepartment` ผลลัพธ์จะยุบเหลือฝ่ายเดียวโดยอัตโนมัติ

#### 1.2 `getDocumentsInvolvingDepartment`

```ts
/** REQ 2 — เอกสารทุกฉบับที่ dept อยู่ใน Involved Departments ของมัน */
export function getDocumentsInvolvingDepartment(dept: string): Document[]
```

พฤติกรรม: `DOCUMENTS.filter(d => getInvolvedDepartments(d.id).includes(dept))`

#### 1.3 `reportByDepartment`

```ts
export interface DeptAggregateRow {
  dept: string
  total: number
  completed: number
  overdue: number
}

/**
 * REQ 2 — ผลรวมรายฝ่ายแบบนับหลายฝ่าย สำหรับทุกฝ่ายใน DEPARTMENTS
 * @param docs ขอบเขตเอกสาร (optional) เพื่อรองรับตัวกรองของหน้า; ค่าเริ่มต้น = DOCUMENTS
 *  - total     = จำนวนเอกสารใน docs ที่ dept อยู่ใน involved departments
 *  - completed = subset ที่ status === 'completed'
 *  - overdue   = subset ที่ deadlineFlag === 'overdue'
 * Deterministic, ไม่มี Math.random
 */
export function reportByDepartment(docs: Document[] = DOCUMENTS): DeptAggregateRow[]
```

พฤติกรรม: `DEPARTMENTS.map(dept => { const involved = docs.filter(d => getInvolvedDepartments(d.id).includes(dept)); return { dept, total: involved.length, completed: involved.filter(d => d.status === 'completed').length, overdue: involved.filter(d => d.deadlineFlag === 'overdue').length } })`

> การรับ `docs` เป็นพารามิเตอร์ (มีค่าเริ่มต้น) ทำให้หน้า Reports ส่ง `filteredDocuments` เข้าไปได้ ทำให้ตัวกรอง direction/date สะท้อนในรายงานตามฝ่ายโดยไม่ต้องเขียนตรรกะซ้ำ

#### 1.4 `reportReceivePerformance`

```ts
export interface ReceivePerfRow {
  dept: string
  assigned: number
  accepted: number
  rejected: number
  recalled: number
  rejectRate: number   // จำนวนเต็ม 0..100
}

/**
 * REQ 3 — ผลรวมประสิทธิภาพการรับงาน คำนวณจาก Sub_Assignment จริง
 * รวบรวม subs จากทุกเอกสารใน scope (docs) แล้วจัดกลุ่มตาม sub.department
 *  - assigned  = จำนวน Countable_Sub (status !== 'cancelled')
 *  - accepted  = status ∈ {'accepted','success'}
 *  - rejected  = status === 'rejected'
 *  - recalled  = status === 'recalled'
 *  - rejectRate = assigned > 0 ? Math.round(rejected / assigned * 100) : 0
 * คืนเฉพาะฝ่ายที่ปรากฏใน sub-assignments (assigned > 0) เรียงตามลำดับใน DEPARTMENTS
 * Deterministic
 */
export function reportReceivePerformance(docs: Document[] = DOCUMENTS): ReceivePerfRow[]
```

พฤติกรรม:
- รวบรวม subs ในขอบเขต: `const subs = docs.flatMap(d => SUB_ASSIGNMENTS[d.id] ?? [])`
- สำหรับแต่ละ `dept` ใน `DEPARTMENTS` (คงลำดับ master): กรอง `deptSubs = subs.filter(s => s.department === dept)`
  - `countable = deptSubs.filter(s => s.status !== 'cancelled')`
  - `assigned = countable.length`
  - `accepted = deptSubs.filter(s => s.status === 'accepted' || s.status === 'success').length`
  - `rejected = deptSubs.filter(s => s.status === 'rejected').length`
  - `recalled = deptSubs.filter(s => s.status === 'recalled').length`
  - `rejectRate = assigned > 0 ? Math.round((rejected / assigned) * 100) : 0`
- คืนเฉพาะแถวที่ `assigned > 0` (เลี่ยงแถวว่าง) เรียงตามลำดับ `DEPARTMENTS` — deterministic

> เลือกนับ `accepted`/`rejected`/`recalled` จาก `deptSubs` (ก่อนกรอง cancelled) เพราะสถานะเหล่านี้ไม่ใช่ cancelled อยู่แล้ว จึงให้ผลเท่ากับการนับจาก `countable` — คงความสอดคล้องกับตัวหาร `assigned`

### 2. `src/pages/ReportsPage.tsx` — การเปลี่ยนแปลง

#### 2.1 Imports

```ts
import {
  DOCUMENTS, MONTHLY_DATA, DEPARTMENTS, AUDIT_REPORT,
  getInvolvedDepartments, reportByDepartment, reportReceivePerformance,
} from '../mock'
```

- เอา `RECEIVE_PERFORMANCE` ออกจากการใช้งานโดยตรง (คงไว้ใน mock.ts เป็นข้อมูลอ้างอิงได้ แต่หน้าใช้ผลคำนวณจริง)

#### 2.2 Filtered documents (derived, reactive)

สร้าง `filteredDocuments` จาก `DOCUMENTS` โดยอิงค่า state ปัจจุบัน (คำนวณทุกครั้งที่เรนเดอร์ → ตัวกรองมีผลทันที):

```ts
const filteredDocuments = DOCUMENTS.filter(d => {
  // REQ 7.2 — ทิศทางเอกสาร
  if (filterDirection !== 'all' && d.docDirection !== filterDirection) return false
  // REQ 7.1 — ฝ่ายที่เกี่ยวข้อง (involved, ไม่ใช่แค่ responsible)
  if (filterDept !== 'all' && !getInvolvedDepartments(d.id).includes(filterDept)) return false
  // REQ 7.3 — ช่วงวันที่ (เทียบ lexicographic กับ 'YYYY-MM-DD')
  //   ใช้ receivedAt เป็นหลัก และ deadline เป็นตัวเผื่อ; ผ่านถ้าฟิลด์ใดฟิลด์หนึ่งอยู่ในช่วง
  const inRange = (v: string) => (!dateFrom || v >= dateFrom) && (!dateTo || v <= dateTo)
  if (!(inRange(d.receivedAt) || inRange(d.deadline))) return false
  return true
})
```

- **การกรองเป็น reactive อยู่แล้ว** (คำนวณตอนเรนเดอร์) — REQ 7.4/7.5 จึงเป็นจริงโดยธรรมชาติ
- ปุ่ม "แสดงรายงาน" คงไว้เพื่อความคุ้นเคยของผู้ใช้ แต่ทำหน้าที่เป็น affirm/no-op ที่สอดคล้อง (ไม่จำเป็นต้องกดเพราะกรองทันที) — ระบุ `type="button"` และอาจใช้ `onClick` เป็น no-op หรือกระตุ้น state ที่ reactive อยู่แล้ว
- **หมายเหตุการเทียบวันที่:** ฟอร์แมตทุกค่าเป็น `พ.ศ. 'YYYY-MM-DD'` ที่สอดคล้องกัน (เช่น `2568-08-10`) การเทียบสตริงแบบ lexicographic จึงให้ผลลำดับถูกต้องโดยไม่ต้องแปลงเป็น Date

#### 2.3 การเปลี่ยนแปลงต่อรายงานแต่ละชนิด

| Report | เดิม | ใหม่ |
| --- | --- | --- |
| **by-dept** | `DEPT_DATA` (ใช้ `DOCUMENTS.filter(d.department === dept)` + `Math.random()` fallback) | `const deptData = reportByDepartment(filteredDocuments)` — ลบ `DEPT_DATA` ทิ้ง; เพิ่มหมายเหตุ (ดูด้านล่าง). ตาราง/กราฟใช้ `total/completed/overdue`; `%` = `total>0 ? Math.round(completed/total*100) : 0` |
| **receive** | `RECEIVE_PERFORMANCE` (static import) | `const receiveData = reportReceivePerformance(filteredDocuments)` — ตาราง/กราฟใช้ field เดิม (`assigned/accepted/rejected/recalled/rejectRate`) |
| **performance** | `PERFORMANCE_DATA` ชื่อฝ่ายผิด (`ฝ่าย HR`, `ฝ่าย IT`, ...) | แก้ชื่อฝ่ายให้อยู่ใน `DEPARTMENTS` จริง + เพิ่มป้าย "ค่าตัวอย่าง (illustrative)"; ค่าเป็น deterministic คงที่ (ไม่สุ่ม) |
| **overdue** | `overdueList = DOCUMENTS.filter(...)`, แสดง `doc.department` เดี่ยว | `const overdueList = filteredDocuments.filter(d => d.deadlineFlag === 'overdue' || d.deadlineFlag === 'due-soon')`; คอลัมน์ "ฝ่ายที่เกี่ยวข้อง" เรนเดอร์ chips จาก `getInvolvedDepartments(doc.id)` |
| **volume** | `MONTHLY_DATA` + การ์ดสรุปคงที่ | คง `MONTHLY_DATA`; การ์ดสรุปสะท้อน `filterDirection` เท่าที่ทำได้ (แสดงเฉพาะรับเข้า/ส่งออกเมื่อเลือกทิศทาง) — คงความเรียบง่าย |
| **audit** | `AUDIT_REPORT` | ไม่เปลี่ยน |

**หมายเหตุ by-dept (REQ 2.5 / 4.3):** เพิ่มข้อความในบริเวณรายงานตามฝ่าย:

> `1 เอกสารเกี่ยวข้องได้หลายฝ่าย ยอดรวมรายฝ่ายจึงอาจมากกว่าจำนวนเอกสารจริง`

**Performance_Data ที่แก้ไข (page-level constant, ใช้ชื่อ `DEPARTMENTS` จริง):**

```ts
// ค่าตัวอย่างเพื่อการสาธิต (illustrative) — deterministic, ชื่อฝ่ายอยู่ใน DEPARTMENTS จริง
const PERFORMANCE_DATA = [
  { dept: 'ฝ่ายการเงิน',        avg: 3.2, target: 2, overdue: 2 },
  { dept: 'ฝ่ายวิศวกรรม',       avg: 5.8, target: 3, overdue: 3 },
  { dept: 'ฝ่ายกฎหมาย',         avg: 2.1, target: 2, overdue: 0 },
  { dept: 'ฝ่ายทรัพยากรบุคคล',  avg: 1.8, target: 2, overdue: 0 },
  { dept: 'ฝ่ายพัสดุและจัดซื้อ', avg: 4.3, target: 3, overdue: 1 },
  { dept: 'ฝ่ายสารสนเทศ',       avg: 2.6, target: 2, overdue: 1 },
]
```

พร้อมป้ายกำกับใกล้หัวข้อ เช่น badge/ข้อความ `ค่าตัวอย่าง (illustrative)` (REQ 6.2)

### 3. `P2026-040_Analysis.md` — documentation-only

- เพิ่ม/ปรับหมายเหตุกติกาการนับ: เอกสารที่เกี่ยวข้องหลายฝ่ายจะถูกนับ **ภายใต้ทุกฝ่ายที่เกี่ยวข้อง** ในรายงานที่จัดกลุ่มตามฝ่าย (RPT-01..04) และรายงานประสิทธิภาพการรับงาน (RPT-06) คำนวณจาก Sub_Assignment จริง
- ปรับความหมาย RPT-01 ถึง RPT-06 ให้สอดคล้อง (ยอดรวมรายฝ่ายอาจ > จำนวนเอกสารจริง)
- เพิ่มรายการ Change Log **Draft 1.8.9** (ต่อจาก 1.8.8) ระบุว่าเป็นการปรับนิยามรายงานหลายฝ่าย + แก้ helpers ใน mockup โดย **ไม่กระทบ State Machine (หมวด 6)**
- คงส่วน State Machine เดิมไว้ทั้งหมด (REQ 10.5)

## Data Models

ไม่มีการเพิ่ม/แก้ไข interface ใน `types.ts` — ใช้ `Document`, `SubAssignment`, `SubStatus`, `DeadlineFlag`, `DocDirection` เดิม

เพิ่ม type ผลลัพธ์ของ helper (export จาก `mock.ts`):

```ts
export interface DeptAggregateRow { dept: string; total: number; completed: number; overdue: number }
export interface ReceivePerfRow  { dept: string; assigned: number; accepted: number; rejected: number; recalled: number; rejectRate: number }
```

ความสัมพันธ์ที่ใช้:
- `Document.status === 'completed'` → นับ completed
- `Document.deadlineFlag === 'overdue' | 'due-soon'` → รายงานงานค้าง / นับ overdue
- `SubAssignment.status !== 'cancelled'` → Countable_Sub (สอดคล้อง BR-2.5)
- `SubAssignment.status ∈ {'accepted','success'}` → accepted

## Error Handling

การออกแบบเป็น pure functions บน mock data จึงเน้น "ความทนต่อ input ที่ไม่สมบูรณ์" มากกว่า try/catch:

| กรณี | การจัดการ |
| --- | --- |
| `docId` ไม่พบใน `DOCUMENTS` | `getInvolvedDepartments` คืน `[]` (ไม่ throw) |
| เอกสารไม่มี Sub_Assignment (`SUB_ASSIGNMENTS[docId]` undefined) | ใช้ `?? []` → คืน `[doc.department, doc.originDepartment]` (dedup) |
| ค่าฝ่ายว่าง/undefined | `.filter(Boolean)` ก่อน dedup |
| หารด้วยศูนย์ (`assigned === 0`) | `rejectRate` ถูกกำหนดเป็น `0` (ไม่เกิด `NaN`/`Infinity`) — REQ 3.6 |
| `total === 0` ในการคำนวณ `%` เสร็จ | guard `total > 0 ? ... : 0` |
| ตัวกรองว่าง (`dateFrom`/`dateTo` = '') | เงื่อนไข `!dateFrom || ...` ทำให้ผ่านทั้งหมด (neutral) |
| การเทียบวันที่ | เทียบสตริง lexicographic บนฟอร์แมต `'YYYY-MM-DD'` ที่สม่ำเสมอ — ไม่แปลงเป็น `Date` เพื่อเลี่ยงปัญหา timezone/พ.ศ. |
| ฝ่ายไม่มี sub เลย | `reportReceivePerformance` ไม่คืนแถวนั้น (assigned = 0) |

## Correctness Properties

> **หมายเหตุ (Optional):** โปรเจกต์นี้เป็น frontend mockup **ไม่มี test framework** ส่วนนี้จึงเป็น **ทางเลือก (optional)** เพื่อบันทึกค่าคงที่เชิงตรรกะ (invariants) สำหรับการตรวจสอบด้วยเหตุผลและงานทดสอบในอนาคต การตรวจสอบจริงในงานนี้ทำผ่าน `pnpm build` + `pnpm exec tsc --noEmit`
>
> *A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Involved departments are deduped and deterministic

*For any* `docId`, ผลลัพธ์ของ `getInvolvedDepartments(docId)` เป็นอาร์เรย์ที่ไม่มีค่าฝ่ายซ้ำกัน และการเรียกซ้ำด้วย input เดิมให้ผลลัพธ์เหมือนเดิมทุกครั้ง (ไม่มี randomness)

**Validates: Requirements 1.1, 1.5, 1.6**

### Property 2: Involved departments cover subs, responsible, and origin

*For any* เอกสารที่พบใน `DOCUMENTS` ผลลัพธ์ `getInvolvedDepartments(doc.id)` ต้องมีสมาชิกครบทั้ง `department` ของทุก Sub_Assignment ของเอกสารนั้น รวมกับ `doc.department` และ `doc.originDepartment`; และเมื่อไม่มี Sub_Assignment ผลลัพธ์เท่ากับ `[doc.department, doc.originDepartment]` (dedup)

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 3: A document is counted under every department it involves

*For any* ขอบเขตเอกสาร `docs` ผลรวม `total` ข้ามทุกฝ่ายจาก `reportByDepartment(docs)` เท่ากับผลรวมของขนาด `getInvolvedDepartments(d.id) ∩ DEPARTMENTS` ของทุกเอกสารใน `docs` (เอกสารหนึ่งฉบับถูกนับหนึ่งครั้งต่อฝ่ายที่เกี่ยวข้อง)

**Validates: Requirements 2.1, 2.2**

### Property 4: Completed and overdue counts are bounded and deterministic

*For any* แถวใน `reportByDepartment(docs)` ค่า `completed ≤ total` และ `overdue ≤ total` เสมอ และการคำนวณเป็น deterministic (ไม่ใช้ `Math.random`)

**Validates: Requirements 2.3, 2.4**

### Property 5: Receive-performance counts match sub-assignment statuses

*For any* แถวจาก `reportReceivePerformance(docs)` ค่า `assigned` เท่ากับจำนวน Sub_Assignment ของฝ่ายที่ `status !== 'cancelled'`, `accepted` เท่ากับจำนวน status ∈ {`accepted`,`success`}, `rejected`/`recalled` เท่ากับจำนวนสถานะที่ตรงกัน

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7**

### Property 6: Reject rate stays within [0, 100] with zero-guard

*For any* แถวจาก `reportReceivePerformance(docs)` ค่า `rejectRate` เป็นจำนวนเต็มในช่วง `[0, 100]` และเท่ากับ `0` เมื่อ `assigned === 0` (ไม่มี `NaN`)

**Validates: Requirements 3.5, 3.6**

### Property 7: Filter soundness and neutral-filter identity

*For any* ค่า `filterDept`/`filterDirection`/ช่วงวันที่ ทุกเอกสารใน `filteredDocuments` ต้องผ่านทุกเงื่อนไขที่ถูกเลือก (ฝ่ายที่เลือกอยู่ใน involved departments, ทิศทางตรงกัน, วันที่อยู่ในช่วง); และเมื่อทุกตัวกรองเป็น 'all'/ช่วงวันที่ครอบคลุมทั้งหมด `filteredDocuments` เท่ากับ `DOCUMENTS`

**Validates: Requirements 7.1, 7.2, 7.3, 7.5**

## Testing Strategy

เนื่องจากไม่มี test framework การตรวจสอบใช้ 2 กลไกหลัก:

1. **Build & type check (บังคับ — REQ 11):**
   - `pnpm build` ต้องสำเร็จโดยไม่มี error ใหม่
   - `pnpm exec tsc --noEmit` ต้องผ่านการตรวจชนิดข้อมูลโดยไม่มี error ใหม่
2. **Manual verification (ตามรายงาน):**
   - by-dept: ตาราง/กราฟแสดงค่าจาก `reportByDepartment(filteredDocuments)` + มีข้อความหมายเหตุหลายฝ่าย
   - receive: ค่า `assigned/accepted/rejected/recalled/rejectRate` มาจาก `reportReceivePerformance` (ไม่ใช่ค่า static)
   - performance: ชื่อฝ่ายอยู่ใน `DEPARTMENTS` จริง + มีป้าย "ค่าตัวอย่าง (illustrative)"
   - overdue: แต่ละแถวแสดง chips ฝ่ายที่เกี่ยวข้องทุกฝ่าย
   - filters: เปลี่ยน `filterDept`/`filterDirection`/ช่วงวันที่ แล้วรายงานเปลี่ยนตามทันที; รีเซ็ตเป็น 'all' + ช่วงกว้าง → เห็นข้อมูลครบ
   - volume: การ์ดสรุปสะท้อนทิศทางที่เลือก

Correctness Properties ข้างต้นเป็นเอกสารอ้างอิง หากเพิ่ม test framework ในอนาคต แต่ละ property ควรทดสอบด้วยการวนซ้ำอย่างน้อย 100 รอบ และแท็กรูปแบบ **Feature: reports-multi-department, Property {number}**

## Design-to-Requirements Mapping

| Requirement | ครอบคลุมโดย |
| --- | --- |
| 1 (Involved Departments) | `getInvolvedDepartments` (§1.1); Property 1, 2 |
| 2 (By-Department Aggregate) | `reportByDepartment` + `getDocumentsInvolvingDepartment` (§1.2–1.3); Property 3, 4; หมายเหตุหลายฝ่าย (§2.3) |
| 3 (Receive Performance Aggregate) | `reportReceivePerformance` (§1.4); Property 5, 6 |
| 4 (by-dept ใช้ผลรวมหลายฝ่าย) | ReportsPage by-dept (§2.3) |
| 5 (receive ใช้ข้อมูลคำนวณจริง) | ReportsPage receive (§2.3) |
| 6 (แก้ชื่อฝ่าย Performance_Data) | PERFORMANCE_DATA ที่แก้ไข + ป้าย illustrative (§2.3) |
| 7 (Report Filters) | `filteredDocuments` (§2.2); Property 7 |
| 8 (งานค้างแสดงฝ่ายที่เกี่ยวข้อง) | ReportsPage overdue chips (§2.3) |
| 9 (volume เคารพตัวกรองทิศทาง) | ReportsPage volume (§2.3) |
| 10 (เอกสารวิเคราะห์) | P2026-040_Analysis.md (§3) |
| 11 (Build Checkpoint) | Testing Strategy — pnpm build + tsc |

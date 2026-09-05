# Design Document — การตั้งค่ารอบการแจ้งเตือนตามระดับความเร่งด่วน (Reminder Interval Configuration)

## Overview

เอกสารออกแบบนี้อธิบายวิธีเพิ่มฟีเจอร์ **การตั้งค่ารอบการแจ้งเตือนตามระดับความเร่งด่วน** ลงในระบบต้นแบบ (mockup) DVS Correspondence System — Phase 2 ซึ่งเป็นงานฝั่งหน้าจอล้วน (frontend-only) ด้วย React + TypeScript + Tailwind (Vite) ใช้ข้อมูลจำลอง (mock data) เท่านั้น ไม่มี backend, ฐานข้อมูลจริง, ตัวจับเวลา (scheduler) จริง และไม่มี test framework

ฟีเจอร์แบ่งเป็น 3 ส่วนตามที่ระบุใน requirements:

- **Part A — รอบการแจ้งเตือน (Reminder Interval):** เพิ่มชนิดข้อมูล `ReminderIntervalConfig`, ค่าเริ่มต้นใน `mock.ts` (`normal` = 5, `urgent` = 3, `very-urgent` = 1 วัน), helper `getReminderInterval`, และแท็บใหม่ "ตั้งค่าการแจ้งเตือน (Reminder)" ในหน้า Admin สำหรับดู/แก้ไขค่าแบบ stateful
- **Part B — ผู้รับการแจ้งเตือน (Reminder Recipients):** helper `latestAssigneesPerTree` คำนวณผู้รับมอบหมายล่าสุดต่อสายการมอบหมาย (Delegation_Tree) และการ์ด "การแจ้งเตือน (Reminder)" ในหน้ารายละเอียดเอกสารรับเข้า แสดงรอบการแจ้งเตือน + ผู้รับ (Origin + Latest_Assignee ต่อ tree)
- **Part C — เอกสารวิเคราะห์:** ปรับปรุง `P2026-040_Analysis.md` (BR-3.2/BR-3.3, ตารางหมวด 8.2, กฎผู้รับ, Change Log Draft 1.8.7 → 1.8.8)

หลักการออกแบบ: ให้ `Reminder_Interval_Config` เป็น **แหล่งข้อมูลกลางแหล่งเดียว (single source of truth)** ใน `mock.ts` และให้ทั้งหน้า Admin และหน้ารายละเอียดเอกสารอ่านค่าจากที่เดียวกัน การแจ้งซ้ำจนกว่างานจะแล้วเสร็จเป็นการ **แสดงความหมาย (documented/represented)** ผ่านค่าและข้อความบนหน้าจอ ไม่มี scheduler จริง

ธีมใช้ Deves (Navy `#012169` / Gold `#FFCD00`) ให้สอดคล้องกับแท็บและการ์ดที่มีอยู่เดิม

## Architecture

### แหล่งข้อมูลรอบการแจ้งเตือน (Config Source)

```
types.ts
  └─ ReminderIntervalConfig = Record<UrgencyLevel, number>   (ชนิดข้อมูลสนับสนุน)

mock.ts  ← Single Source of Truth
  ├─ REMINDER_INTERVALS: ReminderIntervalConfig = { normal: 5, urgent: 3, 'very-urgent': 1 }
  ├─ getReminderInterval(urgency): number        → REMINDER_INTERVALS[urgency]
  └─ latestAssigneesPerTree(subs): SubAssignment[]  → 1 latest ต่อ 1 Delegation_Tree

AdminPage.tsx (Reminder_Config_Tab)              DocumentDetailPage.tsx (Reminder card)
  useState(REMINDER_INTERVALS) → แก้ไข/บันทึก      อ่าน getReminderInterval(doc.urgency)
  (stateful ระดับ mockup)                          + latestAssigneesPerTree(subsState)
```

ค่าเริ่มต้นของ config มาจาก `REMINDER_INTERVALS` ใน `mock.ts` หน้า Admin นำค่านี้ไปเป็น initial state แล้วแก้ไขในหน่วยความจำของหน้าจอ (ไม่ persist — สอดคล้องข้อจำกัด mockup) ส่วนหน้ารายละเอียดเอกสารอ่านค่าตรงจาก `getReminderInterval` เพื่อแสดงรอบตาม `doc.urgency`

### กระแสการคำนวณผู้รับ (Recipient Computation Flow)

```
subsState (flat SubAssignment[] ของเอกสาร)
        │
        ▼
latestAssigneesPerTree(subs)
   1) สร้าง map: parentId → children[]
   2) roots = subs ที่ parentId เป็น undefined หรือชี้ไปยัง id ที่ไม่มีอยู่ (orphan → ถือเป็น root)
   3) สำหรับแต่ละ root: เดินลงตามสายลูกไปยัง leaf ที่ "ใหม่ที่สุด" (สายที่ถูกเพิ่มล่าสุด)
   4) คืน Latest_Assignee 1 รายการต่อ 1 root tree
        │
        ▼
Reminder_Recipients = [ Origin ] ∪ [ ชื่อ Latest_Assignee ของทุก tree ]
   Origin (เอกสารรับเข้า) = ต้นทาง/ผู้ลงทะเบียน (registrar/originator)
        │
        ▼
DocumentDetailPage แสดงเป็น chips/list (เฉพาะเอกสารรับเข้า)
```

การประกอบ `Reminder_Recipients` ทำในหน้า `DocumentDetailPage.tsx` (ตามที่ requirements อนุญาต): นำชื่อ Origin มารวมกับผลลัพธ์ของ `latestAssigneesPerTree` แล้ว dedupe ชื่อซ้ำ

### ลำดับการทำงานและความขนานระดับไฟล์ (File-level Parallelism)

```
types.ts ──▶ mock.ts ──▶ ┌─ AdminPage.tsx        ┐ (ทำขนานกันได้)
                          └─ DocumentDetailPage.tsx ┘

P2026-040_Analysis.md ── (อิสระ ทำเมื่อใดก็ได้ ไม่พึ่งพาโค้ด) ──▶
```

- `types.ts` ต้องเสร็จก่อน (นิยามชนิด) → จากนั้น `mock.ts` (ค่า + helpers) →
- `AdminPage.tsx` และ `DocumentDetailPage.tsx` พึ่งพา `mock.ts` เท่านั้น จึงแก้ไข **ขนานกันได้** ไม่มี dependency ระหว่างกัน
- `P2026-040_Analysis.md` เป็นเอกสาร ไม่พึ่งพาโค้ด ทำได้อิสระ

## Components and Interfaces

### 1. `src/types.ts` — ชนิดข้อมูลสนับสนุน

เพิ่มชนิดข้อมูลใหม่ (ต่อจาก `UrgencyLevel` ที่มีอยู่):

```typescript
// รอบการแจ้งเตือน (จำนวนวัน) แยกตามระดับความเร่งด่วน — Reminder_Interval_Config
// ค่าต้องเป็นจำนวนเต็มบวก (หน่วย: วัน)
export type ReminderIntervalConfig = Record<UrgencyLevel, number>
```

หมายเหตุ: ใช้ `Record<UrgencyLevel, number>` เพื่อบังคับ (compile-time) ให้ครบทั้ง 3 ระดับ (`normal`, `urgent`, `very-urgent`) โดยอัตโนมัติ — ถ้าอนาคตเพิ่มระดับใน `UrgencyLevel` TypeScript จะเตือนให้เพิ่มค่าใน config ด้วย (Requirement 1.1)

### 2. `src/mock.ts` — ค่าเริ่มต้น + helpers

ปรับ import type ให้รวม `ReminderIntervalConfig` และ `UrgencyLevel`:

```typescript
import type {
  Document, TimelineEvent, Task, User,
  SubAssignment, CustodyEntry, AuditEntry, DeliveryMethod,
  UrgencyLevel, ReminderIntervalConfig,
} from './types'
```

เพิ่มค่าเริ่มต้นและ helpers:

```typescript
// ─── รอบการแจ้งเตือนตามระดับความเร่งด่วน (Reminder Interval) — BR-3.2 / BR-3.3 ───
// แหล่งข้อมูลกลาง (single source of truth): แจ้งซ้ำทุก N วัน จนกว่าเอกสารจะ Completed
export const REMINDER_INTERVALS: ReminderIntervalConfig = {
  normal: 5,          // ปกติ — แจ้งซ้ำทุก 5 วัน
  urgent: 3,          // ด่วน — แจ้งซ้ำทุก 3 วัน
  'very-urgent': 1,   // ด่วนมาก — แจ้งซ้ำทุก 1 วัน
}

/** REQ 1.4 — คืนรอบการแจ้งเตือน (จำนวนวัน) ตาม Urgency_Level ของเอกสารจาก config กลาง */
export function getReminderInterval(urgency: UrgencyLevel): number {
  return REMINDER_INTERVALS[urgency]
}

/**
 * REQ 4.1–4.5 — คืน Latest_Assignee 1 รายการต่อ 1 Delegation_Tree
 * รับรายการงานย่อยแบบ flat ของเอกสารหนึ่งฉบับ แล้วคืนผู้รับมอบหมายล่าสุด (leaf)
 * ของแต่ละสายการมอบหมาย โดยไล่ตามความสัมพันธ์ parentId
 *
 * นิยาม (mock-simple, ทนทาน ไม่ throw):
 *  - root = งานย่อยที่ parentId เป็น undefined หรือชี้ไปยัง id ที่ไม่มีอยู่ (orphan → root)
 *  - เด็ก (children) จับคู่จาก parentId
 *  - Latest_Assignee ของ tree = leaf ที่ปลายสายซึ่ง "ใหม่ที่สุด" (เลือกลูกตัวที่ถูกเพิ่มล่าสุด
 *    ตามลำดับใน array ในแต่ละชั้น แล้วเดินลงจนสุดสาย)
 *  - subs ว่าง → คืน [] (REQ 4.5)
 */
export function latestAssigneesPerTree(subs: SubAssignment[]): SubAssignment[] {
  if (!subs || subs.length === 0) return []

  const byId = new Map<string, SubAssignment>()
  for (const s of subs) byId.set(s.id, s)

  // children map: parentId → children[] (คงลำดับตาม array เดิม = ลำดับการเพิ่ม)
  const childrenOf = new Map<string, SubAssignment[]>()
  const roots: SubAssignment[] = []
  for (const s of subs) {
    const parentExists = s.parentId != null && byId.has(s.parentId)
    if (!parentExists) {
      roots.push(s)                          // parentId undefined หรือ orphan → root
    } else {
      const arr = childrenOf.get(s.parentId as string) ?? []
      arr.push(s)
      childrenOf.set(s.parentId as string, arr)
    }
  }

  // เดินจาก root ลงไปยัง leaf ที่ใหม่ที่สุด (ลูกตัวสุดท้ายในแต่ละชั้น)
  const leafOf = (root: SubAssignment): SubAssignment => {
    let node = root
    const guard = new Set<string>()          // กันวนซ้ำ (cycle guard) — ทนทาน ไม่ค้าง
    while (true) {
      if (guard.has(node.id)) break
      guard.add(node.id)
      const kids = childrenOf.get(node.id)
      if (!kids || kids.length === 0) break
      node = kids[kids.length - 1]           // ลูกที่ถูกเพิ่มล่าสุด = ใหม่ที่สุด
    }
    return node
  }

  return roots.map(leafOf)
}
```

การประกอบผู้รับ (`Reminder_Recipients`) ออกแบบให้คำนวณ **ในหน้า** `DocumentDetailPage.tsx` (Origin + ชื่อ latest ต่อ tree) เพื่อให้ helper ใน `mock.ts` คงความบริสุทธิ์และง่ายต่อการนำกลับใช้ (ทางเลือก: ถ้าต้องการ helper รวม สามารถเพิ่ม `getReminderRecipientNames(originName, subs)` ภายหลังได้ แต่ไม่บังคับในสโคปนี้)

### 3. `src/pages/AdminPage.tsx` — แท็บ Reminder_Config_Tab

**Import icon:** ใช้ `Clock` (หรือ `Bell`) จาก lucide-react (มี `Bell`/`BellOff` อยู่แล้ว) เพิ่ม `Clock` เข้าไปในรายการ import

**ขยาย union ของ activeTab และเพิ่ม state:**

```typescript
const [activeTab, setActiveTab] =
  useState<'users' | 'monitor' | 'master-data' | 'reminder'>('users')

// ── Reminder interval state (stateful ระดับ mockup) ──
const [reminderIntervals, setReminderIntervals] =
  useState<ReminderIntervalConfig>(REMINDER_INTERVALS)
```

เพิ่ม import: `REMINDER_INTERVALS` จาก `../mock` และ type `ReminderIntervalConfig` จาก `../types`

**ปุ่มแท็บที่ 4** (ต่อจากปุ่ม master-data ในแถบแท็บ):

```tsx
<button
  onClick={() => setActiveTab('reminder')}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'reminder' ? 'bg-[#012169] text-white shadow-sm' : 'text-[#6C757D] hover:text-[#212529]'}`}
>
  <Clock size={13} />
  ตั้งค่าการแจ้งเตือน (Reminder)
</button>
```

**ส่วนเนื้อหา** (`activeTab === 'reminder'`) — โครงสร้างการ์ดสไตล์ Deves สอดคล้องแท็บอื่น:

- **Info banner** (พื้น `#F8F9FA`/น้ำเงินอ่อน, ไอคอน `AlertCircle`): อธิบายว่า "การแจ้งเตือนจะเกิดซ้ำทุก N วันตามระดับความเร่งด่วน จนกว่าเอกสารจะแล้วเสร็จ (Completed) และส่งเฉพาะต้นทาง (Origin) กับผู้รับมอบหมายล่าสุดของแต่ละสายการมอบหมาย"
- **การ์ด/ตาราง 3 แถว** (หนึ่งแถวต่อหนึ่ง Urgency_Level) แต่ละแถวมี:
  - ป้ายระดับความเร่งด่วน (urgency badge/สี: normal = เทา/เขียว, urgent = ส้ม `#FD7E14`, very-urgent = แดง `#DC3545`) พร้อมข้อความไทย (ปกติ/ด่วน/ด่วนมาก)
  - `<input type="number" min="1" step="1">` แสดง/รับค่าเป็นจำนวนวัน (ผูกกับ `reminderIntervals[level]`)
  - หน่วย "วัน"
- **ปุ่มบันทึก (Save)** ต่อแถวหรือรวม — เมื่อกดจะเรียก `handleSaveInterval(level, rawValue)`:

```typescript
function handleSaveInterval(level: UrgencyLevel, raw: number) {
  // REQ 3.5 — รับเฉพาะจำนวนเต็มบวก มิฉะนั้นปฏิเสธและคงค่าเดิม
  const isPositiveInt = Number.isInteger(raw) && raw > 0
  if (!isPositiveInt) {
    showToast?.('ค่ารอบการแจ้งเตือนต้องเป็นจำนวนเต็มบวก (วัน)', 'error')
    return // คงค่าเดิมไว้ ไม่เปลี่ยน state
  }
  setReminderIntervals(prev => ({ ...prev, [level]: raw }))
  showToast?.(`บันทึกรอบการแจ้งเตือนระดับ "${labelOf(level)}" เป็น ${raw} วันแล้ว`, 'success')
}
```

- **หมายเหตุท้ายการ์ด**: ระบุว่าเป็นการตั้งค่าระดับ mockup (ไม่มี scheduler จริง; ความหมายคือแจ้งซ้ำทุก N วันจนกว่าจะ Completed)

Requirements ที่รองรับ: 3.1, 3.2, 3.3, 3.4, 3.5, 2.1, 2.4

### 4. `src/pages/DocumentDetailPage.tsx` — การ์ด "การแจ้งเตือน (Reminder)"

**Import:** เพิ่ม `getReminderInterval`, `latestAssigneesPerTree` จาก `../mock`; ใช้ไอคอน `Bell`/`Clock` (มี `Clock` อยู่แล้วในชุด import ของหน้า)

**เงื่อนไขแสดง:** เฉพาะเอกสารรับเข้า (`!isOutgoing`) — ไม่แตะส่วนเอกสารส่งออก

**ตำแหน่ง:** คอลัมน์ขวา (`Right column`, `<div className="space-y-4">`) ใต้ Action Panel หรือหลังการ์ด Current holder — เป็นการ์ดคอมแพ็กต์ `card p-5`

**ตรรกะการแสดงผล:**

```typescript
const reminderDays = getReminderInterval(doc.urgency)     // REQ 6.1
const isCompleted = doc.status === 'completed'            // REQ 6.4

// Origin (ต้นทาง/ผู้ลงทะเบียน) — เลือกแบบ mock ที่ชัดเจนและมีป้ายกำกับ:
// ใช้ผู้ลงทะเบียน/ต้นทางจาก TIMELINE (event แรก = งานสารบรรณ/ผู้ลงทะเบียน)
// fallback เป็น doc.originDepartment ("งานสารบรรณ / ผู้ลงทะเบียน") เมื่อไม่มีข้อมูล timeline
const originName =
  TIMELINE_EVENTS[0]?.actor ?? `${doc.originDepartment} (ผู้ลงทะเบียน)`

// Latest_Assignee ต่อ tree — REQ 6.2
const latestAssignees = latestAssigneesPerTree(subsState)

// Reminder_Recipients = Origin ∪ latest ต่อ tree (dedupe ชื่อซ้ำ) — REQ 5.1
const recipientNames = Array.from(
  new Set<string>([originName, ...latestAssignees.map(s => s.assigneeName)]),
)
```

**เนื้อหาการ์ด:**

- หัวข้อ "การแจ้งเตือน (Reminder)" พร้อมไอคอน `Bell`
- **รอบการแจ้งเตือน:** ถ้ายังไม่ completed → "แจ้งซ้ำทุก {reminderDays} วัน จนกว่าสถานะจะแล้วเสร็จ (Completed)" (REQ 6.3); ถ้า `isCompleted` → แสดงแบดจ์/ข้อความ "การแจ้งเตือนสิ้นสุดแล้ว" (REQ 6.4) พร้อมสีเขียว success
- **ผู้รับการแจ้งเตือน:** เรนเดอร์ `recipientNames` เป็น chips เล็ก ๆ (สไตล์ Deves) โดย:
  - chip Origin มีป้ายกำกับ "ต้นทาง (ผู้ลงทะเบียน)"
  - chips อื่นกำกับ "ผู้รับมอบหมายล่าสุด" (Latest_Assignee ต่อ tree)
  - ถ้า `latestAssignees` ว่าง (ไม่มีงานย่อย) → แสดงเฉพาะ Origin

Requirements ที่รองรับ: 6.1, 6.2, 6.3, 6.4, 5.1, 5.4

หมายเหตุการเลือก Origin (ตัดสินใจแบบ mock ที่ชัดเจน): ใช้ผู้กระทำจาก timeline event แรก (ผู้ลงทะเบียน/งานสารบรรณ) เป็น Origin เพราะสื่อความหมาย "ต้นทาง/ผู้ริเริ่ม" ตรงกับ glossary มากกว่า `doc.currentHolder` (ซึ่งเป็นผู้ถือครองปัจจุบัน ไม่ใช่ต้นทาง) และมี fallback เป็น `doc.originDepartment` เพื่อความทนทาน

### 5. `P2026-040_Analysis.md` — การปรับปรุงเอกสารวิเคราะห์ (Part C)

การเปลี่ยนแปลงกฎเชิงธุรกิจโดยตั้งใจ (intentional rule change):

- **BR-3.2 / BR-3.3 (หมวด 11.3):** ปรับให้รอบการแจ้งเตือน **ตั้งค่าได้ต่อระดับความเร่งด่วน** ค่าเริ่มต้น `normal` = 5 วัน, `urgent` = 3 วัน, `very-urgent` = 1 วัน และ **แจ้งซ้ำจนกว่าเอกสารจะ Completed**
- **ตารางรอบการแจ้งเตือน หมวด 8.2:** ปรับค่าให้เป็น 5 / 3 / 1 วัน (normal / urgent / very-urgent)
- **กฎผู้รับการแจ้งเตือน:** ระบุว่าผู้รับ = **Origin (ต้นทาง)** และ **Latest_Assignee ของแต่ละ Delegation_Tree** (ไม่รวม participant ทั้งหมด และไม่รวมหัวหน้าฝ่ายโดยทั่วไป เว้นแต่เป็น Origin หรือ Latest_Assignee)
- **Change Log:** เพิ่มรายการ **Draft 1.8.7 → 1.8.8** อธิบายการเปลี่ยนแปลงกฎการแจ้งเตือนและผู้รับ (และปรับ Version ส่วนหัวเป็น Draft 1.8.8)
- **คงไว้ไม่เปลี่ยน:** เนื้อหา State Machine (หมวด 6) และโครงสร้าง Notification templates ที่ไม่เกี่ยวข้อง

Requirements ที่รองรับ: 7.1, 7.2, 7.3, 7.4, 7.5

## Data Models

### ReminderIntervalConfig (ใหม่ — `types.ts`)

| ฟิลด์ (key) | ชนิด | ความหมาย | ค่าเริ่มต้น |
|---|---|---|---|
| `normal` | `number` | รอบแจ้งเตือน (วัน) ระดับปกติ | 5 |
| `urgent` | `number` | รอบแจ้งเตือน (วัน) ระดับด่วน | 3 |
| `very-urgent` | `number` | รอบแจ้งเตือน (วัน) ระดับด่วนมาก | 1 |

ข้อจำกัด: ค่าทุกตัวต้องเป็น **จำนวนเต็มบวก** (หน่วยวัน) การบังคับใช้อยู่ที่ชั้น UI (ตรวจตอนบันทึกในแท็บ Admin) เนื่องจาก TypeScript ไม่มีชนิด "positive integer" โดยกำเนิด

### SubAssignment (เดิม — ใช้ซ้ำ ไม่แก้ไข)

ใช้ฟิลด์ `id`, `parentId`, `assigneeName`, `status`, `department` ที่มีอยู่แล้ว โครงสร้าง Delegation_Tree นิยามด้วย `parentId`:
- `parentId === undefined` → root ของ tree
- `parentId` ชี้ไปยัง `id` ของงานย่อยอื่น → เป็นการมอบหมายต่อ (onward delegation)
- `parentId` ชี้ไปยัง `id` ที่ไม่มีอยู่ (orphan) → ถือเป็น root (ทนทานต่อข้อมูลไม่สมบูรณ์)

ตัวอย่างจาก `SUB_ASSIGNMENTS['doc-001']`: `sa-001-8` (root) → `sa-001-9` (child ผ่าน `parentId: 'sa-001-8'`) ⇒ Latest_Assignee ของสายนี้คือ `sa-001-9` (นายสมชาย ใจดี) ส่วนงานย่อยอื่นที่ไม่มี `parentId` แต่ละตัวเป็น root/leaf ของ tree ตัวเอง

### Reminder_Recipients (ค่าคำนวณ ไม่เก็บถาวร)

```
recipientNames: string[] = dedupe([ originName, ...latestAssigneesPerTree(subs).map(assigneeName) ])
```

## Error Handling

การออกแบบเน้น "ไม่ล้ม (never throw)" และ degrade อย่างสง่างามในระดับ mockup:

| กรณี | การจัดการ |
|---|---|
| ผู้ใช้ป้อนค่ารอบที่ไม่ใช่จำนวนเต็มบวก (0, ติดลบ, ทศนิยม, ว่าง/NaN) | `handleSaveInterval` ปฏิเสธการบันทึก คงค่าเดิมใน state และแสดง toast แจ้งเตือน (REQ 3.5) |
| เอกสารไม่มีงานย่อย (`subsState` ว่าง) | `latestAssigneesPerTree([])` คืน `[]` → Reminder_Recipients เหลือเฉพาะ Origin (REQ 4.5, 5.1) |
| `parentId` เป็น orphan (ชี้ id ที่ไม่มีอยู่) | ถืองานย่อยนั้นเป็น root — ไม่หายจากผลลัพธ์ ไม่ throw |
| ข้อมูลงานย่อยมี cycle (parentId วนกลับ) | มี cycle guard (`Set` ของ id ที่เยี่ยมแล้ว) หยุดเดินสายเพื่อกันลูปไม่รู้จบ |
| `getReminderInterval` รับ urgency ที่มีใน type | คืนค่าจาก `REMINDER_INTERVALS` เสมอ (type บังคับครบ 3 คีย์ จึงไม่มีกรณี undefined) |
| Origin หาไม่ได้จาก timeline | fallback เป็น `"{doc.originDepartment} (ผู้ลงทะเบียน)"` |

หมายเหตุ: ในระดับ mockup การเลือก "leaf ใหม่ที่สุด" ใช้ลำดับใน array (ลูกตัวสุดท้าย = เพิ่มล่าสุด) ซึ่งเพียงพอและคาดเดาได้ ไม่พึ่งพา timestamp ที่อาจ parse ยาก

## Correctness Properties

*ส่วนนี้เป็น **ทางเลือก (optional)** — โปรเจกต์นี้เป็น mockup ไม่มี test framework จึงไม่ได้เขียน property test จริง คุณสมบัติด้านล่างเป็นข้อกำหนดเชิงตรรกะไว้ตรวจสอบด้วยตนเองและใช้ยืนยันความถูกต้องของ helper ที่เป็นฟังก์ชันบริสุทธิ์ (pure function)*

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: รอบการแจ้งเตือนตรงกับ config

*For any* ระดับความเร่งด่วน `u` (`normal`, `urgent`, `very-urgent`), ค่าที่ `getReminderInterval(u)` คืนต้องเท่ากับ `REMINDER_INTERVALS[u]` เสมอ

**Validates: Requirements 1.4, 2.1**

### Property 2: การตรวจสอบค่ารอบเป็นจำนวนเต็มบวก

*For any* ค่าตัวเลข `n` ที่ป้อนในแท็บ Reminder: ถ้า `n` ไม่ใช่จำนวนเต็มบวก (0, ติดลบ, ทศนิยม หรือ NaN) แล้ว `reminderIntervals` ต้องไม่เปลี่ยนแปลง (คงค่าเดิม); และถ้า `n` เป็นจำนวนเต็มบวก แล้วระดับที่แก้ต้องอัปเดตเป็น `n`

**Validates: Requirements 3.4, 3.5**

### Property 3: หนึ่ง Latest_Assignee ต่อหนึ่ง Delegation_Tree

*For any* รายการงานย่อยแบบ flat `subs`: จำนวนสมาชิกที่ `latestAssigneesPerTree(subs)` คืนต้องเท่ากับจำนวน root (tree) ใน `subs`, สมาชิกแต่ละตัวต้องเป็น leaf (ไม่มีลูก) ที่ปลายสายของ root ที่ต่างกัน, และเมื่อ `subs` ว่างต้องคืน `[]` — ทั้งนี้ต้องไม่ throw ในทุกกรณี (รวมถึง orphan parentId และ cycle)

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 4: ผู้รับการแจ้งเตือน = Origin รวมกับ Latest_Assignee ต่อทุก tree

*For any* เอกสารรับเข้าและรายการงานย่อย `subs`: เซตของ `Reminder_Recipients` ต้องเท่ากับ `{ Origin }` รวมกับเซตของ Latest_Assignee หนึ่งรายการต่อทุก Delegation_Tree (หลัง dedupe ชื่อซ้ำ); เมื่อ `subs` ว่างต้องเหลือเฉพาะ `{ Origin }` และต้องไม่รวม participant ทั้งหมดหรือหัวหน้าฝ่ายที่ไม่ใช่ Origin/Latest_Assignee

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

## Testing Strategy

โปรเจกต์นี้เป็น mockup **ไม่มี test framework** การตรวจสอบความถูกต้องทำผ่าน 2 ช่องทาง:

### 1. Build & Type Check (บังคับ — Build_Checkpoint)

- `pnpm build` — ต้องผ่านโดยไม่มีข้อผิดพลาดใหม่ (REQ 8.1)
- `pnpm exec tsc --noEmit` — ต้องผ่านการตรวจชนิดข้อมูลโดยไม่มีข้อผิดพลาดใหม่ (REQ 8.2)

การใช้ `Record<UrgencyLevel, number>` ช่วยให้ type checker จับกรณีคีย์ขาด/เกินได้ตั้งแต่ compile time

### 2. Manual Verification (ตรวจด้วยตนเองในเบราว์เซอร์)

- **Admin › แท็บ Reminder:** ยืนยันแท็บที่ 4 ปรากฏ, แสดงค่า 5/3/1 เริ่มต้น, แก้ค่าเป็นจำนวนเต็มบวกแล้ว Save เห็นค่าใหม่ + toast; ลองใส่ 0/-1/1.5/ว่าง แล้ว Save ต้องถูกปฏิเสธและคงค่าเดิม (REQ 3.x)
- **Document Detail (incoming):** เปิด `doc-001` (very-urgent) ยืนยันการ์ดแสดง "แจ้งซ้ำทุก 1 วัน จนกว่า Completed" และผู้รับ = Origin + Latest_Assignee ต่อ tree (สาย `sa-001-8`→`sa-001-9` ให้ นายสมชาย ใจดี); เปิดเอกสารสถานะ `completed` (เช่น `doc-003`) ยืนยันข้อความ "การแจ้งเตือนสิ้นสุดแล้ว" (REQ 6.x)
- **Document Detail (outgoing):** ยืนยันว่าการ์ด Reminder **ไม่แสดง** และส่วนเอกสารส่งออกไม่เปลี่ยน
- **เอกสารวิเคราะห์:** ตรวจ BR-3.2/3.3, ตาราง 8.2, กฎผู้รับ และ Change Log 1.8.8 (REQ 7.x)

### แนวทาง Property (ถ้ามี runner ในอนาคต)

หากภายหลังเพิ่ม test runner ควรตั้งค่าอย่างน้อย 100 iterations ต่อ property และผูก tag รูปแบบ **Feature: reminder-interval-config, Property {number}: {property_text}** โดยเป้าหมายหลักคือ Property 3 (`latestAssigneesPerTree`) และ Property 4 (recipient union) ซึ่งเป็นตรรกะบริสุทธิ์ที่ input varying ได้ดี

## Design-to-Requirements Mapping

| Requirement | Acceptance Criteria | องค์ประกอบการออกแบบที่รองรับ |
|---|---|---|
| 1. โครงสร้างข้อมูล + ค่าเริ่มต้น | 1.1–1.4 | `ReminderIntervalConfig` (types.ts), `REMINDER_INTERVALS` + `getReminderInterval` (mock.ts) |
| 2. ความหมายแจ้งซ้ำจนแล้วเสร็จ | 2.1–2.4 | การ์ด Reminder (ข้อความแจ้งซ้ำ/สิ้นสุด), info banner ในแท็บ Admin, ไม่มี scheduler จริง |
| 3. หน้าจอแก้ไขในหน้า Admin | 3.1–3.5 | แท็บที่ 4 `'reminder'`, `reminderIntervals` state, `handleSaveInterval` (validate จำนวนเต็มบวก) |
| 4. ตัวช่วยคำนวณ Latest_Assignee | 4.1–4.5 | `latestAssigneesPerTree(subs)` (mock.ts) + Property 3 |
| 5. กฎผู้รับการแจ้งเตือน | 5.1–5.4 | การประกอบ `recipientNames` (DocumentDetailPage) + Property 4 |
| 6. แสดงในหน้ารายละเอียดเอกสารรับเข้า | 6.1–6.4 | การ์ด "การแจ้งเตือน (Reminder)" (เฉพาะ `!isOutgoing`) |
| 7. ปรับปรุงเอกสารวิเคราะห์ | 7.1–7.5 | การแก้ไข `P2026-040_Analysis.md` (BR-3.2/3.3, 8.2, กฎผู้รับ, Change Log 1.8.8) |
| 8. Build Checkpoint | 8.1–8.2 | Testing Strategy: `pnpm build` + `pnpm exec tsc --noEmit` |

# Design Document

## Overview

ฟีเจอร์นี้แยกแนวคิด "ฝ่าย" ของเอกสารออกเป็นสองส่วนที่ชัดเจน และจัดป้ายกำกับภาษาไทยให้เป็นมาตรฐานเดียวกันทุกหน้า:

1. **ฝ่ายต้นทาง (Origin_Department)** — ฝ่ายของผู้ใช้ที่ล็อกอิน (จำลองจาก `CURRENT_USER`) กำหนดค่าอัตโนมัติแบบอ่านอย่างเดียว
2. **ฝ่ายที่รับผิดชอบ (Responsible_Department)** — ฝ่ายที่อนุมานจากผู้รับมอบหมาย (Assignee) ที่เลือก แทนการเลือกฝ่ายจาก dropdown อิสระ

ขอบเขตงานเป็น mockup ฝั่งหน้าบ้าน (React + TypeScript + Tailwind, Vite) ทั้งหมด ใช้ข้อมูลจำลองใน `src/mock.ts` โดยจำลอง AD/LDAP ด้วยชุด `USERS` และ `DEPARTMENTS` ไม่มี backend, ฐานข้อมูล, หรือระบบยืนยันตัวตนจริง

การเปลี่ยนแปลงหลักแบ่งเป็นห้ากลุ่ม:
- เพิ่มค่าคงที่ `CURRENT_USER` ใน `src/mock.ts`
- เพิ่มฟิลด์ `originDepartment` ใน interface `Document` และเติมค่าใน `DOCUMENTS` ทุกรายการ (โดย `department` ถูก repurpose ให้เป็นฝ่ายที่รับผิดชอบ/ปลายทาง)
- ปรับ `RegisterPage` ให้แสดงฝ่ายต้นทางแบบอ่านอย่างเดียว และอนุมานฝ่ายที่รับผิดชอบ + ตำแหน่งจากผู้รับมอบหมาย
- จัดป้ายกำกับภาษาไทยให้สอดคล้องกันใน `RegisterPage`, `DocumentDetailPage`, `DocumentListPage`, `ReportsPage`
- **ปรับปรุงคำศัพท์ในเอกสารวิเคราะห์ `P2026-040_Analysis.md`** ให้ใช้คำ "ฝ่ายต้นทาง" และ "ฝ่ายที่รับผิดชอบ" สอดคล้องกับ mockup (เป็นงานปรับปรุงเอกสารเท่านั้น ไม่กระทบโค้ด mockup ฝั่งหน้าบ้าน)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    src/mock.ts (Mock_Directory)              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ DEPARTMENTS  │  │    USERS     │  │   CURRENT_USER    │  │
│  │  (string[])  │  │  (User[])    │  │  (User) ── refs ──┼──┼──► USERS[x]
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         │                 │                    │            │
│  ┌──────▼─────────────────▼────────────────────▼─────────┐ │
│  │                   DOCUMENTS (Document[])               │ │
│  │  originDepartment (ฝ่ายต้นทาง)                          │ │
│  │  department        (ฝ่ายที่รับผิดชอบ / ปลายทาง)          │ │
│  └───────────────────────────┬───────────────────────────┘ │
└──────────────────────────────┼─────────────────────────────┘
                               │ import
        ┌──────────────────────┼──────────────────────┐
        ▼            ▼          ▼            ▼          ▼
  RegisterPage  DetailPage  ListPage   ReportsPage  (types.ts)
   (ฟอร์ม)      (รายละเอียด) (ตาราง)    (รายงาน)     Document
```

**หลักการออกแบบ:**
- **Single source of truth**: ทุกหน้าอ่านข้อมูลฝ่ายจาก `Document` interface และ `Mock_Directory` เดียวกัน
- **Derivation over selection**: ฝ่ายต้นทางและฝ่ายที่รับผิดชอบถูก *อนุมาน* จากข้อมูล AD จำลอง ไม่ใช่ให้ผู้ใช้กรอก/เลือกฝ่ายอิสระ ลดโอกาสที่ค่าจะไม่สอดคล้องกับ `DEPARTMENTS`
- **Frontend-only**: ตรรกะทั้งหมดทำงานในหน่วยความจำของเบราว์เซอร์ ไม่มี I/O ภายนอก

## Components and Interfaces

### 1. Mock_Directory (`src/mock.ts`)

เพิ่มค่าคงที่ `CURRENT_USER` ที่อ้างอิงรายการหนึ่งใน `USERS` เพื่อให้ single source of truth และหลีกเลี่ยงการซ้ำซ้อนของข้อมูล

```typescript
// อ้างอิงผู้ใช้ที่ล็อกอินอยู่จากรายการใน USERS (จำลอง AD/LDAP session)
// เลือก somchai.j (ฝ่ายการเงิน) เป็นค่าเริ่มต้น — เป็นสมาชิกของ DEPARTMENTS
export const CURRENT_USER: User =
  USERS.find(u => u.username === 'somchai.j') ?? USERS[0]
```

หมายเหตุ: การ derive จาก `USERS` ด้วย `find` รับประกันว่า `CURRENT_USER` เป็นรายการที่มีอยู่จริงใน `USERS` และมีฟิลด์ `name`, `username`, `department`, `position` ครบ (ตาม interface `User`) และ `department` ของผู้ใช้ที่เลือก (`ฝ่ายการเงิน`) เป็นสมาชิกของ `DEPARTMENTS`

### 2. Document_Model (`src/types.ts`)

เพิ่มฟิลด์ `originDepartment` และคง `department` ไว้เป็นฝ่ายที่รับผิดชอบ/ปลายทาง

```typescript
export interface Document {
  id: string
  docNumber: string
  // ... ฟิลด์เดิม ...
  originDepartment: string   // ฝ่ายต้นทาง (Origin_Department) — ฝ่ายของผู้สร้าง/ต้นเรื่อง
  department: string         // ฝ่ายที่รับผิดชอบ (Responsible_Department) — ฝ่ายที่ดำเนินการ
  // ... ฟิลด์เดิม ...
}
```

**เหตุผลการ repurpose `department`:** ฟิลด์ `department` ถูกอ้างอิงในหลายหน้า (List/Reports filter, DEPT_DATA) ในความหมาย "ฝ่ายที่ดำเนินการ/รับผิดชอบ" อยู่แล้ว การคงชื่อไว้และให้ความหมายเป็น Responsible_Department ลดการแก้ไขที่กระจายและรักษาความเข้ากันได้ของโค้ดเดิม ส่วน `originDepartment` เป็นฟิลด์ใหม่สำหรับฝ่ายต้นทาง

`DOCUMENTS` ทุกรายการจะถูกเติมค่า `originDepartment` ด้วยค่าที่อยู่ใน `DEPARTMENTS` (เช่น เอกสารรับเข้าใช้ `งานสารบรรณ` เป็นต้นทางที่สมเหตุสมผล หรือฝ่ายที่ริเริ่มเรื่อง) และ `department` คงค่าฝ่ายที่รับผิดชอบเดิมไว้

### 3. Registration_System (`src/pages/RegisterPage.tsx`)

**การเปลี่ยนแปลงหลัก:**

1. **ฝ่ายต้นทาง (อ่านอย่างเดียว):** แทนที่ dropdown ฝ่ายอิสระเดิม ด้วยการแสดง `CURRENT_USER.department` ในช่องที่อ่านอย่างเดียว

```typescript
import { DEPARTMENTS, USERS, CURRENT_USER } from '../mock'

// ฝ่ายต้นทางกำหนดจากผู้ใช้ที่ล็อกอิน (คงที่, อ่านอย่างเดียว)
const originDepartment = CURRENT_USER.department
```

```tsx
<div>
  <label className="form-label">ฝ่ายต้นทาง</label>
  <input
    type="text"
    className="form-input bg-slate-50 text-[#6C757D] cursor-not-allowed"
    value={originDepartment}
    readOnly
    aria-readonly="true"
  />
  <p className="text-[11px] text-[#6C757D] mt-1">กำหนดอัตโนมัติจากผู้ใช้ที่ล็อกอิน</p>
</div>
```

2. **ฝ่ายที่รับผิดชอบ (อนุมานจากผู้รับมอบหมาย):** เมื่อเลือก Assignee ให้ค้นหา user ใน `USERS` แล้ว derive ฝ่ายที่รับผิดชอบและตำแหน่ง

```typescript
// อนุมานฝ่ายที่รับผิดชอบ + ตำแหน่ง จากผู้รับมอบหมายที่เลือกล่าสุด
const selectedAssigneeName = selectedRecipients[selectedRecipients.length - 1]
const assignee = USERS.find(u => u.name === selectedAssigneeName)
const responsibleDepartment = assignee?.department ?? ''
const assigneePosition = assignee?.position ?? ''
```

- แสดง `responsibleDepartment` ด้วยป้ายกำกับ "ฝ่ายที่รับผิดชอบ" เป็นแบบอ่านอย่างเดียว (ไม่มี dropdown เลือกฝ่าย)
- เมื่อยังไม่เลือกผู้รับมอบหมาย แสดงค่าว่างพร้อมข้อความสถานะ "ยังไม่ได้เลือกผู้รับมอบหมาย"
- เมื่อเปลี่ยนการเลือก ค่าจะ re-derive ผ่าน React render (เพราะคำนวณจาก `selectedRecipients` ที่เป็น state)

```tsx
<div>
  <label className="form-label">ฝ่ายที่รับผิดชอบ</label>
  {assignee ? (
    <>
      <input type="text" className="form-input bg-slate-50" value={responsibleDepartment} readOnly aria-readonly="true" />
      <p className="text-[11px] text-[#6C757D] mt-1">ตำแหน่งผู้รับมอบหมาย: {assigneePosition}</p>
    </>
  ) : (
    <div className="form-input bg-slate-50 text-[#6C757D] italic flex items-center">
      ยังไม่ได้เลือกผู้รับมอบหมาย
    </div>
  )}
</div>
```

3. **การ validate/persist:** เอา `form.department` (dropdown อิสระ) และ validation `e.department` ออก แทนด้วยค่าที่ derive ตอน submit:

```typescript
const documentToPersist = {
  ...form,
  originDepartment: CURRENT_USER.department,   // persist ฝ่ายต้นทาง
  department: responsibleDepartment,           // persist ฝ่ายที่รับผิดชอบ
  assigneePosition,
}
```

หมายเหตุ: การเชื่อม EDR modal ที่เคย set `department: 'ฝ่ายพัฒนากระบวนการทางธุรกิจ'` (ค่าที่ไม่อยู่ใน DEPARTMENTS) จะถูกยกเลิก เพื่อคงหลักการ derive จาก Mock_Directory เท่านั้น

### 4. Document_Detail_View (`src/pages/DocumentDetailPage.tsx`)

ในบล็อกกริดข้อมูลเอกสาร แยกแสดงสองฝ่ายด้วยป้ายกำกับมาตรฐาน แทนป้าย "ฝ่ายดำเนินการ" เดิม:

```tsx
{ icon: <Building2 size={13} />, label: 'ฝ่ายต้นทาง', value: doc.originDepartment },
{ icon: <Building2 size={13} />, label: 'ฝ่ายที่รับผิดชอบ', value: doc.department },
```

### 5. Document_List_View (`src/pages/DocumentListPage.tsx`)

เปลี่ยนหัวคอลัมน์ `ฝ่าย` เป็น `ฝ่ายที่รับผิดชอบ` และคง cell ที่แสดง `doc.department` (Responsible_Department) ตัวกรอง filterDept ยังใช้ `department` ตามเดิม แต่ปรับ label filter เป็น "ฝ่ายที่รับผิดชอบ" เพื่อความสอดคล้อง

### 6. Reports_View (`src/pages/ReportsPage.tsx`)

ปรับป้ายกำกับ/หัวข้อคอลัมน์ที่สื่อถึงฝ่ายรับผิดชอบให้ใช้คำ "ฝ่ายที่รับผิดชอบ" อย่างสอดคล้อง (เช่น หัวคอลัมน์ตารางในรายงาน by-dept และ filter label) โดยยังอ่านค่าจาก `doc.department`

### 7. Analysis_Document_Terminology_Alignment (`P2026-040_Analysis.md`)

องค์ประกอบนี้เป็น **งานปรับปรุงเอกสาร (documentation-only)** ไม่ใช่โค้ด — เป็นการปรับคำศัพท์และคำจำกัดความในเอกสารวิเคราะห์ระบบ (SRS Analysis) ให้สอดคล้องกับป้ายกำกับใน mockup โดย **ไม่แก้เนื้อหาเชิงกระบวนการที่มีอยู่เดิม** (workflow, State Machine, Notification, Business Rules) การเปลี่ยนแปลงจำกัดเฉพาะ "ความหมายของคำ" ไม่ใช่ "ตรรกะของระบบ"

หลักการสำคัญคือการแยกสองแนวคิดที่ปัจจุบันใช้คำว่า "ต้นทาง" ปนกันในเอกสาร:

- **Registrar_Actor (บทบาทผู้กระทำเชิงกระบวนการ)** — "ต้นทาง" ที่หมายถึง *ผู้ Register / ผู้ Forward* ในบริบท workflow, State Machine และผู้รับการแจ้งเตือน (เช่น NT-02, NT-03, NT-07, การดึงงานกลับ/ยกเลิก) — **คงความหมายเดิมไว้ทั้งหมด**
- **Origin_Department_Field (ฟิลด์ข้อมูลเชิงโครงสร้าง)** — "ฝ่ายต้นทาง" ที่หมายถึง *ฝ่ายซึ่งเป็นจุดกำเนิดของเอกสาร* ตรงกับ `originDepartment` ใน Document_Model ของ mockup

**แนวทางการแก้ไข (Edit Plan) — เฉพาะคำศัพท์/คำจำกัดความ:**

1. **เพิ่มหมายเหตุคำศัพท์ (Terminology Note):** เพิ่มบล็อกคำจำกัดความ (ต่อจาก "หมายเหตุสำคัญเรื่องคำศัพท์" ที่มีอยู่แล้วก่อนสารบัญ หรือเป็นหัวข้อคำศัพท์ใหม่) ที่นิยาม:
   - **"ฝ่ายต้นทาง" (Origin_Department_Field):** ฝ่ายที่เป็นจุดกำเนิดของเอกสารในเชิงโครงสร้างข้อมูล (ตรงกับ `originDepartment` ใน Document_Model ของ mockup)
   - **"ฝ่ายที่รับผิดชอบ":** ฝ่ายของผู้รับมอบหมาย (Assignee) ที่ดำเนินการเอกสาร (ตรงกับ `department` ของ Assignee → ฟิลด์ `department` ใน Document_Model)
   - รองรับ Requirement 7.1

2. **เพิ่มหมายเหตุชี้แจง "ต้นทาง" เชิงกระบวนการ (Reconciliation Note):** ในหมายเหตุคำศัพท์เดียวกัน เพิ่มข้อความชี้แจงว่า *คำว่า "ต้นทาง" ที่ปรากฏในบริบท workflow / State Machine / Notification หมายถึง Registrar_Actor (ผู้ Register / ผู้ Forward) ซึ่งเป็นบทบาทผู้กระทำ และแยกจากฟิลด์ "ฝ่ายต้นทาง" (Origin_Department_Field) ในเชิงโครงสร้างข้อมูล* — โดย **ไม่แก้ถ้อยคำ "ต้นทาง" เดิมในหมวด 5 (กระบวนการ), หมวด 6 (State Machine), หมวด 8 (Notification NT-02/03/07 ฯลฯ)** เพื่อคงความหมาย Registrar_Actor ไว้
   - รองรับ Requirement 7.4

3. **ปรับคำอธิบายฟิลด์ฝ่ายในหมวด 10 (Data Model):** ในคำอธิบาย ER Diagram/entity ที่เกี่ยวข้องกับฝ่าย (เช่น ความสัมพันธ์ `DEPARTMENT ||--o{ ASSIGNMENT : "ฝ่ายผู้รับ"` และฟิลด์ `ASSIGNMENT.assignee_ref`/`assignee_type`) ให้ระบุความหมายให้ชัด: ฝ่ายที่ผู้รับมอบหมายสังกัด = **"ฝ่ายที่รับผิดชอบ"** และแนบหมายเหตุว่าแนวคิดนี้ตรงกับฟิลด์ `department` ของ Document_Model (mockup) ส่วน **Origin_Department_Field ("ฝ่ายต้นทาง")** เป็นฟิลด์แยกที่ระบุจุดกำเนิดของเอกสาร (ตรงกับ `originDepartment` ของ mockup)
   - รองรับ Requirement 7.2

4. **ปรับคำอธิบาย Merge Variable ที่เกี่ยวกับฝ่าย (หมวด 8 — Merge Variables Dictionary):** ปรับคำอธิบายแถว `{{department}}` จากเดิม "ฝ่ายผู้รับ (กรณี Assign เป็นฝ่าย)" ให้เป็นความหมาย **"ฝ่ายที่รับผิดชอบ" ของผู้รับมอบหมาย** ให้ตรงกับป้ายกำกับใน mockup (ปรับเฉพาะคำอธิบายในคอลัมน์ความหมาย ไม่แก้ชื่อ variable `{{department}}` หรือ source mapping `ASSIGNMENT`)
   - รองรับ Requirement 7.5

5. **ปรับถ้อยคำที่สื่อ "ฝ่ายของผู้รับมอบหมาย" ให้เป็น "ฝ่ายที่รับผิดชอบ" อย่างสอดคล้อง:** ในบริบทการมอบหมายงานและ Data Model ที่หมายถึงฝ่ายของ Assignee ให้ใช้คำ "ฝ่ายที่รับผิดชอบ" แทนคำอื่นที่ใช้ในความหมายเดียวกัน (เช่น "ฝ่ายดำเนินการ" ที่ปรากฏในคำอธิบายส่วนหัว Document Detail หมวด 9, "ฝ่ายผู้รับ", หรือ "ฝ่าย" เดี่ยว ๆ ที่กำกวม) — โดย **ไม่แตะคำ "ต้นทาง" เชิงผู้กระทำ** ตามข้อ 2
   - รองรับ Requirement 7.3

6. **คงเนื้อหาเชิงกระบวนการเดิมทั้งหมด (Preservation Constraint):** ห้ามเปลี่ยนโครงสร้าง/ตรรกะของ workflow, State Machine (หมวด 6), Notification matrix และ templates (หมวด 8), และ Business Rules (หมวด 11) — การแก้ไขทุกจุดต้องเป็นการปรับ "คำศัพท์/คำจำกัดความ/คำอธิบายความหมาย" เท่านั้น ไม่เพิ่ม/ลบ/เปลี่ยน rule, state, transition, event, หรือ recipient
   - รองรับ Requirement 7.6

**ขอบเขตที่ไม่แตะต้อง (Do-Not-Touch):**
- ถ้อยคำ "ต้นทาง" ในบริบทผู้กระทำ (ผู้ Register / ผู้ Forward / ดึงงานกลับ / รับเอกสารจริงคืน) ในหมวด 2, 5, 6, 8 — คงเดิม
- ชื่อ entity/field ทางเทคนิคใน Data Model (`doc_direction`, `assignee_ref`, `registrar_ref` ฯลฯ) — คงเดิม
- ชื่อ Merge Variable (`{{department}}`, `{{assignee_name}}` ฯลฯ) และ source mapping — คงเดิม (ปรับได้เฉพาะคำอธิบายความหมาย)
- Change Log เดิม — คงไว้ และเพิ่มรายการเวอร์ชันใหม่ (append-only) ที่สรุปการปรับคำศัพท์ครั้งนี้

## Data Models

### CURRENT_USER
| ฟิลด์ | ที่มา | ตัวอย่าง |
|-------|-------|---------|
| name | USERS[x].name | นายสมชาย ใจดี |
| username | USERS[x].username | somchai.j |
| department | USERS[x].department | ฝ่ายการเงิน |
| position | USERS[x].position | เจ้าหน้าที่การเงินอาวุโส |

### Document (ฟิลด์ที่เกี่ยวข้อง)
| ฟิลด์ | ความหมาย | ป้ายกำกับ (TH) | แหล่งค่า |
|-------|----------|----------------|---------|
| originDepartment | ฝ่ายต้นทาง | ฝ่ายต้นทาง | ค่าใน DEPARTMENTS (ตอนลงทะเบียน = CURRENT_USER.department) |
| department | ฝ่ายที่รับผิดชอบ/ปลายทาง | ฝ่ายที่รับผิดชอบ | ค่าใน DEPARTMENTS (ตอนลงทะเบียน = department ของ Assignee) |

### ป้ายกำกับมาตรฐาน (Label Standard)
| ความหมาย | ป้ายกำกับที่ใช้ | คำที่เลิกใช้ |
|----------|----------------|-------------|
| ฝ่ายต้นทาง | "ฝ่ายต้นทาง" | — |
| ฝ่ายที่รับผิดชอบ | "ฝ่ายที่รับผิดชอบ" | "ฝ่ายดำเนินการ", "ฝ่าย" (เดี่ยว ๆ), "ผู้รับผิดชอบ" (ที่หมายถึงฝ่าย) |

### การจับคู่คำศัพท์ระหว่างเอกสารวิเคราะห์กับ mockup (Analysis ↔ Mockup Terminology Mapping)

ใช้เป็นแนวทางแก้คำใน`P2026-040_Analysis.md` ให้ตรงกับ Document_Model ของ mockup

| แนวคิด | คำ/คำจำกัดความในเอกสารวิเคราะห์ | ฟิลด์ mockup (Document_Model) | Merge Variable ที่เกี่ยวข้อง |
|--------|--------------------------------|-------------------------------|------------------------------|
| ฝ่ายต้นทาง (จุดกำเนิดเอกสาร) | "ฝ่ายต้นทาง" = **Origin_Department_Field** (ฟิลด์ข้อมูลเชิงโครงสร้าง) | `originDepartment` | — |
| ฝ่ายที่รับผิดชอบ (ฝ่ายของผู้รับมอบหมาย) | "ฝ่ายที่รับผิดชอบ" = `department` ของ Assignee | `department` | `{{department}}` = ฝ่ายที่รับผิดชอบของผู้รับมอบหมาย |
| ผู้กระทำต้นทางเชิงกระบวนการ | "ต้นทาง" = **Registrar_Actor** (ผู้ Register / ผู้ Forward) — คงความหมายเดิม | *(ไม่ใช่ฟิลด์ฝ่าย — เป็นบทบาทผู้กระทำ)* | `{{registrar_name}}`, `{{forwarded_by}}` |

> **หมายเหตุการแยกแนวคิด:** "ต้นทาง" (Registrar_Actor) เป็น *บทบาทผู้กระทำ* ในเชิงกระบวนการ ส่วน "ฝ่ายต้นทาง" (Origin_Department_Field) เป็น *ฟิลด์ข้อมูลฝ่าย* ทั้งสองใช้คำพ้อง "ต้นทาง" แต่คนละความหมาย — เอกสารวิเคราะห์ต้องคงคำแรกไว้และนิยามคำที่สองเพิ่มพร้อมหมายเหตุชี้แจง

## Error Handling

เนื่องจากเป็น mockup ฝั่งหน้าบ้านที่ใช้ข้อมูลในหน่วยความจำ กรณีผิดพลาดจึงจำกัดและจัดการแบบ graceful:

1. **ไม่พบผู้รับมอบหมายใน USERS:** `USERS.find(...)` คืน `undefined` → `responsibleDepartment` และ `assigneePosition` เป็นค่าว่าง และ UI แสดงสถานะ "ยังไม่ได้เลือกผู้รับมอบหมาย" (ป้องกัน runtime error ด้วย optional chaining และ `?? ''`)
2. **CURRENT_USER fallback:** ใช้ `USERS.find(...) ?? USERS[0]` เพื่อรับประกันว่าค่าคงที่ไม่เป็น `undefined` แม้ username อ้างอิงจะหาไม่พบ
3. **ยังไม่เลือกผู้รับมอบหมายตอน submit:** ฝ่ายที่รับผิดชอบเป็นค่าว่าง — เนื่องจากการ Assign เป็น optional ณ ขั้น Register (ตามพฤติกรรมเดิม) ระบบยังบันทึกได้ โดยฝ่ายที่รับผิดชอบจะว่างจนกว่าจะ Assign ภายหลัง
4. **ค่าฝ่ายไม่อยู่ใน DEPARTMENTS:** หลีกเลี่ยงโดยออกแบบให้ค่ามาจาก `CURRENT_USER.department` และ `assignee.department` ซึ่งอ้างอิง `USERS` ที่ฝ่ายเป็นสมาชิกของ `DEPARTMENTS` อยู่แล้ว

## Testing Strategy

เนื่องจากขอบเขตเป็น mockup ฝั่งหน้าบ้าน (React/TS/Tailwind + Vite) และโครงการไม่มี test framework ติดตั้ง การตรวจสอบหลักคือ **build/typecheck** ผ่าน `tsc` และ `vite build` เพื่อยืนยันว่าฟิลด์ใหม่และการอ้างอิงข้ามหน้าถูกต้องตามชนิดข้อมูล

- **Type/compile verification:** รัน `pnpm build` (หรือ `tsc --noEmit`) เพื่อยืนยันว่า `Document` interface ที่เพิ่ม `originDepartment` ถูกเติมค่าครบทุกรายการใน `DOCUMENTS` และทุกหน้าอ้างอิงฟิลด์ถูกต้อง
- **Manual/visual check:** ตรวจว่าป้ายกำกับ "ฝ่ายต้นทาง"/"ฝ่ายที่รับผิดชอบ" แสดงถูกต้องและ RegisterPage แสดงค่าอ่านอย่างเดียว/อนุมานตามการเลือกผู้รับมอบหมาย

**การตรวจสอบการปรับปรุงเอกสารวิเคราะห์ (Documentation Review Checklist — Requirement 7):**

เนื่องจากการปรับปรุง `P2026-040_Analysis.md` เป็นงานแก้ไขเอกสารข้อความคงที่ (ไม่ใช่โค้ดที่มี input/output) จึงตรวจสอบด้วย checklist การรีวิวเอกสารและการ grep แทนการทดสอบอัตโนมัติ:

- [ ] มีหมายเหตุคำศัพท์ที่นิยาม "ฝ่ายต้นทาง" (Origin_Department_Field) และ "ฝ่ายที่รับผิดชอบ" (ฝ่ายของผู้รับมอบหมาย) ครบทั้งสองคำ (7.1)
- [ ] หมวด 10 (Data Model) แยกฟิลด์ฝ่ายต้นทางออกจากฝ่ายของผู้รับมอบหมายอย่างชัดเจน ตรงกับ Document_Model (7.2)
- [ ] grep เอกสารในบริบทการมอบหมาย/Data Model ไม่พบการใช้ "ฝ่ายดำเนินการ"/"ฝ่ายผู้รับ"/"ฝ่าย" เดี่ยว ๆ แทนความหมาย "ฝ่ายที่รับผิดชอบ" (7.3)
- [ ] มีหมายเหตุชี้แจงว่า "ต้นทาง" เชิงผู้กระทำ = Registrar_Actor และถ้อยคำ "ต้นทาง" เดิมในหมวด 5/6/8 ยังคงอยู่ครบ (7.4)
- [ ] แถว `{{department}}` ใน Merge Variables Dictionary อธิบายเป็น "ฝ่ายที่รับผิดชอบ" ของผู้รับมอบหมาย (7.5)
- [ ] diff ยืนยันว่าไม่มีการเปลี่ยนโครงสร้าง/ตรรกะของ workflow, State Machine, Notification, Business Rules (เปลี่ยนเฉพาะคำศัพท์/คำจำกัดความ) (7.6)

Correctness properties ด้านล่างระบุพฤติกรรมสากลที่ต้องคงไว้ หากภายหลังมีการเพิ่ม test framework (เช่น Vitest + fast-check) properties เหล่านี้พร้อมนำไปเป็น property-based tests ได้ทันที (ขั้นต่ำ 100 iterations ต่อ property)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Origin department is always the current user's department

*For any* form content entered during registration, the persisted document's `originDepartment` SHALL equal `CURRENT_USER.department`, regardless of any other field the user edits.

**Validates: Requirements 2.1, 2.4, 6.1**

### Property 2: Responsible department and position reflect the latest selected assignee

*For any* assignee selected from the Mock_Directory (including after changing the selection any number of times), the derived Responsible_Department SHALL equal the latest selected assignee's `department` and the derived Assignee_Position SHALL equal that assignee's `position`.

**Validates: Requirements 3.1, 3.2, 3.5**

### Property 3: Every directory user's department is a valid department

*For any* user in `USERS` (including `CURRENT_USER`), that user's `department` SHALL be a member of `DEPARTMENTS`.

**Validates: Requirements 1.2, 1.3**

### Property 4: All sample documents carry valid origin and responsible departments

*For any* document in `DOCUMENTS`, both `originDepartment` and `department` SHALL be non-empty values that are members of `DEPARTMENTS`.

**Validates: Requirements 4.3, 6.1**

### หมายเหตุ: Requirement 7 (การปรับปรุงเอกสารวิเคราะห์) — ไม่มี property-based test

ข้อกำหนดทุกข้อของ Requirement 7 (7.1–7.6) เป็นการแก้ไขเอกสารข้อความคงที่ (`P2026-040_Analysis.md`) ไม่ใช่ตรรกะของโค้ดที่มีพื้นที่ input ให้สุ่มทดสอบ จึง **ไม่สามารถเขียนเป็น property แบบ "for all inputs X, P(X)"** ได้ และไม่เหมาะกับ property-based testing การตรวจสอบทำผ่าน **Documentation Review Checklist** ในหัวข้อ Testing Strategy (example-based verification) แทน — Properties 1–4 ข้างต้นครอบคลุมพฤติกรรมของโค้ด mockup (Requirements 1–6) และไม่ซ้ำซ้อนกับรายการใด ๆ ของ Requirement 7

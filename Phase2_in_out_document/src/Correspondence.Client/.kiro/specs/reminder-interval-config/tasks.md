# Implementation Plan: การตั้งค่ารอบการแจ้งเตือนตามระดับความเร่งด่วน (Reminder Interval Configuration)

## Overview

แผนการพัฒนานี้แปลงเอกสารออกแบบให้เป็นชุดงานเขียนโค้ดที่ทำทีละขั้นแบบต่อยอด (incremental) สำหรับงานฝั่งหน้าจอล้วน (frontend-only) ด้วย React + TypeScript + Tailwind (Vite) โดยใช้ mock data เท่านั้น ไม่มี backend/scheduler จริง และ **ไม่มี test framework** การตรวจสอบความถูกต้องทำผ่าน `pnpm build` และ `pnpm exec tsc --noEmit`

ลำดับการทำงานยึดตาม dependency ระดับไฟล์:
- `src/types.ts` (พื้นฐาน) → `src/mock.ts` (ค่า + helpers) → `src/pages/AdminPage.tsx` และ `src/pages/DocumentDetailPage.tsx` (พึ่งพา `mock.ts` เท่านั้น ทำขนานกันได้)
- `P2026-040_Analysis.md` เป็นเอกสาร ไม่พึ่งพาโค้ด ทำได้อิสระ

หมายเหตุ: โปรเจกต์ไม่มี test runner จึง**ไม่มี**การเขียน property test จริง งาน property test ทั้งหมดถูกกำกับด้วย `*` (ข้าม/ไม่ต้องทำ) และคงไว้เพื่อการตรวจสอบเชิงตรรกะด้วยตนเองเท่านั้น

## Tasks

- [ ] 1. เพิ่มชนิดข้อมูล `ReminderIntervalConfig` ใน `src/types.ts`
  - เพิ่ม `export type ReminderIntervalConfig = Record<UrgencyLevel, number>` ต่อจากชนิด `UrgencyLevel` ที่มีอยู่เดิม
  - ใส่คอมเมนต์กำกับว่าเป็นรอบการแจ้งเตือน (จำนวนวัน จำนวนเต็มบวก) แยกตามระดับความเร่งด่วน
  - งานพื้นฐาน ไม่พึ่งพาไฟล์อื่น
  - _Requirements: 1.1_

- [ ] 2. เพิ่มค่าเริ่มต้นและ helper functions ใน `src/mock.ts`
  - [ ] 2.1 เพิ่มค่าเริ่มต้นและ helper รอบการแจ้งเตือน
    - ปรับ import type ให้รวม `UrgencyLevel` และ `ReminderIntervalConfig` จาก `./types`
    - เพิ่ม `export const REMINDER_INTERVALS: ReminderIntervalConfig = { normal: 5, urgent: 3, 'very-urgent': 1 }` เป็น single source of truth
    - เพิ่ม `export function getReminderInterval(urgency: UrgencyLevel): number` คืน `REMINDER_INTERVALS[urgency]`
    - _Requirements: 1.2, 1.3, 1.4, 2.1_

  - [ ] 2.2 เพิ่ม helper `latestAssigneesPerTree(subs: SubAssignment[]): SubAssignment[]`
    - สร้าง map `parentId → children[]` คงลำดับตาม array เดิม (ลำดับการเพิ่ม)
    - ระบุ root = งานย่อยที่ `parentId` เป็น undefined หรือชี้ไปยัง id ที่ไม่มีอยู่ (orphan → root)
    - เดินจาก root ลงไปยัง leaf ที่ใหม่ที่สุด (ลูกตัวสุดท้ายในแต่ละชั้น) พร้อม cycle guard (`Set` ของ id ที่เยี่ยมแล้ว) กันลูปไม่รู้จบ
    - คืน Latest_Assignee 1 รายการต่อ 1 tree; เมื่อ `subs` ว่างคืน `[]`; ต้องไม่ throw ในทุกกรณี
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.3 (ข้าม — ไม่มี test runner) Property test สำหรับ `getReminderInterval`
    - **Property 1: รอบการแจ้งเตือนตรงกับ config**
    - **Validates: Requirements 1.4, 2.1**

  - [ ]* 2.4 (ข้าม — ไม่มี test runner) Property test สำหรับ `latestAssigneesPerTree`
    - **Property 3: หนึ่ง Latest_Assignee ต่อหนึ่ง Delegation_Tree**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ] 3. เพิ่มแท็บ Reminder_Config_Tab ในหน้า `src/pages/AdminPage.tsx`
  - [ ] 3.1 ขยาย state และเพิ่มปุ่มแท็บที่ 4
    - เพิ่ม `Clock` ในการ import icon จาก lucide-react
    - เพิ่ม import `REMINDER_INTERVALS` จาก `../mock` และ type `ReminderIntervalConfig` จาก `../types`
    - ขยาย union ของ `activeTab` เป็น `'users' | 'monitor' | 'master-data' | 'reminder'`
    - เพิ่ม state `reminderIntervals` (`useState<ReminderIntervalConfig>(REMINDER_INTERVALS)`)
    - เพิ่มปุ่มแท็บที่ 4 "ตั้งค่าการแจ้งเตือน (Reminder)" (ไอคอน `Clock`) สไตล์ Deves สอดคล้องปุ่มแท็บเดิม
    - _Requirements: 3.1_

  - [ ] 3.2 สร้างส่วนเนื้อหาแท็บ reminder + การบันทึกค่าแบบ validate
    - แสดงเฉพาะเมื่อ `activeTab === 'reminder'`: info banner (ไอคอน `AlertCircle`) อธิบายว่าแจ้งซ้ำทุก N วันจนกว่าเอกสารจะ Completed และส่งเฉพาะ Origin + ผู้รับมอบหมายล่าสุดของแต่ละสาย
    - การ์ด 3 แถว (หนึ่งแถวต่อ Urgency_Level) พร้อม urgency badge (normal เทา/เขียว, urgent ส้ม `#FD7E14`, very-urgent แดง `#DC3545`), `<input type="number" min="1" step="1">` ผูกกับ `reminderIntervals[level]` และหน่วย "วัน"
    - เพิ่ม `handleSaveInterval(level, raw)` ตรวจ `Number.isInteger(raw) && raw > 0`: ถ้าไม่ผ่านให้ปฏิเสธ คงค่าเดิม และ toast error; ถ้าผ่านให้ `setReminderIntervals` และ toast success
    - เพิ่มหมายเหตุท้ายการ์ดว่าเป็นการตั้งค่าระดับ mockup (ไม่มี scheduler จริง)
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 2.2, 2.4_

  - [ ]* 3.3 (ข้าม — ไม่มี test runner) Property test สำหรับการ validate ค่ารอบ
    - **Property 2: การตรวจสอบค่ารอบเป็นจำนวนเต็มบวก**
    - **Validates: Requirements 3.4, 3.5**

- [ ] 4. เพิ่มการ์ด "การแจ้งเตือน (Reminder)" ในหน้า `src/pages/DocumentDetailPage.tsx`
  - [ ] 4.1 เพิ่มการ์ด reminder แบบคอมแพ็กต์ (เฉพาะเอกสารรับเข้า)
    - เพิ่ม import `getReminderInterval`, `latestAssigneesPerTree` จาก `../mock` (ใช้ไอคอน `Bell`/`Clock`)
    - แสดงเฉพาะเอกสารรับเข้า (`!isOutgoing`) วางในคอลัมน์ขวาเป็นการ์ด `card p-5`
    - คำนวณ `reminderDays = getReminderInterval(doc.urgency)` และ `isCompleted = doc.status === 'completed'`
    - รอบการแจ้งเตือน: ยังไม่ completed → "แจ้งซ้ำทุก {reminderDays} วัน จนกว่าสถานะจะแล้วเสร็จ (Completed)"; completed → แบดจ์/ข้อความ "การแจ้งเตือนสิ้นสุดแล้ว" สีเขียว success
    - _Requirements: 6.1, 6.3, 6.4, 2.3_

  - [ ] 4.2 คำนวณและแสดง Reminder_Recipients เป็น chips
    - Origin: `TIMELINE_EVENTS[0]?.actor` fallback `` `${doc.originDepartment} (ผู้ลงทะเบียน)` ``
    - Latest_Assignee: `latestAssigneesPerTree(subsState)`
    - `recipientNames = Array.from(new Set([originName, ...latestAssignees.map(s => s.assigneeName)]))` (dedupe)
    - เรนเดอร์เป็น chips สไตล์ Deves: chip Origin กำกับ "ต้นทาง (ผู้ลงทะเบียน)", chips อื่นกำกับ "ผู้รับมอบหมายล่าสุด"; ถ้า `latestAssignees` ว่าง แสดงเฉพาะ Origin
    - _Requirements: 6.2, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 4.3 (ข้าม — ไม่มี test runner) Property test สำหรับกฎผู้รับการแจ้งเตือน
    - **Property 4: ผู้รับการแจ้งเตือน = Origin รวมกับ Latest_Assignee ต่อทุก tree**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [ ] 5. ปรับปรุงเอกสารวิเคราะห์ `P2026-040_Analysis.md` (การเปลี่ยนกฎเชิงธุรกิจโดยตั้งใจ)
  - ปรับ `BR-3.2` / `BR-3.3` (หมวด 11.3): รอบการแจ้งเตือนตั้งค่าได้ต่อระดับความเร่งด่วน ค่าเริ่มต้น normal = 5, urgent = 3, very-urgent = 1 วัน และแจ้งซ้ำจนกว่าเอกสารจะ Completed
  - ปรับตารางรอบการแจ้งเตือนหมวด 8.2 เป็น 5 / 3 / 1 วัน (normal / urgent / very-urgent)
  - เพิ่ม/ปรับกฎผู้รับการแจ้งเตือน: ผู้รับ = Origin (ต้นทาง) + Latest_Assignee ของแต่ละ Delegation_Tree (ไม่รวม participant ทั้งหมด และไม่รวมหัวหน้าฝ่ายทั่วไป เว้นแต่เป็น Origin/Latest_Assignee)
  - เพิ่มรายการ Change Log **Draft 1.8.7 → 1.8.8** อธิบายการเปลี่ยนแปลงกฎการแจ้งเตือนและผู้รับ พร้อมปรับ Version ส่วนหัวเป็น Draft 1.8.8
  - คงเนื้อหา State Machine (หมวด 6) และ Notification templates ที่ไม่เกี่ยวข้องไว้ตามเดิม
  - งานเอกสารอิสระ ไม่พึ่งพาโค้ด
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6. Checkpoint — ตรวจ build และตรวจชนิดข้อมูล
  - รัน `pnpm build` และ `pnpm exec tsc --noEmit` — ต้องผ่านโดยไม่มีข้อผิดพลาดใหม่
  - ตรวจด้วยตนเอง: Admin › แท็บ Reminder (แสดง 5/3/1, แก้ค่า+Save เห็นค่าใหม่+toast, ใส่ 0/-1/1.5/ว่าง แล้วถูกปฏิเสธคงค่าเดิม)
  - ตรวจด้วยตนเอง: `doc-001` (very-urgent) แสดง "แจ้งซ้ำทุก 1 วัน" + ผู้รับ (Origin + Latest_Assignee ต่อ tree); เอกสาร completed แสดง "การแจ้งเตือนสิ้นสุดแล้ว"; เอกสารส่งออก (outgoing) ไม่แสดงการ์ด reminder และไม่เปลี่ยนแปลง
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 8.1, 8.2_

## Notes

- โปรเจกต์นี้เป็น mockup **ไม่มี test framework** งานที่กำกับด้วย `*` (2.3, 2.4, 3.3, 4.3) เป็น property test เชิงตรรกะที่ **ข้าม/ไม่ต้องเขียนจริง** คงไว้เพื่อการตรวจสอบด้วยตนเองและอ้างอิงคุณสมบัติในเอกสารออกแบบ
- แต่ละงานอ้างอิงข้อกำหนด (requirement clause) เฉพาะเพื่อการ trace
- ลำดับ dependency ระดับไฟล์: `types.ts` → `mock.ts` → (`AdminPage.tsx` ∥ `DocumentDetailPage.tsx`); `P2026-040_Analysis.md` อิสระ
- การตรวจสอบความถูกต้องทำผ่าน `pnpm build` + `pnpm exec tsc --noEmit` และการตรวจด้วยตนเองในเบราว์เซอร์

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "5"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "3.1", "4.1"] },
    { "id": 3, "tasks": ["3.2", "4.2"] },
    { "id": 4, "tasks": ["3.3", "4.3"] }
  ]
}
```

# Implementation Plan: origin-responsible-department

## Overview

ปรับ mockup ฝั่งหน้าบ้าน (React + TypeScript + Tailwind, Vite) เพื่อแยกแนวคิด "ฝ่ายต้นทาง" (Origin_Department) ออกจาก "ฝ่ายที่รับผิดชอบ" (Responsible_Department) และจัดป้ายกำกับภาษาไทยให้เป็นมาตรฐานเดียวกันทุกหน้า

ลำดับการทำงานเริ่มจากชั้นข้อมูล (types + mock) แล้วต่อยอดไปที่ฟอร์มลงทะเบียน (RegisterPage) และปิดท้ายด้วยการจัดป้ายกำกับในหน้าแสดงผล (Detail / List / Reports) ทุกงานต่อยอดจากงานก่อนหน้าและเชื่อมโยงกันจนครบ ตรวจสอบด้วย `tsc` / `vite build` เนื่องจากโครงการยังไม่มี test framework ติดตั้ง

รากของโค้ด: `Internal Web App UI Design/`

## Tasks

- [x] 1. วางชั้นข้อมูล: โมเดลเอกสารและข้อมูลจำลอง (types + mock)
  - [x] 1.1 เพิ่มฟิลด์ `originDepartment` ใน interface `Document`
    - แก้ `src/types.ts` เพิ่ม `originDepartment: string` ใน interface `Document` (ฝ่ายต้นทาง) และคง `department: string` ไว้เป็นฝ่ายที่รับผิดชอบ/ปลายทาง พร้อมคอมเมนต์กำกับความหมายทั้งสองฟิลด์
    - _Requirements: 4.1, 4.2_

  - [x] 1.2 เพิ่มค่าคงที่ `CURRENT_USER` ใน Mock_Directory
    - แก้ `src/mock.ts` เพิ่ม `export const CURRENT_USER: User = USERS.find(u => u.username === 'somchai.j') ?? USERS[0]` (วางหลังนิยาม `USERS`) เพื่อ derive จากรายการที่มีอยู่จริง โดย `department` (`ฝ่ายการเงิน`) เป็นสมาชิกของ `DEPARTMENTS`
    - _Requirements: 1.1, 1.2, 1.3, 6.1_

  - [x] 1.3 เติมค่า `originDepartment` ให้เอกสารทุกรายการใน `DOCUMENTS`
    - แก้ `src/mock.ts` เพิ่ม `originDepartment` ให้ทุก object ใน `DOCUMENTS` ด้วยค่าที่อยู่ใน `DEPARTMENTS` (เช่น เอกสารรับเข้าใช้ `งานสารบรรณ` เป็นต้นทางที่สมเหตุสมผล ส่วนเอกสารส่งออกใช้ฝ่ายผู้ริเริ่มเรื่อง) และคง `department` เดิมไว้เป็นฝ่ายที่รับผิดชอบ
    - ตรวจให้ทั้ง `originDepartment` และ `department` ของทุกรายการเป็นค่าไม่ว่างและเป็นสมาชิกของ `DEPARTMENTS`
    - _Requirements: 4.3, 6.1_

  - [ ]* 1.4 เขียน property tests สำหรับข้อมูลจำลอง (ต้องเพิ่ม test framework เช่น Vitest + fast-check ก่อน)
    - **Property 3: Every directory user's department is a valid department** — สำหรับทุก user ใน `USERS` (รวม `CURRENT_USER`) ต้องมี `department` เป็นสมาชิกของ `DEPARTMENTS`
    - **Property 4: All sample documents carry valid origin and responsible departments** — สำหรับทุก document ใน `DOCUMENTS` ทั้ง `originDepartment` และ `department` ต้องไม่ว่างและเป็นสมาชิกของ `DEPARTMENTS`
    - **Validates: Requirements 1.2, 1.3, 4.3, 6.1**

- [x] 2. ปรับฟอร์มลงทะเบียน (Registration_System)
  - [x] 2.1 Rework `RegisterPage`: ฝ่ายต้นทางอ่านอย่างเดียว + อนุมานฝ่ายที่รับผิดชอบจากผู้รับมอบหมาย
    - แก้ `src/pages/RegisterPage.tsx` import `CURRENT_USER` และคำนวณ `const originDepartment = CURRENT_USER.department` แสดงในช่องอ่านอย่างเดียว (`readOnly` + `aria-readonly`) ป้ายกำกับ "ฝ่ายต้นทาง" พร้อมข้อความ "กำหนดอัตโนมัติจากผู้ใช้ที่ล็อกอิน"
    - Derive ฝ่ายที่รับผิดชอบ + ตำแหน่งจากผู้รับมอบหมายล่าสุด: `const assignee = USERS.find(u => u.name === selectedAssigneeName)`, `responsibleDepartment = assignee?.department ?? ''`, `assigneePosition = assignee?.position ?? ''` แสดงป้ายกำกับ "ฝ่ายที่รับผิดชอบ" แบบอ่านอย่างเดียว และเมื่อยังไม่เลือกให้แสดงข้อความ "ยังไม่ได้เลือกผู้รับมอบหมาย"
    - ลบ dropdown ฝ่ายอิสระเดิม (`form.department`) และ validation `e.department` ออก; ตอน submit persist `originDepartment: CURRENT_USER.department`, `department: responsibleDepartment`, `assigneePosition`
    - ยกเลิกการ set `department: 'ฝ่ายพัฒนากระบวนการทางธุรกิจ'` แบบ hardcode จากการเชื่อม EDR modal (ค่าที่ไม่อยู่ใน `DEPARTMENTS`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 6.2_

  - [ ]* 2.2 เขียน property tests สำหรับตรรกะการ derive ใน RegisterPage (ต้องเพิ่ม test framework ก่อน)
    - **Property 1: Origin department is always the current user's department** — สำหรับเนื้อหาฟอร์มใด ๆ ค่า `originDepartment` ที่ persist ต้องเท่ากับ `CURRENT_USER.department`
    - **Property 2: Responsible department and position reflect the latest selected assignee** — สำหรับผู้รับมอบหมายใด ๆ ที่เลือก (รวมถึงหลังเปลี่ยนการเลือกหลายครั้ง) `responsibleDepartment` ต้องเท่ากับ `department` และ `assigneePosition` เท่ากับ `position` ของผู้รับมอบหมายล่าสุด
    - **Validates: Requirements 2.1, 2.4, 3.1, 3.2, 3.5, 6.1**

- [x] 3. จัดป้ายกำกับภาษาไทยให้เป็นมาตรฐานในหน้าแสดงผล
  - [x] 3.1 ปรับ `DocumentDetailPage` ให้แยกป้ายฝ่ายต้นทาง/ฝ่ายที่รับผิดชอบ
    - แก้ `src/pages/DocumentDetailPage.tsx` ในบล็อกกริดข้อมูลเอกสาร แสดง `doc.originDepartment` ด้วยป้าย "ฝ่ายต้นทาง" และ `doc.department` ด้วยป้าย "ฝ่ายที่รับผิดชอบ" แทนป้าย "ฝ่ายดำเนินการ" เดิม
    - _Requirements: 5.1, 5.2, 5.5_

  - [x] 3.2 ปรับหัวคอลัมน์และ label filter ใน `DocumentListPage`
    - แก้ `src/pages/DocumentListPage.tsx` เปลี่ยนหัวคอลัมน์ `ฝ่าย` เป็น `ฝ่ายที่รับผิดชอบ` โดยคง cell ที่แสดง `doc.department` และปรับ label ของตัวกรอง filterDept เป็น "ฝ่ายที่รับผิดชอบ" (ตรรกะ filter ยังใช้ `department` ตามเดิม)
    - _Requirements: 5.3, 5.5_

  - [x] 3.3 ปรับป้ายกำกับ/หัวคอลัมน์ใน `ReportsPage`
    - แก้ `src/pages/ReportsPage.tsx` ปรับหัวคอลัมน์ตาราง by-dept และ filter label ที่สื่อถึงฝ่ายรับผิดชอบให้ใช้คำ "ฝ่ายที่รับผิดชอบ" อย่างสอดคล้อง (ยังอ่านค่าจาก `doc.department`)
    - _Requirements: 5.4, 5.5_

- [x] 4. Checkpoint - ยืนยัน build/typecheck ผ่าน
  - รัน `pnpm build` (หรือ `tsc --noEmit`) ใน `Internal Web App UI Design/` เพื่อยืนยันว่าฟิลด์ `originDepartment` ถูกเติมครบทุกรายการใน `DOCUMENTS` และทุกหน้าอ้างอิงฟิลด์ถูกต้องตามชนิดข้อมูล
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. ปรับปรุงคำศัพท์ในเอกสารวิเคราะห์ (Analysis_Document_Terminology_Alignment)
  - งานปรับปรุงเอกสารเท่านั้น (documentation-only) ที่ไฟล์ `P2026-040_Analysis.md` — ปรับ "คำศัพท์/คำจำกัดความ/คำอธิบายความหมาย" เท่านั้น ห้ามแก้ตรรกะเชิงกระบวนการ (workflow, State Machine, Notification, Business Rules) และห้ามแก้ชื่อฟิลด์/variable ทางเทคนิค
  - อ้างอิง design section 7 "Analysis_Document_Terminology_Alignment" (Edit Plan ข้อ 1–6)

  - [x] 5.1 เพิ่มหมายเหตุคำศัพท์ (Terminology Note) และหมายเหตุชี้แจง "ต้นทาง" เชิงกระบวนการ (Reconciliation Note)
    - แก้ `P2026-040_Analysis.md` เพิ่ม/ขยายบล็อกคำจำกัดความ (ต่อจาก "หมายเหตุสำคัญเรื่องคำศัพท์" ที่มีอยู่ก่อนสารบัญ หรือหัวข้อคำศัพท์ใหม่) นิยาม "ฝ่ายต้นทาง" (Origin_Department_Field = ฝ่ายที่เป็นจุดกำเนิดของเอกสาร ตรงกับ `originDepartment` ใน Document_Model) และ "ฝ่ายที่รับผิดชอบ" (ฝ่ายของผู้รับมอบหมาย ตรงกับ `department` ของ Assignee)
    - ในหมายเหตุเดียวกัน เพิ่ม Reconciliation Note ชี้แจงว่า คำว่า "ต้นทาง" ในบริบท workflow / State Machine / Notification หมายถึง Registrar_Actor (ผู้ Register / ผู้ Forward) ซึ่งเป็นบทบาทผู้กระทำ และแยกจากฟิลด์ "ฝ่ายต้นทาง" (Origin_Department_Field) เชิงโครงสร้างข้อมูล โดยไม่แก้ถ้อยคำ "ต้นทาง" เดิมในหมวด 5/6/8
    - _Requirements: 7.1, 7.4_

  - [x] 5.2 ปรับคำอธิบายฟิลด์ฝ่ายในหมวด 10 (Data Model) และ Merge Variable `{{department}}` (หมวด 8)
    - แก้ `P2026-040_Analysis.md` หมวด 10 (Data Model): ในคำอธิบาย ER Diagram/entity ที่เกี่ยวกับฝ่าย (เช่น ความสัมพันธ์ `DEPARTMENT ||--o{ ASSIGNMENT : "ฝ่ายผู้รับ"` และฟิลด์ `ASSIGNMENT.assignee_ref`/`assignee_type`) ระบุให้ชัดว่า ฝ่ายที่ผู้รับมอบหมายสังกัด = "ฝ่ายที่รับผิดชอบ" (ตรงกับ `department` ของ Document_Model) และแยก Origin_Department_Field ("ฝ่ายต้นทาง" ตรงกับ `originDepartment`) เป็นฟิลด์จุดกำเนิดของเอกสาร — ไม่แก้ชื่อ entity/field ทางเทคนิค
    - แก้ Merge Variables Dictionary (หมวด 8): ปรับคำอธิบายแถว `{{department}}` จาก "ฝ่ายผู้รับ (กรณี Assign เป็นฝ่าย)" ให้เป็นความหมาย "ฝ่ายที่รับผิดชอบ" ของผู้รับมอบหมาย โดยไม่แก้ชื่อ variable `{{department}}` หรือ source mapping `ASSIGNMENT`
    - _Requirements: 7.2, 7.5_

  - [x] 5.3 แทนคำกำกวมด้วย "ฝ่ายที่รับผิดชอบ" ในบริบทการมอบหมาย/Data Model
    - แก้ `P2026-040_Analysis.md` แทนคำ "ฝ่ายดำเนินการ" / "ฝ่ายผู้รับ" / "ฝ่าย" เดี่ยว ๆ ที่กำกวม ด้วย "ฝ่ายที่รับผิดชอบ" เฉพาะในบริบทที่หมายถึงฝ่ายของ Assignee (เช่น คำอธิบายส่วนหัว Document Detail หมวด 9 และคำอธิบายใน Data Model หมวด 10)
    - ห้ามแตะถ้อยคำ "ต้นทาง" เชิงผู้กระทำ (ผู้ Register / ผู้ Forward / ดึงงานกลับ / รับเอกสารจริงคืน) และห้ามแก้ตรรกะ workflow / State Machine / Notification / Business Rules
    - เพิ่มรายการ Change Log เวอร์ชันใหม่แบบ append-only สรุปการปรับคำศัพท์ครั้งนี้ (คง Change Log เดิมไว้)
    - _Requirements: 7.3, 7.6_

  - [ ]* 5.4 ตรวจสอบการปรับปรุงเอกสารด้วย Documentation Review Checklist (example-based: grep + diff)
    - ใช้ Documentation Review Checklist ใน design (Testing Strategy) ตรวจสอบครบทั้ง 6 ข้อ: มีคำจำกัดความ "ฝ่ายต้นทาง"/"ฝ่ายที่รับผิดชอบ" (7.1); หมวด 10 แยกฟิลด์ชัดตรงกับ Document_Model (7.2); grep ในบริบทการมอบหมาย/Data Model ไม่พบ "ฝ่ายดำเนินการ"/"ฝ่ายผู้รับ"/"ฝ่าย" เดี่ยว ๆ แทน "ฝ่ายที่รับผิดชอบ" (7.3); มีหมายเหตุชี้แจง "ต้นทาง" = Registrar_Actor และถ้อยคำ "ต้นทาง" เดิมในหมวด 5/6/8 ยังครบ (7.4); แถว `{{department}}` อธิบายเป็น "ฝ่ายที่รับผิดชอบ" (7.5); diff ยืนยันไม่มีการเปลี่ยนตรรกะ workflow/State Machine/Notification/Business Rules (7.6)
    - ไม่มี property-based test (Requirement 7 เป็นการแก้เอกสารข้อความคงที่ ตรวจแบบ example-based ตาม design)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 6. Checkpoint - ยืนยันการปรับปรุงเอกสารวิเคราะห์
  - ทวน Documentation Review Checklist ให้ครบทุกข้อ และยืนยันด้วย diff ว่าการเปลี่ยนแปลงจำกัดเฉพาะคำศัพท์/คำจำกัดความ ไม่กระทบตรรกะเชิงกระบวนการ
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional. โครงการยังไม่มี test framework ติดตั้ง จึงต้องเพิ่ม (เช่น Vitest + fast-check, ขั้นต่ำ 100 iterations ต่อ property) ก่อนจะรัน property tests ได้ การตรวจสอบหลักคือ build/typecheck ตาม Testing Strategy ใน design
- แต่ละงานอ้างอิง requirements เฉพาะเพื่อ traceability
- งานถูกจัดเรียงแบบ incremental: ชั้นข้อมูล → ฟอร์มลงทะเบียน → หน้าแสดงผล → checkpoint เพื่อยืนยันการเชื่อมโยงทั้งหมด
- ฟิลด์ `department` ถูก repurpose เป็น Responsible_Department เพื่อรักษาความเข้ากันได้ของโค้ดเดิม (List/Reports filter)
- งานกลุ่มที่ 5 (Requirement 7) เป็นการปรับปรุงเอกสาร `P2026-040_Analysis.md` เท่านั้น เป็นอิสระจากงานโค้ด mockup (กลุ่ม 1–3) จึงรันขนานกันได้ และตรวจสอบด้วย Documentation Review Checklist (example-based: grep + diff) ไม่ใช่ automated test

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "5.1"] },
    { "id": 1, "tasks": ["1.3", "3.1", "3.2", "3.3", "5.2"] },
    { "id": 2, "tasks": ["2.1", "1.4", "5.3"] },
    { "id": 3, "tasks": ["2.2", "5.4"] }
  ]
}
```

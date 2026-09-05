# Requirements Document

## Introduction

ฟีเจอร์ **Monitor Multi-Scope** ขยายความสามารถของหน้าจอตั้งค่าผู้เฝ้าติดตาม (Monitor Config) ในแท็บ "ตั้งค่าผู้เฝ้าติดตาม (Monitor)" ของหน้า Admin (`AdminPage.tsx`) ให้ Monitor หนึ่งรายการสามารถกำหนดเป้าหมายการเฝ้าติดตามได้ **หลายฝ่ายพร้อมกัน** (multi-select) โดยมีประเภท Scope แบบ "ทั้งฝ่าย (department)" เป็นประเภทหลัก และคงประเภท Scope อื่น (workgroup / user / doc_direction) ให้เลือกได้ตามเดิม

นอกจากนี้เพิ่มตัวเลือก **"ทุกฝ่าย (all departments)"** ที่จัดเก็บเป็น flag `allDepartments = true` หมายถึงครอบคลุมทุกฝ่ายทั้งที่มีอยู่ปัจจุบันและที่จะเพิ่มในอนาคต และปรับโครงสร้างข้อมูล `MonitorAssignment` จากเป้าหมายเดี่ยว (`scopeRef: string` + `scopeLabel: string`) เป็นเป้าหมายหลายรายการ (`scopeRefs: string[]` + `allDepartments?: boolean`) พร้อมแสดงผลขอบเขตในตารางเป็นหลาย chip/label

งานนี้เป็น **frontend-only mockup** (React + TypeScript + Tailwind บน Vite) ใช้ mock data ไม่มี backend/database/auth จริง คงธีม Deves (Navy `#012169` + Gold `#FFCD00`) และคงกฎ Monitor เดิม (BR-5.3: ดู + Follow up เท่านั้น ไม่ผูกกับผู้รับงาน) รวมถึงการปรับปรุงเอกสารวิเคราะห์ `P2026-040_Analysis.md` (หมวด 3.5, BR-5.3, Data Model `MONITOR_ASSIGNMENT`) ให้สอดคล้อง (documentation only)

## Glossary

- **Monitor_Config_UI**: ส่วนของหน้า `AdminPage.tsx` ในแท็บ "ตั้งค่าผู้เฝ้าติดตาม (Monitor)" ที่แสดงตาราง Monitor และฟอร์มเพิ่ม/แก้ไข (Add/Edit Monitor Modal)
- **Monitor_Assignment**: รายการตั้งค่าผู้เฝ้าติดตามหนึ่งรายการ ตามโครงสร้าง interface `MonitorAssignment` ใน `types.ts`
- **Scope_Type**: ประเภทขอบเขตการเฝ้าติดตาม หนึ่งในค่า `department` / `workgroup` / `user` / `doc_direction` (type `MonitorScopeType`)
- **Scope_Refs**: รายการค่าเป้าหมายของ Scope ที่เลือกไว้ (ฟิลด์ `scopeRefs: string[]`) แทนที่ฟิลด์เดิม `scopeRef: string`
- **All_Departments_Flag**: ฟิลด์ boolean `allDepartments` บน `Monitor_Assignment` ที่เมื่อเป็น `true` หมายถึงครอบคลุมทุกฝ่ายทั้งที่มีอยู่และที่จะเพิ่มในอนาคต
- **Department_Scope**: การตั้งค่า `Monitor_Assignment` ที่มี `scopeType = 'department'`
- **Scope_Chip**: องค์ประกอบ UI (chip/label) ที่แสดงเป้าหมายหนึ่งรายการในคอลัมน์ "ขอบเขต (Scope)" ของตาราง Monitor
- **Monitor_User_Picker**: ตัวเลือก (dropdown) สำหรับเลือกผู้ใช้จากรายการ `USERS` ที่ `active = true` เพื่อกำหนดเป็นผู้เฝ้าติดตาม
- **Mock_Store**: ข้อมูลจำลองใน `mock.ts` โดยเฉพาะค่าคงที่ `MONITOR_ASSIGNMENTS`
- **Analysis_Document**: เอกสาร `P2026-040_Analysis.md` หมวด 3.5, กฎ BR-5.3 และ Data Model `MONITOR_ASSIGNMENT`
- **Build_Process**: การตรวจสอบด้วย TypeScript compiler (`tsc`) และ Vite build ที่ใช้แทนการทดสอบ (โปรเจกต์ไม่มี test framework)

## Requirements

### Requirement 1: โครงสร้างข้อมูล Monitor รองรับหลายเป้าหมาย

**User Story:** As a ผู้ดูแลระบบ (Admin), I want ให้โครงสร้างข้อมูล Monitor เก็บเป้าหมายได้หลายรายการ, so that Monitor หนึ่งรายการเฝ้าติดตามได้หลายฝ่ายโดยไม่ต้องสร้างหลายรายการ

#### Acceptance Criteria

1. THE Monitor_Assignment SHALL provide a field named `scopeRefs` ของชนิด `string[]` เพื่อจัดเก็บค่าเป้าหมายของ Scope หลายรายการ
2. THE Monitor_Assignment SHALL provide an optional field named `allDepartments` ของชนิด `boolean`
3. THE Monitor_Assignment SHALL retain fields `scopeType`, `scopeLabel`, `docDirectionFilter`, `notifyEnabled`, `status`, `createdBy`, และ `createdAt`
4. WHERE `allDepartments` มีค่า `true`, THE Monitor_Assignment SHALL represent การครอบคลุมทุกฝ่ายทั้งที่มีอยู่ปัจจุบันและที่จะเพิ่มในอนาคต
5. THE Monitor_Config_UI SHALL support Monitor_Assignment ที่มี `scopeRefs` ตั้งแต่ 1 รายการขึ้นไปสำหรับ `scopeType = 'department'`

### Requirement 2: เลือกหลายฝ่ายในฟอร์มตั้งค่า Monitor

**User Story:** As a ผู้ดูแลระบบ (Admin), I want เลือกหลายฝ่ายในฟอร์มเพิ่ม/แก้ไข Monitor เมื่อประเภท Scope เป็น "ทั้งฝ่าย", so that ผู้เฝ้าติดตามหนึ่งคนดูแลได้หลายฝ่ายพร้อมกัน

#### Acceptance Criteria

1. WHILE `scopeType = 'department'`, THE Monitor_Config_UI SHALL allow ผู้ใช้เลือกฝ่ายจาก `DEPARTMENTS` ได้มากกว่าหนึ่งฝ่าย (multi-select)
2. WHEN ผู้ใช้เลือกฝ่ายหลายฝ่าย, THE Monitor_Config_UI SHALL store ฝ่ายที่เลือกทั้งหมดไว้ใน `scopeRefs`
3. WHILE `scopeType` มีค่า `workgroup`, `user`, หรือ `doc_direction`, THE Monitor_Config_UI SHALL allow เลือกเป้าหมายและจัดเก็บเป้าหมายที่เลือกไว้ใน `scopeRefs`
4. IF ผู้ใช้กดบันทึกโดยที่ `scopeRefs` ว่างและ `allDepartments` ไม่เป็น `true`, THEN THE Monitor_Config_UI SHALL block การบันทึกและคงฟอร์มเปิดไว้
5. WHEN ผู้ใช้เปลี่ยนค่า `scopeType`, THE Monitor_Config_UI SHALL clear ค่า `scopeRefs` และ `allDepartments` ของฟอร์ม

### Requirement 3: ตัวเลือก "ทุกฝ่าย (all departments)"

**User Story:** As a ผู้ดูแลระบบ (Admin), I want เลือก "ทุกฝ่าย" ได้ในครั้งเดียว, so that Monitor ครอบคลุมทุกฝ่ายรวมถึงฝ่ายที่จะเพิ่มในอนาคตโดยไม่ต้องเลือกทีละฝ่าย

#### Acceptance Criteria

1. WHILE `scopeType = 'department'`, THE Monitor_Config_UI SHALL present ตัวเลือก "ทุกฝ่าย (all departments)"
2. WHEN ผู้ใช้เลือกตัวเลือก "ทุกฝ่าย", THE Monitor_Config_UI SHALL set `allDepartments` เป็น `true`
3. WHEN `allDepartments` มีค่า `true`, THE Monitor_Config_UI SHALL clear และ disable การเลือกฝ่ายรายฝ่ายใน `scopeRefs`
4. WHEN ผู้ใช้ยกเลิกตัวเลือก "ทุกฝ่าย", THE Monitor_Config_UI SHALL set `allDepartments` เป็น `false` และ enable การเลือกฝ่ายรายฝ่ายอีกครั้ง
5. WHERE `allDepartments` มีค่า `true`, THE Monitor_Config_UI SHALL allow การบันทึก Monitor_Assignment โดยไม่ต้องมีค่าใน `scopeRefs`

### Requirement 4: แสดงขอบเขตหลายรายการในตาราง Monitor

**User Story:** As a ผู้ดูแลระบบ (Admin), I want เห็นขอบเขตทั้งหมดของ Monitor ในตาราง, so that ทราบได้ทันทีว่าผู้เฝ้าติดตามแต่ละคนดูแลฝ่ายใดบ้าง

#### Acceptance Criteria

1. WHERE Monitor_Assignment มี `scopeRefs` หลายรายการ, THE Monitor_Config_UI SHALL render หนึ่ง Scope_Chip ต่อหนึ่งเป้าหมายในคอลัมน์ "ขอบเขต (Scope)"
2. WHERE `allDepartments` มีค่า `true`, THE Monitor_Config_UI SHALL render Scope_Chip เดียวที่มีข้อความ "ทุกฝ่าย"
3. THE Monitor_Config_UI SHALL display ป้ายประเภท Scope (Scope_Type badge) ของ Monitor_Assignment ตามค่า `scopeType`
4. WHEN ผู้ใช้กดแก้ไข Monitor_Assignment, THE Monitor_Config_UI SHALL populate ฟอร์มด้วยค่า `scopeRefs` และ `allDepartments` ที่บันทึกไว้

### Requirement 5: เพิ่มผู้ใช้เป็นผู้เฝ้าติดตามจากรายการ USERS

**User Story:** As a ผู้ดูแลระบบ (Admin), I want เลือกผู้ใช้จากรายการ USERS มากำหนดเป็น Monitor, so that สามารถเพิ่มผู้เฝ้าติดตามได้จากผู้ใช้ที่มีอยู่ในระบบ

#### Acceptance Criteria

1. THE Monitor_User_Picker SHALL list ผู้ใช้จาก `USERS` ที่มี `active = true`
2. WHEN ผู้ใช้เลือกผู้ใช้จาก Monitor_User_Picker แล้วบันทึก, THE Monitor_Config_UI SHALL create Monitor_Assignment ที่มี `monitorUserId`, `monitorUserName`, และ `monitorUserDept` ตรงกับผู้ใช้ที่เลือก
3. THE Monitor_Config_UI SHALL allow ผู้ใช้คนเดียวกันมีได้หลาย Monitor_Assignment
4. WHEN สร้าง Monitor_Assignment ใหม่สำเร็จ, THE Monitor_Config_UI SHALL add รายการนั้นเข้าตาราง Monitor และแสดงข้อความแจ้งสำเร็จ (toast)

### Requirement 6: ปรับ Mock Data ให้เข้ากับโครงสร้างใหม่

**User Story:** As a นักพัฒนา, I want ให้ข้อมูลจำลอง `MONITOR_ASSIGNMENTS` ใช้โครงสร้างใหม่, so that mockup ทำงานและ build ผ่านโดยไม่มี type error

#### Acceptance Criteria

1. THE Mock_Store SHALL define ทุกแถวใน `MONITOR_ASSIGNMENTS` ด้วยฟิลด์ `scopeRefs` แทนฟิลด์ `scopeRef`
2. THE Mock_Store SHALL include อย่างน้อยหนึ่งแถวที่ `scopeRefs` มีหลายฝ่าย เพื่อสาธิตการเฝ้าติดตามหลายฝ่าย
3. THE Mock_Store SHALL include อย่างน้อยหนึ่งแถวที่ `allDepartments` มีค่า `true` เพื่อสาธิตตัวเลือก "ทุกฝ่าย"
4. THE Mock_Store SHALL preserve ค่าฟิลด์ `monitorUserId`, `monitorUserName`, `monitorUserDept`, `scopeType`, `docDirectionFilter`, `notifyEnabled`, `status`, `createdBy`, และ `createdAt` ของแถวเดิม

### Requirement 7: คงกฎ Monitor เดิมและธีม Deves

**User Story:** As a เจ้าของระบบ, I want ให้กฎการทำงานของ Monitor และธีม UI ยังคงเดิม, so that ฟีเจอร์ใหม่ไม่ทำลายความสอดคล้องของระบบ

#### Acceptance Criteria

1. THE Monitor_Config_UI SHALL limit สิทธิ์ของ Monitor ไว้ที่การดูและ Follow up เท่านั้น สอดคล้องกับกฎ BR-5.3
2. THE Monitor_Config_UI SHALL apply สีและองค์ประกอบ UI ตามธีม Deves โดยใช้ Navy `#012169` และ Gold `#FFCD00`
3. THE Monitor_Config_UI SHALL operate ด้วย mock data ทั้งหมดโดยไม่เรียก backend, database, หรือ authentication จริง

### Requirement 8: ปรับปรุงเอกสารวิเคราะห์ (Documentation Only)

**User Story:** As a Business Analyst, I want ให้เอกสารวิเคราะห์สะท้อนความสามารถ multi-scope และ all-departments, so that เอกสารตรงกับพฤติกรรมของ mockup

#### Acceptance Criteria

1. THE Analysis_Document SHALL update หมวด 3.5 ให้อธิบายว่า Monitor หนึ่งรายการเฝ้าติดตามได้หลายฝ่าย และมีตัวเลือก "ทุกฝ่าย (all departments)"
2. THE Analysis_Document SHALL update กฎ BR-5.3 ให้ครอบคลุมการเลือกหลายเป้าหมายและตัวเลือกทุกฝ่าย
3. THE Analysis_Document SHALL update Data Model `MONITOR_ASSIGNMENT` ให้สะท้อนการเก็บค่าเป้าหมายหลายรายการและ flag `allDepartments`
4. THE Analysis_Document SHALL remain การเปลี่ยนแปลงในระดับเอกสารเท่านั้น โดยไม่แก้ไขตรรกะเชิงกระบวนการ, State Machine, หรือ Notification Matrix เดิม

### Requirement 9: การตรวจสอบด้วย Build

**User Story:** As a นักพัฒนา, I want ให้โปรเจกต์ compile และ build ผ่านหลังการเปลี่ยนแปลง, so that มั่นใจว่าการเปลี่ยนโครงสร้างข้อมูลไม่ทำให้เกิดข้อผิดพลาด

#### Acceptance Criteria

1. WHEN รัน Build_Process, THE Build_Process SHALL complete โดยไม่มี TypeScript error
2. IF โค้ดอ้างอิงฟิลด์ `scopeRef` แบบเดิมหลังการเปลี่ยนโครงสร้าง, THEN THE Build_Process SHALL report ข้อผิดพลาดเพื่อให้แก้ไขให้ครบทุกจุด

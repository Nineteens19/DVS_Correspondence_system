# Requirements Document

## Introduction

ระบบสารบรรณอิเล็กทรอนิกส์ (Phase 2 — เอกสารรับเข้า/ส่งออก) เป็น mockup ฝั่งหน้าบ้าน (React + TypeScript + Tailwind) ที่ใช้ข้อมูลจำลอง (mock data) โดยจำลอง AD/LDAP ด้วยชุดข้อมูล `USERS` และ `DEPARTMENTS`

ปัจจุบันแนวคิดเรื่อง "ฝ่าย" (department) ของเอกสารถูกใช้ปนกันและมีป้ายกำกับ (label) ภาษาไทยไม่สอดคล้องกันในแต่ละหน้า เช่น "ฝ่ายที่รับผิดชอบ", "ฝ่ายดำเนินการ", "ฝ่าย", และ "ผู้รับผิดชอบ" ทำให้ผู้ใช้สับสนระหว่างฝ่ายที่เป็นต้นทางของเรื่องกับฝ่ายที่รับผิดชอบดำเนินการ

ฟีเจอร์นี้แยกแนวคิดออกเป็นสองส่วนอย่างชัดเจน: (1) ฝ่ายต้นทาง (origin/source department) ที่กำหนดค่าอัตโนมัติจากผู้ใช้ที่ล็อกอิน (AD) แบบอ่านอย่างเดียว และ (2) ฝ่ายที่รับผิดชอบ (responsible/destination department) ที่ได้มาจากข้อมูล AD ของผู้รับมอบหมายที่ถูกเลือก แทนการเลือกฝ่ายแบบ dropdown อิสระ พร้อมทั้งจัดป้ายกำกับภาษาไทยให้เป็นมาตรฐานเดียวกันทุกหน้า

ขอบเขตงานส่วนหลักเป็น mockup ฝั่งหน้าบ้านเท่านั้น ไม่มี backend/ฐานข้อมูล/การยืนยันตัวตนจริง นอกจากนี้ยังครอบคลุมการปรับปรุงเอกสารวิเคราะห์ระบบ (`P2026-040_Analysis.md`) ให้ใช้คำศัพท์ "ฝ่ายต้นทาง" และ "ฝ่ายที่รับผิดชอบ" สอดคล้องกับ mockup โดยเป็นงานปรับปรุงเอกสาร (documentation) เท่านั้น ไม่กระทบขอบเขต mockup ฝั่งหน้าบ้าน

## Glossary

- **Registration_System**: ส่วนของ mockup ที่ทำหน้าที่ลงทะเบียนเอกสารรับเข้า/ส่งออก (`src/pages/RegisterPage.tsx`)
- **Document_Detail_View**: ส่วนแสดงรายละเอียดเอกสาร (`src/pages/DocumentDetailPage.tsx`)
- **Document_List_View**: ส่วนแสดงรายการเอกสารแบบตาราง (`src/pages/DocumentListPage.tsx`)
- **Reports_View**: ส่วนแสดงรายงาน (`src/pages/ReportsPage.tsx`)
- **Mock_Directory**: ข้อมูลจำลอง AD/LDAP ประกอบด้วยชุด `USERS` และ `DEPARTMENTS` ใน `src/mock.ts`
- **Current_User**: ค่าคงที่จำลองผู้ใช้ที่ล็อกอินอยู่ (`CURRENT_USER` ใน `src/mock.ts`) อ้างอิงจากรายการหนึ่งใน `USERS`
- **Origin_Department**: ฝ่ายต้นทางของเอกสาร (ภาษาไทย: "ฝ่ายต้นทาง") ได้มาจาก `department` ของ Current_User
- **Responsible_Department**: ฝ่ายที่รับผิดชอบดำเนินการเอกสาร (ภาษาไทย: "ฝ่ายที่รับผิดชอบ") ได้มาจาก `department` ของผู้รับมอบหมายที่ถูกเลือก
- **Assignee**: ผู้รับมอบหมาย (ภาษาไทย: "ผู้รับมอบหมาย") ที่ถูกเลือกจาก Mock_Directory
- **Assignee_Position**: ตำแหน่งของ Assignee ได้มาจากฟิลด์ `position` ใน Mock_Directory
- **Document_Model**: โครงสร้างข้อมูลเอกสารใน `src/types.ts` (interface `Document`)
- **Analysis_Document**: เอกสารวิเคราะห์ระบบ SRS `P2026-040_Analysis.md` ที่อธิบายภาพรวม ระบบงาน Data Model และ Notification ของระบบสารบรรณ
- **Registrar_Actor**: ผู้กระทำที่เป็นต้นทางของเรื่องในเชิงกระบวนการทำงาน (ผู้ Register หรือ ผู้ Forward) ซึ่งในเอกสารวิเคราะห์เดิมใช้คำว่า "ต้นทาง" ในบริบท workflow และผู้รับการแจ้งเตือน
- **Origin_Department_Field**: ฟิลด์ข้อมูลฝ่ายต้นทางของเอกสารในเชิงโครงสร้างข้อมูล (แนวคิดเดียวกับ Origin_Department ใน mockup) ที่ระบุฝ่ายซึ่งเป็นจุดกำเนิดของเอกสาร แยกจากบทบาทผู้กระทำ Registrar_Actor

## Requirements

### Requirement 1: ค่าคงที่ผู้ใช้ที่ล็อกอิน (Current User)

**User Story:** As a นักพัฒนา mockup, I want ค่าคงที่ผู้ใช้ที่ล็อกอินจำลองที่อ้างอิงจากข้อมูล AD จำลอง, so that ระบบสามารถกำหนดฝ่ายต้นทางได้อัตโนมัติโดยไม่ต้องมี backend

#### Acceptance Criteria

1. THE Mock_Directory SHALL provide ค่าคงที่ Current_User ที่ export จาก `src/mock.ts`
2. THE Current_User SHALL reference รายการหนึ่งที่มีอยู่ใน `USERS` โดยมีฟิลด์ `name`, `username`, `department`, และ `position`
3. THE Current_User.department SHALL match ค่าหนึ่งในรายการ `DEPARTMENTS`

### Requirement 2: กำหนดฝ่ายต้นทางอัตโนมัติแบบอ่านอย่างเดียว

**User Story:** As a ผู้ลงทะเบียนเอกสาร, I want ฝ่ายต้นทางถูกกำหนดอัตโนมัติจากผู้ใช้ที่ล็อกอิน, so that ข้อมูลต้นทางถูกต้องตาม AD และลดข้อผิดพลาดจากการเลือกเอง

#### Acceptance Criteria

1. WHEN Registration_System แสดงฟอร์มลงทะเบียนเอกสาร, THE Registration_System SHALL set ค่า Origin_Department เท่ากับ Current_User.department
2. THE Registration_System SHALL display Origin_Department ด้วยป้ายกำกับ "ฝ่ายต้นทาง"
3. THE Registration_System SHALL render ช่อง Origin_Department เป็นแบบอ่านอย่างเดียว โดยผู้ใช้ไม่สามารถแก้ไขค่าได้
4. WHEN Registration_System บันทึกเอกสาร, THE Registration_System SHALL persist ค่า Origin_Department เท่ากับ Current_User.department

### Requirement 3: อนุมานฝ่ายที่รับผิดชอบจากผู้รับมอบหมาย

**User Story:** As a ผู้ลงทะเบียนเอกสาร, I want ฝ่ายที่รับผิดชอบถูกอนุมานจากผู้รับมอบหมายที่เลือก, so that ฝ่ายที่รับผิดชอบสอดคล้องกับข้อมูล AD ของผู้รับมอบหมายเสมอ

#### Acceptance Criteria

1. WHEN ผู้ใช้เลือก Assignee ใน Registration_System, THE Registration_System SHALL set ค่า Responsible_Department เท่ากับ `department` ของ Assignee ที่เลือกจาก Mock_Directory
2. WHEN ผู้ใช้เลือก Assignee ใน Registration_System, THE Registration_System SHALL derive ค่า Assignee_Position จากฟิลด์ `position` ของ Assignee ที่เลือกจาก Mock_Directory
3. THE Registration_System SHALL display Responsible_Department ด้วยป้ายกำกับ "ฝ่ายที่รับผิดชอบ"
4. THE Registration_System SHALL render ค่า Responsible_Department ที่ได้จากผู้รับมอบหมายเป็นแบบอ่านอย่างเดียว โดยไม่ให้เลือกฝ่ายจาก dropdown อิสระ
5. WHEN ผู้ใช้เปลี่ยนการเลือก Assignee, THE Registration_System SHALL update ค่า Responsible_Department และ Assignee_Position ให้ตรงกับ Assignee ที่เลือกล่าสุด
6. IF ยังไม่มีการเลือก Assignee, THEN THE Registration_System SHALL display Responsible_Department เป็นค่าว่างพร้อมข้อความบอกสถานะว่ายังไม่ได้เลือกผู้รับมอบหมาย

### Requirement 4: จัดเก็บฝ่ายต้นทางและฝ่ายที่รับผิดชอบในโมเดลเอกสาร

**User Story:** As a นักพัฒนา mockup, I want โมเดลเอกสารแยกฟิลด์ฝ่ายต้นทางและฝ่ายที่รับผิดชอบ, so that ทุกหน้าอ้างอิงข้อมูลจากแหล่งเดียวกันได้อย่างสอดคล้อง

#### Acceptance Criteria

1. THE Document_Model SHALL define ฟิลด์สำหรับ Origin_Department
2. THE Document_Model SHALL define ฟิลด์สำหรับ Responsible_Department
3. THE Mock_Directory SHALL populate ค่า Origin_Department และ Responsible_Department สำหรับเอกสารตัวอย่างทุกรายการใน `DOCUMENTS` ด้วยค่าที่อยู่ในรายการ `DEPARTMENTS`

### Requirement 5: มาตรฐานป้ายกำกับและการแยกฝ่ายต้นทางกับฝ่ายที่รับผิดชอบในทุกหน้า

**User Story:** As a ผู้ใช้ระบบ, I want ป้ายกำกับฝ่ายที่สอดคล้องกันและแยกฝ่ายต้นทางกับฝ่ายที่รับผิดชอบชัดเจน, so that ไม่สับสนว่าฝ่ายใดเป็นต้นทางและฝ่ายใดรับผิดชอบ

#### Acceptance Criteria

1. THE Document_Detail_View SHALL display Origin_Department ด้วยป้ายกำกับ "ฝ่ายต้นทาง"
2. THE Document_Detail_View SHALL display Responsible_Department ด้วยป้ายกำกับ "ฝ่ายที่รับผิดชอบ"
3. THE Document_List_View SHALL display Responsible_Department ในคอลัมน์ที่มีหัวข้อ "ฝ่ายที่รับผิดชอบ"
4. THE Reports_View SHALL display Responsible_Department ด้วยป้ายกำกับ "ฝ่ายที่รับผิดชอบ"
5. THE Registration_System, Document_Detail_View, Document_List_View, และ Reports_View SHALL use ป้ายกำกับ "ฝ่ายต้นทาง" และ "ฝ่ายที่รับผิดชอบ" อย่างสอดคล้องกันโดยไม่ใช้คำอื่นแทน (เช่น "ฝ่ายดำเนินการ" หรือ "ฝ่าย" เดี่ยว ๆ) สำหรับความหมายเดียวกัน

### Requirement 6: คงขอบเขต mockup ฝั่งหน้าบ้าน

**User Story:** As a เจ้าของโครงการ, I want ฟีเจอร์นี้ทำงานด้วยข้อมูลจำลองฝั่งหน้าบ้านเท่านั้น, so that สามารถสาธิต UI ได้โดยไม่ต้องพึ่งพา backend จริง

#### Acceptance Criteria

1. THE Registration_System SHALL derive ค่า Origin_Department และ Responsible_Department จาก Mock_Directory เท่านั้น
2. THE Registration_System SHALL operate โดยไม่เรียกใช้บริการ backend, ฐานข้อมูล, หรือระบบยืนยันตัวตนภายนอก

### Requirement 7: ปรับปรุงคำศัพท์ในเอกสารวิเคราะห์ให้สอดคล้องกับ mockup

**User Story:** As a นักวิเคราะห์ระบบและผู้ทดสอบ, I want เอกสารวิเคราะห์ `P2026-040_Analysis.md` ใช้คำว่า "ฝ่ายต้นทาง" และ "ฝ่ายที่รับผิดชอบ" ให้สอดคล้องกับ mockup, so that เอกสารวิเคราะห์และหน้าจอ mockup สื่อความหมายฝ่ายต้นทางกับฝ่ายที่รับผิดชอบตรงกันและไม่สับสน

#### Acceptance Criteria

1. THE Analysis_Document SHALL define คำว่า "ฝ่ายต้นทาง" ให้หมายถึง Origin_Department_Field (ฝ่ายที่เป็นจุดกำเนิดของเอกสาร) และคำว่า "ฝ่ายที่รับผิดชอบ" ให้หมายถึงฝ่ายของผู้รับมอบหมายที่ดำเนินการเอกสาร โดยระบุคำจำกัดความไว้ในส่วนคำศัพท์หรือหมายเหตุคำศัพท์ของเอกสาร
2. THE Analysis_Document SHALL describe ฟิลด์ฝ่ายในเชิงโครงสร้างข้อมูลโดยแยก Origin_Department_Field (ฝ่ายต้นทาง) ออกจากฟิลด์ฝ่ายของผู้รับมอบหมาย (`department` ของ Assignee ที่หมายถึง "ฝ่ายที่รับผิดชอบ") ให้ตรงกับ Document_Model ของ mockup
3. WHERE Analysis_Document อธิบายฝ่ายที่ผู้รับมอบหมายสังกัดในบริบทการมอบหมายงานหรือ Data Model, THE Analysis_Document SHALL use คำว่า "ฝ่ายที่รับผิดชอบ" อย่างสอดคล้องกันโดยไม่ใช้คำอื่น (เช่น "ฝ่ายดำเนินการ", "ฝ่ายผู้รับ", หรือ "ฝ่าย" เดี่ยว ๆ) แทนความหมายเดียวกัน
4. WHERE Analysis_Document ใช้คำว่า "ต้นทาง" ในบริบท workflow, State Machine, หรือผู้รับการแจ้งเตือน (Notification) เพื่อหมายถึง Registrar_Actor (ผู้ Register / ผู้ Forward), THE Analysis_Document SHALL retain ความหมายเดิมของ Registrar_Actor และ SHALL provide ข้อความชี้แจงว่า "ต้นทาง" ในบริบทผู้กระทำหมายถึง Registrar_Actor ซึ่งแยกจากฟิลด์ Origin_Department_Field (ฝ่ายต้นทาง) ในเชิงโครงสร้างข้อมูล
5. THE Analysis_Document SHALL ensure ว่าคำอธิบาย Merge Variables ที่เกี่ยวข้องกับฝ่าย (เช่น `{{department}}`) ระบุความหมายให้ตรงกับ "ฝ่ายที่รับผิดชอบ" ของผู้รับมอบหมาย เพื่อให้สอดคล้องกับป้ายกำกับใน mockup
6. THE Analysis_Document SHALL preserve เนื้อหาเชิงกระบวนการ (workflow, State Machine, Notification, Business Rules) ที่มีอยู่เดิมไว้ โดยการปรับปรุงจำกัดเฉพาะคำศัพท์และคำจำกัดความของฝ่ายต้นทางกับฝ่ายที่รับผิดชอบ

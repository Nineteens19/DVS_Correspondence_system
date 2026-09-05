# Requirements Document

## Introduction

เอกสารนี้กำหนดความต้องการสำหรับการปรับปรุง **หน้าลงทะเบียนเอกสารส่งออก (Outgoing Document Registration)** ในระบบสารบรรณ (Phase 2) ให้สอดคล้องกับลักษณะเฉพาะของเอกสารส่งออกที่แตกต่างจากเอกสารรับเข้า กล่าวคือ เอกสารส่งออกถูกนำส่งไปยังหน่วยงานภายนอกองค์กร จึงไม่มีการมอบหมายผู้รับงานภายใน (Assign) และฝ่ายต้นทางถือเป็นฝ่ายที่รับผิดชอบอยู่แล้ว

ขอบเขตงานนี้เป็น **Mockup ส่วนหน้า (Frontend-only)** พัฒนาด้วย React + TypeScript + Tailwind CSS (Vite) ใช้ข้อมูลจำลอง (Mock Data) เท่านั้น ไม่มี Backend/Database/Authentication จริง และไม่มี Test Framework โดยตรวจสอบความถูกต้องของโค้ดผ่านคำสั่ง `pnpm build` ธีมสีตาม Deves (Navy `#012169` / Gold `#FFCD00`)

การเปลี่ยนแปลงมีผลเฉพาะกับ Flow การลงทะเบียนเอกสารส่งออก (`docDirection === 'outgoing'` ใน `src/pages/RegisterPage.tsx`) เท่านั้น Flow การลงทะเบียนเอกสารรับเข้าต้องไม่ได้รับผลกระทบ

## Glossary

- **Register_Page**: หน้าจอลงทะเบียนเอกสารที่ `src/pages/RegisterPage.tsx` รองรับทั้งเอกสารรับเข้าและส่งออกผ่าน prop `docDirection`
- **Outgoing_Flow**: โหมดการทำงานของ Register_Page เมื่อ `docDirection === 'outgoing'`
- **Incoming_Flow**: โหมดการทำงานของ Register_Page เมื่อ `docDirection === 'incoming'`
- **Current_User**: ผู้ใช้ที่ล็อกอินอยู่ (จำลอง) อ้างอิงจากค่าคงที่ `CURRENT_USER` ใน `src/mock.ts`
- **Origin_Department**: ฝ่ายต้นทาง (`originDepartment` ใน type `Document`) ฝ่ายของผู้สร้าง/ต้นเรื่อง
- **Responsible_Department**: ฝ่ายที่รับผิดชอบ (`department` ใน type `Document`) ฝ่ายที่ดำเนินการ
- **Delivery_Method**: รูปแบบการส่งเอกสารออก เช่น ไปรษณีย์ลงทะเบียน, EMS, ให้ ปณ. มารับ, Messenger, รับด้วยตนเอง, จัดส่งอิเล็กทรอนิกส์
- **Delivery_Method_Master**: ชุดข้อมูลหลัก (Master Data) ของ Delivery_Method ที่ประกาศไว้ใน `src/mock.ts`
- **Postal_Pickup_Option**: รายการใน Delivery_Method_Master ที่ถูกทำเครื่องหมายว่าเป็นตัวเลือก "ให้ ปณ. มารับ" ซึ่งผูกกับปุ่มลิงก์ระบบภายนอก
- **External_Pickup_System**: ระบบภายนอกที่มีอยู่แล้วสำหรับลงทะเบียนให้ไปรษณีย์ (ปณ.) เข้ามารับเอกสาร
- **External_Pickup_Button**: ปุ่มใน Outgoing_Flow ที่เปิดลิงก์ไปยัง External_Pickup_System
- **Assign_Card**: ส่วนของ Register_Page สำหรับมอบหมายผู้รับงานภายใน (มีเฉพาะ Incoming_Flow)
- **Admin_Page**: หน้าจอผู้ดูแลระบบที่ `src/pages/AdminPage.tsx` มีแท็บ `users` | `monitor` | `master-data`
- **Master_Data_Section**: ส่วนจัดการข้อมูลหลักภายในแท็บ `master-data` ของ Admin_Page
- **Build_Command**: คำสั่ง `pnpm build` ที่ใช้ตรวจสอบว่าโค้ดคอมไพล์ผ่านโดยไม่มีข้อผิดพลาด
- **Analysis_Document**: ไฟล์เอกสารวิเคราะห์ `Phase2_in_out_document/P2026-040_Analysis.md`

## Requirements

### Requirement 1: Master Data รูปแบบการส่ง (Delivery Method Master)

**User Story:** As a ผู้ดูแลระบบ, I want ชุดข้อมูลหลักของรูปแบบการส่งเอกสารออก, so that สามารถนำรายการรูปแบบการส่งไปใช้ในฟอร์มลงทะเบียนเอกสารส่งออกได้อย่างสอดคล้องกัน (Master-Driven Data Entry ตาม BR-1.5)

#### Acceptance Criteria

1. THE Delivery_Method_Master SHALL ถูกประกาศเป็นรายการข้อมูลหลักใน `src/mock.ts`
2. THE Delivery_Method_Master SHALL ประกอบด้วยรายการรูปแบบการส่งอย่างน้อย 6 รายการ ได้แก่ ไปรษณีย์ลงทะเบียน, ไปรษณีย์ด่วนพิเศษ (EMS), ให้ไปรษณีย์มารับ (ปณ. มารับ), Messenger บริษัท, รับด้วยตนเอง, และจัดส่งอิเล็กทรอนิกส์/อีเมล
3. THE Delivery_Method_Master SHALL กำหนดให้แต่ละรายการมีคุณสมบัติ ได้แก่ รหัส (id), ป้ายชื่อภาษาไทย (label), สถานะการใช้งาน (active) แบบ boolean, และธง (flag) ระบุว่าเป็น Postal_Pickup_Option หรือไม่
4. THE Delivery_Method_Master SHALL กำหนดให้มีรายการ Postal_Pickup_Option จำนวน 1 รายการที่ถูกทำเครื่องหมายเป็นตัวเลือก "ให้ ปณ. มารับ"

### Requirement 2: ช่องเลือกรูปแบบการส่งในฟอร์มเอกสารส่งออก

**User Story:** As a เจ้าหน้าที่ผู้ลงทะเบียนเอกสารส่งออก, I want เลือกรูปแบบการส่งจากรายการที่กำหนดไว้, so that ระบุวิธีนำส่งเอกสารได้ตรงตามข้อมูลหลักและลดข้อผิดพลาดจากการพิมพ์เอง

#### Acceptance Criteria

1. WHILE Register_Page อยู่ในโหมด Outgoing_Flow, THE Register_Page SHALL แสดงช่องเลือกแบบ dropdown ป้ายกำกับ "รูปแบบการส่ง (Delivery Method)"
2. WHILE Register_Page อยู่ในโหมด Outgoing_Flow, THE Register_Page SHALL แสดงตัวเลือกใน dropdown รูปแบบการส่งจากรายการใน Delivery_Method_Master ที่มีสถานะ active เป็น true เท่านั้น
3. WHEN ผู้ใช้เลือกค่ารูปแบบการส่งจาก dropdown, THE Register_Page SHALL เก็บค่ารหัส Delivery_Method ที่เลือกไว้ใน state ของฟอร์ม
4. WHILE Register_Page อยู่ในโหมด Incoming_Flow, THE Register_Page SHALL ไม่แสดงช่องเลือกรูปแบบการส่ง

### Requirement 3: ฝ่ายต้นทางเป็นฝ่ายที่รับผิดชอบสำหรับเอกสารส่งออก

**User Story:** As a เจ้าหน้าที่ผู้ลงทะเบียนเอกสารส่งออก, I want ให้ฝ่ายต้นทางถือเป็นฝ่ายที่รับผิดชอบโดยอัตโนมัติ, so that ไม่ต้องเลือกฝ่ายที่รับผิดชอบแยกต่างหาก เพราะเอกสารถูกส่งออกไปภายนอก

#### Acceptance Criteria

1. WHILE Register_Page อยู่ในโหมด Outgoing_Flow, THE Register_Page SHALL แสดงช่องข้อมูลฝ่ายเพียงช่องเดียวที่สื่อความหมายว่าฝ่ายต้นทางคือฝ่ายที่รับผิดชอบ โดยแสดงค่าจาก `CURRENT_USER.department`
2. WHILE Register_Page อยู่ในโหมด Outgoing_Flow, THE Register_Page SHALL ไม่แสดงช่อง "ฝ่ายที่รับผิดชอบ" แยกต่างหากที่ต้องอาศัยการเลือกผู้รับมอบหมาย
3. WHEN ผู้ใช้ยืนยันการลงทะเบียนใน Outgoing_Flow, THE Register_Page SHALL บันทึกทั้ง `originDepartment` และ `department` ให้มีค่าเท่ากับ `CURRENT_USER.department`

### Requirement 4: ไม่มีการมอบหมายผู้รับงานสำหรับเอกสารส่งออก

**User Story:** As a เจ้าหน้าที่ผู้ลงทะเบียนเอกสารส่งออก, I want ให้ Flow ส่งออกไม่มีขั้นตอนมอบหมายผู้รับงานภายใน, so that สอดคล้องกับข้อเท็จจริงที่เอกสารถูกส่งไปยังหน่วยงานภายนอก

#### Acceptance Criteria

1. WHILE Register_Page อยู่ในโหมด Outgoing_Flow, THE Register_Page SHALL ไม่แสดง Assign_Card สำหรับมอบหมายผู้รับงานภายใน
2. WHILE Register_Page อยู่ในโหมด Outgoing_Flow, THE Register_Page SHALL ไม่กำหนดให้ผู้ใช้ต้องเลือกผู้รับผิดชอบหรือฝ่ายผู้รับมอบหมายเป็นเงื่อนไขก่อนยืนยันการลงทะเบียน
3. WHEN ผู้ใช้ยืนยันการลงทะเบียนใน Outgoing_Flow, THE Register_Page SHALL ดำเนินการบันทึกได้สำเร็จโดยไม่ต้องมีข้อมูลผู้รับมอบหมาย

### Requirement 5: ปุ่มลิงก์ลงทะเบียนให้ ปณ. มารับ (ระบบภายนอก)

**User Story:** As a เจ้าหน้าที่ผู้ลงทะเบียนเอกสารส่งออก, I want ปุ่มลิงก์ไปยังระบบลงทะเบียนให้ไปรษณีย์มารับ, so that ดำเนินการนัดหมายให้ ปณ. เข้ามารับเอกสารผ่านระบบภายนอกที่มีอยู่แล้วได้

#### Acceptance Criteria

1. WHILE Register_Page อยู่ในโหมด Outgoing_Flow, THE Register_Page SHALL แสดง External_Pickup_Button พร้อมป้ายกำกับที่สื่อว่าเป็น "ลงทะเบียนให้ ปณ. มารับ"
2. THE External_Pickup_Button SHALL แสดงเครื่องหมายหรือข้อความที่ระบุชัดเจนว่าเป็นการเชื่อมต่อไปยังระบบภายนอก
3. WHEN ผู้ใช้กด External_Pickup_Button, THE Register_Page SHALL เปิดลิงก์ไปยัง External_Pickup_System ผ่าน `window.open` ตาม URL ที่กำหนดไว้ และ/หรือแสดงข้อความแจ้งเตือน (toast) เชิงข้อมูล
4. WHILE Register_Page อยู่ในโหมด Incoming_Flow, THE Register_Page SHALL ไม่แสดง External_Pickup_Button

### Requirement 6: การจัดการ Master รูปแบบการส่งในหน้าผู้ดูแลระบบ

**User Story:** As a ผู้ดูแลระบบ, I want ดูและจัดการรายการรูปแบบการส่งในหน้าผู้ดูแลระบบ, so that ควบคุมตัวเลือกที่ปรากฏในฟอร์มลงทะเบียนเอกสารส่งออกได้

#### Acceptance Criteria

1. WHILE Admin_Page แสดงแท็บ `master-data`, THE Master_Data_Section SHALL แสดงรายการ Delivery_Method_Master ทั้งหมดพร้อมป้ายชื่อภาษาไทยและสถานะการใช้งาน (active)
2. THE Master_Data_Section SHALL ระบุอย่างชัดเจนว่ารายการใดเป็น Postal_Pickup_Option
3. WHERE ผู้ดูแลระบบเปิดหน้าจอจัดการ Delivery_Method_Master, THE Master_Data_Section SHALL แสดงส่วนควบคุมสำหรับดู/จัดการรายการรูปแบบการส่ง (ในระดับ mockup)

### Requirement 7: Flow เอกสารรับเข้าไม่ได้รับผลกระทบ

**User Story:** As a เจ้าหน้าที่ผู้ลงทะเบียนเอกสารรับเข้า, I want ให้ Flow การลงทะเบียนเอกสารรับเข้าทำงานเหมือนเดิม, so that การเปลี่ยนแปลงเอกสารส่งออกไม่กระทบงานเดิม

#### Acceptance Criteria

1. WHILE Register_Page อยู่ในโหมด Incoming_Flow, THE Register_Page SHALL คงพฤติกรรมการแสดงฟิลด์และ Assign_Card ตามการทำงานเดิมไว้ทั้งหมด
2. WHEN ผู้ใช้ยืนยันการลงทะเบียนใน Incoming_Flow, THE Register_Page SHALL คงพฤติกรรมการอนุมานและบันทึก Responsible_Department จากผู้รับมอบหมายตามการทำงานเดิม

### Requirement 8: จุดตรวจ Build และการปรับปรุงเอกสาร

**User Story:** As a ผู้พัฒนา/ผู้ดูแลเอกสาร, I want ตรวจสอบว่าโค้ดคอมไพล์ผ่านและบันทึกการเปลี่ยนแปลงในเอกสารวิเคราะห์, so that มั่นใจได้ว่างานสมบูรณ์และมีการติดตามการเปลี่ยนแปลง

#### Acceptance Criteria

1. WHEN การพัฒนาเสร็จสิ้น, THE Build_Command SHALL คอมไพล์โปรเจกต์สำเร็จโดยไม่มีข้อผิดพลาด
2. WHEN การพัฒนาเสร็จสิ้น, THE Analysis_Document SHALL ได้รับการเพิ่มรายการ Change Log ที่ระบุการเปลี่ยนแปลง 3 ประเด็น ได้แก่ ฝ่ายต้นทางเป็นฝ่ายที่รับผิดชอบและไม่มีการ Assign สำหรับเอกสารส่งออก, การเพิ่ม Delivery_Method_Master (รูปแบบการส่ง), และปุ่มลิงก์ลงทะเบียนให้ ปณ. มารับผ่านระบบภายนอก
3. THE Analysis_Document SHALL คงเนื้อหาส่วน Workflow Logic, State Machine และ Notification Matrix ไว้โดยไม่เปลี่ยนแปลง

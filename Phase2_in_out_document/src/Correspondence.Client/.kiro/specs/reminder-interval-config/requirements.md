# Requirements Document

## Introduction

เอกสารนี้กำหนดความต้องการสำหรับฟีเจอร์ **การตั้งค่ารอบการแจ้งเตือนตามระดับความเร่งด่วน (Reminder Interval Configuration)** ในระบบต้นแบบ (mockup) ของระบบสารบรรณรับเข้า–ส่งออก (DVS Correspondence System — Phase 2)

ฟีเจอร์นี้เป็นการทำงานฝั่งหน้าจอ (frontend-only) ด้วย React + TypeScript + Tailwind (Vite) ใช้ข้อมูลจำลอง (mock data) เท่านั้น ไม่มี backend, ไม่มีฐานข้อมูลจริง, ไม่มีตัวจับเวลา (scheduler) จริง และไม่มี test framework การตรวจสอบความถูกต้องทำผ่านการ build (`pnpm build`) และการตรวจชนิดข้อมูล (`pnpm exec tsc --noEmit`) ธีมของหน้าจอใช้ธีม Deves (Navy `#012169` / Gold `#FFCD00`)

ขอบเขตแบ่งเป็น 3 ส่วน:
- **Part A** — การตั้งค่ารอบการแจ้งเตือนตามระดับความเร่งด่วน (ค่ากำหนดในหน่วยวัน) พร้อมหน้าจอแก้ไขในหน้า Admin และความหมายการแจ้งซ้ำจนกว่างานจะแล้วเสร็จ
- **Part B** — กฎผู้รับการแจ้งเตือน: ส่งเฉพาะต้นทาง และผู้รับมอบหมายล่าสุดของแต่ละสายการมอบหมาย (delegation tree) พร้อมการแสดงผลในหน้ารายละเอียดเอกสารรับเข้า
- **Part C** — การปรับปรุงเอกสารวิเคราะห์ `P2026-040_Analysis.md` ให้สอดคล้องกับกฎที่เปลี่ยนแปลง

การเปลี่ยนแปลงกฎในเอกสารนี้เป็นการเปลี่ยนแปลงเชิงธุรกิจที่ผู้ใช้ร้องขอโดยตั้งใจ (intentional rule change) ไม่ใช่เพียงการซิงค์เอกสาร

## Glossary

- **Reminder_System**: ส่วนของระบบต้นแบบที่รับผิดชอบการกำหนดค่ารอบการแจ้งเตือน การคำนวณผู้รับ และการแสดงผลตารางการแจ้งเตือน (ระดับ mockup)
- **Admin_Page**: หน้าจอผู้ดูแลระบบ (`AdminPage.tsx`) ที่มีแท็บจัดการต่าง ๆ
- **Reminder_Config_Tab**: แท็บ/ส่วน "ตั้งค่าการแจ้งเตือน (Reminder)" ที่เพิ่มใหม่ในหน้า Admin_Page
- **Urgency_Level**: ระดับความเร่งด่วนของเอกสาร มีค่า `normal` (ปกติ), `urgent` (ด่วน), `very-urgent` (ด่วนมาก) ตามชนิด `UrgencyLevel` ที่มีอยู่เดิมใน `types.ts`
- **Reminder_Interval**: จำนวนวัน (จำนวนเต็มบวก) ระหว่างการแจ้งเตือนแต่ละครั้ง กำหนดแยกตาม Urgency_Level
- **Reminder_Interval_Config**: โครงสร้างข้อมูลที่จับคู่ Urgency_Level แต่ละระดับเข้ากับ Reminder_Interval (เช่น `Record<UrgencyLevel, number>`) เก็บใน `mock.ts`
- **Completed_Status**: สถานะเอกสาร `completed` (แล้วเสร็จ) ตามชนิด `IncomingDocStatus` / `DocStatus` เดิม
- **Origin**: ต้นทางของเอกสาร คือ ผู้ลงทะเบียน/ผู้ริเริ่มเอกสาร (registrar/originator)
- **Sub_Assignment**: งานย่อยรายผู้รับ ตามชนิด `SubAssignment` เดิม เชื่อมสายการมอบหมายด้วยฟิลด์ `parentId`
- **Delegation_Tree**: สายการมอบหมายหนึ่งสาย ประกอบด้วยงานย่อยระดับบนสุด (root — `parentId` เป็น undefined) และงานย่อยที่สืบทอดต่อ (onward delegation descendants) ที่เชื่อมด้วย `parentId`
- **Latest_Assignee**: ผู้รับมอบหมายล่าสุดของ Delegation_Tree หนึ่งสาย คือ โหนดปลายสุด (leaf) / โหนดที่ใหม่ที่สุดที่ยัง active ที่ปลายของสายการมอบหมายนั้น
- **Reminder_Recipients**: กลุ่มผู้รับการแจ้งเตือนของเอกสารหนึ่งฉบับ ประกอบด้วย Origin และ Latest_Assignee ของทุก Delegation_Tree
- **Document_Detail_View**: หน้าจอรายละเอียดเอกสาร (`DocumentDetailPage.tsx`)
- **Analysis_Document**: ไฟล์เอกสารวิเคราะห์ `P2026-040_Analysis.md`
- **Build_Checkpoint**: การตรวจสอบว่าโครงการ build ผ่าน (`pnpm build`) และตรวจชนิดข้อมูลผ่าน (`pnpm exec tsc --noEmit`) โดยไม่มีข้อผิดพลาดใหม่

## Requirements

### Requirement 1: โครงสร้างข้อมูลและค่าเริ่มต้นของรอบการแจ้งเตือน (Part A)

**User Story:** As a นักพัฒนา/ผู้ดูแลระบบ, I want โครงสร้างข้อมูลรอบการแจ้งเตือนต่อระดับความเร่งด่วนพร้อมค่าเริ่มต้น, so that ระบบสามารถอ้างอิงรอบการแจ้งเตือนตามความเร่งด่วนของแต่ละเอกสารได้

#### Acceptance Criteria

1. THE Reminder_System SHALL กำหนดชนิดข้อมูลสนับสนุนใน `types.ts` สำหรับ Reminder_Interval_Config ที่จับคู่ Urgency_Level แต่ละระดับ (`normal`, `urgent`, `very-urgent`) เข้ากับค่า Reminder_Interval ที่เป็นจำนวนเต็มบวกในหน่วยวัน (เช่น `Record<UrgencyLevel, number>` หรือ interface ที่เทียบเท่า)
2. THE Reminder_System SHALL จัดเก็บค่า Reminder_Interval_Config เริ่มต้นใน `mock.ts` ด้วยค่า `normal` = 5 วัน, `urgent` = 3 วัน, และ `very-urgent` = 1 วัน
3. THE Reminder_System SHALL ใช้ Reminder_Interval_Config เป็นแหล่งข้อมูลกลางในการหารอบการแจ้งเตือนของเอกสารตาม Urgency_Level ของเอกสารนั้น
4. WHERE เอกสารมี Urgency_Level ที่กำหนดไว้, THE Reminder_System SHALL คืนค่า Reminder_Interval ที่ตรงกับ Urgency_Level ของเอกสารนั้นจาก Reminder_Interval_Config

### Requirement 2: ความหมายการแจ้งซ้ำจนกว่างานจะแล้วเสร็จ (Part A)

**User Story:** As a ผู้รับผิดชอบเอกสาร, I want การแจ้งเตือนซ้ำตามรอบที่กำหนดจนกว่าเอกสารจะแล้วเสร็จ, so that งานที่ยังค้างจะได้รับการติดตามอย่างต่อเนื่อง

#### Acceptance Criteria

1. THE Reminder_System SHALL แสดงความหมายว่าการแจ้งเตือนเกิดซ้ำทุก ๆ N วันตาม Reminder_Interval ของเอกสาร โดย N คือค่าที่กำหนดใน Reminder_Interval_Config
2. WHILE สถานะของเอกสารยังไม่เป็น Completed_Status, THE Reminder_System SHALL แสดงว่าการแจ้งเตือนจะเกิดซ้ำต่อเนื่องตามรอบที่กำหนด
3. WHEN สถานะของเอกสารเป็น Completed_Status, THE Reminder_System SHALL แสดงว่าการแจ้งเตือนของเอกสารนั้นสิ้นสุดลง (ไม่แจ้งซ้ำอีก)
4. THE Reminder_System SHALL แสดงความหมายการแจ้งซ้ำจนกว่างานจะแล้วเสร็จผ่านการกำหนดค่าและการแสดงผล (documented/represented) โดยไม่ต้องมีตัวจับเวลา (scheduler) จริงในระดับ mockup

### Requirement 3: หน้าจอแก้ไขรอบการแจ้งเตือนในหน้า Admin (Part A)

**User Story:** As a ผู้ดูแลระบบ (Admin), I want ดูและแก้ไขรอบการแจ้งเตือนต่อระดับความเร่งด่วนได้ในหน้า Admin, so that ปรับความถี่การแจ้งเตือนได้ตามนโยบายองค์กร

#### Acceptance Criteria

1. THE Admin_Page SHALL แสดงแท็บหรือส่วน Reminder_Config_Tab ชื่อ "ตั้งค่าการแจ้งเตือน (Reminder)" เพิ่มเติมจากแท็บที่มีอยู่เดิม (`users`, `monitor`, `master-data`)
2. WHEN ผู้ดูแลระบบเปิด Reminder_Config_Tab, THE Admin_Page SHALL แสดง Reminder_Interval ปัจจุบันของ Urgency_Level ทั้งสามระดับในหน่วยวัน
3. WHEN ผู้ดูแลระบบแก้ไขค่า Reminder_Interval ของ Urgency_Level ระดับใดระดับหนึ่งและยืนยันการบันทึก, THE Admin_Page SHALL ปรับค่านั้นในสถานะภายในหน้าจอ (stateful ระดับ mockup) และแสดงค่าที่ปรับแล้ว
4. THE Reminder_Config_Tab SHALL แสดงและรับค่า Reminder_Interval เป็นจำนวนเต็มบวกในหน่วยวันต่อ Urgency_Level แต่ละระดับ
5. IF ผู้ดูแลระบบป้อนค่า Reminder_Interval ที่ไม่ใช่จำนวนเต็มบวก, THEN THE Reminder_Config_Tab SHALL ปฏิเสธการบันทึกค่านั้นและคงค่าเดิมไว้

### Requirement 4: ตัวช่วยคำนวณผู้รับมอบหมายล่าสุดต่อสายการมอบหมาย (Part B)

**User Story:** As a นักพัฒนา, I want ฟังก์ชันคำนวณผู้รับมอบหมายล่าสุดของแต่ละสายการมอบหมายจากรายการงานย่อย, so that ระบุ Latest_Assignee ต่อ Delegation_Tree ได้อย่างสม่ำเสมอ

#### Acceptance Criteria

1. THE Reminder_System SHALL จัดเตรียมฟังก์ชันตัวช่วยใน `mock.ts` ที่รับรายการ Sub_Assignment แบบ flat ของเอกสารหนึ่งฉบับและคืนค่า Latest_Assignee ของแต่ละ Delegation_Tree
2. THE ฟังก์ชันตัวช่วย SHALL ระบุ root ของแต่ละ Delegation_Tree จาก Sub_Assignment ที่มี `parentId` เป็น undefined
3. THE ฟังก์ชันตัวช่วย SHALL ระบุ Latest_Assignee ของแต่ละ Delegation_Tree เป็นโหนดปลายสุด (leaf) / โหนดที่สืบทอดใหม่ที่สุดที่ปลายของสายการมอบหมายนั้น โดยไล่ตามสายความสัมพันธ์ `parentId`
4. WHERE เอกสารมีหลาย Delegation_Tree, THE ฟังก์ชันตัวช่วย SHALL คืนค่า Latest_Assignee หนึ่งรายการต่อหนึ่ง Delegation_Tree
5. IF เอกสารไม่มี Sub_Assignment ใด ๆ, THEN THE ฟังก์ชันตัวช่วย SHALL คืนค่ารายการว่าง (ไม่มี Latest_Assignee)

### Requirement 5: กฎผู้รับการแจ้งเตือน (Part B)

**User Story:** As a ผู้ออกแบบระบบ, I want ให้การแจ้งเตือนส่งเฉพาะต้นทางและผู้รับมอบหมายล่าสุดของแต่ละสาย, so that การแจ้งเตือนตรงกลุ่มผู้ที่ต้องดำเนินการจริง

#### Acceptance Criteria

1. THE Reminder_System SHALL คำนวณ Reminder_Recipients ของเอกสารหนึ่งฉบับให้ประกอบด้วยเฉพาะ (ก) Origin ของเอกสาร และ (ข) Latest_Assignee ของทุก Delegation_Tree ของเอกสารนั้น
2. THE Reminder_System SHALL ไม่รวมผู้เข้าร่วมทุกคนในสายการมอบหมาย (participant ทั้งหมด) ไว้ใน Reminder_Recipients
3. THE Reminder_System SHALL ไม่รวมหัวหน้าฝ่าย (department head) โดยทั่วไปไว้ใน Reminder_Recipients ตามกฎนี้ เว้นแต่หัวหน้าฝ่ายนั้นเป็น Origin หรือเป็น Latest_Assignee ของสายใดสายหนึ่ง
4. WHERE เอกสารมีหลาย Delegation_Tree, THE Reminder_System SHALL รวม Latest_Assignee ของทุกสายไว้ใน Reminder_Recipients

### Requirement 6: การแสดงตารางการแจ้งเตือนและผู้รับในหน้ารายละเอียดเอกสาร (Part B)

**User Story:** As a ผู้ใช้ที่ดูรายละเอียดเอกสารรับเข้า, I want เห็นรอบการแจ้งเตือนและรายชื่อผู้รับที่คำนวณได้, so that เข้าใจและตรวจสอบกฎการแจ้งเตือนได้จากหน้าจอ

#### Acceptance Criteria

1. WHERE เอกสารเป็นเอกสารรับเข้า (`docDirection` = `incoming`), THE Document_Detail_View SHALL แสดงรอบการแจ้งเตือน (Reminder_Interval) ที่อ้างอิงจาก Urgency_Level ของเอกสารนั้น
2. WHERE เอกสารเป็นเอกสารรับเข้า, THE Document_Detail_View SHALL แสดง Reminder_Recipients ที่คำนวณได้ ประกอบด้วย Origin และ Latest_Assignee ต่อ Delegation_Tree
3. THE Document_Detail_View SHALL แสดงหน่วยของรอบการแจ้งเตือนเป็นวัน และระบุความหมายว่าการแจ้งเตือนจะเกิดซ้ำจนกว่าเอกสารจะเป็น Completed_Status
4. WHEN สถานะของเอกสารเป็น Completed_Status, THE Document_Detail_View SHALL แสดงว่าการแจ้งเตือนของเอกสารนั้นสิ้นสุดแล้ว

### Requirement 7: การปรับปรุงเอกสารวิเคราะห์ (Part C)

**User Story:** As a นักวิเคราะห์ธุรกิจ, I want ให้เอกสารวิเคราะห์สะท้อนกฎการแจ้งเตือนที่เปลี่ยนแปลง, so that เอกสารอ้างอิงตรงกับพฤติกรรมของระบบต้นแบบ

#### Acceptance Criteria

1. THE Analysis_Document SHALL ปรับปรุงกฎ `BR-3.2` และ `BR-3.3` ให้สะท้อนรอบการแจ้งเตือนที่ตั้งค่าได้ต่อระดับความเร่งด่วน โดยมีค่าเริ่มต้น `normal` = 5 วัน, `urgent` = 3 วัน, `very-urgent` = 1 วัน และแจ้งซ้ำจนกว่าเอกสารจะเป็น Completed_Status
2. THE Analysis_Document SHALL ปรับปรุงกฎผู้รับการแจ้งเตือนให้ระบุว่าผู้รับคือ Origin (ต้นทาง) และ Latest_Assignee ของแต่ละ Delegation_Tree
3. THE Analysis_Document SHALL ปรับปรุงตารางค่ารอบการแจ้งเตือนเริ่มต้นในหมวด 8.2 ให้ตรงกับค่าเริ่มต้น `normal` = 5 วัน, `urgent` = 3 วัน, `very-urgent` = 1 วัน
4. THE Analysis_Document SHALL เพิ่มรายการบันทึกการเปลี่ยนแปลง (Change Log entry) ที่อธิบายการเปลี่ยนแปลงกฎการแจ้งเตือนและผู้รับ
5. THE Analysis_Document SHALL คงเนื้อหา State Machine (หมวด 6) ไว้โดยไม่เปลี่ยนแปลง และคงโครงสร้าง Notification templates ที่ไม่เกี่ยวข้องไว้ตามเดิม

### Requirement 8: จุดตรวจสอบการ Build (Build Checkpoint)

**User Story:** As a นักพัฒนา, I want ให้โครงการ build และตรวจชนิดข้อมูลผ่านหลังการเปลี่ยนแปลง, so that มั่นใจว่าไม่มีข้อผิดพลาดใหม่เกิดขึ้น

#### Acceptance Criteria

1. WHEN การเปลี่ยนแปลงโค้ดสำหรับฟีเจอร์นี้เสร็จสิ้น, THE Reminder_System SHALL ผ่านการ build ด้วยคำสั่ง `pnpm build` โดยไม่มีข้อผิดพลาดใหม่
2. WHEN การเปลี่ยนแปลงโค้ดสำหรับฟีเจอร์นี้เสร็จสิ้น, THE Reminder_System SHALL ผ่านการตรวจชนิดข้อมูลด้วยคำสั่ง `pnpm exec tsc --noEmit` โดยไม่มีข้อผิดพลาดใหม่

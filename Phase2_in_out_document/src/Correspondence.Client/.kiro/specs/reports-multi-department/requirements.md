# Requirements Document

## Introduction

เอกสารฉบับนี้กำหนดข้อกำหนด (Requirements) สำหรับการแก้ไขหน้ารายงาน (ReportsPage) ของระบบงานสารบรรณเข้า–ออก (Phase 2) ให้ "เรียกข้อมูลถูกต้อง" ตามข้อเท็จจริงว่า เอกสาร 1 ฉบับสามารถเกี่ยวข้องกับหลายฝ่ายพร้อมกันผ่านงานย่อย (Sub-assignment) จึงต้องนับและสรุปผลรายฝ่ายให้ครบทุกฝ่ายที่เกี่ยวข้อง แทนการนับจากฝ่ายรับผิดชอบฝ่ายเดียว และเลิกใช้ค่าที่สุ่ม (Math.random) หรือค่าคงที่ (hardcoded) ที่ไม่ได้มาจากข้อมูลจริง

ขอบเขตงานเป็น mockup ฝั่งหน้าเว็บ (frontend-only) ด้วย React + TypeScript + Tailwind (Vite) โดยใช้ข้อมูลจำลอง (mock data) จากไฟล์ `src/mock.ts` เท่านั้น ไม่มี backend, ไม่มีฐานข้อมูลจริง, ไม่มีการยืนยันตัวตนจริง และไม่มี test framework โดยการตรวจสอบความถูกต้องทำผ่านการ build (`pnpm build`) และตรวจชนิดข้อมูล (`pnpm exec tsc --noEmit`) งานนี้ครอบคลุมการเพิ่มฟังก์ชันช่วย (helpers) ใน `src/mock.ts`, การแก้ไข `src/pages/ReportsPage.tsx`, และการปรับปรุงเอกสารวิเคราะห์ `P2026-040_Analysis.md`

ระบบต้องคงธีม Deves (Navy #012169 + Gold #FFCD00) และภาษาไทยในส่วนติดต่อผู้ใช้ตามเดิม

## Glossary

- **Reports_Page**: คอมโพเนนต์หน้าเว็บ `src/pages/ReportsPage.tsx` ที่แสดงรายงานและสถิติทั้งหมด
- **Mock_Module**: โมดูลข้อมูลจำลอง `src/mock.ts` ที่รวบรวมข้อมูลและฟังก์ชันช่วยสำหรับ mockup
- **Document**: ระเบียนเอกสารในอาร์เรย์ `DOCUMENTS` ซึ่งมีฟิลด์ `department` (ฝ่ายที่รับผิดชอบ), `originDepartment` (ฝ่ายต้นทาง), `status`, `deadlineFlag`, `docDirection` ('incoming'|'outgoing'), `urgency`, `receivedAt`, `deadline`
- **Sub_Assignment**: ระเบียนงานย่อยใน `SUB_ASSIGNMENTS: Record<docId, SubAssignment[]>` แต่ละรายการมีฟิลด์ `department`, `assigneeType` ('person'|'department'), `status` ('pending'|'accepted'|'rejected'|'recalled'|'forwarded'|'success'|'cancelled'), และ `parentId?`
- **Involved_Departments**: เซตของฝ่ายที่เอกสารหนึ่งฉบับเกี่ยวข้อง คือ การรวม (union) แบบไม่ซ้ำของฝ่ายจาก Sub_Assignment ทุกสถานะของเอกสารนั้น รวมกับฝ่ายที่รับผิดชอบ (`department`) และฝ่ายต้นทาง (`originDepartment`) เมื่อเอกสารไม่มี Sub_Assignment ให้ใช้ `[doc.department]`
- **Departments_Master**: อาร์เรย์รายชื่อฝ่ายมาตรฐาน `DEPARTMENTS: string[]` ใน Mock_Module
- **By_Department_Aggregate**: ผลรวมรายฝ่ายสำหรับรายงาน "รายงานตามฝ่าย" (by-dept) ที่นับเอกสารหนึ่งฉบับภายใต้ทุกฝ่ายที่เอกสารนั้นเกี่ยวข้อง
- **Receive_Performance_Aggregate**: ผลรวมรายฝ่ายด้านประสิทธิภาพการรับงาน คำนวณจาก Sub_Assignment จริง (มอบหมาย/รับ/ปฏิเสธ/ดึงกลับ และอัตราปฏิเสธ)
- **Countable_Sub**: Sub_Assignment ที่นับเป็นตัวหารของงานที่มอบหมาย ตามนิยามของ Mock_Module (ไม่รวมสถานะที่ไม่นับ เช่น cancelled)
- **Report_Filters**: ตัวกรองในหน้ารายงาน ได้แก่ `dateFrom`, `dateTo` (ช่วงวันที่), `filterDept` (ฝ่ายที่เกี่ยวข้อง), และ `filterDirection` ('all'|'incoming'|'outgoing')
- **Show_Report_Action**: ปุ่ม "แสดงรายงาน" หรือกลไก reactive ที่ทำให้รายงานถูกกรองตาม Report_Filters
- **Overdue_Report**: รายงานงานค้างและใกล้กำหนด (`deadlineFlag` เป็น 'overdue' หรือ 'due-soon')
- **Performance_Data**: ชุดข้อมูลประสิทธิภาพการดำเนินงานรายฝ่าย (`PERFORMANCE_DATA`) ที่แสดงเวลาเฉลี่ยเทียบเป้าหมาย
- **Analysis_Document**: เอกสารวิเคราะห์ `Phase2_in_out_document/P2026-040_Analysis.md`
- **Build_Checkpoint**: การตรวจสอบด้วยคำสั่ง `pnpm build` และ `pnpm exec tsc --noEmit`
- **Deterministic**: การคำนวณที่ให้ผลลัพธ์เดิมทุกครั้งเมื่ออินพุตเดิม โดยไม่ใช้ค่าสุ่มหรือค่าเวลาปัจจุบัน

## Requirements

### Requirement 1: ฟังก์ชันคำนวณฝ่ายที่เอกสารเกี่ยวข้อง (Involved Departments)

**User Story:** As a ผู้พัฒนา mockup, I want ฟังก์ชันที่คำนวณเซตของฝ่ายที่เอกสารหนึ่งฉบับเกี่ยวข้องได้ครบทุกฝ่าย, so that รายงานสามารถสะท้อนความจริงว่า 1 เอกสารเกี่ยวข้องกับหลายฝ่าย

#### Acceptance Criteria

1. THE Mock_Module SHALL จัดเตรียมฟังก์ชันช่วยที่รับตัวระบุเอกสาร (docId) หรือ Document หนึ่งฉบับ แล้วคืนค่ารายการฝ่ายที่เกี่ยวข้อง (Involved_Departments) แบบไม่ซ้ำ
2. WHEN เอกสารมี Sub_Assignment อย่างน้อยหนึ่งรายการ, THE Mock_Module SHALL รวมฝ่าย (`department`) จาก Sub_Assignment ทุกสถานะเข้าเป็นส่วนหนึ่งของ Involved_Departments
3. THE Mock_Module SHALL รวมฝ่ายที่รับผิดชอบ (`doc.department`) และฝ่ายต้นทาง (`doc.originDepartment`) เข้าเป็นส่วนหนึ่งของ Involved_Departments
4. IF เอกสารไม่มี Sub_Assignment, THEN THE Mock_Module SHALL คืนค่า Involved_Departments เท่ากับ `[doc.department]`
5. THE Mock_Module SHALL คืนค่า Involved_Departments โดยไม่มีค่าฝ่ายซ้ำกันภายในรายการเดียว
6. THE Mock_Module SHALL คำนวณ Involved_Departments แบบ Deterministic โดยไม่ใช้ค่าสุ่ม

### Requirement 2: ผลรวมรายฝ่ายแบบนับหลายฝ่าย (By-Department Aggregate)

**User Story:** As a ผู้บริหาร, I want รายงานตามฝ่ายที่นับเอกสารภายใต้ทุกฝ่ายที่เกี่ยวข้อง, so that ผมเห็นภาระงานจริงของแต่ละฝ่ายแม้เอกสารฉบับเดียวจะเกี่ยวข้องหลายฝ่าย

#### Acceptance Criteria

1. THE Mock_Module SHALL จัดเตรียมฟังก์ชันช่วยที่คืนค่า By_Department_Aggregate เป็นรายการต่อฝ่ายสำหรับทุกฝ่ายใน Departments_Master
2. WHERE เอกสารหนึ่งฉบับมีฝ่ายใดอยู่ใน Involved_Departments, THE Mock_Module SHALL นับเอกสารฉบับนั้นภายใต้ผลรวมของฝ่ายนั้น
3. THE Mock_Module SHALL คำนวณจำนวนเอกสารที่เสร็จสิ้น (`status` เท่ากับ 'completed') และจำนวนเอกสารที่เกินกำหนด (`deadlineFlag` เท่ากับ 'overdue') ต่อฝ่าย ภายใต้กติกาการนับตามฝ่ายที่เกี่ยวข้องเดียวกัน
4. THE Mock_Module SHALL คำนวณ By_Department_Aggregate แบบ Deterministic โดยไม่ใช้ `Math.random` หรือค่าคงที่ที่ไม่ได้มาจากข้อมูลจริง
5. WHEN ผลรวมจำนวนเอกสารรายฝ่ายถูกรวมข้ามทุกฝ่าย, THE Reports_Page SHALL แสดงหมายเหตุที่อธิบายว่า "1 เอกสารเกี่ยวข้องได้หลายฝ่าย ยอดรวมรายฝ่ายจึงอาจมากกว่าจำนวนเอกสารจริง"

### Requirement 3: ผลรวมประสิทธิภาพการรับงานจาก Sub-assignment จริง (Receive Performance Aggregate)

**User Story:** As a ผู้ตรวจสอบ, I want รายงานประสิทธิภาพการรับงานที่คำนวณจากงานย่อยจริง, so that อัตราการปฏิเสธ/ดึงกลับสะท้อนสถานะ Sub_Assignment ที่บันทึกไว้จริง

#### Acceptance Criteria

1. THE Mock_Module SHALL จัดเตรียมฟังก์ชันช่วยที่คืนค่า Receive_Performance_Aggregate รายฝ่าย โดยจัดกลุ่มตามฝ่ายของ Sub_Assignment (`sub.department`)
2. THE Mock_Module SHALL คำนวณจำนวนงานที่มอบหมาย (assigned) จากจำนวน Countable_Sub ของแต่ละฝ่าย
3. THE Mock_Module SHALL คำนวณจำนวนที่รับงาน (accepted) จากผลรวมของ Sub_Assignment ที่มีสถานะ 'accepted' และ 'success'
4. THE Mock_Module SHALL คำนวณจำนวนที่ปฏิเสธ (rejected) จาก Sub_Assignment สถานะ 'rejected' และจำนวนที่ดึงกลับ (recalled) จาก Sub_Assignment สถานะ 'recalled'
5. WHEN จำนวนงานที่มอบหมาย (assigned) ของฝ่ายมากกว่าศูนย์, THE Mock_Module SHALL คำนวณอัตราการปฏิเสธ (rejectRate) เป็นสัดส่วนของจำนวนที่ปฏิเสธต่อจำนวนที่มอบหมาย
6. IF จำนวนงานที่มอบหมาย (assigned) ของฝ่ายเท่ากับศูนย์, THEN THE Mock_Module SHALL กำหนดอัตราการปฏิเสธ (rejectRate) ของฝ่ายนั้นเป็นศูนย์
7. THE Mock_Module SHALL คำนวณ Receive_Performance_Aggregate แบบ Deterministic

### Requirement 4: รายงานตามฝ่ายบน Reports_Page ใช้ผลรวมแบบนับหลายฝ่าย

**User Story:** As a ผู้ใช้รายงาน, I want รายงานตามฝ่าย (by-dept) แสดงผลจากผลรวมที่นับหลายฝ่ายจริง, so that กราฟและตารางตรงกับข้อมูลจริงและไม่ใช่ตัวเลขสุ่ม

#### Acceptance Criteria

1. THE Reports_Page SHALL ใช้ By_Department_Aggregate จาก Mock_Module เป็นแหล่งข้อมูลของรายงานตามฝ่าย (by-dept) แทนการคำนวณ `DEPT_DATA` เดิมที่ใช้ `Math.random`
2. THE Reports_Page SHALL แสดงกราฟและตารางของรายงานตามฝ่ายด้วยค่าจำนวนทั้งหมด เสร็จสิ้น และเกินกำหนด ต่อฝ่าย จาก By_Department_Aggregate
3. THE Reports_Page SHALL แสดงหมายเหตุ "1 เอกสารเกี่ยวข้องได้หลายฝ่าย ยอดรวมรายฝ่ายจึงอาจมากกว่าจำนวนเอกสารจริง" ในบริเวณรายงานตามฝ่าย

### Requirement 5: รายงานประสิทธิภาพการรับงานบน Reports_Page ใช้ข้อมูลที่คำนวณจริง

**User Story:** As a ผู้ใช้รายงาน, I want รายงานประสิทธิภาพการรับงานแสดงค่าที่คำนวณจาก Sub_Assignment จริง, so that ตัวเลขไม่ใช่ค่าคงที่ที่ตายตัว

#### Acceptance Criteria

1. THE Reports_Page SHALL ใช้ Receive_Performance_Aggregate ที่คำนวณจาก Sub_Assignment จริง เป็นแหล่งข้อมูลของรายงานประสิทธิภาพการรับงาน (receive) แทนการใช้ค่าคงที่เดิมโดยตรง
2. THE Reports_Page SHALL แสดงค่าจำนวนที่มอบหมาย รับงาน ปฏิเสธ ดึงกลับ และอัตราปฏิเสธ รายฝ่าย จาก Receive_Performance_Aggregate

### Requirement 6: แก้ไขชื่อฝ่ายใน Performance_Data ให้ตรงกับฝ่ายมาตรฐาน

**User Story:** As a ผู้ใช้รายงาน, I want รายงานประสิทธิภาพการดำเนินงานอ้างชื่อฝ่ายที่มีอยู่จริง, so that รายงานสอดคล้องกับรายชื่อฝ่ายมาตรฐานของระบบ

#### Acceptance Criteria

1. THE Reports_Page SHALL ใช้ชื่อฝ่ายใน Performance_Data ที่เป็นค่าในรายชื่อ Departments_Master เท่านั้น
2. THE Reports_Page SHALL แสดงป้ายกำกับที่ระบุว่าค่าตัวเลขใน Performance_Data เป็นค่าตัวอย่างเพื่อการสาธิต (illustrative)
3. THE Reports_Page SHALL กำหนดค่า Performance_Data แบบ Deterministic โดยไม่ใช้ค่าสุ่ม

### Requirement 7: การกรองรายงานตาม Report_Filters

**User Story:** As a ผู้ใช้รายงาน, I want ตัวกรองฝ่าย ประเภทเอกสาร และช่วงวันที่ทำงานจริง, so that ผมสามารถดูรายงานเฉพาะกลุ่มข้อมูลที่ต้องการ

#### Acceptance Criteria

1. WHEN ผู้ใช้เลือกค่า `filterDept` ที่ไม่ใช่ 'all', THE Reports_Page SHALL แสดงเฉพาะเอกสารที่มีฝ่ายที่เลือกอยู่ใน Involved_Departments ของเอกสารนั้น
2. WHEN ผู้ใช้เลือกค่า `filterDirection` เป็น 'incoming' หรือ 'outgoing', THE Reports_Page SHALL แสดงเฉพาะเอกสารที่มี `docDirection` ตรงกับค่าที่เลือก
3. WHERE รายงานเป็นรายการเอกสารที่อ้างอิงช่วงวันที่ได้ (Overdue_Report และรายงานปริมาณ), THE Reports_Page SHALL กรองเอกสารด้วยช่วงวันที่ `dateFrom` ถึง `dateTo` โดยเทียบกับ `receivedAt` หรือ `deadline`
4. WHEN ผู้ใช้เรียกใช้ Show_Report_Action, THE Reports_Page SHALL แสดงรายงานที่ถูกกรองตามค่า Report_Filters ปัจจุบัน
5. WHERE ค่า Report_Filters ทั้งหมดเป็น 'all' หรือครอบคลุมทุกช่วงวันที่, THE Reports_Page SHALL แสดงเอกสารทั้งหมดตามเดิม

### Requirement 8: รายงานงานค้างแสดงฝ่ายที่เกี่ยวข้องทั้งหมด

**User Story:** As a ผู้ติดตามงาน, I want รายงานงานค้างแสดงทุกฝ่ายที่เกี่ยวข้องกับเอกสาร, so that ผมทราบว่าเอกสารค้างเกี่ยวข้องกับฝ่ายใดบ้าง ไม่ใช่แค่ฝ่ายรับผิดชอบฝ่ายเดียว

#### Acceptance Criteria

1. THE Reports_Page SHALL แสดงรายการ Involved_Departments ของแต่ละเอกสารใน Overdue_Report แทนการแสดงเฉพาะ `doc.department`
2. WHERE เอกสารมี Involved_Departments มากกว่าหนึ่งฝ่าย, THE Reports_Page SHALL แสดงฝ่ายที่เกี่ยวข้องทุกฝ่ายของเอกสารนั้น

### Requirement 9: รายงานปริมาณเคารพตัวกรองประเภทเอกสาร

**User Story:** As a ผู้ใช้รายงาน, I want รายงานปริมาณเอกสารสอดคล้องกับตัวกรองประเภทเอกสาร, so that สรุปปริมาณสะท้อนทิศทางเอกสารที่เลือก

#### Acceptance Criteria

1. THE Reports_Page SHALL คงการใช้ `MONTHLY_DATA` เป็นแหล่งข้อมูลกราฟปริมาณเอกสารรายเดือนสำหรับ mockup
2. WHERE ผู้ใช้เลือก `filterDirection` เป็น 'incoming' หรือ 'outgoing', THE Reports_Page SHALL สะท้อนทิศทางที่เลือกในส่วนสรุปของรายงานปริมาณเท่าที่ทำได้

### Requirement 10: ปรับปรุงเอกสารวิเคราะห์ (Documentation)

**User Story:** As a นักวิเคราะห์ระบบ, I want เอกสารวิเคราะห์ระบุกติกาการนับหลายฝ่ายและที่มาของรายงานอย่างชัดเจน, so that ทีมเข้าใจความหมายของรายงาน RPT-01..06 ตรงกัน

#### Acceptance Criteria

1. THE Analysis_Document SHALL อธิบายว่าเอกสารที่เกี่ยวข้องกับหลายฝ่ายจะถูกนับภายใต้ทุกฝ่ายที่เกี่ยวข้องในรายงานที่จัดกลุ่มตามฝ่าย
2. THE Analysis_Document SHALL อธิบายว่ารายงานประสิทธิภาพการรับงานคำนวณจาก Sub_Assignment จริง
3. THE Analysis_Document SHALL ปรับความหมายของรายงาน RPT-01 ถึง RPT-06 ให้สอดคล้องกับกติกาการนับหลายฝ่าย
4. THE Analysis_Document SHALL เพิ่มรายการใน Change Log สำหรับการปรับปรุงครั้งนี้
5. THE Analysis_Document SHALL คงเนื้อหาส่วน State Machine ไว้ตามเดิมโดยไม่เปลี่ยนแปลง

### Requirement 11: จุดตรวจสอบการ Build (Build Checkpoint)

**User Story:** As a ผู้พัฒนา, I want โค้ดผ่านการ build และตรวจชนิดข้อมูลได้โดยไม่มี error ใหม่, so that mockup ยังคงคอมไพล์และทำงานได้

#### Acceptance Criteria

1. WHEN รันคำสั่ง `pnpm build`, THE Reports_Page SHALL คอมไพล์สำเร็จโดยไม่มีข้อผิดพลาดใหม่
2. WHEN รันคำสั่ง `pnpm exec tsc --noEmit`, THE Mock_Module SHALL ผ่านการตรวจชนิดข้อมูลโดยไม่มีข้อผิดพลาดใหม่

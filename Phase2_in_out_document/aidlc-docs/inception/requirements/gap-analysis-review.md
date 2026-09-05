# เอกสารรายงานการทบทวนและวิเคราะห์ส่วนต่างของระบบ (AI-DLC Gap Analysis Report)

**โครงการ:** ระบบ Monitor สถานะเอกสารรับเข้า–ส่งออก (Correspondence Monitoring System) — P2026-XXX  
**เอกสารอ้างอิง:** 
1. UI Mockup: `mockup/`
2. SRS Analysis Specification: `P2026-XXX_Analysis.md` (Draft 1.8.8)
3. Running Application: `src/Correspondence.Client/` (React SPA) & `src/Correspondence.Api/` (.NET 8 Web API + MS SQL Server)

---

## 1. บทสรุปผู้บริหาร (Executive Summary)

จากการตรวจสอบเปรียบเทียบระหว่าง **ระบบที่กำลังทำงานอยู่ (Running System)** กับ **UI Mockup (`mockup/`)** และ **ข้อกำหนดความต้องการทางธุรกิจ (SRS `P2026-XXX_Analysis.md`)** พบประเด็นความไม่ตรงกันและฟังก์ชันที่ขาดหายไปสำคัญดังนี้:

1. **หน้ารายละเอียดเอกสาร (Document Detail Page)**:
   - ใน `mockup/` มีความสมบูรณ์สูงมาก (1,387 บรรทัด) รองรับโครงสร้างการมอบหมายต่อแบบต้นไม้ซ้อนชั้น (**Nested Delegation SubTree ตาม BR-2.4-A**), การติดตามผู้ถือครองเอกสารตัวจริง (**Stateful Chain of Custody ตาม BR-6.1**), และระบบ **Top Secret OTP Verification Gate + Dynamic Watermark (BR-1.4)**
   - ใน Running Client (`src/Correspondence.Client/`) มีการตัดทอนโค้ดลงเหลือ 1,080 บรรทัด ทำให้โครงสร้าง Delegation Tree ถูก Flatten และ Modal การดำเนินการสำคัญหลายส่วนทำงานไม่สมบูรณ์
2. **หน้าผู้ดูแลระบบและการตั้งค่า (Admin & Configuration Page)**:
   - ขาดการเชื่อมโยงการตั้งค่า **รอบการแจ้งเตือนเตือนซ้ำ (Configurable Reminder Interval ตาม BR-3.2/3.3)**
   - การตั้งค่า **Monitor (ROLE-07 Watcher ตาม BR-5.3)** ยังไม่รองรับ Multi-Scope และ All-Departments flag อย่างสมบูรณ์บน UI
3. **หน้าแดชบอร์ดและรายงาน (Dashboard & Reports)**:
   - Filter การสลับประเภทงาน (รับเข้า / ส่งออก / ทั้งหมด) และการกระจายสถานะ (Status Distribution) ยังไม่ซิงค์กับข้อมูลจริงครบทุกแกน
4. **ความเข้ากันได้ของข้อมูลจำลองและสิทธิ์ผู้ใช้ (User Roles & Data Parity)**:
   - ผู้ใช้ทั้ง 17 บัญชีใน `mockup/` และ `TEST_USERS_CATALOG.md` ยังไม่สามารถสลับบริบทการมองเห็นข้อมูล (Data Scope: Own / Dept / All / Watcher) ในหน้าจอได้อย่างเต็มรูปแบบเหมือนใน Mockup

---

## 2. ตารางเปรียบเทียบ Gap Analysis Matrix รายหมวดหมู่

| หมวดหมู่ / Business Rule | ข้อกำหนดใน SRS (`P2026-XXX_Analysis.md`) | สถานะใน `mockup/` | สถานะใน Running System (`src/`) | สถานะ Gap |
| :--- | :--- | :--- | :--- | :---: |
| **BR-1.1 & BR-1.2**<br>ประเภทเอกสารและการแนบไฟล์ | รองรับเอกสาร 2 ประเภท (รับเข้า/ส่งออก) แนบไฟล์ผ่านเครื่อง + กล้องถ่ายภาพ (Camera Flip/Rotate) | สมบูรณ์ 100% | มีฟังก์ชันพื้นฐาน แต่บางจุดยังไม่รองรับ Drag & Drop dropzone | 🟡 ปรับปรุงเล็กน้อย |
| **BR-1.2-B**<br>Attachment Management on Detail | แนบไฟล์/ถ่ายภาพเพิ่มในหน้า Detail, Lightbox Preview, Download, Delete Extra | สมบูรณ์ 100% | มีบางส่วน แต่ยังไม่สมบูรณ์ตาม Mockup | 🟡 ปรับปรุง |
| **BR-1.3-A to D**<br>EDR Seamless Outgoing Number | เชื่อมต่อระบบ EDR ขอเลขไทย/อังกฤษ Dual-Key ผ่าน Pre-flight Context Check API | สมบูรณ์ 100% (มี Modal เต็มรูปแบบ) | Backend มี Service แต่ UI ยังไม่ต่อครบ Flow | 🟡 ปรับปรุง |
| **BR-1.4-A to E**<br>Top Secret OTP & Watermark | เอกสาร "ลับมาก" ต้องข้ามผ่าน OTP Gate (Email only) + แสดง Dynamic Watermark | สมบูรณ์ 100% | UI ใน src ถูกตัดทอนการครอบ OTP Gate | 🔴 **ขาดหาย (Critical)** |
| **BR-2.4-A**<br>Nested Delegation SubTree | มอบหมายต่อภายในฝ่ายเดียวกัน (A → B → C) แสดงเป็นโครงสร้างต้นไม้ซ้อนชั้น | สมบูรณ์ 100% (มี Tree UI) | ถูกแปลงเป็น Flat List ทำให้ดูลำดับสายงานไม่ได้ | 🔴 **ขาดหาย (Critical)** |
| **BR-3.2 & BR-3.3**<br>Configurable Reminder Intervals | กำหนดรอบเตือนซ้ำรายความเร่งด่วน (ปกติ 5 วัน, ด่วน 3 วัน, ด่วนมาก 1 วัน) | สมบูรณ์ 100% บนหน้า Admin | Backend ยังไม่มี API บันทึก/อ่านค่า Config นี้ | 🔴 **ขาดหาย** |
| **BR-5.2**<br>LDAP User Provisioning | Admin ค้นหาบัญชีจาก AD/LDAP แล้ว Provision เข้าระบบและผูก Role | สมบูรณ์ 100% | Backend รองรับแล้ว แต่ UI ยังไม่ต่อให้ครบสมบูรณ์ | 🟡 ปรับปรุง |
| **BR-5.3 & BR-5.3-A/B/C**<br>Configurable Monitor (ROLE-07) | เฝ้าติดตามหลายฝ่ายพร้อมกัน (Multi-Scope) หรือเลือกทุกฝ่าย (All-Departments flag) | สมบูรณ์ 100% | DB รองรับแล้ว แต่ UI Client ยังไม่ส่ง payload ครบ | 🟡 ปรับปรุง |
| **BR-6.1**<br>Stateful Chain of Custody | ติดตามผู้ถือครองเอกสารตัวจริง ณ ปัจจุบัน (Current Holder) เมื่อเปลี่ยนมือ | สมบูรณ์ 100% ใน mock state | ยังไม่แสดง Current Holder Badge ชัดเจนบน Detail | 🔴 **ขาดหาย** |
| **RPT-01 to RPT-06**<br>Multi-Department Reporting | คำนวณยอดรายงานแบบนับซ้ำข้ามฝ่ายตาม Involved Departments | สมบูรณ์ 100% ใน `mock.ts` | Backend Reports API ส่งข้อมูลเฉพาะ aggregate เบื้องต้น | 🟡 ปรับปรุง |

---

## 3. รายละเอียดจุดที่ต้องแก้ไขรายหน้าจอ (Actionable Remediation Plan)

### 3.1 หน้า DocumentDetailPage (`src/Correspondence.Client/src/pages/DocumentDetailPage.tsx`)
1. **กู้คืนและผสาน Nested Delegation Tree**:
   - นำฟังก์ชัน `buildDelegation`, `renderDelegationTree`, และคอมโพเนนต์แสดงสายงานย่อยซ้อนชั้นกลับมาผสานกับ Live Data
   - คำนวณ Leaf Assignees และสถานะของแต่ละกิ่งก้านอย่างถูกต้อง
2. **ผสาน Action Modals ครบวงจร**:
   - Modal รับงาน (Accept) พร้อมข้อความแจ้งเตือนเอกสารตัวจริง
   - Modal มอบหมายต่อ (Delegate) กรองเฉพาะสมาชิกในฝ่าย (`subordinateCandidates`)
   - Modal ส่งต่อ (Forward), ปฏิเสธ (Reject), ดึงงานกลับ (Recall), และปิดงาน (Success)
   - Modal บันทึกนำส่งถึงปลายทาง (Delivered) และยืนยันรับเอกสารฉบับจริงคืน
3. **ระบบ OTP Verification Gate & Watermarking**:
   - บล็อกการพรีวิว/ดาวน์โหลดไฟล์เอกสารลับมากจนกว่าจะยืนยัน OTP สำเร็จ
   - แสดง Dynamic Watermark ซ้อนทับบนหน้าจอ

### 3.2 หน้า AdminPage (`src/Correspondence.Client/src/pages/AdminPage.tsx`)
1. นำแท็บ **Reminder Configuration** กลับมาใช้งาน พร้อมเชื่อมต่อ API สำหรับบันทึกรอบเตือนซ้ำ
2. ปรับฟอร์ม **Monitor Configuration** ให้รองรับการเลือกหลายฝ่าย (Multi-select) และสวิตช์ "ทุกฝ่าย (All Departments)"
3. ปรับปรุงการแสดงผลตารางผู้ใช้และการ Provisioning จาก AD/LDAP

### 3.3 หน้า Dashboard & Reports (`DashboardPage.tsx`, `ReportsPage.tsx`)
1. ปรับ Filter รับเข้า / ส่งออก / ทั้งหมด ให้คำนวณและแสดงกราฟ Status Distribution และ Monthly Volume ได้ถูกต้องครบถ้วน
2. ปรับปรุง Reports Page ให้รองรับรายงาน RPT-01 ถึง RPT-06 พร้อมระบบ Filter และ Export

### 3.4 Backend Enhancements (`src/Correspondence.Api` & `Infrastructure`)
1. เพิ่ม Endpoint สำหรับ **Reminder Interval Configuration** (`GET/POST /api/v1/master/reminder-intervals`)
2. ปรับปรุง `DocumentWorkflowService` ให้รองรับการบันทึกสายการมอบหมายต่อ (`parent_id`) และอัปเดต `CUSTODY_LOG` เมื่อมีผู้รับงานเอกสารตัวจริง

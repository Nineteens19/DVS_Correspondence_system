# เอกสารชุดทดสอบระบบ (Test Cases Specification) — P2026-XXX

**Document Type:** Test Case Specification (ตารางชุดการทดสอบระบบสารบรรณ)  
**Form Code:** F-BP-005 / TC-P2026-040  
**Project:** P2026-XXX ระบบ Monitor สถานะเอกสารรับเข้า–ส่งออก (Correspondence Monitoring System)  
**Company:** บริษัท เทเวศประกันภัย จำกัด (มหาชน) (Deves Insurance PCL)  
**System:** Correspondence Monitoring System (ครอบคลุมทั้งงานเอกสารรับเข้าและงานเอกสารส่งออก)  
**Version:** 1.0.0 (สอดคล้องกับ SRS Analysis Draft 1.8.8)  
**Prepared by:** BA (Business Analyst — Deves Correspondence System)  
**Created Date:** 2 กันยายน 2026  
**Source Analysis:** [P2026-XXX_Analysis.md](file:///e:/DVS/Project/DVS_Correspondence_system/Phase2_in_out_document/P2026-XXX_Analysis.md) (Draft 1.8.8)  
**Status:** Approved for UAT / SIT Testing  

---

## 1. ข้อมูลภาพรวมและเมทริกซ์การครอบคลุม (Test Coverage Matrix)

| หมวดหมู่การทดสอบ | รหัสหมวด | จำนวน Test Cases | Business Rules ที่ครอบคลุม | Validations ที่ครอบคลุม | ระดับความสำคัญ |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **1. ยืนยันตัวตน, LDAP Provisioning & RBAC** | `SEC-AUTH` | 8 TCs | BR-5.1, BR-5.2, BR-5.2-A..D | VAL-12, VAL-13, VAL-14 | Critical |
| **2. ลงทะเบียนเอกสารรับเข้า, แนบไฟล์ & กล้อง WebRTC** | `REG-IN` | 10 TCs | BR-1.2, BR-1.2-A, BR-1.2-B, BR-2.4 | VAL-01, VAL-02, VAL-03, VAL-05, VAL-10, VAL-15 | Critical |
| **3. ลงทะเบียนเอกสารส่งออก & การขอเลข EDR 2 ภาษา** | `REG-OUT` | 10 TCs | BR-1.3-A..D, BR-4.1, BR-4.1-A..B | VAL-04, VAL-11, VAL-16..19 | Critical |
| **4. เวิร์กโฟลว์, Owner-first & Onward Delegation** | `WF-FLOW` | 10 TCs | BR-2.1, BR-2.2, BR-2.2-A/B, BR-2.3, BR-2.4-A | VAL-06, VAL-07, VAL-08 | Critical |
| **5. การคำนวณ Progress & Chain of Custody เอกสารจริง** | `WF-CUSTODY` | 8 TCs | BR-2.5, BR-6.1, BR-2.2-A | VAL-09 | High |
| **6. เอกสารลับมาก, ระบบ OTP ทางอีเมล & Watermark** | `SEC-OTP` | 10 TCs | BR-1.4-A..E | VAL-20, VAL-21, VAL-22 | Critical |
| **7. วงจรชีวิตการนำส่งเอกสารภายนอก (Delivery Lifecycle)** | `DEL-OUT` | 6 TCs | BR-4.2, BR-4.1-A, BR-4.1-B | VAL-11 | High |
| **8. การแจ้งเตือน (Notifications), Reminder & Follow up** | `NOTI-REMIND` | 8 TCs | BR-3.1..3.4, BR-3.4-A, BR-6.2, BR-6.2-A | NT-01 ถึง NT-17 | High |
| **9. ผู้เฝ้าติดตามที่ Config ได้ (Configurable Watcher)** | `MON-WATCH` | 8 TCs | BR-5.3, BR-5.3-A..C, BR-3.4-A | VAL-23, VAL-24 | High |
| **10. ข้อมูลหลัก Master-Driven Data Entry** | `MST-DATA` | 6 TCs | BR-1.5 | VAL-25, VAL-26 | High |
| **11. แดชบอร์ดผู้บริหาร & รายงานมาตรฐาน 6 ฉบับ** | `DASH-RPT` | 8 TCs | RPT-01..06, Multi-Dept Rule | N/A | High |
| **12. คุณลักษณะเชิงเทคนิค (NFR), Security & Audit 10 ปี** | `NFR-AUDIT` | 6 TCs | BR-6.3 | NFR-01 ถึง NFR-18 | Critical |
| **13. กระบวนการทดสอบข้ามสายงาน (End-to-End Flows)** | `E2E-FLOW` | 5 Scenarios | All In-Scope Workflows | All Relevant Rules | Critical |
| **รวมทั้งสิ้น** | | **103 รายการ** | **ครบ 100% ของ SRS Analysis** | **ครบทุกข้อ (VAL-01..26)** | |

---

## 2. ข้อมูลบัญชีผู้ใช้สำหรับทดสอบ (Test Accounts Matrix)

| Username | รหัสผ่านทดสอบ | Role ID | บทบาทหน้าที่ในระบบ | ฝ่ายที่สังกัด | ขอบเขตข้อมูล (Data Scope) | วัตถุประสงค์ในการทดสอบ |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `sutthichok.t` | `password123` | `ROLE-05` | Admin (ผู้ดูแลระบบ) | ฝ่ายสารสนเทศ | All (ทุกฝ่ายทั่วองค์กร) | ทดสอบการค้นหา/Provision ผู้ใช้จาก LDAP, จัดการ Master Data, ตั้งค่าระบบ |
| `admin` | `password123` | `ROLE-05` | Admin (ผู้ดูแลระบบ) | ฝ่ายสารสนเทศ | All (ทุกฝ่ายทั่วองค์กร) | ทดสอบสิทธิ์ Super Admin |
| `somchai.p` | `password123` | `ROLE-01` | สารบรรณ (Registrar) | งานสารบรรณ | Own (ของตนเอง) | ลงทะเบียนเอกสารรับเข้า, ถ่ายภาพกล้อง, ยืนยันรับคืนเอกสารฉบับจริง |
| `anong.s` | `password123` | `ROLE-03` | หัวหน้างานสารบรรณ | งานสารบรรณ | Dept (งานสารบรรณ) | ตรวจสอบงานสารบรรณ, ส่งต่อข้ามฝ่าย |
| `wichai.t` | `password123` | `ROLE-03` | ผอ. ฝ่ายสารสนเทศ | ฝ่ายสารสนเทศ | Dept (ฝ่ายสารสนเทศ) | รับงาน Owner-first, มอบหมายต่อ (Delegate) ให้ลูกทีม, ปฏิเสธงาน, ส่งต่อ |
| `kanda.m` | `password123` | `ROLE-02` | เจ้าหน้าที่ IT (Staff) | ฝ่ายสารสนเทศ | Own (งานที่ได้รับมอบ) | รับงาน, ปิดงาน Complete, ขอ OTP เปิดไฟล์ลับมาก, แนบไฟล์เพิ่ม |
| `wichai.c` | `password123` | `ROLE-03`/`06`| ผอ. การเงิน / ผู้ส่งออก | ฝ่ายการเงิน | Dept + Outgoing | ลงทะเบียนส่งออก, ขอเลข EDR 2 ภาษา, บันทึกนำส่ง (Sent), ยืนยัน Delivered |
| `siriporn.w` | `password123` | `ROLE-02` | เจ้าหน้าที่การเงิน (Staff) | ฝ่ายการเงิน | Own (งานที่ได้รับมอบ) | รับงานเอกสารการเงิน, แนบไฟล์สลิปตอบรับ, ปิดงาน |
| `prasit.m` | `password123` | `ROLE-03` | ผอ. ฝ่ายวิศวกรรม | ฝ่ายวิศวกรรม | Dept (ฝ่ายวิศวกรรม) | รับงานส่งต่อข้ามฝ่าย, มอบหมายต่อให้วิศวกร |
| `nattawut.s` | `password123` | `ROLE-02` | วิศวกร (Staff) | ฝ่ายวิศวกรรม | Own (งานที่ได้รับมอบ) | รับงานทางเทคนิค, ปิดงาน Success 100% |
| `prapat.k` | `password123` | `ROLE-04` | ผู้บริหาร (Executive) | ฝ่ายบริหารทั่วไป | All (Read-only ทุกฝ่าย) | ดู Dashboard ภาพรวมทุกฝ่าย, สถิติ SLA, กราฟ Volume เอกสาร |
| `monitor.auditor`| `password123` | `ROLE-07`| Monitor (ผู้เฝ้าติดตาม)| ฝ่ายบริหารทั่วไป | Config Scope (ตามที่ตั้ง) | ตรวจสอบงานค้าง, สถิติ Overdue, รับ Reminder ติดตาม, กด Follow up |

---

# ตารางชุดการทดสอบระบบสารบรรณ (Sheet: TestCases)

---

## หมวดที่ 1: การยืนยันตัวตน, LDAP Provisioning และสิทธิ์การใช้งาน (SEC-AUTH)

### TC-P2026-001: ผู้ใช้ที่ได้รับการ Provision เข้าระบบและมีสถานะ Active ล็อกอินสำเร็จ
- **Section:** 1. ยืนยันตัวตน & RBAC
- **Test Type:** Positive / Security
- **Priority:** Critical
- **Traceability:** `BR-5.2`, `NFR-01`, `UC-01`
- **Pre-requisite & Test Data:** ผู้ใช้ `somchai.p` ถูก Provision ในระบบ มีสถานะ `status = Active` ในฐานข้อมูล
- **Test Steps:**
  1. เข้าหน้าจอ Login (`/login`)
  2. ระบุ Username: `somchai.p`
  3. ระบุ Password: `password123` (Credential ถูกต้องตาม LDAP/AD)
  4. คลิกปุ่ม "เข้าสู่ระบบ"
- **Expected Results:**
  1. ระบบตรวจสอบ Credential ผ่านกับ LDAP/AD และตรวจพบสถานะ Active ในตาราง `SYSTEM_USER`
  2. เข้าสู่ระบบสำเร็จ ระบบ Redirect ไปยังหน้า Dashboard/Task Inbox
  3. แสดงชื่อผู้ใช้ "นายสมชาย พัฒนาการ" และป้ายกำกับ Role "ผู้ Register (สารบรรณ)" บน TopBar
  4. บันทึกประวัติใน Audit Log: Action `Login`, Actor `somchai.p`, Result `Success` พร้อม IP Address

---

### TC-P2026-002: ผู้ใช้ใน Active Directory ที่ยังไม่ถูก Admin Provision พยายามเข้าสู่ระบบ
- **Section:** 1. ยืนยันตัวตน & RBAC
- **Test Type:** Negative / Security / Business Rule
- **Priority:** Critical
- **Traceability:** `BR-5.2-A`, `VAL-13`, `NFR-01`, `ERR-CR-011`
- **Pre-requisite & Test Data:** บัญชี `worawan.d` มีตัวตนจริงใน AD แต่ยังไม่ถูก Admin ทำการ Provision เข้าระบบ
- **Test Steps:**
  1. เข้าหน้าจอ Login
  2. กรอก Username: `worawan.d` และรหัสผ่านที่ถูกต้องของ AD
  3. คลิกปุ่ม "เข้าสู่ระบบ"
- **Expected Results:**
  1. ระบบตรวจสอบผ่านกับ AD แต่ไม่พบรายการใน `SYSTEM_USER`
  2. ระบบปฏิเสธการเข้าใช้งาน HTTP 403 Forbidden
  3. แสดงข้อความแจ้งเตือน: *"บัญชียังไม่ได้รับอนุญาตให้ใช้งานระบบ โปรดติดต่อผู้ดูแลระบบ (VAL-13)"*
  4. ไม่เกิดการสร้าง Session Token หรือนำทางเข้าสู่ระบบ

---

### TC-P2026-003: ผู้ใช้ที่ถูก Admin ปิดการใช้งาน (status = Inactive) พยายามเข้าสู่ระบบ
- **Section:** 1. ยืนยันตัวตน & RBAC
- **Test Type:** Negative / Security / Business Rule
- **Priority:** High
- **Traceability:** `BR-5.2-B`, `VAL-13`, `ERR-CR-011`
- **Pre-requisite & Test Data:** บัญชี `porntip.s` ถูก Admin สลับสถานะเป็น `Inactive` ในหน้าจัดการผู้ใช้
- **Test Steps:**
  1. เข้าหน้าจอ Login
  2. กรอก Username: `porntip.s` และรหัสผ่านที่ถูกต้อง
  3. คลิกปุ่ม "เข้าสู่ระบบ"
- **Expected Results:**
  1. ระบบปฏิเสธการเข้าใช้งาน HTTP 403 Forbidden
  2. แสดงข้อความแจ้งเตือน: *"บัญชีถูกปิดการใช้งาน (VAL-13)"*

---

### TC-P2026-004: ล็อกอินไม่สำเร็จเมื่อระบุชื่อผู้ใช้หรือรหัสผ่านผิดพลาด
- **Section:** 1. ยืนยันตัวตน & RBAC
- **Test Type:** Negative / Security
- **Priority:** High
- **Traceability:** `BR-5.2-C`, `NFR-01`, `ERR-CR-012`
- **Test Steps:**
  1. เข้าหน้าจอ Login
  2. กรอก Username: `somchai.p` และ Password: `wrongpassword888`
  3. คลิกปุ่ม "เข้าสู่ระบบ"
- **Expected Results:**
  1. ระบบปฏิเสธการเข้าใช้งาน HTTP 401 Unauthorized
  2. แสดงข้อความแจ้งเตือน: *"ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"*
  3. ไม่เปิดเผยข้อมูลว่าฟิลด์ใดผิดเพื่อความปลอดภัย (Generic Security Error)

---

### TC-P2026-005: Admin ค้นหาและนำเข้าผู้ใช้ใหม่จาก LDAP/AD (User Provisioning)
- **Section:** 1. ยืนยันตัวตน & RBAC
- **Test Type:** Positive / Admin / Integration
- **Priority:** Critical
- **Traceability:** `BR-5.2`, `NFR-14`, `UC-Admin-01`
- **Pre-requisite & Test Data:** ผู้ใช้ `sutthichok.t` (ROLE-05 Admin) ล็อกอินเข้าสู่ระบบ
- **Test Steps:**
  1. เข้าเมนู "Admin (ตั้งค่าระบบ)" $\rightarrow$ ไปที่แท็บ "จัดการผู้ใช้"
  2. คลิกปุ่ม "เพิ่มผู้ใช้ใหม่ (เชื่อมโยง LDAP)"
  3. ค้นหาด้วยคำว่า `chutima` หรือรหัสพนักงาน `DVS-10021`
  4. ผลการค้นหาแสดง "น.ส.ชุติมา ขจรเกียรติ" $\rightarrow$ คลิก "เลือกนำเข้า"
  5. เลือก Role: `ROLE-02 เจ้าของงานปลายทาง (Staff)` และเลือกฝ่าย: `ฝ่ายทรัพยากรบุคคล`
  6. คลิกปุ่ม "ยืนยันเพิ่มผู้ใช้"
- **Expected Results:**
  1. ระบบบันทึกผู้ใช้ลงฐานข้อมูล `SYSTEM_USER` ด้วยสถานะ `Active` และ `source = LDAP` (HTTP 201)
  2. ผู้ใช้ `chutima.k` ปรากฏในตารางผู้ใช้ทันที
  3. บันทึก Audit Log Action: `ProvisionUser` โดย `sutthichok.t`
  4. ทดสอบล็อกอินด้วย `chutima.k` สำเร็จทันที

---

### TC-P2026-006: Admin พยายามเพิ่มผู้ใช้ที่มีอยู่ในระบบแล้วซ้ำ (Duplicate Provisioning)
- **Section:** 1. ยืนยันตัวตน & RBAC
- **Test Type:** Negative / Validation
- **Priority:** Medium
- **Traceability:** `BR-5.2-D`, `ERR-CR-014`
- **Test Steps:**
  1. เปิด Modal เพิ่มผู้ใช้จาก LDAP
  2. ค้นหาและเลือก `somchai.p` ซึ่งมีอยู่ในระบบแล้ว
  3. คลิกปุ่มยืนยันเพิ่มผู้ใช้
- **Expected Results:**
  1. ระบบปฏิเสธคำขอ HTTP 409 Conflict
  2. แสดงข้อความแจ้งเตือน: *"ผู้ใช้นี้อยู่ในระบบแล้ว"*

---

### TC-P2026-007: Validation การเพิ่มผู้ใช้โดยไม่ระบุ Role หรือฝ่าย
- **Section:** 1. ยืนยันตัวตน & RBAC
- **Test Type:** Negative / Validation
- **Priority:** Medium
- **Traceability:** `VAL-14`, `ERR-CR-013`
- **Test Steps:**
  1. เลือกผู้ใช้จาก LDAP แต่ไม่เลือก Role หรือไม่เลือกฝ่าย
  2. คลิกปุ่ม "ยืนยันเพิ่มผู้ใช้"
- **Expected Results:**
  1. ระบบบล็อกการส่งข้อมูล
  2. แสดงข้อความแจ้งเตือน: *"กรุณาเลือกผู้ใช้จาก LDAP และระบุ Role/ฝ่าย (VAL-14)"*

---

### TC-P2026-008: ตรวจสอบการควบคุมสิทธิ์การมองเห็นข้อมูลตามบทบาท (RBAC Data Scope Enforcement)
- **Section:** 1. ยืนยันตัวตน & RBAC
- **Test Type:** Security / Access Control
- **Priority:** Critical
- **Traceability:** `BR-5.1`, `NFR-02`, `Permission Matrix`
- **Test Steps:**
  1. ล็อกอินด้วย `kanda.m` (ROLE-02 Staff IT) $\rightarrow$ ตรวจสอบรายการเอกสารและแดชบอร์ด
  2. ล็อกอินด้วย `wichai.t` (ROLE-03 ผอ. IT) $\rightarrow$ ตรวจสอบรายการเอกสารและแดชบอร์ด
  3. ล็อกอินด้วย `prapat.k` (ROLE-04 ผู้บริหาร) $\rightarrow$ ตรวจสอบรายการเอกสารและแดชบอร์ด
- **Expected Results:**
  1. `kanda.m` เห็นเฉพาะเอกสารที่ตนเองได้รับมอบหมาย (`Data Scope = Own`)
  2. `wichai.t` เห็นเอกสารทั้งหมดของฝ่ายสารสนเทศ (`Data Scope = Dept`)
  3. `prapat.k` เห็นเอกสารของทุกฝ่ายทั่วองค์กรในโหมด Read-only (`Data Scope = All`)
  4. Backend enforce การกรองข้อมูลที่ระดับ API Query ไม่ใช่เพียงการซ่อน UI (NFR-02)

---

## หมวดที่ 2: การลงทะเบียนเอกสารรับเข้า, แนบไฟล์ & กล้อง WebRTC (REG-IN)

### TC-P2026-009: ลงทะเบียนเอกสารรับเข้าประเภทฉบับจริง (Physical) ผ่านไปรษณีย์ สำเร็จ
- **Section:** 2. ลงทะเบียนเอกสารรับเข้า
- **Test Type:** Positive / Functional
- **Priority:** Critical
- **Traceability:** `BR-1.2`, `VAL-01`, `VAL-02`, `UC-02`
- **Actor:** `somchai.p` (ROLE-01 สารบรรณ)
- **Test Steps:**
  1. เข้าหน้าจอ "ลงทะเบียนเอกสาร" เลือกแท็บ "เอกสารรับเข้า"
  2. เลือกประเภทเอกสาร: `ฉบับจริง (Physical)`
  3. เลือกช่องทาง: `ไปรษณีย์`
  4. ระบุ หน่วยงานส่ง: `สำนักงานคณะกรรมการกำกับและส่งเสริมการประกอบธุรกิจประกันภัย (คปภ.)`
  5. ระบุ เลขที่หนังสือต้นทาง: `คปภ-1088/2569`
  6. ระบุ ชื่อเรื่อง: `ขอความอนุเคราะห์ข้อมูลสถิติการรับประกันภัย ประจำปี 2569`
  7. เลือกระดับความเร่งด่วน: `ด่วน (Urgent)`
  8. เลือกระดับชั้นความลับ: `ปกติ (Normal)`
  9. ระบุ กำหนดแล้วเสร็จ (Deadline): วันที่ปัจจุบัน + 5 วัน (เวลา 16:30 น.)
  10. เลือกผู้รับมอบหมาย: `ฝ่ายสารสนเทศ`
  11. แนบไฟล์ PDF `stat_request.pdf` ขนาด 2.4 MB
  12. คลิกปุ่ม "บันทึกและลงทะเบียนเอกสาร"
- **Expected Results:**
  1. ระบบออกเลขที่เอกสารรับเข้าอัตโนมัติ เช่น `IN-2026-0001` (HTTP 201 Created)
  2. สถานะ Main เอกสารเป็น `Pending Acceptance (รอรับงาน)`
  3. สร้าง Sub-task รายฝ่าย 1 รายการ มอบหมายให้ `ฝ่ายสารสนเทศ`
  4. ฝ่ายต้นทาง (`originDepartment`) บันทึกเป็น `งานสารบรรณ` และฝ่ายที่รับผิดชอบเป็น `ฝ่ายสารสนเทศ`
  5. ผู้ถือครองเอกสารตัวจริงเริ่มต้น (`current_holder`) ถูกบันทึกเป็น `somchai.p (งานสารบรรณ)`
  6. บันทึก Chain of Custody รายการแรก "รับเอกสารเข้าสู่ระบบสารบรรณ"
  7. ส่ง Notification (NT-01) ไปยังหัวหน้าฝ่ายสารสนเทศ (`wichai.t`)

---

### TC-P2026-010: ลงทะเบียนเอกสารรับเข้าประเภทอีเมล (Electronic) มอบหมายรายบุคคล
- **Section:** 2. ลงทะเบียนเอกสารรับเข้า
- **Test Type:** Positive / Functional
- **Priority:** High
- **Traceability:** `BR-1.2`, `BR-2.4`, `UC-02`
- **Test Steps:**
  1. เข้าหน้าลงทะเบียนเอกสารรับเข้า
  2. เลือกประเภท: `อีเมล (Email)` (ช่องทางการรับจะถูกซ่อนหรือ Disable อัตโนมัติ)
  3. ระบุ หน่วยงานส่ง: `external_auditor@pwc.com`
  4. ระบุ เรื่อง: `รายงานผลการตรวจสอบระบบบัญชีและการเงิน ประจำปี 2569`
  5. เลือกผู้รับมอบหมาย: รายบุคคล $\rightarrow$ `siriporn.w` (เจ้าหน้าที่การเงิน)
  6. กำหนด Deadline: วันที่ปัจจุบัน + 3 วัน
  7. คลิกบันทึกและลงทะเบียน
- **Expected Results:**
  1. สร้างเอกสารสำเร็จ สถานะ `Pending Acceptance`
  2. เอกสารประเภทอีเมลไม่มีการผูก Chain of Custody การถือครองเอกสารกายภาพ
  3. ระบบส่ง Noti (NT-01) ทาง Email + In-app + ปรากฏใน Task Inbox ของ `siriporn.w`

---

### TC-P2026-011: การถ่ายภาพเอกสารผ่านกล้องของอุปกรณ์ (Camera Capture) พร้อมฟังก์ชันกลับภาพและหมุนภาพ
- **Section:** 2. ลงทะเบียนเอกสารรับเข้า
- **Test Type:** UI / Functional / Feature
- **Priority:** High
- **Traceability:** `BR-1.2-A`, `NFR-15`, `Appendix D`
- **Test Steps:**
  1. ในหน้าลงทะเบียนเอกสาร คลิกปุ่ม "ถ่ายภาพด้วยกล้องของอุปกรณ์"
  2. เบราว์เซอร์ขอสิทธิ์เข้าถึงกล้อง $\rightarrow$ กด "อนุญาต (Allow)"
  3. ตรวจสอบการแสดงผลสตรีมภาพสด พร้อมเส้นกรอบเล็ง Viewfinder สีทอง `#FFCD00`
  4. คลิกปุ่ม "กลับภาพซ้าย-ขวา (Horizontal Flip/Mirror)" $\rightarrow$ ตรวจสอบว่าภาพและตัวอักษรกลับด้าน
  5. คลิกปุ่มชัตเตอร์ $\rightarrow$ มี Flash Animation สีขาว และแสดงภาพพรีวิว
  6. คลิกปุ่ม "หมุน 90° (Rotate)" $\rightarrow$ ภาพหมุนตามเข็มนาฬิกา 90 องศา
  7. คลิกปุ่ม "ใช้ภาพนี้ (Confirm Photo)"
- **Expected Results:**
  1. ภาพถ่ายถูกบันทึกเป็นไฟล์ JPEG แนบในรายการไฟล์แนบอัตโนมัติ (เช่น `camera-20260902-1700.jpg`)
  2. แสดง Badge แหล่งที่มา "ถ่ายจากกล้อง"
  3. สามารถคลิก Thumbnail เพื่อเปิด Lightbox พรีวิวภาพความละเอียดสูงได้

---

### TC-P2026-012: การจัดการไฟล์แนบในหน้าจอรายละเอียดเอกสาร (Direct Upload, Drag & Drop, Delete)
- **Section:** 2. ลงทะเบียนเอกสารรับเข้า
- **Test Type:** Functional / UI
- **Priority:** High
- **Traceability:** `BR-1.2-B`, `VAL-03`
- **Test Steps:**
  1. เปิดหน้ารายละเอียดเอกสาร (`/documents/IN-2026-0001`)
  2. คลิกปุ่ม "แนบไฟล์เพิ่ม" $\rightarrow$ เลือกไฟล์ `appendix_table.xlsx` (1.2 MB) จากเครื่อง
  3. ลากไฟล์รูปภาพ `evidence.png` มาวางในพื้นที่ Drag-and-Drop Dropzone
  4. ตรวจสอบรายการไฟล์ในการ์ด "ไฟล์แนบและภาพถ่าย"
  5. คลิกปุ่มดาวน์โหลดที่ไฟล์ `appendix_table.xlsx`
  6. คลิกปุ่มลบ (Trash) ที่ไฟล์ `evidence.png` ที่แนบเพิ่มเข้ามา
  7. ตรวจสอบไฟล์แนบหลักที่มาตอน Register ว่ามีปุ่มลบหรือไม่
- **Expected Results:**
  1. ไฟล์ที่อัปโหลดและลากวางถูกแนบเข้าระบบสำเร็จ แสดง Badge "ไฟล์แนบเพิ่ม"
  2. ดาวน์โหลดไฟล์สำเร็จ ไฟล์สมบูรณ์ไม่เสียหาย
  3. ลบไฟล์แนบที่เพิ่มใหม่สำเร็จ รายการหายไปจากการ์ด
  4. ไฟล์แนบหลักตอน Register ไม่มีปุ่มลบ (ไม่สามารถลบไฟล์ตั้งต้นได้ตาม BR-1.2-B)

---

### TC-P2026-013: Validation การลงทะเบียนเมื่อไม่เลือกประเภทเอกสาร หรือไม่ระบุหัวข้อ
- **Section:** 2. ลงทะเบียนเอกสารรับเข้า
- **Test Type:** Negative / Validation
- **Priority:** High
- **Traceability:** `VAL-01`, `VAL-05`, `ERR-CR-001`, `ERR-CR-002`
- **Test Steps:**
  1. เข้าหน้าลงทะเบียนเอกสารรับเข้า
  2. ไม่เลือกประเภทเอกสาร หรือไม่กรอกชื่อเรื่องเอกสาร หรือไม่เลือกผู้รับมอบหมาย
  3. คลิกปุ่ม "บันทึกและลงทะเบียนเอกสาร"
- **Expected Results:**
  1. ระบบบล็อกการส่งข้อมูล แสดงข้อความเตือนสีแดง:
     - *"กรุณาเลือกประเภทเอกสาร (VAL-01)"*
     - *"กรุณากรอกหัวข้อเอกสาร"*
     - *"กรุณาเลือกผู้รับอย่างน้อย 1 ราย (VAL-05)"*

---

### TC-P2026-014: Validation ฉบับจริงแต่ไม่ระบุช่องทางการรับ
- **Section:** 2. ลงทะเบียนเอกสารรับเข้า
- **Test Type:** Negative / Validation
- **Priority:** Medium
- **Traceability:** `VAL-02`
- **Test Steps:**
  1. เลือกประเภท "ฉบับจริง" แต่ไม่ติ๊กเลือกว่าเป็น ไปรษณีย์ หรือ Messenger
  2. คลิกปุ่มบันทึก
- **Expected Results:**
  1. ระบบแจ้งเตือน: *"กรุณาเลือกช่องทางการรับเอกสาร (VAL-02)"*

---

### TC-P2026-015: Validation ไฟล์แนบผิดประเภท หรือขนาดเกิน 25 MB
- **Section:** 2. ลงทะเบียนเอกสารรับเข้า
- **Test Type:** Negative / Validation / Security
- **Priority:** Medium
- **Traceability:** `VAL-03`, `NFR-04`, `ERR-CR-009`
- **Test Steps:**
  1. พยายามแนบไฟล์นามสกุล `.exe` หรือ `.bat`
  2. พยายามแนบไฟล์ขนาด 30 MB
- **Expected Results:**
  1. ระบบปฏิเสธไฟล์และแจ้งเตือน: *"ไฟล์แนบไม่ถูกต้องหรือเกินขนาดที่กำหนด (รองรับ PDF, DOCX, XLSX, JPG, PNG, WEBP, ZIP ขนาด ≤ 25 MB) (VAL-03)"*

---

### TC-P2026-016: Validation กำหนดแล้วเสร็จ (Deadline) เป็นวันในอดีต
- **Section:** 2. ลงทะเบียนเอกสารรับเข้า
- **Test Type:** Negative / Boundary
- **Priority:** Medium
- **Traceability:** `VAL-10`, `ERR-CR-008`
- **Test Steps:**
  1. ระบุวัน Deadline เป็นวันที่ในอดีต (เช่น เมื่อวานนี้)
  2. คลิกปุ่มบันทึก
- **Expected Results:**
  1. ระบบปฏิเสธการบันทึกและแจ้งเตือน: *"กำหนดแล้วเสร็จต้องไม่เป็นวันในอดีต (VAL-10)"*

---

### TC-P2026-017: การลงทะเบียนแบบกระจายงานหลายฝ่ายและหลายบุคคลพร้อมกัน (Multiple Select)
- **Section:** 2. ลงทะเบียนเอกสารรับเข้า
- **Test Type:** Positive / Complex Workflow
- **Priority:** Critical
- **Traceability:** `BR-2.4`, `BR-3.1`, `UC-02`
- **Test Steps:**
  1. ลงทะเบียนเอกสารรับเข้า เรื่อง "คำสั่งนโยบายความมั่นคงปลอดภัยสารสนเทศ ประจำปี 2569"
  2. กำหนด Deadline: วันที่ปัจจุบัน + 7 วัน
  3. ในส่วนผู้รับมอบหมาย ติ๊กเลือก:
     - `ฝ่ายสารสนเทศ` (Assign รายฝ่าย)
     - `ฝ่ายกฎหมาย` (Assign รายฝ่าย)
     - `siriporn.w` (Assign รายบุคคล - ฝ่ายการเงิน)
  4. คลิกบันทึกและลงทะเบียน
- **Expected Results:**
  1. ระบบสร้าง 3 Sub-tasks ภายใต้เลขที่เอกสารเดียวกัน (Key Reference เดียวกัน)
  2. ทุก Sub-task สืบทอด Deadline เดียวกันกับ Main Document เสมอ (BR-3.1)
  3. ทั้ง 3 งานมีสถานะเริ่มต้นเป็น `Pending Acceptance`
  4. หัวหน้าฝ่าย IT (`wichai.t`), หัวหน้าฝ่ายกฎหมาย (`veera.c`) และ `siriporn.w` ได้รับ Notification พร้อมกัน

---

### TC-P2026-018: การจัดการกรณีสิทธิ์การเข้าถึงกล้องถูกปฏิเสธ (Camera Permission Fallback)
- **Section:** 2. ลงทะเบียนเอกสารรับเข้า
- **Test Type:** Negative / Fallback
- **Priority:** Low
- **Traceability:** `VAL-15`, `NFR-15`, `ERR-CR-015`
- **Test Steps:**
  1. เมื่อเบราว์เซอร์ถาม Permission การใช้กล้อง $\rightarrow$ กด "ไม่อนุญาต (Block/Deny)"
- **Expected Results:**
  1. ระบบแสดงคำแนะนำตาม VAL-15: *"ไม่สามารถเข้าถึงกล้องถ่ายภาพได้ กรุณาอนุญาตสิทธิ์การใช้กล้องหรือใช้วิธีเลือกไฟล์"*
  2. ผู้ใช้สามารถเลือกใช้วิธี Native File Dialog แทนได้อย่างราบรื่น

---

## หมวดที่ 3: การลงทะเบียนเอกสารส่งออก & การขอเลข EDR 2 ภาษา (REG-OUT)

### TC-P2026-019: ขอสร้างเลขที่เอกสารส่งออกรูปแบบปกติผ่าน EDR API (Flow A - Seamless EDR Integration)
- **Section:** 3. ลงทะเบียนเอกสารส่งออก
- **Test Type:** Positive / Integration / API
- **Priority:** Critical
- **Traceability:** `BR-1.3-A`, `BR-1.3-D`, `Appendix E.1/E.2`
- **Actor:** `wichai.c` (ROLE-03/06 ผอ. การเงิน)
- **Test Steps:**
  1. เข้าหน้าลงทะเบียน เลือกแท็บ "เอกสารส่งออก"
  2. คลิกปุ่ม "ขอเลขที่ส่งออกจากระบบ EDR"
  3. ใน Modal (UI 2 คอลัมน์):
     - เลือกประเภทหน่วยงาน: `หน่วยงานทั่วไป (General)`
     - เลือกหน่วยงาน: `กรมสรรพากร`
     - กรอกชื่อเรื่อง: `หนังสือนำส่งภาษีหัก ณ ที่จ่าย ประจำเดือนสิงหาคม 2569`
     - เพิ่มผู้รับเอกสาร: `นายประวิทย์ นิติกร` (บังคับ $\ge 1$)
     - เพิ่มผู้ลงนาม: `นายวิชัย เจริญผล` (บังคับ $\ge 1$)
  4. คลิกปุ่ม "ส่งคำขอออกเลข"
- **Expected Results:**
  1. ระบบยิง API `POST /api/v1/document-requests` ไปยัง EDR Engine
  2. EDR ตอบกลับ 200 OK ออกเลขคู่ขนาน 2 ภาษาทันที:
     - เลขที่ภาษาไทย: `ท001กง/2569`
     - เลขที่ภาษาอังกฤษ: `G001FN/2026`
  3. Modal ปิดลง ฟิลด์เลขที่เอกสารในหน้าลงทะเบียนถูกเติมและล็อกค่าอัตโนมัติ
  4. สถานะเอกสารเปลี่ยนเป็น `Ready to Send / Registered` และพร้อมให้แนบไฟล์นำส่ง

---

### TC-P2026-020: ขอสร้างเลขที่เอกสารส่งออกรูปแบบพิเศษ (Flow B - รออนุมัติเลข)
- **Section:** 3. ลงทะเบียนเอกสารส่งออก
- **Test Type:** Positive / Integration
- **Priority:** High
- **Traceability:** `BR-1.3-A`, `Appendix E.2 (Flow B)`
- **Test Steps:**
  1. เปิด Modal ขอเลข EDR
  2. เลือกแท็บ: `ขอเลขพิเศษ (Special Number)`
  3. เลือกหน่วยงานพิเศษ: `สำนักงาน คปภ.`
  4. กรอกชื่อเรื่อง, ผู้รับ, ผู้ลงนาม และคลิกส่งคำขอ
- **Expected Results:**
  1. EDR Engine ส่ง Response สถานะ `Pending`
  2. ในระบบสารบรรณแสดงสถานะ `Pending (รออนุมัติเลข)`
  3. EDR ส่งอีเมลแจ้งเตือนไปยังผู้อนุมัติเลขพิเศษ
  4. ยังไม่สามารถบันทึกนำส่งได้จนกว่าจะได้รับการอนุมัติเลขจาก EDR

---

### TC-P2026-021: กฎบังคับแนบไฟล์หลักฐานก่อนนำส่งเอกสารส่งออก (Mandatory Attachment Rule BR-4.1)
- **Section:** 3. ลงทะเบียนเอกสารส่งออก
- **Test Type:** Business Rule / Negative
- **Priority:** Critical
- **Traceability:** `BR-4.1`, `VAL-04`, `ERR-CR-007`
- **Test Steps:**
  1. กรอกข้อมูลเอกสารส่งออกครบทุกช่อง ได้เลข EDR เรียบร้อย
  2. ไม่แนบไฟล์เอกสารหรือภาพถ่ายใดๆ
  3. คลิกปุ่ม "บันทึกและลงทะเบียนเอกสาร" หรือพยายามกดเปลี่ยนสถานะเป็น Sent
- **Expected Results:**
  1. ระบบไม่อนุญาตให้ดำเนินการ HTTP 400 Bad Request
  2. แสดงข้อความแจ้งเตือน Error: *"ต้องแนบไฟล์หลักฐานหรือภาพถ่ายเอกสารก่อนนำส่ง (VAL-04 / BR-4.1)"*

---

### TC-P2026-022: ลงทะเบียนเอกสารส่งออกสำเร็จพร้อมแนบไฟล์และเลือก Delivery Method
- **Section:** 3. ลงทะเบียนเอกสารส่งออก
- **Test Type:** Positive / Functional
- **Priority:** Critical
- **Traceability:** `BR-4.1`, `BR-1.5`, `Draft 1.8.5`
- **Test Steps:**
  1. กรอกข้อมูลเอกสารส่งออกครบถ้วน
  2. เลือก รูปแบบการส่ง (Delivery Method): `ไปรษณีย์ด่วนพิเศษ (EMS)` (เลือกจาก Master Data)
  3. แนบไฟล์ PDF `tax_submission_doc.pdf` (1.8 MB)
  4. คลิกปุ่ม "บันทึกและลงทะเบียนเอกสาร"
- **Expected Results:**
  1. บันทึกเอกสารส่งออกสำเร็จ สถานะเป็น `Ready to Send (รอนำส่ง)`
  2. ฝ่ายต้นทางและฝ่ายที่รับผิดชอบถูกกำหนดเป็น `ฝ่ายการเงิน` ในตัว (ไม่มีขั้นตอน Assign ภายในตาม Draft 1.8.5)
  3. เอกสารแสดงในรายการ "เอกสารส่งออก"

---

### TC-P2026-023: ลิงก์เชื่อมโยงระบบภายนอกสำหรับนัดหมายให้ไปรษณีย์มารับเอกสาร (Postal Pickup Service)
- **Section:** 3. ลงทะเบียนเอกสารส่งออก
- **Test Type:** UI / Functional
- **Priority:** Low
- **Traceability:** `Draft 1.8.5`
- **Test Steps:**
  1. ในหน้าลงทะเบียนเอกสารส่งออก เลือกรูปแบบการส่ง: `ให้ ปณ. มารับเอกสารที่บริษัท`
- **Expected Results:**
  1. ปรากฏปุ่มลิงก์ภายนอก "เข้าสู่ระบบนัดหมายไปรษณีย์ไทย (Thailand Post Pickup Service)"
  2. เมื่อคลิกปุ่ม ระบบเปิดหน้าต่างใหม่ (`target="_blank"`) ไปยัง URL ของไปรษณีย์ไทย

---

### TC-P2026-024: การรับข้อมูล Reverse Sync ผ่าน Webhook จากระบบ EDR เดิม (Inbound Sync)
- **Section:** 3. ลงทะเบียนเอกสารส่งออก
- **Test Type:** Integration / API
- **Priority:** Critical
- **Traceability:** `BR-1.3-B`, `Appendix E.3`
- **Test Steps:**
  1. จำลองการยิง Webhook จาก EDR Engine: `POST /api/v1/integration/edr/sync-document` พร้อม Payload ข้อมูลเอกสารที่ออกเลขสำเร็จจากเว็บ EDR เดิม
- **Expected Results:**
  1. ระบบสารบรรณสร้าง Record เอกสารส่งออกให้อัตโนมัติ (HTTP 200 OK)
  2. สถานะเริ่มต้นเป็น `Registered` และส่ง Notification แจ้งผู้ขอให้เข้าแนบไฟล์หลักฐาน

---

### TC-P2026-025: การทดสอบความเท่าเทียมของข้อมูลและการป้องกันข้อมูลซ้ำ (Data Parity & Idempotent Upsert)
- **Section:** 3. ลงทะเบียนเอกสารส่งออก
- **Test Type:** Integration / Resilience
- **Priority:** Critical
- **Traceability:** `BR-1.3-C`, `NFR-16`
- **Test Steps:**
  1. ยิง Webhook ซ้ำด้วย `edr_request_id = 561601` เดิมเป็นครั้งที่ 2 และ 3
- **Expected Results:**
  1. ระบบทำการ Upsert อัปเดตข้อมูลเดิม ไม่สร้าง Record ซ้ำซ้อน
  2. ฐานข้อมูลมีเอกสารเพียงฉบับเดียว (Data Parity 100%)

---

### TC-P2026-026: การค้นหาเอกสารส่งออกด้วยเลขคู่ขนาน 2 ภาษา (Dual Key Cross-Search)
- **Section:** 3. ลงทะเบียนเอกสารส่งออก
- **Test Type:** Functional / Search
- **Priority:** High
- **Traceability:** `BR-1.3-D`
- **Test Steps:**
  1. ค้นหาเอกสารด้วยเลขภาษาไทย: `ท001กง/2569`
  2. ค้นหาเอกสารด้วยเลขภาษาอังกฤษ: `G001FN/2026`
- **Expected Results:**
  1. ทั้ง 2 คำค้นหาแสดงผลลัพธ์เป็นเอกสารฉบับเดียวกันอย่างถูกต้อง

---

### TC-P2026-027: Validation การขอเลข EDR โดยไม่ระบุผู้รับหรือผู้ลงนาม
- **Section:** 3. ลงทะเบียนเอกสารส่งออก
- **Test Type:** Negative / Validation
- **Priority:** High
- **Traceability:** `VAL-16`, `VAL-17`
- **Test Steps:**
  1. ใน Modal ขอเลข EDR ไม่เพิ่มรายชื่อผู้รับเอกสาร หรือไม่เพิ่มรายชื่อผู้ลงนาม
  2. คลิกปุ่มส่งคำขอ
- **Expected Results:**
  1. ระบบบล็อกคำขอและแจ้งเตือน:
     - *"กรุณาระบุผู้รับเอกสารอย่างน้อย 1 คน (VAL-16)"*
     - *"กรุณาระบุผู้ลงนามอย่างน้อย 1 คน (VAL-17)"*

---

### TC-P2026-028: ตรวจสอบ Pre-flight Context Check แจ้งเตือนฝ่ายที่ไม่มีตัวย่อ 2 ภาษา (VAL-19)
- **Section:** 3. ลงทะเบียนเอกสารส่งออก
- **Test Type:** Negative / Integration / API
- **Priority:** High
- **Traceability:** `VAL-19`, `Appendix E.1`
- **Pre-requisite:** ผู้ใช้ `somchai.ja` สังกัดฝ่ายที่ยังไม่มีตัวย่อในระบบ EDR (`is_dept_code_configured = false`)
- **Test Steps:**
  1. ล็อกอินด้วย `somchai.ja` และกดปุ่มขอเลข EDR
- **Expected Results:**
  1. Pre-flight Check API ส่งคืน `can_request_number: false`
  2. หน้าจอแสดง Alert ทันที: *"ฝ่ายของท่านยังไม่ได้รับการกำหนดรหัสตัวย่อฝ่ายในระบบออกเลขที่เอกสาร กรุณาติดต่อผู้ดูแลระบบเพื่อไปตั้งค่ารหัสตัวย่อฝ่ายที่ระบบออกเลขที่เอกสารก่อนดำเนินการ (VAL-19)"*

---

## หมวดที่ 4: เวิร์กโฟลว์, Owner-first & Onward Delegation (WF-FLOW)

### TC-P2026-029: หัวหน้าฝ่ายรับงานระดับฝ่าย (Department Owner-first Acceptance)
- **Section:** 4. เวิร์กโฟลว์ & สถานะ
- **Test Type:** Positive / Workflow
- **Priority:** Critical
- **Traceability:** `BR-2.3`, `BR-2.4-A`, `Draft 1.8.2`
- **Actor:** `wichai.t` (ผอ. IT)
- **Pre-requisite:** มีเอกสารรับเข้ามอบหมายระดับฝ่ายมายัง `ฝ่ายสารสนเทศ` สถานะ `Pending Acceptance`
- **Test Steps:**
  1. ล็อกอินด้วย `wichai.t` เข้าหน้ารายละเอียดเอกสาร
  2. ตรวจสอบปุ่ม "รับงาน (หัวหน้าฝ่าย)" ในการ์ดงานย่อย
  3. คลิกปุ่ม "รับงาน (Accept)" และกดยืนยันใน Modal
- **Expected Results:**
  1. Sub-task ของฝ่ายสารสนเทศเปลี่ยนสถานะเป็น `Accepted (in-progress)`
  2. สถานะ Main Document เปลี่ยนเป็น `In Progress (กำลังดำเนินการ)`
  3. ปรากฏปุ่ม "มอบหมายต่อ (Delegate)", "ส่งต่อ (Forward)", "ดำเนินการเสร็จสิ้น (Complete)"
  4. บันทึก Audit Log Action: `Accept` และส่ง Notification (NT-02) แจ้งต้นทาง

---

### TC-P2026-030: หัวหน้าฝ่ายมอบหมายงานต่อให้ลูกทีม (Onward Delegation SubTree)
- **Section:** 4. เวิร์กโฟลว์ & สถานะ
- **Test Type:** Positive / Workflow / Tree Structure
- **Priority:** Critical
- **Traceability:** `BR-2.4-A`, `Draft 1.8.7`, `UC-04`
- **Actor:** `wichai.t` (ผอ. IT)
- **Test Steps:**
  1. ที่หน้ารายละเอียดเอกสารสถานะ `In Progress` คลิกปุ่ม "มอบหมายต่อ (Delegate)"
  2. ใน Modal เลือกผู้รับมอบหมาย: `kanda.m` (เจ้าหน้าที่ IT ในฝ่ายเดียวกัน)
  3. กรอกคำสั่งการ: `ขอให้ตรวจสอบความถูกต้องของข้อมูลตามข้อกำหนดและสรุปผล`
  4. คลิกปุ่ม "ยืนยันมอบหมายต่อ"
- **Expected Results:**
  1. สร้าง Sub-task รายบุคคลใหม่ผูกโยงเป็นลูกของ Sub-task เดิม (`parent_ref = id ของ wichai.t`)
  2. การแสดงผลใน Story Line / แท็บงานย่อยแสดงเป็น **โครงสร้างต้นไม้ซ้อนชั้น (Nested SubTree)**
  3. งานปรากฏใน Inbox ของ `kanda.m` เพื่อรอรับงาน
  4. กรณีเอกสารฉบับจริง ผู้ถือครองตัวจริงถูกส่งมอบให้ `kanda.m`

---

### TC-P2026-031: ผู้รับมอบหมายดำเนินการเสร็จสิ้นและปิดงาน (Complete Task)
- **Section:** 4. เวิร์กโฟลว์ & สถานะ
- **Test Type:** Positive / Workflow
- **Priority:** Critical
- **Traceability:** `BR-2.5`, `UC-05`
- **Actor:** `kanda.m` (Staff IT)
- **Test Steps:**
  1. ล็อกอินด้วย `kanda.m` เปิดเอกสารที่รับงานแล้ว
  2. แนบไฟล์ผลงานเรียบร้อย
  3. คลิกปุ่ม "ดำเนินการเสร็จสิ้น (Complete)" และกดยืนยัน
- **Expected Results:**
  1. Sub-task ของ `kanda.m` เปลี่ยนสถานะเป็น `Success`
  2. Progress ของเอกสารปรับเป็น `100%`
  3. กรณีเอกสารอีเมล สถานะ Main Document เปลี่ยนเป็น `Completed (เสร็จสิ้น)`
  4. ส่ง Notification (NT-09) แจ้งต้นทางและผู้เกี่ยวข้อง

---

### TC-P2026-032: การปฏิเสธ/ส่งคืนเอกสารพร้อมระบุเหตุผล (Reject & Return Flow)
- **Section:** 4. เวิร์กโฟลว์ & สถานะ
- **Test Type:** Positive / Exception Workflow
- **Priority:** Critical
- **Traceability:** `BR-2.2`, `VAL-06`, `UC-06`
- **Actor:** `wichai.t` (ผอ. IT)
- **Test Steps:**
  1. เปิดเอกสารที่ได้รับมอบหมายผิดฝ่าย
  2. คลิกปุ่ม "ปฏิเสธ/ส่งคืน (Reject)"
  3. ระบุเหตุผล: `เอกสารนี้เป็นเรื่องการเบิกจ่ายงบประมาณ ขอส่งคืนให้ฝ่ายการเงินพิจารณา`
  4. คลิกปุ่ม "ยืนยันส่งคืน"
- **Expected Results:**
  1. Sub-task เปลี่ยนสถานะเป็น `Rejected`
  2. ส่ง Notification (NT-03) พร้อมเหตุผลไปยังผู้ลงทะเบียนต้นทาง (`somchai.p`)
  3. บันทึก Audit Log Action: `Reject` พร้อมบันทึกเหตุผลในฟิลด์ Note

---

### TC-P2026-033: Validation การปฏิเสธโดยไม่ระบุหมายเหตุ/เหตุผล
- **Section:** 4. เวิร์กโฟลว์ & สถานะ
- **Test Type:** Negative / Validation
- **Priority:** High
- **Traceability:** `BR-2.2-E`, `VAL-06`, `ERR-CR-004`
- **Test Steps:**
  1. เปิด Modal ปฏิเสธเอกสาร
  2. ไม่กรอกข้อความในช่องเหตุผล $\rightarrow$ ตรวจสอบสถานะปุ่มยืนยัน
  3. พยายามกดยืนยันส่งคืน
- **Expected Results:**
  1. ปุ่มยืนยันถูก Disabled หรือระบบบล็อกพร้อมแจ้งเตือน: *"กรุณาระบุหมายเหตุการปฏิเสธ (VAL-06)"*

---

### TC-P2026-034: การส่งต่อเอกสารข้ามฝ่าย (Forward Across Department)
- **Section:** 4. เวิร์กโฟลว์ & สถานะ
- **Test Type:** Positive / Workflow
- **Priority:** Critical
- **Traceability:** `BR-6.1`, `BR-2.3`, `UC-07`
- **Actor:** `kanda.m` (IT) $\rightarrow$ ส่งต่อให้ `ฝ่ายวิศวกรรม`
- **Pre-requisite:** `kanda.m` กดยอมรับงาน (Accept) เรียบร้อยแล้ว
- **Test Steps:**
  1. คลิกปุ่ม "ส่งต่อ (Forward)"
  2. เลือกฝ่ายปลายทาง: `ฝ่ายวิศวกรรม`
  3. ระบุคำสั่งการ: `ขอให้ฝ่ายวิศวกรรมช่วยตรวจสอบโครงสร้างสายสัญญาณ`
  4. คลิกปุ่มยืนยันส่งต่อ
- **Expected Results:**
  1. Sub-task เดิมของ IT เปลี่ยนสถานะเป็น `Forwarded`
  2. สร้าง Sub-task ใหม่ของฝ่ายวิศวกรรม สถานะ `Pending Acceptance`
  3. การส่งต่อ **ไม่เพิ่มตัวหารในการคำนวณ Progress** (สืบทอดงานเดิมตาม BR-6.1)
  4. ส่ง Notification (NT-04) ไปยัง `prasit.m` (ผอ. วิศวกรรม)

---

### TC-P2026-035: Validation การส่งต่อหรือปิดงานก่อนกดยอมรับเอกสาร (Forward/Complete before Accept)
- **Section:** 4. เวิร์กโฟลว์ & สถานะ
- **Test Type:** Negative / Business Rule
- **Priority:** High
- **Traceability:** `BR-2.3`, `VAL-07`, `ERR-CR-003`
- **Test Steps:**
  1. ในเอกสารที่สถานะเป็น `Pending Acceptance` พยายามยิง API หรือกดปุ่ม Forward/Complete
- **Expected Results:**
  1. ระบบบล็อกการทำงาน HTTP 400 Bad Request
  2. แสดงข้อความแจ้งเตือน: *"ต้องกดยอมรับการรับเอกสารก่อนดำเนินการต่อ (VAL-07 / BR-2.3)"*

---

### TC-P2026-036: ต้นทางดึงงานกลับ (Recall Flow)
- **Section:** 4. เวิร์กโฟลว์ & สถานะ
- **Test Type:** Positive / Workflow
- **Priority:** High
- **Traceability:** `BR-2.1`, `UC-08`
- **Actor:** `somchai.p` (ผู้ลงทะเบียนต้นทาง)
- **Pre-requisite:** เอกสารยังอยู่ในสถานะ `Pending Acceptance` (ปลายทางยังไม่ Accept)
- **Test Steps:**
  1. เปิดเอกสารที่เพิ่งส่งไปผิดคน
  2. คลิกปุ่ม "ดึงงานกลับ (Recall)" และกดยืนยัน
- **Expected Results:**
  1. Sub-task เปลี่ยนสถานะเป็น `Recalled`
  2. งานถูกดึงกลับมาที่สารบรรณ เอกสารหายไปจาก Inbox ปลายทาง
  3. ส่ง Notification (NT-05) แจ้งผู้ที่ถูกดึงงานกลับ และบันทึก Audit Log

---

### TC-P2026-037: Validation การพยายามดึงงานกลับที่ปิดงาน Success ไปแล้ว
- **Section:** 4. เวิร์กโฟลว์ & สถานะ
- **Test Type:** Negative / Business Rule
- **Priority:** Medium
- **Traceability:** `BR-2.1-E`, `VAL-08`, `ERR-CR-006`
- **Test Steps:**
  1. พยายามกดยกเลิกหรือดึงงานกลับในรายการ Sub-task ที่ปิดสถานะ `Success` ไปแล้ว
- **Expected Results:**
  1. ระบบบล็อกการทำงาน HTTP 400 Bad Request
  2. แจ้งเตือน: *"ไม่สามารถดำเนินการกับงานที่ปิดแล้ว (VAL-08 / BR-2.1-E)"*

---

### TC-P2026-038: การยกเลิกเอกสาร (Cancel Document)
- **Section:** 4. เวิร์กโฟลว์ & สถานะ
- **Test Type:** Positive / Workflow
- **Priority:** High
- **Traceability:** `BR-2.5`, `BR-2.1`
- **Test Steps:**
  1. คลิกปุ่ม "ยกเลิกเอกสาร (Cancel)" และระบุเหตุผลการยกเลิก
- **Expected Results:**
  1. สถานะ Main Document เปลี่ยนเป็น `Cancelled`
  2. เอกสารถูกตัดออก ไม่นำมานับเป็นงานค้าง Overdue และไม่นำมาคิด Progress

---

## หมวดที่ 5: การคำนวณ Progress & Chain of Custody เอกสารจริง (WF-CUSTODY)

### TC-P2026-039: การคำนวณ Progress % กรณีมีหลายงานย่อย (Equal Weight Calculation)
- **Section:** 5. Progress & Custody
- **Test Type:** Business Logic / Calculation
- **Priority:** Critical
- **Traceability:** `BR-2.5`
- **Test Scenario:** เอกสารมี 4 Sub-tasks:
  - Sub 1 (IT): `Success`
  - Sub 2 (การเงิน): `Success`
  - Sub 3 (กฎหมาย): `In Progress`
  - Sub 4 (HR): `Pending`
- **Test Steps:**
  1. ตรวจสอบการแสดงผล Progress Bar และ Progress Ring บนหน้าจอ
- **Expected Results:**
  1. $\text{Progress} = (2 / 4) \times 100 = 50\%$
  2. สถานะ Main Document ยังคงเป็น `In Progress`

---

### TC-P2026-040: การคำนวณ Progress % โดยตัด Sub-task ที่ถูก Cancelled ออกจากตัวหาร
- **Section:** 5. Progress & Custody
- **Test Type:** Property-Based / Calculation Rule
- **Priority:** Critical
- **Traceability:** `BR-2.5`
- **Test Scenario:** เอกสารเดิมมี 4 Sub-tasks ต่อมา Sub 4 ถูกยกเลิก (`Cancelled`), Sub 1-3 ปิด `Success` ทั้งหมด
- **Test Steps:**
  1. ดำเนินการยกเลิก Sub 4
  2. ตรวจสอบการคำนวณ Progress
- **Expected Results:**
  1. จำนวนงานที่นับได้ (Countable) = $4 - 1 = 3$ งาน
  2. $\text{Progress} = (3 / 3) \times 100 = 100\%$
  3. Main Document เปลี่ยนสถานะเป็น `Completed`

---

### TC-P2026-041: การคำนวณ Progress กรณีมอบหมายงาน 1 ต่อ 1 (Single Assignee)
- **Section:** 5. Progress & Custody
- **Test Type:** Boundary / Calculation
- **Priority:** High
- **Traceability:** `BR-2.5`
- **Test Steps:**
  1. เอกสารมอบหมาย 1 คน $\rightarrow$ ผู้รับปิดงาน Success
- **Expected Results:**
  1. Progress เปลี่ยนจาก $0\% \rightarrow 100\%$ ทันที และ Main Document เป็น `Completed`

---

### TC-P2026-042: วงจรการส่งคืนเอกสารฉบับจริงเมื่อทุกงานย่อยถูกปฏิเสธ (Awaiting Physical Return)
- **Section:** 5. Progress & Custody
- **Test Type:** Complex Business Rule
- **Priority:** Critical
- **Traceability:** `BR-2.2-A`, `VAL-09`, `ERR-CR-005`
- **Test Steps:**
  1. เอกสารประเภท "ฉบับจริง" ทุก Sub-tasks ถูกกดปฏิเสธ (Rejected)
  2. ตรวจสอบสถานะ Main Document
  3. สารบรรณพยายามกด Assign ใหม่ทันทีโดยยังไม่ยืนยันรับคืน
  4. สารบรรณคลิกปุ่ม "ยืนยันรับเอกสารคืน" ในแถบ Banner สีเหลือง
- **Expected Results:**
  1. สถานะ Main Document เปลี่ยนเป็น `Awaiting Physical Return (รอรับเอกสารฉบับจริงคืน)`
  2. ขั้นตอนที่ 3 ถูกบล็อกแจ้งเตือน: *"ต้องยืนยันรับเอกสารฉบับจริงคืนก่อน Assign ใหม่ (VAL-09)"*
  3. ขั้นตอนที่ 4 สำเร็จ สถานะเปลี่ยนกลับเป็น `Registered` และอนุญาตให้มอบหมายงานใหม่ได้

---

### TC-P2026-043: กรณีเอกสารอีเมลถูกปฏิเสธทั้งหมด เปลี่ยนเป็น Registered ทันที
- **Section:** 5. Progress & Custody
- **Test Type:** Business Rule
- **Priority:** High
- **Traceability:** `BR-2.2-B`
- **Test Steps:**
  1. เอกสารประเภท "อีเมล" ทุก Sub-tasks ถูกปฏิเสธ
- **Expected Results:**
  1. สถานะ Main Document เปลี่ยนเป็น `Registered` ทันทีโดยไม่ต้องผ่านขั้นตอน Awaiting Physical Return

---

### TC-P2026-044: การติดตามการถือครองเอกสารฉบับจริงแบบ Stateful (Chain of Custody Tracking)
- **Section:** 5. Progress & Custody
- **Test Type:** Functional / Data Integrity
- **Priority:** High
- **Traceability:** `BR-6.1`, `Draft 1.8.7`
- **Test Steps:**
  1. สารบรรณ (`somchai.p`) Register $\rightarrow$ ผู้ถือครอง: `somchai.p`
  2. มอบหมาย IT $\rightarrow$ `wichai.t` กดยอมรับงาน $\rightarrow$ ผู้ถือครอง: `wichai.t`
  3. `wichai.t` มอบหมายต่อ $\rightarrow$ `kanda.m` กดยอมรับงาน $\rightarrow$ ผู้ถือครอง: `kanda.m`
  4. ตรวจสอบแท็บ "การถือครอง (Chain of Custody)"
- **Expected Results:**
  1. ผู้ถือครองปัจจุบัน (`current_holder`) แสดงเป็น `kanda.m`
  2. ตารางแสดงประวัติการเปลี่ยนมือครบถ้วนทั้ง 3 ลำดับพร้อมวัน-เวลาประทับ

---

### TC-P2026-045: วงจรปิดงานเอกสารฉบับจริงและการส่งคืนสารบรรณสมบูรณ์
- **Section:** 5. Progress & Custody
- **Test Type:** Workflow / Custody
- **Priority:** High
- **Traceability:** `BR-6.1`
- **Test Steps:**
  1. เจ้าหน้าที่ทำงานเสร็จ กด Complete ในเอกสารฉบับจริง
  2. สารบรรณได้รับเล่มเอกสารคืนและกดยืนยันรับคืน
- **Expected Results:**
  1. สถานะเปลี่ยนเป็น `Completed`
  2. ผู้ถือครองตัวจริงกลับมาเป็น `somchai.p (งานสารบรรณ)`

---

### TC-P2026-046: Story Line แสดงระยะเวลาค้างในแต่ละ Stage และชี้เป้าจุดคอขวด (Bottleneck)
- **Section:** 5. Progress & Custody
- **Test Type:** UI / Reporting
- **Priority:** Medium
- **Traceability:** `Section 17 Scenario 35`
- **Test Steps:**
  1. เปิดดูแท็บ "เส้นทางเอกสาร (Story Line)" ของเอกสารที่ผ่านหลายขั้นตอน
- **Expected Results:**
  1. แสดงระยะเวลา (Duration) ในแต่ละ Node เช่น `ค้างที่ฝ่าย IT 3 วัน 4 ชม.`
  2. ไฮไลต์ Stage ที่ใช้เวลานานที่สุดเป็นจุดคอขวด

---

## หมวดที่ 6: เอกสารลับมาก, ระบบ OTP ทางอีเมล & Watermark (SEC-OTP)

### TC-P2026-047: การจำกัดการมองเห็นไฟล์แนบสำหรับเอกสาร "ลับมาก" (Restricted Visibility)
- **Section:** 6. เอกสารลับมาก & OTP
- **Test Type:** Security / Access Control
- **Priority:** Critical
- **Traceability:** `BR-1.4-B`, `VAL-22`, `ERR-CR-018`
- **Actor:** `prapat.k` (ผู้บริหาร) หรือ Admin ที่ไม่ได้ถูก Assign
- **Pre-requisite:** เอกสารมีระดับชั้นความลับ `Top Secret (ลับมาก)`
- **Test Steps:**
  1. ล็อกอินด้วย `prapat.k` เปิดดูหน้ารายละเอียดเอกสารลับมาก
  2. ตรวจสอบการ์ดไฟล์แนบ
- **Expected Results:**
  1. ระบบซ่อนชื่อไฟล์ ขนาด และภาพพรีวิวทั้งหมด
  2. แสดงกล่องสีเทาแจ้งเตือนความปลอดภัย: *"เอกสารนี้เป็นเอกสารลับมาก สงวนสิทธิ์เฉพาะผู้ได้รับมอบหมายโดยตรง (VAL-22)"*
  3. ไม่มีปุ่มดาวน์โหลดหรือดูภาพพรีวิว

---

### TC-P2026-048: การขอรหัส OTP ทางอีเมลสำหรับผู้ได้รับมอบหมาย (Request OTP Flow)
- **Section:** 6. เอกสารลับมาก & OTP
- **Test Type:** Security / Functional
- **Priority:** Critical
- **Traceability:** `BR-1.4-C`, `NFR-17`, `Draft 1.7.1`
- **Actor:** `kanda.m` (ผู้ได้รับมอบหมายงานเอกสารลับมาก)
- **Test Steps:**
  1. ล็อกอินด้วย `kanda.m` เปิดหน้ารายละเอียดเอกสารลับมาก
  2. คลิกปุ่มเด่น `[ 🛡️ ยืนยันตัวตนด้วยรหัส OTP เพื่อดูไฟล์แนบ ]`
- **Expected Results:**
  1. ระบบสร้าง OTP 6 หลักแบบสุ่ม เข้ารหัส BCrypt บน Database
  2. ส่ง OTP ไปยัง **อีเมลที่ผูกใน LDAP เท่านั้น** (`kanda.m@deves.co.th`) ภายใน 30 วินาที (ไม่มี SMS ตาม Draft 1.7.1)
  3. เปิด `OtpVerificationModal` แสดงเลขอ้างอิง (เช่น `REF-4821`), อีเมลแบบ Mask (`k****@deves.co.th`) และเวลานับถอยหลัง 3:00 นาที
  4. บันทึก Audit Log Action: `RequestOTP`

---

### TC-P2026-049: ยืนยัน OTP ถูกต้อง ได้รับ Temporary Token 15 นาที และปลดล็อกไฟล์
- **Section:** 6. เอกสารลับมาก & OTP
- **Test Type:** Security / Functional
- **Priority:** Critical
- **Traceability:** `BR-1.4-C`, `BR-1.4-E`
- **Test Steps:**
  1. กรอกรหัส OTP 6 หลักที่ถูกต้องลงในช่องกรอก 6 ช่อง
  2. ระบบ Auto-submit เมื่อกรอกครบ 6 หลัก
- **Expected Results:**
  1. ตรวจสอบ OTP ถูกต้อง ออก `Temporary File Access Token` อายุ 15 นาที
  2. Modal ปิดลง การ์ดไฟล์แนบปลดล็อกแสดงรายการไฟล์ทั้งหมด พร้อม Badge สีเขียว "ยืนยันตัวตนแล้ว (เข้าถึงได้ 15 นาที)"
  3. ปุ่มดูรูปและดาวน์โหลดไฟล์สามารถใช้งานได้
  4. บันทึก Audit Log Action: `VerifyOTP_Success`

---

### TC-P2026-050: การประทับลายน้ำไดนามิกขณะเปิดดูพรีวิวไฟล์ลับมาก (Dynamic Watermarking)
- **Section:** 6. เอกสารลับมาก & OTP
- **Test Type:** Visual / Security
- **Priority:** Critical
- **Traceability:** `BR-1.4-D`
- **Test Steps:**
  1. หลังปลดล็อก OTP สำเร็จ คลิกปุ่มพรีวิวรูปภาพหรือเอกสารลับมาก
- **Expected Results:**
  1. Lightbox พรีวิวแสดงภาพเอกสารพร้อมลายน้ำโปร่งใสพาดทแยงมุม
  2. ลายน้ำระบุข้อความไดนามิก: `น.ส.กานดา มีสุข (kanda.m) | 02/09/2026 17:05:12 | IP: 192.168.1.45`
  3. บันทึก Audit Log Action: `ViewSecretFile`

---

### TC-P2026-051: การดาวน์โหลดไฟล์ลับมากและบันทึก Audit Log
- **Section:** 6. เอกสารลับมาก & OTP
- **Test Type:** Security / Audit
- **Priority:** High
- **Traceability:** `BR-1.4-C`, `NFR-05`
- **Test Steps:**
  1. คลิกปุ่ม "ดาวน์โหลด" ไฟล์ลับมาก
- **Expected Results:**
  1. ดาวน์โหลดไฟล์สำเร็จ
  2. บันทึก Audit Log Action: `DownloadSecretFile` ระบุ Document ID, File Name, Actor, Timestamp, IP

---

### TC-P2026-052: Validation การกรอกรหัส OTP ไม่ถูกต้อง
- **Section:** 6. เอกสารลับมาก & OTP
- **Test Type:** Negative / Security
- **Priority:** High
- **Traceability:** `VAL-20`, `ERR-CR-016`
- **Test Steps:**
  1. ในหน้าต่างกรอก OTP ระบุรหัสผิด เช่น `999999`
  2. กดยืนยัน
- **Expected Results:**
  1. ระบบปฏิเสธ HTTP 400 Bad Request
  2. แสดงข้อความเตือน: *"รหัส OTP ไม่ถูกต้องหรือหมดอายุ กรุณาตรวจสอบหรือขอรหัสใหม่ (VAL-20)"*
  3. ไฟล์แนบยังคงถูกล็อก

---

### TC-P2026-053: การป้องกัน Brute-Force กรอก OTP ผิดเกิน 3 ครั้ง (Rate Limiting)
- **Section:** 6. เอกสารลับมาก & OTP
- **Test Type:** Negative / Security / Rate Limit
- **Priority:** Critical
- **Traceability:** `VAL-21`, `NFR-17`, `ERR-CR-017`
- **Test Steps:**
  1. กรอกรหัส OTP ผิดติดต่อกัน 3 ครั้ง
- **Expected Results:**
  1. ระบบระงับการขอ OTP ชั่วคราว 15 นาที HTTP 429 Too Many Requests
  2. แสดงข้อความเตือน: *"ท่านกรอกรหัส OTP ผิดเกินจำนวนครั้งที่กำหนด ระบบระงับการขอรหัสชั่วคราว 15 นาที เพื่อความปลอดภัย (VAL-21)"*
  3. บันทึก Security Alert ลง Audit Log

---

### TC-P2026-054: รหัส OTP หมดอายุเมื่อเกิน 3 นาที
- **Section:** 6. เอกสารลับมาก & OTP
- **Test Type:** Negative / Boundary
- **Priority:** Medium
- **Traceability:** `VAL-20`
- **Test Steps:**
  1. ขอ OTP แล้วรอจนเวลานับถอยหลังหมด 3:00 นาที
  2. กรอกรหัส OTP เดิม
- **Expected Results:**
  1. ระบบแจ้งเตือนรหัสหมดอายุ และเปิดปุ่ม "ส่งรหัสใหม่อีกครั้ง (Resend OTP)"

---

### TC-P2026-055: สิทธิ์เข้าถึงแบบเต็มสาย (Full-flow Access) สำหรับผู้ที่เคยมีส่วนร่วมใน Flow
- **Section:** 6. เอกสารลับมาก & OTP
- **Test Type:** Positive / Business Rule
- **Priority:** High
- **Traceability:** `BR-1.4-C`, `Draft 1.8.4`
- **Actor:** `wichai.t` (ผอ. IT ผู้ที่เคยมอบหมายงานต่อให้ `kanda.m` ไปแล้ว)
- **Test Steps:**
  1. ล็อกอินด้วย `wichai.t` เข้าดูเอกสารลับมากที่ตนเองเคยส่งต่อให้ลูกทีมแล้ว
  2. กดปุ่มขอ OTP
- **Expected Results:**
  1. ระบบอนุญาตให้ `wichai.t` ขอ OTP และยืนยันตัวตนเปิดดูไฟล์ได้ (Full-flow Access ตาม Draft 1.8.4)

---

### TC-P2026-056: Session Timeout หมดอายุ 15 นาทีและการล็อกไฟล์กลับอัตโนมัติ
- **Section:** 6. เอกสารลับมาก & OTP
- **Test Type:** Security / Timeout
- **Priority:** High
- **Traceability:** `BR-1.4-E`
- **Test Steps:**
  1. ยืนยัน OTP ปลดล็อกไฟล์เรียบร้อย ปล่อยหน้าจอไว้เกิน 15 นาที
  2. คลิกพรีวิวหรือดาวน์โหลดไฟล์
- **Expected Results:**
  1. Token หมดอายุ ระบบล็อกไฟล์แนบกลับสู่สถานะเดิมอัตโนมัติ
  2. ผู้ใช้ต้องกดขอ OTP เพื่อยืนยันตัวตนใหม่

---

## หมวดที่ 7: วงจรชีวิตการนำส่งเอกสารภายนอก (DEL-OUT)

### TC-P2026-057: บันทึกสถานะการนำส่งเอกสารส่งออก (Mark as Sent)
- **Section:** 7. การนำส่งเอกสารส่งออก
- **Test Type:** Positive / Functional
- **Priority:** Critical
- **Traceability:** `BR-4.2`, `UC-Out-02`
- **Actor:** `wichai.c` (ผอ. การเงิน)
- **Pre-requisite:** เอกสารส่งออกสถานะ `Ready to Send` พร้อมไฟล์แนบ
- **Test Steps:**
  1. เปิดหน้ารายละเอียดเอกสารส่งออก
  2. คลิกปุ่ม "บันทึกการนำส่ง (Sent)"
  3. ระบุเลข Tracking: `ED887766554TH`
  4. คลิกปุ่มยืนยัน
- **Expected Results:**
  1. สถานะเปลี่ยนเป็น `Sent (นำส่งแล้ว)`
  2. บันทึกวันเวลาที่นำส่ง และแสดงปุ่ม "ตรวจสอบสถานะพัสดุ (Track)"
  3. Timeline อัปเดตขั้นตอนการนำส่งพร้อมเลข Tracking

---

### TC-P2026-058: ยืนยันปลายทางรับเอกสารส่งออกพร้อมแนบหลักฐานตอบรับ (Mark as Delivered)
- **Section:** 7. การนำส่งเอกสารส่งออก
- **Test Type:** Positive / Functional
- **Priority:** Critical
- **Traceability:** `BR-4.2`, `BR-4.1-A`, `BR-4.1-B`, `VAL-11`
- **Test Steps:**
  1. ที่เอกสารสถานะ `Sent` คลิกปุ่ม "ยืนยันปลายทางรับ (Delivered)"
  2. ใน Modal ยืนยัน ติ๊ก Checkbox "ยืนยันว่าผู้รับปลายทางได้รับเอกสารแล้ว"
  3. แนบไฟล์ภาพสลิปใบตอบรับ `delivery_slip.jpg` หรือเปิดกล้องถ่ายใบเซ็นรับ
  4. ระบุชื่อผู้รับปลายทาง: `นายสมเกียรติ นิติกร (กรมสรรพากร)`
  5. คลิกปุ่ม "ยืนยัน Delivered"
- **Expected Results:**
  1. สถานะเอกสารเปลี่ยนเป็น `Delivered` และ `Completed (เสร็จสิ้น)`
  2. Progress ปรับเป็น `100%`
  3. หลักฐานการตอบรับถูกบันทึกแนบในเอกสาร

---

### TC-P2026-059: Validation การยืนยัน Delivered โดยไม่แนบหลักฐานตอบรับ
- **Section:** 7. การนำส่งเอกสารส่งออก
- **Test Type:** Negative / Validation
- **Priority:** High
- **Traceability:** `VAL-11`, `BR-4.2`
- **Test Steps:**
  1. เปิด Modal ยืนยัน Delivered
  2. ไม่แนบไฟล์สลิปหรือภาพถ่ายใบเซ็นรับ
  3. พยายามคลิกยืนยัน Delivered
- **Expected Results:**
  1. ระบบแจ้งเตือนตาม VAL-11: *"กรุณาแนบหลักฐานตอบรับ (อัปโหลดไฟล์สลิป/เอกสาร หรือถ่ายภาพใบเซ็นรับ) ก่อนยืนยันปลายทางรับ"*

---

### TC-P2026-060: ตรวจสอบว่าขั้นตอน Delivered เป็นการอัปเดตแบบ Manual (ไม่มี Reminder บังคับ)
- **Section:** 7. การนำส่งเอกสารส่งออก
- **Test Type:** Business Rule Check
- **Priority:** Medium
- **Traceability:** `BR-4.2`
- **Test Steps:**
  1. ตรวจสอบเงื่อนไขการแจ้งเตือนในระบบสำหรับเอกสารส่งออกสถานะ `Sent`
- **Expected Results:**
  1. ไม่มีระบบส่ง Reminder บังคับในขั้นตอนรอ Delivered (ผู้ส่งเป็นผู้อัปเดตเองตาม BR-4.2)

---

### TC-P2026-061: ลิงก์ตรวจสอบสถานะพัสดุอัตโนมัติด้วย Tracking Number
- **Section:** 7. การนำส่งเอกสารส่งออก
- **Test Type:** UI / Functional
- **Priority:** Low
- **Test Steps:**
  1. ในเอกสารที่ระบุ Tracking No. `ED887766554TH`
  2. คลิกปุ่มไอคอนค้นหาพัสดุข้างเลข Tracking
- **Expected Results:**
  1. เบราว์เซอร์เปิดแท็บใหม่ไปยังเว็บไซต์ของไปรษณีย์ไทยพร้อมค้นหาเลขพัสดุให้อัตโนมัติ

---

### TC-P2026-062: การยกเลิกเอกสารส่งออก (Cancel Outgoing Document)
- **Section:** 7. การนำส่งเอกสารส่งออก
- **Test Type:** Positive / Workflow
- **Priority:** Medium
- **Test Steps:**
  1. ในเอกสารส่งออกที่ยังไม่ได้นำส่ง คลิกปุ่ม "ยกเลิกเอกสาร"
- **Expected Results:**
  1. สถานะเปลี่ยนเป็น `Cancelled`

---

## หมวดที่ 8: การแจ้งเตือน (Notifications), Reminder & Follow up (NOTI-REMIND)

### TC-P2026-063: การส่งแจ้งเตือนเมื่อได้รับมอบหมายงานใหม่ (NT-01 New Assignment)
- **Section:** 8. การแจ้งเตือน & Reminder
- **Test Type:** Positive / Notification
- **Priority:** High
- **Traceability:** `NT-01`, `BR-6.2`, `BR-6.2-A`
- **Test Steps:**
  1. ลงทะเบียนเอกสารมอบหมาย `kanda.m`
  2. ตรวจสอบกล่องข้อความ Email, In-app Notification และ Task Inbox ของ `kanda.m`
- **Expected Results:**
  1. ได้รับ Email: หัวข้อ `[สารบรรณ] ท่านได้รับมอบหมายเอกสาร: [ชื่อเรื่อง]` พร้อมลิงก์เข้าดู
  2. In-app Noti แสดงเตือนมุมขวาบน
  3. Task Inbox แสดงรายการงานในแท็บ "งานที่ต้องปฏิบัติ"

---

### TC-P2026-064: ระบบส่ง Reminder เตือนใกล้ครบกำหนด (Due Soon - NT-10) ณ เวลาทำการ 08:30 น.
- **Section:** 8. การแจ้งเตือน & Reminder
- **Test Type:** Scheduler / Business Rule
- **Priority:** High
- **Traceability:** `BR-3.2`, `NT-10`, `NFR-09`
- **Pre-requisite:** เอกสารด่วนมาก กำหนดส่งวันนี้ เวลา 16:30 น. (เหลือเวลา < 1 วัน)
- **Test Steps:**
  1. จำลองการทำงานของ Scheduler ณ เวลา 08:30 น.
- **Expected Results:**
  1. ส่ง Reminder NT-10 ไปยังผู้รับมอบหมายล่าสุดและต้นทาง
  2. หัวเรื่อง Email ระบุ: `[เตือนใกล้ครบกำหนด] เอกสาร [เลขที่] เรื่อง [ชื่อเรื่อง]`

---

### TC-P2026-065: รอบการเตือนซ้ำแบบ Configurable ต่อระดับความเร่งด่วน (Repeat Interval BR-3.2/BR-3.3)
- **Section:** 8. การแจ้งเตือน & Reminder
- **Test Type:** Business Rule / Scheduler
- **Priority:** Critical
- **Traceability:** `BR-3.2`, `BR-3.3`, `Draft 1.8.8`
- **Test Matrix รอบการเตือนซ้ำ:**
  | ระดับความเร่งด่วน | ค่าเริ่มต้นรอบเตือนซ้ำ (Default Repeat Interval) |
  | :--- | :--- |
  | **ปกติ (Normal)** | เตือนซ้ำทุก 5 วัน |
  | **ด่วน (Urgent)** | เตือนซ้ำทุก 3 วัน |
  | **ด่วนมาก (Very Urgent)** | เตือนซ้ำทุก 1 วัน (ทุกวันทำการ) |
- **Expected Results:**
  1. ระบบเตือนซ้ำเป็นรอบ ๆ ตามความเร่งด่วนจนกว่าเอกสารจะ Completed

---

### TC-P2026-066: ผู้รับ Reminder ซ้ำจำกัดเฉพาะต้นทางและผู้รับมอบหมายล่าสุด (Leaf Nodes BR-3.4)
- **Section:** 8. การแจ้งเตือน & Reminder
- **Test Type:** Business Rule / Filtering
- **Priority:** High
- **Traceability:** `BR-3.4`, `Draft 1.8.8`
- **Pre-requisite:** เอกสารสายการมอบหมาย A (ผอ.) $\rightarrow$ B (หัวหน้าทีม) $\rightarrow$ C (ลูกทีม - ผู้รับมอบหมายล่าสุด)
- **Test Steps:**
  1. ถึงรอบส่ง Reminder ซ้ำ (NT-11 Overdue)
- **Expected Results:**
  1. ส่ง Reminder ให้ (ก) สารบรรณผู้ริเริ่มเอกสาร และ (ข) `C` ผู้รับมอบหมายล่าสุดเท่านั้น
  2. ไม่ส่งหา `A` และ `B` ที่ส่งต่องานไปแล้ว (ตาม BR-3.4 Draft 1.8.8)

---

### TC-P2026-067: การกดปุ่มติดตามงาน (Follow up - NT-16)
- **Section:** 8. การแจ้งเตือน & Reminder
- **Test Type:** Positive / Functional
- **Priority:** Medium
- **Traceability:** `BR-3.4`, `NT-16`
- **Actor:** `somchai.p` (ต้นทาง) หรือ Monitor
- **Test Steps:**
  1. เปิดดูเอกสารที่ค้างอยู่ คลิกปุ่ม "ติดตามงาน (Follow up)"
- **Expected Results:**
  1. ระบบส่งแจ้งเตือนย้ำ NT-16 ไปยังผู้รับมอบหมายปัจจุบันทันที 3 ช่องทาง
  2. แสดง Toast แจ้ง "ส่งข้อความติดตามงานเรียบร้อยแล้ว"

---

### TC-P2026-068: การยกเลิกคิว Reminder อัตโนมัติเมื่อเอกสารถูก Accept หรือ Complete
- **Section:** 8. การแจ้งเตือน & Reminder
- **Test Type:** Scheduler / Cleanup
- **Priority:** Medium
- **Traceability:** `Section 8.8`
- **Test Steps:**
  1. เอกสารมีคิวเตือน Pending Acceptance $\rightarrow$ ผู้รับกด Accept
- **Expected Results:**
  1. คิวแจ้งเตือน Pending Acceptance ที่ค้างอยู่ถูกลบ/ยกเลิกออกจาก Scheduler ทันที

---

### TC-P2026-069: การสลับแท็บและการจัดการสถานะใน Task Inbox (Actionable Items)
- **Section:** 8. การแจ้งเตือน & Reminder
- **Test Type:** UI / Functional
- **Priority:** High
- **Traceability:** `BR-6.2`, `BR-6.2-A`
- **Test Steps:**
  1. เข้าหน้า Task Inbox (`/tasks`)
  2. สลับดูแท็บ: `งานที่ต้องปฏิบัติ`, `งานกำลังดำเนินการ`, `งานเสร็จสิ้น`, `งานที่ส่งต่อ`
  3. คลิกปุ่ม Mark as Read บนการ์ดแจ้งเตือน
- **Expected Results:**
  1. แสดงงานตรงตามสถานะอย่างถูกต้อง
  2. สถานะการอ่านถูกอัปเดต และตัวเลขนับบน Badge ลดลง

---

### TC-P2026-070: ตรวจสอบความถูกต้องของ Merge Variables ใน Email Template ทุก Event (NT-01..17)
- **Section:** 8. การแจ้งเตือน & Reminder
- **Test Type:** Data Validation
- **Priority:** Medium
- **Traceability:** `Message Catalog (Section 8.7)`
- **Test Steps:**
  1. ตรวจสอบเนื้อหาอีเมลที่ระบบส่งออกมาในทุก Event
- **Expected Results:**
  1. ตัวแปร เช่น `{{doc_number}}`, `{{subject}}`, `{{sender}}`, `{{due_date}}`, `{{department}}` ถูกแทนที่ด้วยค่าจริงครบถ้วน ไม่มีหลุด string code

---

## หมวดที่ 9: ผู้เฝ้าติดตามที่ Config ได้ (Configurable Watcher / Monitor) (MON-WATCH)

### TC-P2026-071: Admin ตั้งค่า Monitor รายฝ่าย (Department Scope Watcher)
- **Section:** 9. Monitor (ผู้เฝ้าติดตาม)
- **Test Type:** Positive / Admin / RBAC
- **Priority:** High
- **Traceability:** `BR-5.3`, `Draft 1.8.0`, `UC-Admin-02`
- **Actor:** `sutthichok.t` (Admin)
- **Test Steps:**
  1. เข้าหน้า Admin $\rightarrow$ แท็บ "ตั้งค่าผู้เฝ้าติดตาม (Monitor)"
  2. คลิก "เพิ่มผู้เฝ้าติดตาม"
  3. เลือกผู้ใช้: `monitor.auditor`
  4. เลือก Scope Type: `ฝ่าย (Department)`
  5. เลือกฝ่ายเป้าหมาย: `ฝ่ายสารสนเทศ` และ `ฝ่ายวิศวกรรม` (Multi-Scope ตาม Draft 1.8.3)
  6. ติ๊ก "รับแจ้งเตือนงานค้างใน Scope (`notify_enabled = true`)"
  7. คลิกบันทึก
- **Expected Results:**
  1. บันทึกลงตาราง `MONITOR_ASSIGNMENT` สำเร็จ (HTTP 201)
  2. ล็อกอินด้วย `monitor.auditor` $\rightarrow$ หน้าแดชบอร์ดแสดงงานของฝ่าย IT และวิศวกรรมทั้งหมด
  3. บันทึก Audit Log Action: `ConfigMonitor`

---

### TC-P2026-072: การตั้งค่า Monitor แบบ "ทุกฝ่าย (All Departments)" ด้วย Flag พิเศษ
- **Section:** 9. Monitor (ผู้เฝ้าติดตาม)
- **Test Type:** Positive / Feature
- **Priority:** High
- **Traceability:** `BR-5.3`, `Draft 1.8.3`
- **Test Steps:**
  1. ตั้งค่า Monitor เลือกตัวเลือก "ทุกฝ่าย (all departments)"
  2. บันทึกข้อมูล
- **Expected Results:**
  1. บันทึก `all_departments = true` และ `scope_refs` เป็นค่าว่าง
  2. Monitor เห็นเอกสารทุกฝ่ายทั้งที่มีอยู่ปัจจุบันและที่จะเพิ่มขึ้นใหม่ในอนาคต

---

### TC-P2026-073: Monitor ได้รับการแจ้งเตือนงานค้างและ SLA Overdue ใน Scope (BR-3.4-A)
- **Section:** 9. Monitor (ผู้เฝ้าติดตาม)
- **Test Type:** Notification / Integration
- **Priority:** High
- **Traceability:** `BR-3.4-A`, `BR-5.3`
- **Test Steps:**
  1. เอกสารของฝ่าย IT เข้าสู่สถานะ Overdue
- **Expected Results:**
  1. `monitor.auditor` ได้รับ Email Reminder NT-11 เพิ่มเติมจากผู้รับงานและหัวหน้าฝ่าย

---

### TC-P2026-074: Monitor สามารถกด Follow up งานค้างได้
- **Section:** 9. Monitor (ผู้เฝ้าติดตาม)
- **Test Type:** Functional
- **Priority:** High
- **Traceability:** `BR-5.3`
- **Test Steps:**
  1. `monitor.auditor` เปิดดูงานค้างใน Scope และคลิกปุ่ม "ติดตามงาน (Follow up)"
- **Expected Results:**
  1. ส่งแจ้งเตือน NT-16 ไปยังผู้รับงานปัจจุบันสำเร็จ

---

### TC-P2026-075: ตรวจสอบ Action ต้องห้ามสำหรับ Monitor (View-only Enforcement)
- **Section:** 9. Monitor (ผู้เฝ้าติดตาม)
- **Test Type:** Security / Negative
- **Priority:** Critical
- **Traceability:** `BR-5.3`
- **Test Steps:**
  1. ล็อกอินด้วย `monitor.auditor` เปิดดูหน้ารายละเอียดเอกสารใน Scope
- **Expected Results:**
  1. ไม่มีปุ่ม Accept, Reject, Forward, Complete หรือ Assign
  2. พยายามยิง API Transition $\rightarrow$ Backend ตอบกลับ 403 Forbidden

---

### TC-P2026-076: Monitor ไม่มีสิทธิ์เปิดดูไฟล์แนบเอกสารลับมาก (Confidentiality Gate)
- **Section:** 9. Monitor (ผู้เฝ้าติดตาม)
- **Test Type:** Security / Access Control
- **Priority:** Critical
- **Traceability:** `BR-5.3-A`, `BR-1.4-B`
- **Test Steps:**
  1. `monitor.auditor` เปิดดูเอกสารลับมากในฝ่ายที่ตนเองเฝ้าติดตาม
- **Expected Results:**
  1. Monitor เห็นสถานะและความคืบหน้าได้ แต่การ์ดไฟล์แนบแสดง Restricted Locked Box
  2. ไม่สามารถขอ OTP หรือเปิดดูไฟล์แนบได้ (สงวนสิทธิ์เฉพาะ Assignee)

---

### TC-P2026-077: Validation หัวหน้าฝ่ายตั้งค่า Monitor ข้ามฝ่ายที่ตนไม่ได้กำกับ (VAL-24)
- **Section:** 9. Monitor (ผู้เฝ้าติดตาม)
- **Test Type:** Negative / Authorization
- **Priority:** High
- **Traceability:** `BR-5.3-C`, `VAL-24`
- **Actor:** `wichai.t` (ผอ. IT)
- **Test Steps:**
  1. `wichai.t` พยายามตั้งค่า Monitor ให้เฝ้าติดตามฝ่ายการเงิน
- **Expected Results:**
  1. ระบบบล็อกการทำงาน HTTP 403 Forbidden
  2. แสดงข้อความเตือน: *"ไม่มีสิทธิ์กำหนดผู้เฝ้าติดตามนอกฝ่ายที่ท่านกำกับ (VAL-24)"*

---

### TC-P2026-078: Validation การตั้งค่า Monitor ไม่เลือกผู้ใช้ หรือไม่เลือก Scope
- **Section:** 9. Monitor (ผู้เฝ้าติดตาม)
- **Test Type:** Negative / Validation
- **Priority:** Medium
- **Traceability:** `BR-5.3-B`, `VAL-23`
- **Test Steps:**
  1. ไม่เลือกผู้ใช้ หรือไม่เลือก Scope $\rightarrow$ คลิกบันทึก
- **Expected Results:**
  1. ระบบแจ้งเตือนตาม VAL-23: *"กรุณาเลือกผู้เฝ้าติดตามและขอบเขต (Scope) จาก Master Data"*

---

## หมวดที่ 10: ข้อมูลหลัก Master-Driven Data Entry (MST-DATA)

### TC-P2026-079: ฟิลด์ข้อมูลหลักบังคับเลือกจาก Master Data (Controlled-Input Enforcement)
- **Section:** 10. Master Data
- **Test Type:** UI / Functional
- **Priority:** High
- **Traceability:** `BR-1.5`, `Appendix F`
- **Test Steps:**
  1. ตรวจสอบฟิลด์: ฝ่าย, กลุ่มงาน, ผู้รับ/ผู้ลงนาม, หน่วยงานภายนอก, Delivery Method, ความเร่งด่วน, ชั้นความลับ
- **Expected Results:**
  1. ทุกฟิลด์แสดงผลเป็น Dropdown / Lookup / Autocomplete จาก Master Data ไม่ใช่ช่องพิมพ์อิสระ
  2. ข้อมูลที่บันทึกจัดเก็บเป็น Reference ID ผูก Foreign Key (NFR-18)

---

### TC-P2026-080: Backend ปฏิเสธค่านอก Master Data (Referential Integrity Check)
- **Section:** 10. Master Data
- **Test Type:** API / Negative / Security
- **Priority:** High
- **Traceability:** `BR-1.5`, `VAL-25`, `NFR-18`
- **Test Steps:**
  1. ยิง API บันทึกเอกสารโดยส่งค่า `delivery_method_id = "invalid_id_999"`
- **Expected Results:**
  1. Backend ปฏิเสธคำขอ HTTP 400 Bad Request
  2. แจ้งเตือน: *"ค่าที่เลือกไม่ถูกต้องหรือไม่มีอยู่ในระบบ กรุณาเลือกจากรายการ (VAL-25)"*

---

### TC-P2026-081: การจัดการหน่วยงานภายนอกกรณีเลือก "อื่นๆ" (Custom Free-text Organization)
- **Section:** 10. Master Data
- **Test Type:** Positive & Negative Validation
- **Priority:** Medium
- **Traceability:** `BR-1.5`, `VAL-26`, `VAL-18`
- **Test Steps:**
  1. เลือกหน่วยงานภายนอกเป็น "อื่นๆ" $\rightarrow$ ช่อง Free-text ปรากฏขึ้น
  2. ไม่กรอกข้อความ $\rightarrow$ กดบันทึก (ตรวจ VAL-26)
  3. กรอกชื่อหน่วยงาน: `บริษัท นวัตกรรมไทย จำกัด` $\rightarrow$ กดบันทึก
- **Expected Results:**
  1. ขั้นตอนที่ 2 บล็อกแจ้งเตือน: *"กรุณาระบุชื่อหน่วยงานภายนอก (VAL-26)"*
  2. ขั้นตอนที่ 3 บันทึกสำเร็จ พร้อมส่งคำแนะนำให้ Admin พิจารณาเพิ่มเข้า Master Data

---

### TC-P2026-082: การปิดใช้งาน Master Data คงค่าในเอกสารเดิมแบบ Soft Reference
- **Section:** 10. Master Data
- **Test Type:** Data Integrity / Lifecycle
- **Priority:** High
- **Traceability:** `NFR-18`
- **Test Steps:**
  1. Admin ปิดใช้งาน (is_active = false) ฝ่าย หรือ Delivery Method หนึ่ง
  2. เปิดดูเอกสารเก่าที่เคยอ้างอิง Master นั้น
  3. เปิดฟอร์มลงทะเบียนเอกสารใหม่
- **Expected Results:**
  1. เอกสารเก่ายังคงแสดงชื่อฝ่าย/Delivery Method เดิมได้อย่างถูกต้อง ไม่เกิด Error
  2. ในฟอร์มลงทะเบียนใหม่ รายการที่ปิดใช้งานจะไม่ปรากฏให้เลือกอีกต่อไป

---

### TC-P2026-083: Admin จัดการ Master Data ฝ่ายงานและหัวหน้าฝ่าย (Departments CRUD)
- **Section:** 10. Master Data
- **Test Type:** Admin / Functional
- **Priority:** High
- **Test Steps:**
  1. เพิ่มฝ่ายใหม่ในหน้า Admin พร้อมระบุชื่อไทย/อังกฤษ, ตัวย่อ และหัวหน้าฝ่าย
- **Expected Results:**
  1. ฝ่ายใหม่แสดงใน Master Data และพร้อมใช้งานในฟอร์มลงทะเบียนทันที

---

### TC-P2026-084: Admin จัดการ Master Data รูปแบบการส่งเอกสาร (Delivery Methods CRUD)
- **Section:** 10. Master Data
- **Test Type:** Admin / Functional
- **Priority:** High
- **Test Steps:**
  1. เพิ่มวิธีการส่งใหม่: `ขนส่งด่วน Flash Express`
- **Expected Results:**
  1. ปรากฏใน Dropdown รูปแบบการส่งของเอกสารส่งออกทันที

---

## หมวดที่ 11: แดชบอร์ดผู้บริหาร & รายงานมาตรฐาน 6 ฉบับ (DASH-RPT)

### TC-P2026-085: แดชบอร์ดภาพรวมผู้บริหารระดับสูง ROLE-04 (Executive Dashboard View)
- **Section:** 11. แดชบอร์ด & รายงาน
- **Test Type:** UI / Reporting
- **Priority:** High
- **Traceability:** `BR-5.1`, `Section 9.1`
- **Actor:** `prapat.k` (ROLE-04 ผู้บริหาร)
- **Test Steps:**
  1. ล็อกอินเข้าหน้า Dashboard
  2. สลับ Dropdown ดูประเภท: `ทั้งหมด`, `เอกสารรับเข้า`, `เอกสารส่งออก`
- **Expected Results:**
  1. Summary Cards แสดงตัวเลขรวมทั้งองค์กร (Total, Pending, In Progress, Completed, Overdue)
  2. กราฟแท่งแสดงปริมาณเอกสารแยกตามรายฝ่าย
  3. กราฟวงกลมแสดงสัดส่วนความเร่งด่วนและชั้นความลับ
  4. ข้อมูลเป็น Read-only

---

### TC-P2026-086: RPT-01 รายงานสรุปสถานะเอกสารภาพรวม (Overall Document Status Report)
- **Section:** 11. แดชบอร์ด & รายงาน
- **Test Type:** Reporting / Data
- **Priority:** High
- **Traceability:** `RPT-01`, `Draft 1.8.9`
- **Test Steps:**
  1. เลือกรายงาน RPT-01 เลือกระบุช่วงวันที่
  2. คลิกสร้างรายงาน
- **Expected Results:**
  1. ตารางแสดงจำนวนเอกสารจำแนกตามสถานะและฝ่ายที่รับผิดชอบ ยอดรวมถูกต้องตรงกับฐานข้อมูล

---

### TC-P2026-087: RPT-02 รายงานเอกสารค้างเกินกำหนดและ SLA Overdue (SLA Breach Report)
- **Section:** 11. แดชบอร์ด & รายงาน
- **Test Type:** Reporting / SLA
- **Priority:** Critical
- **Traceability:** `RPT-02`
- **Test Steps:**
  1. สร้างรายงาน RPT-02
- **Expected Results:**
  1. แสดงเฉพาะเอกสารที่เลยกำหนดส่ง (Overdue) ระบุผู้ถือครองปัจจุบัน, จำนวนวันล่าช้า และ Stage ที่ค้างอยู่

---

### TC-P2026-088: RPT-03 รายงานสถิติปริมาณเอกสารแยกตามฝ่าย (Volume by Department)
- **Section:** 11. แดชบอร์ด & รายงาน
- **Test Type:** Reporting
- **Priority:** High
- **Traceability:** `RPT-03`
- **Test Steps:**
  1. สร้างรายงาน RPT-03
- **Expected Results:**
  1. แสดงสถิติจำนวนเอกสารรับเข้า-ส่งออกของแต่ละฝ่าย พร้อมคำนวณอัตราความสำเร็จ (% Success Rate)

---

### TC-P2026-089: RPT-04 รายงานเอกสารส่งออกและสถานะนำส่ง EDR (EDR Outgoing Tracking)
- **Section:** 11. แดชบอร์ด & รายงาน
- **Test Type:** Reporting
- **Priority:** High
- **Traceability:** `RPT-04`
- **Test Steps:**
  1. สร้างรายงาน RPT-04
- **Expected Results:**
  1. แสดงเลข EDR คู่ขนาน (ไทย/อังกฤษ), รูปแบบการส่ง, หมายเลข Tracking, วันที่นำส่ง, วันที่ปลายทางรับ

---

### TC-P2026-090: RPT-05 รายงานประวัติการเข้าถึงเอกสารลับมาก (Top Secret OTP Audit Report)
- **Section:** 11. แดชบอร์ด & รายงาน
- **Test Type:** Security / Audit Report
- **Priority:** Critical
- **Traceability:** `RPT-05`
- **Test Steps:**
  1. สร้างรายงาน RPT-05
- **Expected Results:**
  1. แสดงประวัติการขอ OTP, ผลการยืนยัน, เวลาที่ดูพรีวิว, เวลาที่ดาวน์โหลด และ IP Address ครบถ้วน

---

### TC-P2026-091: RPT-06 รายงานการถือครองเอกสารฉบับจริง (Chain of Custody Report)
- **Section:** 11. แดชบอร์ด & รายงาน
- **Test Type:** Reporting
- **Priority:** High
- **Traceability:** `RPT-06`
- **Test Steps:**
  1. สร้างรายงาน RPT-06
- **Expected Results:**
  1. แสดงเส้นทางการเปลี่ยนมือเอกสารตัวจริงทุกฉบับ พร้อมประวัติการส่งคืนสารบรรณ

---

### TC-P2026-092: การส่งออกรายงานเป็นไฟล์ Excel (.xlsx) และ CSV รองรับภาษาไทย (UTF-8 BOM)
- **Section:** 11. แดชบอร์ด & รายงาน
- **Test Type:** Functional / Export
- **Priority:** High
- **Traceability:** `Section 17 Scenario 37`
- **Test Steps:**
  1. ในหน้าแสดงรายงาน คลิกปุ่ม "ส่งออก Excel (.xlsx)" และ "ส่งออก CSV"
  2. เปิดไฟล์ด้วย Microsoft Excel
- **Expected Results:**
  1. ดาวน์โหลดไฟล์สำเร็จ
  2. ภาษาไทยแสดงผลถูกต้อง 100% ไม่เป็นตัวอักษรต่างดาว (UTF-8 with BOM)
  3. บันทึก Audit Log Action: `Export`

---

## หมวดที่ 12: คุณลักษณะเชิงเทคนิค (NFR), Security & Audit 10 ปี (NFR-AUDIT)

### TC-P2026-093: ตรวจสอบการบันทึก Audit Log ครบถ้วนทุก Action และการจัดเก็บย้อนหลัง 10 ปี
- **Section:** 12. NFR & Security
- **Test Type:** Auditability / Compliance
- **Priority:** Critical
- **Traceability:** `BR-6.3`, `NFR-05`, `NFR-06`, `Appendix B`
- **Test Steps:**
  1. ดำเนินการ Actions ต่างๆ: Register, Assign, Accept, Reject, Forward, Recall, Cancel, Delivered, OTP
  2. ตรวจสอบตาราง `DOCUMENT_AUDIT_LOG`
- **Expected Results:**
  1. บันทึกครบทุก Action พร้อมฟิลด์ `log_id`, `doc_ref`, `actor_ref`, `action`, `from_state`, `to_state`, `action_time`, `holder_ref`, `note`, `ip_address`
  2. ฐานข้อมูลกำหนดนโยบาย Retention นาน 10 ปี

---

### TC-P2026-094: ตรวจสอบ Security Headers ใน HTTP Response
- **Section:** 12. NFR & Security
- **Test Type:** Security / NFR
- **Priority:** Critical
- **Traceability:** `NFR-03`
- **Test Steps:**
  1. ยิง Request ไปยัง Web Application และ API
  2. ตรวจสอบ Response Headers
- **Expected Results:**
  1. พบ Security Headers ครบถ้วน: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`

---

### TC-P2026-095: ตรวจสอบการป้องกัน SQL Injection, XSS และ CSRF
- **Section:** 12. NFR & Security
- **Test Type:** Security / Penetration
- **Priority:** Critical
- **Traceability:** `NFR-03`
- **Test Steps:**
  1. กรอก Payload `' OR 1=1 --` ในช่องค้นหา
  2. กรอก `<script>alert('XSS')</script>` ในช่องชื่อเรื่อง
- **Expected Results:**
  1. ระบบ Sanitize และ Escape ปลอดภัย ไม่เกิด SQL Error หรือรันสคริปต์บนหน้าจอ

---

### TC-P2026-096: ตรวจสอบความถูกต้องของการจัดการข้อผิดพลาดตามมาตรฐาน RFC 7807 (Problem Details)
- **Section:** 12. NFR & Security
- **Test Type:** API / Standards
- **Priority:** High
- **Test Steps:**
  1. ยิง API Request ที่ผิดพลาด
- **Expected Results:**
  1. Response ส่งกลับเป็น Content-Type `application/problem+json`
  2. มีฟิลด์ `type`, `title`, `status`, `detail`, `instance`, `traceId` และไม่เปิดเผย Stack Trace ในโหมด Production

---

### TC-P2026-097: ตรวจสอบความเร็วในการโหลด Dashboard และรายงาน (Performance Benchmark)
- **Section:** 12. NFR & Security
- **Test Type:** Performance
- **Priority:** High
- **Traceability:** `NFR-08`
- **Test Steps:**
  1. โหลดหน้า Dashboard ที่มีเอกสาร 5,000 รายการ
- **Expected Results:**
  1. หน้าจอโหลดและเรนเดอร์ข้อมูลเสร็จสิ้นภายใน $\le 3$ วินาที (เกณฑ์ NFR กำหนด $\le 5$ วินาที)

---

### TC-P2026-098: ตรวจสอบระบบตรวจสอบสถานะระบบ Health Check Endpoints
- **Section:** 12. NFR & Security
- **Test Type:** DevOps / Observability
- **Priority:** High
- **Traceability:** `NFR-07`
- **Test Steps:**
  1. เรียกตรวจสอบ `/health`, `/health/ready`, `/health/live`
- **Expected Results:**
  1. ได้รับ HTTP 200 OK แสดงสถานะ `Healthy` ของ Database และ Storage

---

## หมวดที่ 13: กระบวนการทดสอบข้ามสายงาน (End-to-End Scenarios) (E2E-FLOW)

### TC-P2026-099: E2E-01 วงจรเอกสารรับเข้าสมบูรณ์ (Multi-Actor Incoming Lifecycle)
- **Section:** 13. End-to-End Flow
- **Test Type:** End-to-End Multi-Actor
- **Priority:** Critical
- **Scenario Flow:**
  1. `somchai.p` (สารบรรณ) ลงทะเบียนรับเข้าฉบับจริง มอบหมาย `ฝ่ายสารสนเทศ`
  2. `wichai.t` (ผอ. IT) ล็อกอิน กดยอมรับงาน (Owner-first) $\rightarrow$ มอบหมายต่อให้ `kanda.m`
  3. `kanda.m` ล็อกอิน รับงาน และกดส่งต่อให้ `ฝ่ายวิศวกรรม`
  4. `prasit.m` (ผอ. วิศวกรรม) รับงาน และมอบหมายต่อให้ `nattawut.s`
  5. `nattawut.s` ปฏิบัติงานเสร็จสิ้น กด Complete (Progress 100%)
  6. `somchai.p` ได้รับเอกสารตัวจริงคืน กดยืนยันรับคืน $\rightarrow$ Main Document เป็น `Completed`
- **Expected Results:**
  1. เอกสารผ่านครบทุกสถานะ Story Line แสดงโหนดต่อเนื่องถูกต้อง
  2. Chain of Custody เปลี่ยนมือ 4 ทอดและจบที่สารบรรณ
  3. Notification ส่งถึงผู้เกี่ยวข้องทุกรอยต่อ

---

### TC-P2026-100: E2E-02 วงจรเอกสารส่งออกและการนำส่ง EDR (Outgoing EDR & Delivery Flow)
- **Section:** 13. End-to-End Flow
- **Test Type:** End-to-End Multi-Actor
- **Priority:** Critical
- **Scenario Flow:**
  1. `wichai.c` (การเงิน) ขอเลข EDR ได้เลข `ท005กง/2569` $\rightarrow$ ลงทะเบียนส่งออก
  2. แนบไฟล์หลักฐานครบถ้วน $\rightarrow$ บันทึกการนำส่ง (Sent + Tracking: `ED112233445TH`)
  3. เมื่อไปรษณีย์ส่งถึงปลายทาง $\rightarrow$ การเงินกดยืนยัน Delivered พร้อมแนบสลิปตอบรับ
- **Expected Results:**
  1. เอกสารเปลี่ยนสถานะจาก Ready to Send $\rightarrow$ Sent $\rightarrow$ Delivered $\rightarrow$ Completed (100%)

---

### TC-P2026-101: E2E-03 วงจรการเข้าถึงเอกสารลับมากผ่าน OTP และประทับลายน้ำ
- **Section:** 13. End-to-End Flow
- **Test Type:** End-to-End Security
- **Priority:** Critical
- **Scenario Flow:**
  1. สารบรรณลงทะเบียนเอกสาร "ลับมาก" แนบไฟล์แผนยุทธศาสตร์
  2. ผู้บริหารทั่วไปเข้าดู $\rightarrow$ ไฟล์แนบถูกล็อก
  3. เจ้าหน้าที่ IT ผู้รับงานเข้าดู $\rightarrow$ ขอ OTP ทางอีเมล $\rightarrow$ กรอก OTP 6 หลักถูกต้อง
  4. ไฟล์แนบปลดล็อก $\rightarrow$ เปิดพรีวิวพบลายน้ำไดนามิก
- **Expected Results:**
  1. ป้องกันการรั่วไหลของข้อมูลลับมากสมบูรณ์แบบ และบันทึก Audit Log ครบทุกจังหวะ

---

### TC-P2026-102: E2E-04 วงจรการปฏิเสธงาน การดึงงานกลับ และการมอบหมายใหม่
- **Section:** 13. End-to-End Flow
- **Test Type:** End-to-End Exception Flow
- **Priority:** High
- **Scenario Flow:**
  1. สารบรรณลงทะเบียนมอบหมายผิดฝ่าย $\rightarrow$ สารบรรณกด Recall ดึงงานกลับ
  2. สารบรรณมอบหมายใหม่ไปยัง IT $\rightarrow$ ผอ. IT พบว่าผิดสายงาน กด Reject พร้อมระบุเหตุผล
  3. สารบรรณได้รับ Noti ตีกลับ และมอบหมายต่อไปยังฝ่ายการเงินได้อย่างถูกต้อง
- **Expected Results:**
  1. ระบบรองรับการแก้ไขข้อผิดพลาดโดยข้อมูลไม่ตกหล่นและมีประวัติย้อนหลังชัดเจน

---

### TC-P2026-103: E2E-05 วงจรการกระจายงานหลายฝ่ายพร้อมกันและการคำนวณ Progress รวม
- **Section:** 13. End-to-End Flow
- **Test Type:** End-to-End Complex Calculation
- **Priority:** Critical
- **Scenario Flow:**
  1. สารบรรณกระจายงานไปยัง 3 ฝ่าย (IT, การเงิน, กฎหมาย)
  2. IT ปิดงาน (Progress ปรับเป็น 33%)
  3. การเงินปิดงาน (Progress ปรับเป็น 67%)
  4. กฎหมายปิดงาน (Progress ปรับเป็น 100% $\rightarrow$ Main Document เป็น Completed)
- **Expected Results:**
  1. ระบบคำนวณความคืบหน้ารวมถูกต้องเรียลไทม์ และปิดงานหลักอัตโนมัติเมื่อทุกฝ่ายทำเสร็จ

---

## 3. สรุปและแนวทางการส่งมอบ (Sign-off & Execution Guidance)

- **เครื่องมือที่ใช้รันการทดสอบ:** รองรับทั้งการทดสอบแบบ Manual QA (บันทึกผล Pass/Fail ในตาราง) และการใช้ Automation Test Framework (Playwright / Cypress)
- **เกณฑ์การผ่าน UAT (Acceptance Criteria):**
  1. Test Cases ระดับ **Critical** ทั้งหมด (48 TCs) ต้องได้ผลลัพธ์ **Pass 100%**
  2. Test Cases ระดับ **High** ต้องได้ผลลัพธ์ **Pass $\ge 95\%$** และไม่มี Blocking Bug
  3. มีบันทึก Audit Log ครบถ้วนตามมาตรฐานความมั่นคงปลอดภัยของ บมจ. เทเวศประกันภัย

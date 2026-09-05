# Test Cases Specification Reference

เอกสารฉบับเต็มของชุดทดสอบ Test Cases ทั้งหมด 78 รายการ พร้อมข้อมูลนำไปทำ Automation Test (Playwright / Cypress / C# xUnit) ถูกจัดเก็บไว้ที่:

👉 [TESTCASES_SPECIFICATION.md](file:///e:/DVS/Project/DVS_Correspondence_system/Phase2_in_out_document/TESTCASES_SPECIFICATION.md)

### สรุปโมดูลและจำนวน Test Cases:
1. **TC-AUTH (6 TCs):** ยืนยันตัวตน, สิทธิ์ RBAC 7 บทบาท, API Guard
2. **TC-REG-IN (8 TCs):** ลงทะเบียนรับเข้า (Physical/Email, แนบไฟล์, ถ่ายภาพกล้อง, กระจายงานหลายฝ่าย, ชั้นความลับ)
3. **TC-REG-OUT (7 TCs):** ลงทะเบียนส่งออก, ขอเลข EDR (Normal/Special), กฎบังคับแนบไฟล์ BR-4.1, Webhook Parity
4. **TC-WF (12 TCs):** เวิร์กโฟลว์ (Accept, Delegate Tree, Complete, Reject, Forward, Recall, Cancel, Physical Return, Progress Rule)
5. **TC-OTP (6 TCs):** เอกสารลับมาก, ระบบ OTP 6 หลัก, ลายน้ำไดนามิก, Audit Log
6. **TC-DEL (5 TCs):** สถานะการนำส่งเอกสารส่งออก (Sent, Delivered, Returned, Direct Tracking Link)
7. **TC-INBOX (6 TCs):** สลับแท็บสถานะ, ค้นหาแบบ Realtime, กรองความเร่งด่วน/ชั้นความลับ, SLA Badge
8. **TC-DASH (5 TCs):** แดชบอร์ดตามสิทธิ์ (ROLE-04 ผู้บริหาร, ROLE-03 ผอ. ฝ่าย, ROLE-07 Monitor)
9. **TC-RPT (7 TCs):** รายงานมาตรฐาน RPT-01 ถึง RPT-06 และการส่งออกไฟล์ Excel/CSV
10. **TC-ADM (6 TCs):** จัดการผู้ใช้ LDAP Provision, Active/Inactive Toggle, Master Data
11. **TC-NFR (5 TCs):** Security Headers, Problem Details RFC 7807, SQLi/XSS Prevention, Health Checks
12. **E2E-FLOW (5 Scenarios):** การทดสอบ Multi-Actor ครบวงจรตั้งแต่ต้นจนจบ พร้อมสคริปต์สเปกสำหรับ Automation

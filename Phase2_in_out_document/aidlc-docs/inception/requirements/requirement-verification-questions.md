# Requirements Verification & Technical Architecture Questions

โปรดตอบคำถามด้านล่างเพื่อยืนยันข้อกำหนดทางเทคนิคและการตั้งค่าสถาปัตยกรรมสำหรับระบบ **Correspondence Monitoring System (.NET 8)** โดยใส่ตัวอักษรตัวเลือกที่ต้องการหลังแท็ก `[Answer]:` ในแต่ละข้อ

---

## Question 1: System Architecture & Frontend Integration
รูปแบบสถาปัตยกรรมของระบบและการเชื่อมต่อระหว่าง .NET 8 Backend กับ Mockup Frontend (React + Vite + Tailwind):

A) ASP.NET Core 8 Web API (Backend RESTful API) + React Vite Frontend แยกโฟลเดอร์สำหรับพัฒนา โดยมี Proxy/CORS และสคริปต์ Build ให้ ASP.NET Core เสิร์ฟ Single-Page Application ใน Production

B) ASP.NET Core 8 Web API ล้วน (Backend Only) พร้อม Swagger/OpenAPI ให้ Frontend เรียกใช้งานแบบ Standalone API Server

C) ASP.NET Core 8 Razor Pages / MVC โดยแปลงหน้าจอ Mockup มาเป็น Razor Views ทั้งหมด

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2: Database Provider & Persistence Strategy
ฐานข้อมูลหลัก (Database Engine) สำหรับจัดเก็บข้อมูลระบบและ EF Core 8:

A) SQLite (File-based database) — ติดตั้งและรันได้ทันทีโดยไม่ต้องตั้งค่า Server ภายนอก เหมาะสำหรับการพัฒนา ทดสอบ และสาธิตระบบ

B) Microsoft SQL Server (LocalDB / SQL Server Express / Docker) — ตรงตามมาตรฐานระดับ Enterprise ขององค์กร

C) PostgreSQL (Npgsql)

X) Other (please describe after [Answer]: tag below)

[Answer]: B Microsoft SQL Server

---

## Question 3: Authentication & LDAP Provisioning Mode
การจัดการการยืนยันตัวตน (Authentication) และการ Provisioning ผู้ใช้จาก LDAP/Active Directory (ตาม BR-5.2):

A) Dual-Mode: มีระบบ Mock LDAP & Seed Users สำหรับทดสอบครบทุก Role ในตัว (Admin, Registrar, Assignee, Approver, Monitor) พร้อมทั้งรองรับการสลับไปต่อ Active Directory LDAP จริงผ่าน Configuration (`appsettings.json`)

B) Active Directory LDAP Integration จริงเท่านั้น (ต้องระบุ LDAP Server Host, Port, Base DN)

C) Simple Local Authentication (Username/Password ในฐานข้อมูล ไม่ต้องเชื่อมต่อ LDAP)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4: External EDR System (ระบบออกเลขที่เอกสาร) Interoperability
การเชื่อมต่อกับระบบออกเลขที่เอกสารภายนอก (EDR) สำหรับงานเอกสารส่งออก (Seamless Outgoing Number Request & Reverse Sync Webhook ตาม Appendix 18.6):

A) Built-in EDR Service Mock & Webhook Simulator ในตัว เพื่อให้สามารถทดสอบกระบวนการขอเลขธรรมดา/เลขพิเศษ และ Reverse Webhook Sync ได้สมบูรณ์ 100% โดยไม่ต้องพึ่งพาระบบภายนอก พร้อมรองรับการชี้ไปยัง External EDR API จริง

B) Real External EDR API Only (เชื่อมต่อไปยัง URL ของระบบ EDR ภายนอกเท่านั้น)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5: Resiliency Extensions
Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability — covering 15 practice areas across business goals, change management, observability, high availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or guarantee any availability, RTO, or RPO target. It is a **starting point** that scaffolds good resiliency decisions early — it is not a substitute for a formal **AWS Well-Architected Review** of the built system.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance (recommended for business-critical workloads, as an informed starting point that you can validate and harden before go-live)

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

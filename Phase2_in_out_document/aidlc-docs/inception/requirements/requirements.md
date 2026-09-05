# Software Requirements Specification — Correspondence Monitoring System (.NET 8)

## 1. Intent Analysis Summary
- **User Request**: Build a complete, production-ready Correspondence Monitoring System using .NET Core 8 (ASP.NET Core 8 Web API + Entity Framework Core 8), seamlessly integrated with the existing React + TypeScript + Tailwind CSS UI Mockup (`mockup/`), preserving all styling, layouts, UX behaviors, and Thai insurance domain business logic.
- **Request Type**: Greenfield Backend Implementation & Full-Stack System Integration
- **Scope Estimate**: System-wide Full-Stack Solution (ASP.NET Core 8 Web API, SQL Server Database, Mock/Real LDAP Authentication, Attachment Storage with OTP Gate & Watermarking, EDR Integration & Webhooks, SPA Frontend Integration)
- **Complexity Estimate**: Complex (Extensive Business Rules, Multi-Level State Machines, Delegation Trees, OTP-Gated Security, Bi-directional Parity Webhooks, Dynamic Watermarking)

---

## 2. Functional Requirements (FR)

### 2.1 Document Registration & Management (FR-01)
- **Incoming Documents (เอกสารรับเข้า)**:
  - Supports 2 channels: Email and Physical (ไปรษณีย์ / Messenger / Walk-in).
  - Configurable urgency: ปกติ (Normal), ด่วน (Urgent), ด่วนมาก (Very Urgent).
  - Confidentiality level: ปกติ (Normal), ลับ (Confidential), ลับมาก (Top Secret).
  - Multiple file attachments (PDF, DOCX, XLSX, JPG, PNG, WEBP, ZIP <= 25MB) via file upload or Device Camera Capture (with flip/rotate capability).
  - Multi-select assignment (รายฝ่าย / รายบุคคล) starting lifecycle at `pending_receive`.
- **Outgoing Documents (เอกสารส่งออก)**:
  - Origin department acts as the responsible department (no internal assign step).
  - Master-driven Delivery Methods (ไปรษณีย์ลงทะเบียน, EMS, ให้ ปณ. มารับ, Messenger, etc.) + external portal link.
  - Tracking status through `awaiting_delivery` -> `sent` -> `delivered` / `returned`.

### 2.2 Workflow & State Machine (FR-02)
- **State Machine Transitions**:
  - `pending_receive` -> `in_progress` (on Accept) or `pending_receive` (on Reject/Forward).
  - Support Onward Delegation (มอบหมายต่อ): Head/Assignee delegates to subordinate, creating hierarchical lineage tree (`parent_ref`).
  - Support Recall (ดึงงานกลับ) & Cancel (ยกเลิก).
  - Support Complete (เสร็จสิ้น) and Awaiting Return (รอนำส่งคืนตัวจริง).
  - Chain of Custody tracking for physical documents reflecting real-time `current_holder`.

### 2.3 Outgoing Number Request & EDR Integration (FR-03)
- Seamless Outgoing Number Request Modal (Normal & Special number request).
- Bi-directional Data Parity: Sync between Correspondence System and EDR System.
- Dual-Key support: Thai format (e.g. `พ001สอ/2569`) and English format (e.g. `S001CC/2026`).
- Webhook receiver with Idempotency Key and retry queue for real-time creation/update of outgoing documents.

### 2.4 Confidentiality & Top Secret OTP File Access (FR-04)
- Restricted Attachment Visibility for Top Secret documents: hides preview and download for unauthorized viewers.
- Email-only 6-digit OTP delivery to LDAP registered email.
- Verification generates a Temporary File Access Token (valid for 15 minutes).
- Dynamic Watermarking overlaid on document preview (User Name, Employee ID, Timestamp, IP Address).
- Complete Audit Logging in `ATTACHMENT_ACCESS_LOG`.

### 2.5 Configurable Watcher / Monitor (FR-05)
- Support `ROLE-07 Monitor`: Read-only tracking without participating in assignment lifecycle.
- Multi-scope tracking (multiple departments/groups) or `all_departments = true`.
- Monitor-specific views and notification digests for overdue/pending tasks.

### 2.6 Dashboard & Multi-Department Reports (FR-06)
- Role-based Dashboard (Overview cards, Pending tasks, Aging analysis, SLA indicators).
- 6 Standard Reports (RPT-01 to RPT-06) with multi-department counting rules.
- Export capabilities (Excel / CSV / PDF).

### 2.7 Administration & LDAP Provisioning (FR-07)
- Admin User Provisioning: Search users from LDAP and assign System Role + Department.
- Master Data Management (Departments, Workgroups, Delivery Methods, System Settings).

---

## 3. Non-Functional Requirements (NFR) & Extensions Compliance

### 3.1 Security Baseline (SECURITY-01 to SECURITY-09)
- **Data Protection**: SQL Server encryption and encrypted storage paths for attachments.
- **Authentication**: JWT Bearer token authentication with HMAC-SHA256 / RSA signing, secure HttpOnly cookie options, strict expiry.
- **Access Control (RBAC)**: Enforce role-based and document-level authorization policies across all API endpoints.
- **Input Validation**: ASP.NET Core FluentValidation / DataAnnotations verifying all request payloads.
- **Security Headers**: Middleware configuring `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy`.
- **Sensitive Data Masking**: Ensure no passwords, OTP tokens, or secret keys appear in log messages.

### 3.2 Resiliency Baseline
- **Polly Resilience Policies**: Retry with Exponential Backoff for database connections and external API / Webhook calls.
- **Health Checks**: `/health`, `/health/ready`, `/health/live` endpoints monitoring database and storage.
- **Global Error Handling**: Middleware translating unhandled exceptions to standardized RFC 7807 Problem Details.

### 3.3 Property-Based Testing
- Validation test suite with FsCheck / CsCheck or xUnit Theory tests validating:
  - Document State Machine invariants.
  - Progress calculation consistency ($0\% \le \text{progress} \le 100\%$).
  - Multi-department aggregation calculation rules.

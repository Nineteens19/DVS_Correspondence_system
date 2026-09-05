# Application Design — Correspondence Monitoring System (.NET 8)

## 1. System Architecture Overview

The system is designed as a Clean / Layered Architecture running on .NET 8 (C#) with an integrated React SPA frontend:

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client (React + Vite + Tailwind CSS)"]
        UI["SPA Views (Dashboard, Register, List, Detail, Admin, Reports)"]
        APIClient["Axios/Fetch API Client + Interceptors (JWT Token Auth)"]
        Modals["Modals (EDR Number Request, OTP Verification, Delivered Capture)"]
    end

    subgraph ApiLayer["🌐 Presentation / API Layer (Correspondence.Api)"]
        Controllers["REST API Controllers (AuthController, DocumentController, AdminController, ReportController, WebhookController)"]
        Middleware["Security Headers, Global Exception / RFC 7807, Request Logging & JWT Auth Middleware"]
        SPAHoster["SPA Static Web Assets Middleware (Serves React Production Build)"]
    end

    subgraph AppLayer["⚙️ Application Core Layer (Correspondence.Application)"]
        Services["DocumentWorkflowService, AuthService, LdapService, OtpService, EdrSyncService, ReportService"]
        StateMachine["Correspondence State Machine Engine & Delegation Tree Evaluator"]
        Validators["FluentValidation / Input Sanitization"]
        DTOs["Request & Response DTOs / Mappings"]
    end

    subgraph DomainLayer["🏛️ Domain Layer (Correspondence.Domain)"]
        Entities["Document, DocumentAssignment, DocumentHistory, DocumentAttachment, User, Department, MonitorAssignment"]
        Enums["DocType, DocStatus, UrgencyLevel, ConfidentialityLevel, RoleType, ScopeType"]
        Constants["SystemConstants, BusinessRuleConstants"]
    end

    subgraph InfraLayer["💾 Infrastructure Layer (Correspondence.Infrastructure)"]
        DbContext["CorrespondenceDbContext (EF Core 8)"]
        SQLServer["Microsoft SQL Server (Database Engine)"]
        Storage["Local Secure File Storage / AES Gated Path Provider"]
        Email["Email / SMTP Relay Service (OTP & Notifications)"]
        EdrClient["EDR API Gateway Client with Polly Transient Retry"]
    end

    UI --> APIClient
    APIClient --> Controllers
    Controllers --> Services
    Services --> StateMachine
    Services --> DbContext
    DbContext --> SQLServer
    Services --> Storage
    Services --> Email
    Services --> EdrClient
    SPAHoster -.-> UI
```

---

## 2. API Contract Specification

### 2.1 Authentication & User Management
- `POST /api/v1/auth/login`: Authenticate with LDAP/AD credentials, returns JWT Bearer token & user profile.
- `GET /api/v1/auth/me`: Current logged-in user context and permissions.
- `GET /api/v1/admin/users`: List system users with roles and departments.
- `POST /api/v1/admin/users/provision`: Search and provision user from LDAP.
- `PUT /api/v1/admin/users/{id}`: Update user role and department.

### 2.2 Master Data Management
- `GET /api/v1/master/departments`: List active departments and department heads.
- `GET /api/v1/master/workgroups`: List workgroups and members.
- `GET /api/v1/master/delivery-methods`: List delivery methods for outgoing documents.
- `GET /api/v1/master/monitors`: List configured monitor scopes.
- `POST /api/v1/master/monitors`: Create / update monitor assignment.

### 2.3 Document Lifecycle & Workflows
- `GET /api/v1/documents`: Filterable paginated list of incoming and outgoing documents.
- `GET /api/v1/documents/{id}`: Full document details, assignments, attachments, and hierarchical story line.
- `POST /api/v1/documents/incoming`: Register new incoming document with file/camera attachments.
- `POST /api/v1/documents/outgoing`: Register new outgoing document with delivery method.
- `POST /api/v1/documents/{id}/accept`: Accept assigned task (updates Chain of Custody).
- `POST /api/v1/documents/{id}/delegate`: Onward delegation (มอบหมายต่อ) within department.
- `POST /api/v1/documents/{id}/forward`: Forward to another department/user.
- `POST /api/v1/documents/{id}/reject`: Reject task with remarks.
- `POST /api/v1/documents/{id}/complete`: Mark task complete / awaiting physical return.
- `POST /api/v1/documents/{id}/deliver`: Mark outgoing document delivered with proof attachment.
- `POST /api/v1/documents/{id}/recall`: Recall document back to registrar.
- `POST /api/v1/documents/{id}/cancel`: Cancel document with remarks.

### 2.4 Confidential Attachments & OTP Gate
- `POST /api/v1/documents/{id}/otp/request`: Trigger email OTP for Top Secret document.
- `POST /api/v1/documents/{id}/otp/verify`: Verify 6-digit OTP code, returns 15-minute temporary access token.
- `GET /api/v1/documents/{id}/attachments/{attId}/preview`: Gated image/PDF preview with dynamic watermark overlay.
- `GET /api/v1/documents/{id}/attachments/{attId}/download`: Gated file download stream.

### 2.5 EDR System Interoperability & Webhooks
- `GET /api/v1/edr/context`: Pre-flight context check (department abbreviations TH/EN, user verification).
- `POST /api/v1/edr/request-number`: Request outgoing document number (Normal/Special) to EDR.
- `POST /api/v1/edr/webhook/sync`: Reverse webhook receiver for EDR document creations/approvals (Idempotent).

### 2.6 Dashboard & Reports
- `GET /api/v1/dashboard/metrics`: KPI metrics (Incoming, Outgoing, Due soon, Overdue, Completed, In-progress).
- `GET /api/v1/reports/{reportType}`: Reports RPT-01 to RPT-06 with multi-department counting rules.
- `GET /api/v1/reports/{reportType}/export`: Export report to Excel / CSV.

---

## 3. Database Schema & Relational Model

```mermaid
erDiagram
    USERS ||--o{ DOCUMENT_ASSIGNMENTS : receives
    USERS ||--o{ DOCUMENTS : creates
    USERS ||--o{ MONITOR_ASSIGNMENTS : assigned
    DEPARTMENTS ||--o{ USERS : belongs_to
    DEPARTMENTS ||--o{ DOCUMENTS : origin_department
    DEPARTMENTS ||--o{ DOCUMENTS : responsible_department
    DOCUMENTS ||--o{ DOCUMENT_ASSIGNMENTS : has
    DOCUMENTS ||--o{ DOCUMENT_ATTACHMENTS : contains
    DOCUMENTS ||--o{ DOCUMENT_HISTORIES : logs
    DOCUMENTS ||--o{ OTP_TRANSACTIONS : requires
    DOCUMENT_ASSIGNMENTS ||--o{ DOCUMENT_ASSIGNMENTS : parent_child_delegation
```

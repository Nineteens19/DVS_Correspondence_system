# Units of Work — Correspondence Monitoring System (.NET 8)

## 1. Breakdown of Implementation Units

| Unit ID | Unit Name | Scope & Responsibilities | Dependencies |
|---|---|---|---|
| **UNIT-01** | Core Domain & Data Layer | Domain entities, enums, EF Core 8 SQL Server DbContext, schema configurations, seed data for initial users/departments/delivery methods. | None |
| **UNIT-02** | Auth & LDAP Provisioning | JWT Bearer token generation, Mock & Active Directory LDAP integration, Admin user provisioning & RBAC policies. | UNIT-01 |
| **UNIT-03** | Workflow & State Machine | Document registration, State machine transitions (Accept, Reject, Forward, Delegate, Complete, Recall, Cancel), Onward Delegation SubTree, and Chain of Custody tracking. | UNIT-01, UNIT-02 |
| **UNIT-04** | Attachments & OTP Watermarking | Secure file storage, direct file upload/camera capture, email-only 6-digit OTP verification for Top Secret documents, 15-min access token, dynamic watermarking on preview. | UNIT-01, UNIT-02, UNIT-03 |
| **UNIT-05** | EDR Gateway & Parity Webhooks | Pre-flight context check API (`/context`), outgoing number request API (Normal/Special), reverse sync webhook receiver with idempotency, and dual-key support. | UNIT-01, UNIT-03 |
| **UNIT-06** | Dashboard & Reports Aggregator | KPI metric calculations (Incoming/Outgoing, overdue, aging), Reports RPT-01 to RPT-06 with multi-department counting rules and export engine. | UNIT-01, UNIT-03 |
| **UNIT-07** | Frontend SPA Integration | Connecting existing React/TypeScript UI in `mockup/` with .NET 8 Web API endpoints, state management, API error handling, and configuring ASP.NET Core static SPA serving. | UNIT-01 - UNIT-06 |
| **UNIT-08** | Build, Tests & PBT Suite | Automated xUnit tests, Property-Based Testing (State machine & aggregation invariants), and complete build verification. | All Units |

---

## 2. Unit Execution Order
```
UNIT-01 (Domain & Data Layer)
    │
    ▼
UNIT-02 (Auth & LDAP)
    │
    ▼
UNIT-03 (Workflow Engine & State Machine)
    │
    ├──────────────────┬──────────────────┐
    ▼                  ▼                  ▼
UNIT-04 (Attachments) UNIT-05 (EDR Sync) UNIT-06 (Dashboard/Reports)
    │                  │                  │
    └──────────────────┼──────────────────┘
                       ▼
UNIT-07 (Frontend Integration & SPA Hosting)
                       │
                       ▼
UNIT-08 (Build, Testing & Verification)
```

# Code Generation Plan — Correspondence System (.NET 8)

## 1. Plan Overview
This plan defines the step-by-step implementation of the complete .NET 8 solution and its integration with the React UI mockup.

---

## 2. Step-by-Step Generation Checklist

### 📦 Setup & Domain Layer
- [x] **Step 1**: Initialize .NET 8 Solution and Project structure (`Correspondence.Domain`, `Correspondence.Application`, `Correspondence.Infrastructure`, `Correspondence.Api`, `Correspondence.Tests`).
- [x] **Step 2**: Implement Domain Models (`User`, `Department`, `Workgroup`, `Document`, `DocumentAssignment`, `DocumentHistory`, `DocumentAttachment`, `OtpTransaction`, `AttachmentAccessLog`, `MonitorAssignment`, `DeliveryMethod`).

### ⚙️ Application & Business Logic Layer
- [x] **Step 3**: Implement Application DTOs, Mappings, and FluentValidation validators.
- [x] **Step 4**: Implement State Machine Engine, Delegation Tree Hierarchy logic, and Chain of Custody Tracker.
- [x] **Step 5**: Implement OTP Lifecycle Service (6-digit generation, 15-min temporary token, email dispatch) & Dynamic Watermarking.
- [x] **Step 6**: Implement Multi-Department Report Aggregation & KPI Dashboard Service.
- [x] **Step 7**: Implement EDR Service Gateway & Webhook Synchronization.

### 💾 Infrastructure & Persistence Layer
- [x] **Step 8**: Implement EF Core 8 `CorrespondenceDbContext`, Entity Type Configurations, and SQL Server connection.
- [x] **Step 9**: Implement Mock & Real Active Directory LDAP Service and User Provisioning Provider.
- [x] **Step 10**: Implement Secure File Storage Provider & Seed Data Generator.

### 🌐 Web API & Controllers
- [x] **Step 11**: Implement API Controllers (`AuthController`, `DocumentsController`, `AdminController`, `MasterController`, `ReportsController`, `EdrController`).
- [x] **Step 12**: Configure Security Headers Middleware, Global Exception RFC 7807 Handler, JWT Authentication, Polly Retries, and Health Checks in `Program.cs`.

### 🖥️ Frontend Integration & SPA Hosting
- [x] **Step 13**: Implement Frontend API Client in `mockup/` with Axios/Fetch interceptors for JWT token and real REST endpoints.
- [x] **Step 14**: Configure ASP.NET Core 8 to serve the compiled SPA from `wwwroot` with fallback routing.

### 🧪 Testing & Verification
- [x] **Step 15**: Implement Unit Tests & Property-Based Tests (State Machine transitions, Progress calculations, Multi-department reporting rules).
- [x] **Step 16**: Execute Build and Automated Test Suite.
- [x] **Step 17**: Commit and Push to Git repository.

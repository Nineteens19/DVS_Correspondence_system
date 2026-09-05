# คู่มือการใช้งาน Docker สำหรับระบบ Correspondence System

ระบบ Monitor สถานะเอกสารรับเข้า–ส่งออก (Correspondence System) รองรับการรันผ่าน Docker และ Docker Compose ร่วมกับ Microsoft SQL Server 2022

---

## 🚀 สถาปัตยกรรมระบบ (Architecture)

1. **`deves-correspondence-db` (MS SQL Server 2022 Container)**
   - ฐานข้อมูลหลักของระบบ
   - Persistent Volume: `mssql_data`
   - พอร์ตเชื่อมต่อ: `localhost:1433`
2. **`deves-correspondence-app` (Web Application & .NET 8 Web API)**
   - รวม React 19 Frontend SPA + .NET 8 Backend API ไว้ใน Single Container
   - ทำการ Auto-Migrate สคีมา และ Seed ข้อมูล Master Data / Mock Users ให้อัตโนมัติเมื่อ Start
   - Volume สำหรับไฟล์แนบเอกสาร: `app_uploads`
   - พอร์ตเข้าใช้งาน: `http://localhost:8080`

---

## 🛠️ คำสั่งเริ่มต้นใช้งาน (Quick Start)

### 1. เริ่มต้นระบบทั้งหมด (Build & Run in Background)
```bash
docker compose up -d --build
```

### 2. ตรวจสอบสถานะ Containers
```bash
docker compose ps
```

### 3. ดู Log การทำงานของระบบ
```bash
# ดู Log ทั้งหมดแบบ Realtime
docker compose logs -f

# ดูเฉพาะ Log ของ Application
docker compose logs -f app

# ดูเฉพาะ Log ของ MS SQL Server
docker compose logs -f sqlserver
```

### 4. หยุดการทำงาน (Stop Containers)
```bash
docker compose down
```

### 5. ล้างข้อมูลฐานข้อมูลและไฟล์ใหม่ทั้งหมด (Reset / Fresh Start)
```bash
docker compose down -v
```

---

## 🌐 URLs และช่องทางการเข้าใช้งาน

| ช่องทาง / บริการ | URL / Connection | รายละเอียด |
| :--- | :--- | :--- |
| **Web UI (Frontend SPA)** | `http://localhost:8080` | หน้าจอผู้ใช้งานระบบ Correspondence System |
| **Swagger API Documentation** | `http://localhost:8080/swagger` | ทดสอบ REST API ทั้งหมดของระบบ |
| **Health Check Endpoint** | `http://localhost:8080/health` | ตรวจสอบสถานะ API และการเชื่อมต่อ DB |
| **MS SQL Server Connection** | `localhost,1433` | Server: `localhost,1433`<br>User: `sa`<br>Password: `YourStrong@Password!2026`<br>Database: `DevesCorrespondenceDb` |

---

## 🔑 บัญชีผู้ใช้งานสำหรับทดสอบระบบ (Default Mock Accounts)

| Username | Role | สิทธิ์การเข้าถึง |
| :--- | :--- | :--- |
| `saraban` | งานสารบรรณ (ROLE-01) | ลงรับเอกสาร, ออกเลข, มอบหมายงาน |
| `wilai.p` | หัวหน้าฝ่าย (ROLE-03) | รับ/ส่งต่อ/มอบหมายในฝ่ายบริหาร |
| `somchai.p` | ผู้ใช้ทั่วไป (ROLE-02) | ดำเนินการเอกสาร |
| `admin` | ผู้ดูแลระบบ (ROLE-05) | สิทธิ์สูงสุดทุกโมดูล |

*(รหัสผ่าน Mock Login: รองรับการเข้าสู่ระบบผ่าน LDAP Mock / Mock Auth)*

---

## ⚙️ การตั้งค่าเพิ่มเติม (.env)

สามารถคัดลอกไฟล์ `.env.example` เป็น `.env` เพื่อปรับแต่งค่าต่างๆ ได้ตามต้องการ:
```bash
cp .env.example .env
```
สามารถเปลี่ยนพอร์ต `APP_PORT`, `MSSQL_PORT` หรือรหัสผ่าน `MSSQL_SA_PASSWORD` ได้ตามต้องการ

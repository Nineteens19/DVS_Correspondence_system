# THEME.md — สรุปธีมที่ใช้ใน Mockup (ธีม Deves: เทเวศประกันภัย / ระบบ EDNS)

> ไฟล์นี้บันทึก Design Tokens และ Component Specs ตามมาตรฐาน **ธีม Deves (เทเวศประกันภัย)**

---

## 1. Design Tokens (ค่าจริง ต้องตรงทุกตัว)

```css
--primary:        #012169;  /* กรมท่า/น้ำเงินเข้ม — identity หลัก: sidebar, ปุ่มหลัก, ตัวอักษรเน้น */
--primary-dark:   #001a52;
--secondary:      #FFCD00;  /* เหลืองทอง — accent, logo icon, active state บน sidebar */
--secondary-dark: #e6b800;
--bg:             #F8F9FA;  /* พื้นหลังเพจ */
--success:        #28A745;
--danger:         #DC3545;
--warning:        #FD7E14;
--info:           #17A2B8;
--text:           #212529;
--text-muted:     #6C757D;
--border:         #DEE2E6;
```

### แม็ปเข้า Tailwind (`theme.extend.colors` หรือ `@theme inline`)
```ts
colors: {
  primary:   { DEFAULT: '#012169', dark: '#001a52' },
  secondary: { DEFAULT: '#FFCD00', dark: '#e6b800' },
  success: '#28A745',
  danger:  '#DC3545',
  warning: '#FD7E14',
  info:    '#17A2B8',
  bg:      '#F8F9FA',
  border:  '#DEE2E6',
  'text-muted': '#6C757D',
}
```

---

## 2. ฟอนต์ (Typography)
- **Sarabun** (weight 300, 400, 500, 600, 700) เป็น font-sans หลักทั้งเว็บ
- **JetBrains Mono** สำหรับเลขที่เอกสาร / รหัสอ้างอิง

---

## 3. Badge สถานะ (สีเฉพาะ ต้องตรงทุกตัว)

| Badge | ความหมาย | bg | text |
|---|---|---|---|
| `badge-pending` | รออนุมัติ / รอรับงาน | `#FFF3CD` | `#856404` |
| `badge-approved` | อนุมัติ / ใช้งาน / เสร็จสิ้น | `#D4EDDA` | `#155724` |
| `badge-rejected` | ไม่อนุมัติ / เกินกำหนด | `#F8D7DA` | `#721C24` |
| `badge-draft` | ฉบับร่าง / ลงทะเบียนแล้ว | `#E2E3E5` | `#383D41` |
| `badge-returned` | ตีกลับ / รอรับเอกสารคืน | `#FFE5D0` | `#7C3A00` |
| `badge-special` | พิเศษ | `#F8D7DA` | `#721C24` |
| `badge-normal` | ธรรมดา / ส่งออก | `#D1ECF1` | `#0C5460` |
| `badge-urgent` | เร่งด่วน / ด่วนมาก | bg = `#DC3545`, text = ขาว + pulse animation |

---

## 4. Layout Pattern

### Sidebar
- Fixed ซ้าย กว้าง **260px** พื้น `primary` (`#012169`) ตัวอักษรขาว
- **Logo block**: สี่เหลี่ยมมุมโค้ง 8px พื้นเหลือง (`#FFCD00`) ตัวอักษรกรมท่า (`#012169`) ขนาด 40×40px + ข้อความ "ระบบสารบรรณอิเล็กทรอนิกส์" และ "บมจ.เทเวศประกันภัย"
- **Nav menu**:
  - hover: พื้นน้ำเงินเข้ม (`#003080` หรือ `rgba(255,255,255,0.12)`)
  - active: พื้นเหลือง (`#FFCD00`) ตัวอักษรกรมท่า (`#012169`) ตัวหนา
- ล่างสุด: user info block + ปุ่มออกจากระบบ

### Header bar
- พื้นขาว + shadow `0 1px 3px rgba(0,0,0,.08)`
- ซ้าย: breadcrumb คั่นด้วย `>` (ตัวสุดท้ายสี `#012169` ตัวหนา, ก่อนหน้าสี `#6C757D`) หรือ Search bar
- ขวา: user menu (avatar กลมพื้น navy `#012169` ตัวขาว + ชื่อผู้ใช้) + notification icon

### Content area
- `margin-left: 260px`, พื้น `#F8F9FA`, padding ~1.5rem / 24px

---

## 5. Component Spec

- **`Button`**:
  - `primary`: พื้น `#012169` hover `#001a52` ตัวหนังสือขาว
  - `secondary`: พื้น `#FFCD00` hover `#e6b800` ตัวหนังสือ `#012169` ตัวหนา
  - `outline`: ขอบ `#012169` ตัวหนังสือ `#012169` hover พื้น `#012169` ตัวหนังสือขาว
  - `danger`: พื้น `#DC3545` hover `#c82333` ตัวหนังสือขาว
- **`Card`**: พื้นขาว `rounded-xl` shadow `0 1px 3px rgba(0,0,0,0.08)` border `1px solid #DEE2E6`
- **`SummaryCard`**: Card + `border-left: 4px solid [color]` + ตัวเลขใหญ่หนา (`text-2xl font-bold`) + icon ในกรอบ `bg-[color]/10`
- **`DataTable`**: header พื้น `#F8F9FA` ตัวหนังสือสี `#6C757D`, hover row พื้น `#F1F3F5`, border `#DEE2E6`
- **`FilterBar`**: ฟิลด์ inline ใน Card + ปุ่มค้นหา (`primary`) + ล้าง (`outline`)
- **`CameraCaptureModal`**: หน้าต่างถ่ายภาพเอกสารแบบ Realtime (WebRTC/กล้องอุปกรณ์) + เส้นกรอบ Viewfinder สีทอง `#FFCD00` + ปุ่มชัตเตอร์กลม + Flash Effect + Lightbox พรีวิวรูปภาพก่อนแนบจริง

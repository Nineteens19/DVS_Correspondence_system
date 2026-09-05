# Design Document

## Overview

เอกสารออกแบบนี้ครอบคลุมการปรับปรุง **หน้าลงทะเบียนเอกสารส่งออก (Outgoing_Flow)** ให้สอดคล้องกับลักษณะเฉพาะของเอกสารส่งออก 3 ประเด็นหลัก:

1. **ฝ่ายต้นทาง = ฝ่ายที่รับผิดชอบ** สำหรับเอกสารส่งออก และ **ไม่มีการมอบหมายผู้รับงานภายใน (Assign)**
2. เพิ่ม **Master Data รูปแบบการส่ง (Delivery_Method_Master)** และ dropdown เลือกรูปแบบการส่งในฟอร์มส่งออก
3. เพิ่ม **ปุ่มลิงก์ลงทะเบียนให้ ปณ. มารับ (External_Pickup_Button)** เชื่อมต่อระบบภายนอก

งานนี้เป็น **Mockup ส่วนหน้า (Frontend-only)** React + TypeScript + Tailwind CSS (Vite) ใช้ Mock Data ไม่มี Backend/DB/Auth จริง ไม่มี Test Framework ตรวจสอบความถูกต้องผ่าน `pnpm build` เท่านั้น ธีมสี Deves (Navy `#012169` / Gold `#FFCD00`)

**ขอบเขตการเปลี่ยนแปลง:** เฉพาะ `docDirection === 'outgoing'` เท่านั้น — Incoming_Flow ต้องไม่ได้รับผลกระทบ (Requirement 7)

## Architecture

โครงสร้างไฟล์ที่เกี่ยวข้องและทิศทางการพึ่งพา (dependency direction):

```
src/types.ts          ──►  เพิ่ม interface DeliveryMethod (ฐานของ type)
      │
      ▼
src/mock.ts           ──►  เพิ่ม DELIVERY_METHODS + POSTAL_PICKUP_URL (พึ่งพา type)
      │
      ├──────────────────────────────┐
      ▼                              ▼
src/pages/RegisterPage.tsx      src/pages/AdminPage.tsx
(dropdown + single dept +       (Master Data section
 external pickup button)         อ่านอย่างเดียว/toggle)
```

**File-level parallelism:** `types.ts` ต้องเสร็จก่อน → จากนั้น `mock.ts` (พึ่งพา type) → จากนั้น `RegisterPage.tsx` และ `AdminPage.tsx` ทำ **คู่ขนานได้** เพราะเป็นไฟล์คนละไฟล์และพึ่งพา `mock.ts` เท่านั้น ไม่พึ่งพากันเอง

**เอกสารประกอบ:** `P2026-040_Analysis.md` เป็นงาน documentation-only แยกอิสระ ทำคู่ขนานกับงานโค้ดได้

การออกแบบยึดหลัก **Master-Driven Data Entry (BR-1.5)** — ตัวเลือกรูปแบบการส่งมาจาก Master เดียว ใช้ร่วมทั้งฟอร์มลงทะเบียนและหน้า Admin ลดข้อผิดพลาดจากการพิมพ์เอง

## Components and Interfaces

### 1. Type — `src/types.ts`

เพิ่ม interface ใหม่ (ต่อท้ายกลุ่ม master types):

```typescript
// รูปแบบการส่งเอกสารออก (Delivery Method Master) — Master-Driven Data Entry (BR-1.5)
export interface DeliveryMethod {
  id: string              // รหัส เช่น 'dm-01'
  label: string           // ป้ายชื่อภาษาไทย
  active: boolean          // สถานะการใช้งาน — เฉพาะ active=true จึงแสดงใน dropdown
  isPostalPickup?: boolean // true = Postal_Pickup_Option (ผูกกับปุ่มระบบภายนอก)
}
```

หมายเหตุ: ไม่จำเป็นต้องเพิ่มฟิลด์ลงใน `Document` — ค่ารูปแบบการส่งถูกเก็บใน state ของฟอร์มเท่านั้น (mockup) อาจเพิ่ม `deliveryMethod?: string` ใน object ที่ persist ของฟอร์มได้แต่ไม่บังคับ

### 2. Mock consts — `src/mock.ts`

เพิ่มหลังกลุ่ม masters (ใกล้ `DEPARTMENTS` / `DEPARTMENT_OWNERS`) และเพิ่ม `DeliveryMethod` ในบรรทัด import type:

```typescript
import type {
  Document, TimelineEvent, Task, User,
  SubAssignment, CustodyEntry, AuditEntry, DeliveryMethod
} from './types'

// ─── Master Data: รูปแบบการส่งเอกสารออก (Delivery Method) — BR-1.5 ────────────
export const DELIVERY_METHODS: DeliveryMethod[] = [
  { id: 'dm-01', label: 'ไปรษณีย์ลงทะเบียน', active: true },
  { id: 'dm-02', label: 'ไปรษณีย์ด่วนพิเศษ (EMS)', active: true },
  { id: 'dm-03', label: 'ให้ไปรษณีย์มารับ (ปณ. มารับ)', active: true, isPostalPickup: true },
  { id: 'dm-04', label: 'Messenger บริษัท', active: true },
  { id: 'dm-05', label: 'รับด้วยตนเอง (มารับเอง)', active: true },
  { id: 'dm-06', label: 'จัดส่งอิเล็กทรอนิกส์ / อีเมล', active: true },
]

// URL ระบบภายนอกสำหรับลงทะเบียนให้ ปณ. มารับ (mock external link — placeholder)
export const POSTAL_PICKUP_URL = 'https://track.thailandpost.co.th/'
```

- ครบ 6 รายการ (Req 1.2) · ทุกคุณสมบัติ id/label/active/isPostalPickup ครบ (Req 1.3) · มี Postal_Pickup_Option 1 รายการคือ `dm-03` (Req 1.4)

### 3. RegisterPage — `src/pages/RegisterPage.tsx` (เฉพาะ Outgoing_Flow)

**3.1 Import + state**
```typescript
import { /* ...ของเดิม... */ ExternalLink, Truck } from 'lucide-react'
import { USERS, DEPARTMENTS, CURRENT_USER, resolveDepartmentOwner,
         DELIVERY_METHODS, POSTAL_PICKUP_URL } from '../mock'
```
เพิ่ม `deliveryMethod: ''` ใน object `form` ของ `useState`

**3.2 ฟิลด์ฝ่าย (ในการ์ด "ความเร่งด่วน ชั้นความลับ และกำหนดเวลา")**

ปัจจุบันการ์ดนี้แสดง 2 ช่อง: "ฝ่ายต้นทาง" (จาก `originDepartment`) และ "ฝ่ายที่รับผิดชอบ" (อนุมานจากผู้รับมอบหมาย) ปรับให้ render แบบมีเงื่อนไข:

- **OUTGOING:** แสดง **ช่องเดียว** ป้ายกำกับสื่อความหมายว่า *ฝ่ายต้นทาง = ฝ่ายที่รับผิดชอบ* (เช่น "ฝ่ายต้นทาง / ฝ่ายที่รับผิดชอบ") value = `originDepartment` (`CURRENT_USER.department`), `readOnly`, พร้อม helper note:
  > "เอกสารส่งออก: ฝ่ายต้นทางเป็นฝ่ายที่รับผิดชอบ (ส่งออกภายนอก ไม่มีการมอบหมายภายใน)"
  ไม่แสดงช่อง "ฝ่ายที่รับผิดชอบ" แบบอิงผู้รับมอบหมาย (Req 3.1, 3.2)
- **INCOMING:** คงพฤติกรรม 2 ช่องเดิมทุกประการ (Req 7.1)

```tsx
{isIncoming ? (
  <>
    {/* ── ช่องฝ่ายต้นทาง + ช่องฝ่ายที่รับผิดชอบ (โค้ดเดิมทั้งหมด) ── */}
  </>
) : (
  <div className="sm:col-span-2">
    <label className="form-label">ฝ่ายต้นทาง / ฝ่ายที่รับผิดชอบ</label>
    <input type="text" className="form-input bg-slate-50 text-[#6C757D] cursor-not-allowed"
           value={originDepartment} readOnly aria-readonly="true" />
    <p className="text-[11px] text-[#6C757D] mt-1">
      เอกสารส่งออก: ฝ่ายต้นทางเป็นฝ่ายที่รับผิดชอบ (ส่งออกภายนอก ไม่มีการมอบหมายภายใน)
    </p>
  </div>
)}
```

**3.3 Dropdown รูปแบบการส่ง (outgoing only)**

เพิ่มในการ์ดเดียวกัน (หรือการ์ดข้อมูลเอกสารส่งออก) ใช้ styling `form-select` เดิม แสดงเฉพาะ active:

```tsx
{!isIncoming && (
  <div className="sm:col-span-2">
    <label className="form-label">รูปแบบการส่ง (Delivery Method)</label>
    <select className="form-select" value={form.deliveryMethod}
            onChange={e => update('deliveryMethod', e.target.value)}>
      <option value="">— เลือกรูปแบบการส่ง —</option>
      {DELIVERY_METHODS.filter(m => m.active).map(m => (
        <option key={m.id} value={m.id}>{m.label}</option>
      ))}
    </select>
  </div>
)}
```
เก็บ id ที่เลือกใน `form.deliveryMethod` (Req 2.1–2.4)

**3.4 External_Pickup_Button (outgoing only)**

วางใกล้ dropdown หรือในแบนเนอร์ EDR ของ outgoing ใช้ธีม gold/navy + ไอคอน `ExternalLink`:

```tsx
{!isIncoming && (
  <button type="button"
    onClick={() => {
      window.open(POSTAL_PICKUP_URL, '_blank')
      showToast('เปิดระบบภายนอกสำหรับลงทะเบียนให้ ปณ. มารับ (เชื่อมต่อระบบภายนอก)', 'info')
    }}
    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold
               bg-[#FFCD00] hover:bg-[#e6b800] text-[#012169] shadow-sm transition-all">
    <ExternalLink size={14} />
    ลงทะเบียนให้ ปณ. มารับ (ระบบภายนอก)
  </button>
)}
```
- เปิดลิงก์ผ่าน `window.open(POSTAL_PICKUP_URL, '_blank')` + toast เชิงข้อมูล (Req 5.1–5.3)
- ป้ายกำกับ + ไอคอน `ExternalLink` สื่อชัดว่าเป็นระบบภายนอก (Req 5.2)
- **Nicety (optional):** เมื่อ `DELIVERY_METHODS.find(m => m.id === form.deliveryMethod)?.isPostalPickup` เป็น true อาจ highlight ปุ่ม (เช่น ring สีทอง) เพื่อแนะนำผู้ใช้

**3.5 handleSubmit (outgoing)**

สำหรับ outgoing ให้ set ทั้ง `originDepartment` และ `department` = `CURRENT_USER.department` และรวม `deliveryMethod` โดย **ไม่บังคับ** ผู้รับมอบหมาย:

```typescript
const documentToPersist = isIncoming
  ? { ...form, originDepartment: CURRENT_USER.department,
      department: responsibleDepartment, assigneePosition }
  : { ...form, originDepartment: CURRENT_USER.department,
      department: CURRENT_USER.department, deliveryMethod: form.deliveryMethod }
```
- ไม่มี validation ผู้รับมอบหมายสำหรับ outgoing (Req 4.2, 4.3) — `validate()` เดิมไม่ได้บังคับ assignee อยู่แล้ว จึงไม่ต้องแก้

**3.6 Assign_Card** — อยู่ในบล็อก `{isIncoming && (...)}` อยู่แล้ว จึงไม่แสดงใน outgoing โดยธรรมชาติ (Req 4.1) — คงไว้ตามเดิม

### 4. AdminPage — `src/pages/AdminPage.tsx`

ในแท็บ `master-data` เพิ่ม section/การ์ดที่สองใต้ตาราง Department Owner หัวข้อ **"Master Data รูปแบบการส่ง (Delivery Method)"** เป็นตารางแสดง `DELIVERY_METHODS`:

- คอลัมน์: ป้ายชื่อภาษาไทย (label), สถานะ active (badge เขียว "ใช้งาน" / เทา "ปิดใช้งาน"), เครื่องหมาย Postal_Pickup_Option (badge "ปณ. มารับ")
- **ขั้นต่ำ:** ตารางอ่านอย่างเดียวพร้อม badge (Req 6.1, 6.2)
- **ทางเลือก:** จัดการระดับ mockup ด้วย local state `useState(DELIVERY_METHODS)` + ปุ่ม toggle active (Req 6.3)

```tsx
import { DELIVERY_METHODS } from '../mock'
import { Truck } from 'lucide-react' // เพิ่มในกลุ่ม import ไอคอน

// ...ใน activeTab === 'master-data' ต่อจากการ์ดตารางฝ่าย/หัวหน้า...
<div className="card overflow-hidden mt-4">
  <div className="px-5 py-3.5 border-b border-[#DEE2E6] flex items-center gap-2">
    <Truck size={15} className="text-[#012169]" />
    <h3 className="text-sm font-bold text-[#012169]">Master Data รูปแบบการส่ง (Delivery Method)</h3>
  </div>
  <table className="w-full text-sm">
    {/* thead: รูปแบบการส่ง | สถานะ | ประเภท */}
    <tbody className="divide-y divide-[#DEE2E6]">
      {DELIVERY_METHODS.map(m => (
        <tr key={m.id} className="row-hover">
          <td className="px-5 py-3.5 font-bold text-[#212529]">{m.label}</td>
          <td className="px-4 py-3.5">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              m.active ? 'bg-green-100 text-[#28A745]' : 'bg-slate-200 text-slate-600'}`}>
              {m.active ? 'ใช้งาน' : 'ปิดใช้งาน'}
            </span>
          </td>
          <td className="px-4 py-3.5">
            {m.isPostalPickup && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFCD00] text-[#012169]">
                ปณ. มารับ (ระบบภายนอก)
              </span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 5. Analysis document — `P2026-040_Analysis.md` (documentation-only)

- Append รายการ **Change Log** ใหม่ (เพิ่มเลขจากล่าสุด เช่น Draft 1.8.5 → 1.8.6) ระบุ 3 ประเด็น: (a) เอกสารส่งออก ฝ่ายต้นทาง = ฝ่ายที่รับผิดชอบ และไม่มีการ Assign, (b) เพิ่ม Delivery_Method_Master, (c) ปุ่มลิงก์ลงทะเบียนให้ ปณ. มารับผ่านระบบภายนอก
- **ห้ามแก้ไข** ส่วน Workflow Logic / State Machine / Notification Matrix (Req 8.3)
- ทางเลือก: ระบุว่ารูปแบบการส่งสอดคล้องกับ Master-Driven Data Entry (BR-1.5) และเพิ่มแถวใน Master Data Catalog / Controlled-Input Matrix หากทำได้โดยไม่กระทบส่วนอื่น

## Data Models

| Entity | ที่อยู่ | ฟิลด์ |
|--------|--------|-------|
| `DeliveryMethod` | `types.ts` | `id: string`, `label: string`, `active: boolean`, `isPostalPickup?: boolean` |
| `DELIVERY_METHODS` | `mock.ts` | `DeliveryMethod[]` — 6 รายการ (dm-01..dm-06), dm-03 เป็น postal pickup |
| `POSTAL_PICKUP_URL` | `mock.ts` | `string` — URL ระบบภายนอก (placeholder) |
| `form.deliveryMethod` | `RegisterPage` state | `string` — เก็บ `DeliveryMethod.id` ที่เลือก (ค่าว่าง = ยังไม่เลือก) |

**Persisted (outgoing) shape:** `{ ...form, originDepartment: CURRENT_USER.department, department: CURRENT_USER.department, deliveryMethod }` — mockup เท่านั้น ไม่เขียนลง DB

## Error Handling

- **Dropdown ไม่ได้เลือก:** `form.deliveryMethod === ''` ยอมรับได้ (ไม่บังคับตาม requirements) — ค่า default เป็นค่าว่าง
- **Master ว่าง/ไม่มี active:** `.filter(m => m.active)` คืน array ว่าง → dropdown มีเพียง option placeholder ไม่เกิด error
- **`window.open` ถูกบล็อก (popup blocker):** ยังคงแสดง toast เชิงข้อมูลเสมอ ผู้ใช้รับรู้การกระทำ
- **Incoming ไม่กระทบ:** ตรรกะใหม่อยู่ในเงื่อนไข `!isIncoming` ทั้งหมด — ค่า `deliveryMethod` ไม่ถูกใช้ใน incoming path

## Correctness Properties

> **หมายเหตุ (Optional):** โปรเจกต์นี้ **ไม่มี Test Framework** ตรวจสอบผ่าน `pnpm build` + ทดสอบด้วยมือ ส่วนนี้เป็นการระบุคุณสมบัติเชิงตรรกะเพื่อเป็นแนวทางทดสอบด้วยมือเท่านั้น (ไม่บังคับให้เขียน automated test)

### Property 1: Active filter

*สำหรับทุก* รายการที่แสดงใน dropdown รูปแบบการส่ง ทุกตัวต้องมี `active === true`

**Validates: Requirements 2.2**

### Property 2: Origin equals Responsible

*สำหรับทุก* การลงทะเบียน outgoing ค่า `originDepartment` และ `department` ที่ persist ต้องเท่ากับ `CURRENT_USER.department`

**Validates: Requirements 3.3**

### Property 3: No-assign submit

*สำหรับทุก* การลงทะเบียน outgoing การยืนยันต้องสำเร็จโดยไม่ต้องมีข้อมูลผู้รับมอบหมาย

**Validates: Requirements 4.3**

### Property 4: Incoming invariant

*สำหรับทุก* การ render/submit ใน incoming พฤติกรรมฟิลด์ฝ่ายและ Assign_Card ต้องเหมือนเดิม

**Validates: Requirements 7.1, 7.2**

## Testing Strategy

- **Build check:** รัน `pnpm build` — ต้องคอมไพล์ผ่านไม่มี TypeScript error (Req 8.1) *(ผู้ใช้รันเองในเทอร์มินัล)*
- **Manual verification (outgoing):** เปิดหน้าลงทะเบียนส่งออก → ตรวจว่ามี dropdown รูปแบบการส่ง (6 ตัวเลือก), ช่องฝ่ายช่องเดียวพร้อม helper note, ปุ่ม ปณ. มารับเปิดลิงก์ + toast, ไม่มี Assign_Card, submit สำเร็จโดยไม่เลือกผู้รับมอบหมาย
- **Manual verification (incoming):** เปิดหน้าลงทะเบียนรับเข้า → ตรวจว่าไม่มี dropdown/ปุ่ม ปณ., ยังมี 2 ช่องฝ่าย + Assign_Card ทำงานเหมือนเดิม
- **Manual verification (admin):** แท็บ `master-data` → เห็นตารางรูปแบบการส่งพร้อม badge สถานะและเครื่องหมาย ปณ. มารับ

## Design-to-Requirements Mapping

| Requirement | ส่วนออกแบบที่รองรับ |
|-------------|---------------------|
| 1. Delivery_Method_Master | §2 (`DELIVERY_METHODS` 6 รายการ, dm-03 postal pickup), §1 (interface) |
| 2. Dropdown รูปแบบการส่ง | §3.1 (state), §3.3 (dropdown filter active) |
| 3. ฝ่ายต้นทาง = ฝ่ายที่รับผิดชอบ | §3.2 (ช่องเดียว read-only), §3.5 (persist origin=dept) |
| 4. ไม่มีการ Assign | §3.5 (ไม่บังคับ assignee), §3.6 (Assign_Card incoming-only) |
| 5. External_Pickup_Button | §3.4 (ปุ่ม + window.open + toast + icon) |
| 6. จัดการ Master ใน Admin | §4 (ตารางใต้ Department Owner + badge) |
| 7. Incoming ไม่กระทบ | §3.2/§3.6 (เงื่อนไข isIncoming), Error Handling |
| 8. Build + เอกสาร | §5 (Change Log), Testing Strategy (`pnpm build`) |

# Design Document

## Overview

ฟีเจอร์นี้ปรับปรุงการควบคุมการเข้าถึงเอกสารระดับ "ลับมาก" (`confidentiality === 'top-secret'`) ในแอป Mockup งานสารบรรณ (React + TypeScript + Tailwind, Vite, frontend-only, Mock Data) โดยมี 3 การเปลี่ยนแปลงหลัก:

1. **Full-flow access** — เพิ่ม helper ใน `src/mock.ts` ที่คำนวณ "ชุดผู้มีสิทธิ์เต็มสาย" (Authorized Set) จากการรวม (union) แหล่งข้อมูล 3 แหล่ง (assignedTo + sub-assignments ทุกสถานะ + custody log) เพื่อให้ทุกคนที่เคยอยู่ใน flow — รวมผู้ที่ดำเนินการและส่งต่อไปแล้ว — ยังเปิดเอกสารได้
2. **คงประตูตรวจ OTP** — ผู้มีสิทธิ์ยังต้องยืนยัน OTP ก่อนปลดล็อกเนื้อหา/ไฟล์แนบ (พฤติกรรม `showOtpModal` / `isOtpVerified` เดิมไม่เปลี่ยน)
3. **OTP ผ่านอีเมลเท่านั้น** — ตัด `userPhone` และการอ้างอิง SMS/เบอร์โทรออกจาก `OtpVerificationModal` ให้เหลือช่องทางอีเมล (`userEmail`) เท่านั้น

เอกสารระดับ `normal` / `confidential` / ไม่ระบุ ไม่ได้รับผลกระทบ การตรวจสอบทำผ่าน `pnpm build` เนื่องจากโปรเจกต์ไม่มี Test framework

ภาษาโค้ดตัวอย่าง: TypeScript / TSX (สอดคล้อง codebase เดิม) · ธีม Deves (Navy `#012169` / Gold `#FFCD00`)

## Architecture

### Data-flow ของการคำนวณ Authorized Set

```
docId
  │
  ▼
getFlowAuthorizedUsers(docId)
  ├── DOCUMENTS.find(d => d.id === docId)?.assignedTo ?? []          → ชื่อผู้ได้รับมอบหมาย
  ├── (SUB_ASSIGNMENTS[docId] ?? []).map(s => s.assigneeName)         → ชื่อผู้รับงานย่อย (ทุกสถานะ)
  └── (CUSTODY_LOG[docId] ?? []).map(c => c.holder)                   → ชื่อผู้ถือครองในสายงาน
  │
  ▼
union + dedupe (Set)  ──►  string[]  (Authorized Set)
```

### Decision-flow ของการเข้าถึงใน DocumentDetailPage

```
เปิดหน้า DocumentDetailPage(docId)
  │
  ├── isTopSecret === false ─────────────► isAssigned = true  (พฤติกรรมเดิม ไม่แตะ Authorized Set)
  │
  └── isTopSecret === true
        │
        ▼
      isAssigned = isFlowAuthorized(doc.id, CURRENT_USER)
        │
        ├── false ─► คงล็อกเนื้อหา/ไฟล์แนบ · ไม่แสดงปุ่มยืนยัน OTP
        │
        └── true  ─► แสดงปุ่มยืนยัน OTP (Case 2)
                       │
                       ▼
                     OTP_Gate: showOtpModal → OtpVerificationModal (email-only)
                       │
                       └── onSuccess → isOtpVerified = true ─► ปลดล็อกเนื้อหา/ไฟล์แนบ (Case 3)
```

จุดสำคัญ: helper เป็น pure function ที่อ่านจาก mock data โดยตรง การตัดสินสิทธิ์ทั้งหมดเกิดขึ้นฝั่ง client และมีผลเฉพาะการแสดงผล UI (mock — ไม่มีการบังคับสิทธิ์ระดับ backend)

## Components and Interfaces

### 1. `src/mock.ts` — helper ใหม่

เพิ่มฟังก์ชัน 2 ตัว (pure functions) ไว้ท้ายไฟล์หลังนิยาม `DOCUMENTS`, `SUB_ASSIGNMENTS`, `CUSTODY_LOG`, `CURRENT_USER`:

```typescript
/**
 * คำนวณชุดผู้มีสิทธิ์เต็มสาย (Full-flow Authorized Set) ของเอกสารลับมาก
 * รวม (union) รายชื่อจาก 3 แหล่ง แล้ว dedupe:
 *   1. doc.assignedTo
 *   2. assigneeName ของ SUB_ASSIGNMENTS[docId] ทุกสถานะ
 *   3. holder ของ CUSTODY_LOG[docId]
 * รองรับ key ที่ขาดหาย/ว่างโดยไม่ throw (คืน [] เมื่อไม่มีข้อมูลเลย)
 * (REQ 1.1–1.6)
 */
export function getFlowAuthorizedUsers(docId: string): string[] {
  const doc = DOCUMENTS.find(d => d.id === docId)
  const assigned = doc?.assignedTo ?? []
  const subNames = (SUB_ASSIGNMENTS[docId] ?? []).map(s => s.assigneeName)
  const holders = (CUSTODY_LOG[docId] ?? []).map(c => c.holder)
  return Array.from(new Set([...assigned, ...subNames, ...holders]))
}

/**
 * Predicate: ตรวจว่า user อยู่ใน Authorized Set ของเอกสารหรือไม่
 * ใช้การเทียบชื่อแบบผ่อนปรน (normalized contains/equality) เพื่อรองรับ
 * รูปแบบชื่อที่ปนกันใน mock data เช่น 'Teerapat', 'teerapat.ti', 'นายสมชาย ใจดี'
 * โดยเทียบกับทั้ง user.name และ user.username
 * (REQ 2.1, 2.3, 2.4)
 */
export function isFlowAuthorized(docId: string, user: User): boolean {
  const authorized = getFlowAuthorizedUsers(docId)
  const norm = (s: string) => s.trim().toLowerCase()
  const candidates = [norm(user.name), norm(user.username)]
  return authorized.some(entry => {
    const e = norm(entry)
    // เทียบเท่ากันตรง ๆ หรือชื่อ/username เป็นส่วนหนึ่งของ entry (และกลับกัน)
    return candidates.some(c => e === c || e.includes(c) || c.includes(e))
  })
}
```

หมายเหตุการออกแบบ predicate:
- ใช้ normalized `trim().toLowerCase()` + `includes` สองทิศทาง เพื่อให้ครอบทั้งกรณี entry ยาว (`'Mr. Teerapat Tiangkool'`) เทียบกับ username สั้น (`'teerapat.ti'`) และกรณีชื่อไทยเต็ม
- ตั้งใจ "ผ่อนปรนแบบ mock" ตามสไตล์เดิมของ codebase (โค้ดเดิมใช้ `.includes('Teerapat')` ฯลฯ) ไม่ทำ strict identity matching
- `CURRENT_USER` ปัจจุบันคือ `somchai.j` → `name: 'นายสมชาย ใจดี'` ซึ่งอยู่ใน `assignedTo`, `SUB_ASSIGNMENTS`, และ `CUSTODY_LOG` ของ `doc-001` จึงผ่านสิทธิ์

### 2. `src/pages/DocumentDetailPage.tsx` — เปลี่ยนการคำนวณ `isAssigned`

แทนที่การเทียบรายชื่อแบบ hardcode (~บรรทัด 115) ด้วยการเรียก predicate ใหม่ และจำกัดการคำนวณไว้เฉพาะเอกสารลับมาก:

```typescript
// เดิม (hardcoded literal names)
const isAssigned = doc.assignedTo
  ? doc.assignedTo.some(a => a.includes('Teerapat') || a.includes('teerapat.ti') || a.includes('สมชาย') || a.includes('นายสมชาย'))
  : true

// ใหม่ (REQ 2.1, 2.5, 5.1–5.3)
const isAssigned = isTopSecret
  ? isFlowAuthorized(doc.id, CURRENT_USER)   // ลับมาก: เทียบกับ Authorized Set เต็มสาย
  : true                                     // ปกติ/ลับ: พฤติกรรมเดิม (ไม่ล็อก)
```

- ต้อง import `isFlowAuthorized`, `CURRENT_USER` จาก `../mock`
- state `showOtpModal` / `isOtpVerified` และเงื่อนไข render Case 2 / Case 3 คงเดิมทั้งหมด (REQ 3.1–3.4)
- ผลลัพธ์: past/forwarded participants ที่อยู่ใน sub-assignments หรือ custody log จะได้ `isAssigned = true` เท่ากับผู้ถือครองปัจจุบัน (REQ 2.3)

### 3. `src/components/ui.tsx` — `OtpVerificationModal` เหลืออีเมลอย่างเดียว

การเปลี่ยน prop signature:

```typescript
// เดิม
function OtpVerificationModal({
  isOpen, onClose, onSuccess, docNumber,
  userPhone = '081-xxx-5678',
  userEmail = 'teerapat.ti@deves.co.th',
  showToast
}: { ...; userPhone?: string; userEmail?: string; ... })

// ใหม่ (REQ 4.4, 4.5) — ลบ userPhone ออกทั้ง default และ type
function OtpVerificationModal({
  isOpen, onClose, onSuccess, docNumber,
  userEmail = 'teerapat.ti@deves.co.th',
  showToast
}: { ...; userEmail?: string; ... })
```

การเปลี่ยนข้อความ (info text) — อ้างอีเมลเท่านั้น (REQ 4.1, 4.2):

```tsx
// เดิม: "...ส่งรหัส OTP 6 หลัก ไปยังเบอร์โทร {userPhone} และอีเมล {userEmail}"
// ใหม่:
<p className="mt-0.5 text-amber-800 leading-relaxed">
  ระบบได้ส่งรหัส OTP 6 หลัก ไปยังอีเมล <span className="font-bold text-amber-950">{userEmail}</span>
</p>
```

การเปลี่ยน resend toast (REQ 4.3):

```typescript
// เดิม: `ส่งรหัส OTP ใหม่ไปยัง SMS / Email เรียบร้อยแล้ว (Ref: ${newRef})`
// ใหม่:
showToast(`ส่งรหัส OTP ใหม่ไปยังอีเมลเรียบร้อยแล้ว (Ref: ${newRef})`, 'info')
```

### 4. Call-site update — `src/pages/DocumentDetailPage.tsx`

จุดเรียกโมดัล (~บรรทัด 1244) ต้องลบ prop `userPhone` ออก (REQ 4.4):

```tsx
// เดิม
<OtpVerificationModal
  ...
  docNumber={doc.docNumber}
  userPhone="081-xxx-5678"
  userEmail="teerapat.ti@deves.co.th"
  showToast={showToast}
/>

// ใหม่ — ตัด userPhone ทิ้ง
<OtpVerificationModal
  ...
  docNumber={doc.docNumber}
  userEmail="teerapat.ti@deves.co.th"
  showToast={showToast}
/>
```

หากไม่ลบ prop นี้ TypeScript จะรายงาน error (property ไม่มีใน type ใหม่) → ทำให้ `pnpm build` ไม่ผ่าน (REQ 6.1)

### 5. เอกสารวิเคราะห์ `P2026-040_Analysis.md` (documentation-only)

- ปรับถ้อยคำกฎ **BR-1.4-C** ให้สะท้อน (ก) การเข้าถึงแบบเต็มสายสำหรับเอกสารลับมาก และ (ข) การส่ง OTP ผ่านอีเมลเท่านั้น (REQ 6.2)
- แก้เฉพาะถ้อยคำ/กฎเชิงเอกสาร ห้ามแตะ workflow logic, State Machine หรือ Notification Matrix (REQ 6.3)
- เพิ่มรายการเวอร์ชันใหม่ต่อท้ายใน Change Log (REQ 6.4)

## Data Models

ไม่มีการเพิ่ม/แก้ไขชนิดข้อมูลใน `src/types.ts` ทั้งหมดใช้โครงสร้างเดิม:

| โครงสร้าง | ฟิลด์ที่ใช้ | บทบาทในฟีเจอร์ |
|-----------|------------|----------------|
| `Document` | `id`, `assignedTo?`, `confidentiality?` | แหล่งที่ 1 ของ Authorized Set + เกณฑ์ top-secret |
| `SubAssignment` | `assigneeName`, `status` | แหล่งที่ 2 (รวมทุกสถานะ) |
| `CustodyEntry` | `holder` | แหล่งที่ 3 |
| `User` | `name`, `username`, `email` | ตัวตนที่ใช้เทียบใน predicate |

## Error Handling

- **docId / key ที่ไม่มีอยู่:** `getFlowAuthorizedUsers` ใช้ `?.` และ `?? []` ทุกแหล่ง → คืน `[]` โดยไม่ throw (REQ 1.6)
- **ไม่มี assignedTo:** `doc?.assignedTo ?? []` จัดการ undefined ได้
- **ชื่อว่าง/ช่องว่าง:** `norm()` ทำ `trim()` ก่อนเทียบ ลดการ match ผิดจากช่องว่าง
- **ไม่พบเอกสาร:** DocumentDetailPage มี fallback `?? DOCUMENTS[0]` เดิม จึงไม่เกิด null reference

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.*

> หมายเหตุ: โปรเจกต์ไม่มี Test framework ติดตั้ง property ด้านล่างจึงเป็น **optional (PBT ไม่บังคับ)** ใช้เป็นสเปกอ้างอิงสำหรับการตรวจด้วยตาและการยืนยันผ่าน `pnpm build` หากติดตั้ง test framework ในอนาคต (เช่น Vitest + fast-check) สามารถนำมาเขียนเป็น property test ได้โดยตรง

### Property 1: Authorized set completeness (optional)

*For any* เอกสาร `doc` ใด ๆ ชื่อทุกตัวใน `doc.assignedTo`, ทุก `assigneeName` ใน `SUB_ASSIGNMENTS[doc.id]` (ทุกสถานะ รวม forwarded/cancelled) และทุก `holder` ใน `CUSTODY_LOG[doc.id]` จะต้องปรากฏอยู่ในผลลัพธ์ของ `getFlowAuthorizedUsers(doc.id)`

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Authorized set uniqueness (optional)

*For any* `docId` ใด ๆ ผลลัพธ์ของ `getFlowAuthorizedUsers(docId)` จะต้องไม่มีรายชื่อซ้ำ (`result.length === new Set(result).size`)

**Validates: Requirements 1.5**

### Property 3: Empty/missing sources are safe (optional)

*For any* `docId` ที่ไม่มีข้อมูลใน `DOCUMENTS`, `SUB_ASSIGNMENTS` หรือ `CUSTODY_LOG` การเรียก `getFlowAuthorizedUsers(docId)` จะต้องคืนค่าอาร์เรย์ (คืน `[]` เมื่อไม่มีข้อมูลเลย) โดยไม่ throw

**Validates: Requirements 1.6**

### Property 4: Membership decides top-secret access (optional)

*For any* เอกสารลับมากและผู้ใช้ใด ๆ `isFlowAuthorized(doc.id, user)` จะคืน `true` ก็ต่อเมื่อชื่อหรือ username ของผู้ใช้ตรง (แบบ normalized contains/equality) กับสมาชิกใน Authorized Set — ผู้ที่เคยส่งต่อหรือถือครองในอดีตแต่ยังอยู่ในเซ็ตต้องได้ผลเท่ากับผู้ถือครองปัจจุบัน และผู้ที่อยู่นอกเซ็ตต้องได้ `false`

**Validates: Requirements 2.1, 2.3, 2.4**

### Property 5: OTP gate invariant for top-secret (optional)

*For any* เอกสารลับมาก เนื้อหา/ไฟล์แนบจะปลดล็อกได้ก็ต่อเมื่อ `isAssigned === true` **และ** `isOtpVerified === true` เท่านั้น ในทุกกรณีที่ `isOtpVerified === false` เนื้อหา/ไฟล์แนบต้องคงสถานะล็อก

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: Non-top-secret documents unaffected (optional)

*For any* เอกสารที่ `confidentiality !== 'top-secret'` (รวม `normal`, `confidential`, และไม่ระบุ) ค่า `isAssigned` จะเป็น `true` เสมอ และฟีเจอร์นี้จะไม่บังคับการคำนวณ Authorized Set หรือประตูตรวจ OTP

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: OTP messaging is email-only (optional)

*For any* ค่า `userEmail` ข้อความ info และข้อความ resend toast ของ `OtpVerificationModal` จะต้องอ้างอิงอีเมลปลายทางเท่านั้น และต้องไม่มีการอ้างถึงเบอร์โทรหรือ SMS

**Validates: Requirements 4.1, 4.2, 4.3**

## Testing Strategy

โปรเจกต์เป็น Mockup frontend-only และ **ไม่มี Test framework** ติดตั้ง กลยุทธ์การตรวจสอบจึงยึดตามที่ requirements กำหนด:

- **Build check (บังคับ):** รัน `pnpm build` หลังแก้โค้ดทุกครั้ง ต้องคอมไพล์ผ่านโดยไม่มี error โดยเฉพาะจุด call-site ที่ตัด `userPhone` ออก ซึ่ง TypeScript จะจับได้ทันทีหากยังอ้าง prop เดิม (REQ 6.1)
- **Manual/example verification:** ตรวจด้วยตาบนหน้า DocumentDetailPage ของ `doc-001` (ลับมาก) — ยืนยันว่า `CURRENT_USER` (somchai.j) ผ่านสิทธิ์ (Case 2 แสดงปุ่ม OTP), เมื่อยืนยัน OTP สำเร็จเนื้อหาปลดล็อก (Case 3), และโมดัล OTP แสดงอีเมลอย่างเดียวไม่มีเบอร์โทร/SMS
- **Property-based testing (optional):** properties ในหัวข้อ Correctness Properties เป็นสเปกอ้างอิง หากในอนาคตติดตั้ง Vitest + fast-check สามารถนำ Property 1–7 มาเขียนเป็น property test (≥100 iterations ต่อ property) โดยอ้างอิงหมายเลข property ในรูปแบบ **Feature: top-secret-flow-access, Property {number}** ได้ทันที ปัจจุบันจัดเป็น optional เพราะไม่มี test runner
- **Documentation review:** ตรวจ diff ของ `P2026-040_Analysis.md` ว่าจำกัดเฉพาะถ้อยคำ BR-1.4-C และการเพิ่ม Change Log โดยไม่แตะ workflow logic (REQ 6.2–6.4)

## Design-to-Requirements Mapping

| องค์ประกอบการออกแบบ | Requirements ที่ครอบคลุม |
|----------------------|--------------------------|
| `getFlowAuthorizedUsers()` helper (union 3 แหล่ง + dedupe + missing-key safe) | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 |
| `isFlowAuthorized()` predicate (normalized name/username matching) | 2.1, 2.3, 2.4 |
| `isAssigned` ใหม่ใน DocumentDetailPage (เรียก helper แทน hardcode) | 2.1, 2.5, 5.1, 5.2, 5.3 |
| คง `showOtpModal` / `isOtpVerified` / Case 2 / Case 3 | 2.2, 3.1, 3.2, 3.3, 3.4 |
| ลบ `userPhone` prop + info text อีเมลอย่างเดียว + resend toast อีเมล | 4.1, 4.2, 4.3, 4.4 |
| คง `userEmail` prop | 4.5 |
| Call-site: ตัด `userPhone` จากการเรียกโมดัล | 4.4, 6.1 |
| `pnpm build` เป็นจุดตรวจ | 6.1 |
| ปรับ BR-1.4-C + Change Log ใน `P2026-040_Analysis.md` (เชิงเอกสาร) | 6.2, 6.3, 6.4 |

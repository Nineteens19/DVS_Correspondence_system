# Implementation Plan: top-secret-flow-access

## Overview

แผนการพัฒนาแบ่งงานออกเป็น task ระดับโค้ดตามการออกแบบ โดยแยกตามไฟล์เพื่อรองรับการทำงานคู่ขนาน (file-level parallelism):

- `src/mock.ts` — เพิ่ม helper สองตัว (`getFlowAuthorizedUsers`, `isFlowAuthorized`) เป็นฐานที่ task อื่นพึ่งพา
- `src/pages/DocumentDetailPage.tsx` — เปลี่ยน `isAssigned` ให้เรียก helper และตัด prop `userPhone` ที่ call-site (ไฟล์เดียว = task เดียว) ขึ้นกับ helper ใน `mock.ts`
- `src/components/ui.tsx` — ปรับ `OtpVerificationModal` ให้เหลืออีเมลอย่างเดียว (ไฟล์แยก ทำคู่ขนานกับ `mock.ts` และเอกสารได้)
- `P2026-040_Analysis.md` — ปรับถ้อยคำ BR-1.4-C + Change Log (เชิงเอกสาร ไม่ขึ้นกับใคร)

โปรเจกต์เป็น Mockup frontend-only (React + TypeScript + Tailwind, Vite) ไม่มี Test framework การตรวจสอบใช้ `pnpm build` (script คือ `vite build`) ร่วมกับ `pnpm exec tsc --noEmit` สำหรับ type check property-based test ทั้งหมดจึงเป็น optional (ทำเครื่องหมาย `*` และข้ามได้)

## Tasks

- [ ] 1. เพิ่ม helper คำนวณ Authorized Set ใน `src/mock.ts`
  - เพิ่มฟังก์ชัน `getFlowAuthorizedUsers(docId: string): string[]` ท้ายไฟล์หลังนิยาม `DOCUMENTS`, `SUB_ASSIGNMENTS`, `CUSTODY_LOG`, `CURRENT_USER`
  - รวม (union) 3 แหล่ง: `doc.assignedTo`, `assigneeName` ของ `SUB_ASSIGNMENTS[docId]` ทุกสถานะ, `holder` ของ `CUSTODY_LOG[docId]` แล้ว dedupe ด้วย `Set`
  - ใช้ `?.` และ `?? []` ทุกแหล่งเพื่อรองรับ key/เอกสารที่ขาดหายโดยไม่ throw (คืน `[]` เมื่อไม่มีข้อมูล)
  - เพิ่มฟังก์ชัน `isFlowAuthorized(docId: string, user: User): boolean` ที่เทียบชื่อแบบ normalized (`trim().toLowerCase()` + `includes` สองทิศทาง) กับทั้ง `user.name` และ `user.username`
  - ให้ `export` ทั้งสองฟังก์ชัน และ import type `User` หากยังไม่มีในไฟล์
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.3, 2.4_

  - [ ]* 1.1 เขียน property test สำหรับ helper (optional — ข้ามเพราะไม่มี test framework)
    - **Property 1: Authorized set completeness** — Validates: Requirements 1.2, 1.3, 1.4
    - **Property 2: Authorized set uniqueness** — Validates: Requirements 1.5
    - **Property 3: Empty/missing sources are safe** — Validates: Requirements 1.6
    - **Property 4: Membership decides top-secret access** — Validates: Requirements 2.1, 2.3, 2.4

- [ ] 2. ปรับ `OtpVerificationModal` ให้เหลืออีเมลอย่างเดียวใน `src/components/ui.tsx`
  - ลบ prop `userPhone` ออกทั้งจาก default parameter และ type signature ของ `OtpVerificationModal`
  - คง prop `userEmail` ไว้ (default `'teerapat.ti@deves.co.th'`)
  - แก้ info text ให้อ้างเฉพาะอีเมลปลายทาง (`{userEmail}`) ไม่กล่าวถึงเบอร์โทร/SMS
  - แก้ resend toast เป็น `ส่งรหัส OTP ใหม่ไปยังอีเมลเรียบร้อยแล้ว (Ref: ${newRef})` ตัดคำว่า SMS ออก
  - (ทางเลือกในขอบเขต) หากทำได้ง่ายแบบ inline ที่ `src/components/ui.tsx:1278` ให้ครอบ ref callback ด้วยปีกกาเพื่อคืน `void` (`ref={el => { inputRefs.current[idx] = el }}`) เพื่อแก้ error typing ของ React 19 — เป็นทางเลือก ห้ามขยายขอบเขต
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.1 เขียน property test สำหรับข้อความ OTP (optional — ข้ามเพราะไม่มี test framework)
    - **Property 7: OTP messaging is email-only** — Validates: Requirements 4.1, 4.2, 4.3

- [ ] 3. ปรับ `isAssigned` และ call-site ใน `src/pages/DocumentDetailPage.tsx`
  - import `isFlowAuthorized`, `CURRENT_USER` จาก `../mock`
  - แทนที่การเทียบรายชื่อแบบ hardcode (~บรรทัด 115) ด้วย `const isAssigned = isTopSecret ? isFlowAuthorized(doc.id, CURRENT_USER) : true`
  - คง state `showOtpModal` / `isOtpVerified` และเงื่อนไข render Case 2 / Case 3 ไว้ทั้งหมด (ไม่แตะ OTP gate)
  - ที่ call-site ของ `<OtpVerificationModal ... />` (~บรรทัด 1244) ลบ prop `userPhone="081-xxx-5678"` ออก คง `userEmail` ไว้
  - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 3.3, 3.4, 4.4, 5.1, 5.2, 5.3_

  - [ ]* 3.1 เขียน property test สำหรับการตัดสินสิทธิ์และ OTP gate (optional — ข้ามเพราะไม่มี test framework)
    - **Property 5: OTP gate invariant for top-secret** — Validates: Requirements 3.1, 3.2, 3.3, 3.4
    - **Property 6: Non-top-secret documents unaffected** — Validates: Requirements 5.1, 5.2, 5.3

- [ ] 4. ปรับปรุงเอกสารวิเคราะห์ `P2026-040_Analysis.md`
  - แก้ถ้อยคำกฎ **BR-1.4-C** ให้สะท้อน (ก) การเข้าถึงแบบเต็มสายสำหรับเอกสารลับมาก และ (ข) การส่ง OTP ผ่านอีเมลเท่านั้น
  - แก้เฉพาะถ้อยคำ/กฎเชิงเอกสาร ห้ามแตะ workflow logic, State Machine หรือ Notification Matrix
  - เพิ่มรายการเวอร์ชันใหม่ต่อท้ายใน Change Log
  - _Requirements: 6.2, 6.3, 6.4_

- [ ] 5. Checkpoint — ตรวจ build และความสะอาดของโค้ด
  - รัน `pnpm build` (script `vite build`) — ต้องผ่านโดยไม่มี error
  - รัน `pnpm exec tsc --noEmit` — ต้องไม่มี error ใหม่ อนุญาตเฉพาะ error เดิมที่ไม่เกี่ยวกับฟีเจอร์นี้ที่ `src/components/ui.tsx:1278` (React 19 ref-callback typing ของ `OtpVerificationModal`) เท่านั้น หาก task 2 แก้ไป inline แล้ว error นี้ควรหายไปด้วย ถือว่า build ผ่าน
  - ตรวจว่าไม่มี reference `userPhone` หรือ SMS/เบอร์โทรหลงเหลือในโค้ดที่เกี่ยวข้อง (`ui.tsx`, `DocumentDetailPage.tsx`)
  - หากพบ error ใหม่นอกเหนือจากที่ระบุ ให้แก้ไขก่อนปิดงาน และสอบถามผู้ใช้หากมีข้อสงสัย
  - _Requirements: 6.1_

## Notes

- Task ย่อยที่ทำเครื่องหมาย `*` เป็น optional (property test) และถูกข้ามทั้งหมดเพราะโปรเจกต์ไม่มี test framework — properties อ้างอิงหมายเลขจากส่วน Correctness Properties ใน design.md
- แต่ละ task อ้างอิง requirement clause เฉพาะเพื่อ traceability
- ข้อจำกัดระดับไฟล์: การแก้ `isAssigned` และ call-site เป็นไฟล์เดียวกัน (`DocumentDetailPage.tsx`) จึงรวมเป็น task เดียว; `ui.tsx` เป็นไฟล์แยกทำคู่ขนานกับ `mock.ts` และเอกสารได้; `DocumentDetailPage.tsx` ต้องรอ helper ใน `mock.ts` ก่อน
- Error เดิมที่ `ui.tsx:1278` เป็นปัญหา pre-existing ไม่เกี่ยวกับฟีเจอร์นี้ — checkpoint ถือว่า build ผ่านหากเหลือเพียง error นี้เท่านั้น

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "4", "1.1", "2.1"] },
    { "id": 1, "tasks": ["3", "3.1"] }
  ]
}
```

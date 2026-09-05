# Implementation Plan: การปรับปรุงหน้าลงทะเบียนเอกสารส่งออก (รูปแบบการส่ง + ฝ่ายต้นทาง + ปุ่ม ปณ. มารับ)

## Overview

แผนงานนี้แปลงเอกสารออกแบบเป็นชุดงานเขียนโค้ดแบบเพิ่มทีละขั้น (incremental) สำหรับ Mockup ส่วนหน้า React + TypeScript + Tailwind CSS (Vite) ใช้ Mock Data ไม่มี Backend/DB/Auth และ **ไม่มี Test Framework** ตรวจสอบความถูกต้องผ่าน `pnpm build` (สคริปต์คือ `vite build`) และ `pnpm exec tsc --noEmit` สำหรับตรวจ type

ลำดับการพึ่งพาไฟล์: `src/types.ts` → `src/mock.ts` → (`src/pages/RegisterPage.tsx` ‖ `src/pages/AdminPage.tsx`) โดยสองไฟล์สุดท้ายทำคู่ขนานได้เพราะเป็นคนละไฟล์และพึ่งพา `mock.ts` เท่านั้น ส่วนงานเอกสาร `P2026-040_Analysis.md` เป็นงานอิสระทำได้ตั้งแต่ต้น

**ขอบเขต:** เปลี่ยนแปลงเฉพาะ `docDirection === 'outgoing'` เท่านั้น — Incoming_Flow ต้องไม่ได้รับผลกระทบ

## Tasks

- [ ] 1. เพิ่ม type `DeliveryMethod` ใน `src/types.ts`
  - เพิ่ม interface `DeliveryMethod` ต่อท้ายกลุ่ม master types
  - ฟิลด์: `id: string`, `label: string`, `active: boolean`, `isPostalPickup?: boolean`
  - เป็นงานฐาน (foundational) ไม่พึ่งพาไฟล์อื่น
  - _Requirements: 1.3_

- [ ] 2. เพิ่ม Master Data รูปแบบการส่งใน `src/mock.ts`
  - เพิ่ม `DeliveryMethod` เข้าไปในบรรทัด `import type { ... } from './types'`
  - ประกาศ `export const DELIVERY_METHODS: DeliveryMethod[]` จำนวน 6 รายการ (dm-01..dm-06) โดย `dm-03` กำหนด `isPostalPickup: true` และ label "ให้ไปรษณีย์มารับ (ปณ. มารับ)"
  - ประกาศ `export const POSTAL_PICKUP_URL = 'https://track.thailandpost.co.th/'` (placeholder ระบบภายนอก)
  - วางใกล้กลุ่ม masters เดิม (เช่น `DEPARTMENTS` / `DEPARTMENT_OWNERS`)
  - พึ่งพา Task 1
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. ปรับ `src/pages/RegisterPage.tsx` สำหรับ Outgoing_Flow
  - [ ] 3.1 เพิ่ม import และ state
    - เพิ่ม `ExternalLink`, `Truck` ในกลุ่ม import จาก `lucide-react`
    - เพิ่ม `DELIVERY_METHODS`, `POSTAL_PICKUP_URL` ในกลุ่ม import จาก `../mock`
    - เพิ่ม `deliveryMethod: ''` ใน object `form` ของ `useState`
    - พึ่งพา Task 2
    - _Requirements: 2.3_

  - [ ] 3.2 ปรับฟิลด์ฝ่ายให้ render ตามเงื่อนไข `isIncoming`
    - OUTGOING: แสดงช่องเดียว ป้าย "ฝ่ายต้นทาง / ฝ่ายที่รับผิดชอบ" value = `originDepartment` (`CURRENT_USER.department`), `readOnly` + helper note
    - ไม่แสดงช่อง "ฝ่ายที่รับผิดชอบ" ที่อิงผู้รับมอบหมายใน outgoing
    - INCOMING: คงพฤติกรรม 2 ช่องเดิมทุกประการ (ห่อโค้ดเดิมไว้ในสาขา `isIncoming`)
    - _Requirements: 3.1, 3.2, 7.1_

  - [ ] 3.3 เพิ่ม dropdown "รูปแบบการส่ง (Delivery Method)" (outgoing only)
    - แสดงเฉพาะเมื่อ `!isIncoming` ใช้ styling `form-select` เดิม
    - ตัวเลือกมาจาก `DELIVERY_METHODS.filter(m => m.active)` + option placeholder ค่าว่าง
    - `onChange` เก็บ `id` ที่เลือกไว้ใน `form.deliveryMethod` ผ่าน `update('deliveryMethod', ...)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.4 เพิ่ม External_Pickup_Button (outgoing only)
    - แสดงเฉพาะเมื่อ `!isIncoming` ใช้ธีม gold/navy + ไอคอน `ExternalLink`
    - `onClick`: `window.open(POSTAL_PICKUP_URL, '_blank')` + `showToast(...,'info')` เชิงข้อมูล
    - ป้ายกำกับ + ไอคอนสื่อชัดว่าเป็นระบบภายนอก
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 3.5 ปรับ handleSubmit สำหรับ outgoing
    - outgoing: set `originDepartment` และ `department` = `CURRENT_USER.department` และรวม `deliveryMethod: form.deliveryMethod`
    - ไม่บังคับผู้รับมอบหมาย (assignee) สำหรับ outgoing — คง `validate()` เดิม
    - Assign_Card อยู่ในบล็อก `{isIncoming && (...)}` อยู่แล้ว จึงไม่แสดงใน outgoing โดยธรรมชาติ
    - incoming path คงเดิมทุกประการ
    - _Requirements: 3.3, 4.1, 4.2, 4.3, 7.2_

  - [ ]* 3.6 ทดสอบเชิงคุณสมบัติ (property tests) — ข้าม (ไม่มี Test Framework)
    - **Property 1: Active filter** — dropdown แสดงเฉพาะรายการ `active === true`
    - **Property 2: Origin equals Responsible** — outgoing persist `originDepartment === department === CURRENT_USER.department`
    - **Property 3: No-assign submit** — outgoing submit สำเร็จโดยไม่มีผู้รับมอบหมาย
    - **Property 4: Incoming invariant** — incoming render/submit เหมือนเดิม
    - **Validates: Requirements 2.2, 3.3, 4.3, 7.1, 7.2**

- [ ] 4. เพิ่ม Master Data section รูปแบบการส่งใน `src/pages/AdminPage.tsx`
  - เพิ่ม import `DELIVERY_METHODS` จาก `../mock` และ `Truck` จาก `lucide-react`
  - ในแท็บ `master-data` เพิ่มการ์ด/ตารางใต้ตาราง Department Owner หัวข้อ "Master Data รูปแบบการส่ง (Delivery Method)"
  - คอลัมน์: ป้ายชื่อภาษาไทย (label), สถานะ active (badge เขียว "ใช้งาน" / เทา "ปิดใช้งาน"), เครื่องหมาย Postal_Pickup_Option (badge "ปณ. มารับ (ระบบภายนอก)")
  - ขั้นต่ำ: ตารางอ่านอย่างเดียวพร้อม badge
  - พึ่งพา Task 2 · เป็นคนละไฟล์กับ Task 3 จึงทำคู่ขนานได้
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 5. เพิ่ม Change Log ใน `P2026-040_Analysis.md` (documentation-only)
  - เพิ่มรายการ Change Log ใหม่ (increment เวอร์ชันล่าสุด: Draft 1.8.4 → 1.8.5)
  - ระบุ 3 ประเด็น: (a) เอกสารส่งออก ฝ่ายต้นทาง = ฝ่ายที่รับผิดชอบ และไม่มีการ Assign, (b) เพิ่ม Delivery_Method_Master, (c) ปุ่มลิงก์ลงทะเบียนให้ ปณ. มารับผ่านระบบภายนอก
  - **ห้ามแก้ไข** ส่วน Workflow Logic / State Machine / Notification Matrix
  - งานอิสระ ทำได้ตั้งแต่ต้น (wave 0)
  - _Requirements: 8.2, 8.3_

- [ ] 6. Checkpoint — ตรวจสอบ build และ incoming ไม่กระทบ
  - รัน `pnpm build` (สคริปต์ `vite build`) และ `pnpm exec tsc --noEmit` — ต้องไม่มี error ใหม่
  - หมายเหตุ: error เดิมที่ `ui.tsx:1278` ถูกแก้ไปแล้วในฟีเจอร์ก่อนหน้า ดังนั้น tsc ควรสะอาด
  - ยืนยันด้วยสายตาว่า Incoming_Flow (ฟิลด์ฝ่าย 2 ช่อง + Assign_Card) ทำงานเหมือนเดิม ไม่มี dropdown/ปุ่ม ปณ.
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 8.1, 7.1, 7.2_

## Notes

- งานที่มีเครื่องหมาย `*` เป็นงานทดสอบที่ **ข้าม** เนื่องจากโปรเจกต์นี้ไม่มี Test Framework — ตรวจสอบด้วย `pnpm build` + `pnpm exec tsc --noEmit` และการทดสอบด้วยมือแทน
- แต่ละงานอ้างอิงข้อกำหนดเฉพาะเพื่อการ trace กลับ (traceability)
- Task 3 (RegisterPage) และ Task 4 (AdminPage) เป็นคนละไฟล์ → ทำคู่ขนานได้ ทั้งคู่พึ่งพา `mock.ts` (Task 2)
- Task 1 → Task 2 เป็นลำดับ (dependency chain) แต่คนละไฟล์
- Task 5 (เอกสาร) เป็นงานอิสระ อยู่ใน wave 0

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "5"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3.1", "4"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["3.5"] },
    { "id": 5, "tasks": ["3.6"] }
  ]
}
```

# Implementation Plan: Monitor Multi-Scope

## Overview

แผนการนำ Monitor Multi-Scope ไปใช้จริงในโค้ด โดยเริ่มจาก type layer (`types.ts`) ซึ่งเป็น breaking change ที่บังคับให้เลเยอร์อื่นต้องปรับตาม จากนั้นจึงย้าย mock data และปรับ UI/logic ใน `AdminPage.tsx` (ทั้งสองพึ่งพา type ใหม่) แล้วปิดท้ายด้วย checkpoint ตรวจ build งานปรับปรุงเอกสารวิเคราะห์ `P2026-040_Analysis.md` เป็น documentation-only จึงเป็นอิสระและรันขนานได้

โปรเจกต์เป็น frontend-only mockup (React + TypeScript + Tailwind บน Vite) ไม่มี test framework การตรวจสอบหลักคือ `tsc --noEmit` / `pnpm build` การเพิ่ม property test (Vitest + fast-check) เป็นทางเลือกและต้องติดตั้ง dependency ก่อน

## Tasks

- [ ] 1. ปรับสัญญาข้อมูล `MonitorAssignment`
  - [ ] 1.1 ปรับ interface `MonitorAssignment` (`src/types.ts`)
    - เปลี่ยนฟิลด์ `scopeRef: string` → `scopeRefs: string[]`
    - เพิ่มฟิลด์ optional `allDepartments?: boolean`
    - ลบฟิลด์ `scopeLabel: string` (label จะ derive ตอน render)
    - คงฟิลด์เดิม: `scopeType`, `docDirectionFilter`, `notifyEnabled`, `effectiveFrom/To`, `status`, `createdBy`, `createdAt`
    - เป็น breaking change ที่บังคับให้ทุก reader ของ `scopeRef`/`scopeLabel` ต้องแก้ (compiler จะรายงาน)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. ย้าย Mock Data เข้าโครงสร้างใหม่ (`src/mock.ts`)
  - [ ] 2.1 Migrate `MONITOR_ASSIGNMENTS` ทุกแถวและลบ `scopeLabel`
    - mon-001 → `scopeRefs: ['ฝ่ายการเงิน', 'ฝ่ายพัสดุและจัดซื้อ']`, `allDepartments: false` (สาธิต multi-dept)
    - mon-002 → `scopeRefs: ['wg-04']`, `allDepartments: false` (workgroup เดี่ยว)
    - mon-003 → `scopeRefs: []`, `allDepartments: true` (สาธิต all-departments)
    - คงค่า `monitorUserId`, `monitorUserName`, `monitorUserDept`, `scopeType`, `docDirectionFilter`, `notifyEnabled`, `status`, `createdBy`, `createdAt` ของแถวเดิม
    - ลบฟิลด์ `scopeRef`/`scopeLabel` ออกทุกแถว
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 3. ปรับ Monitor form state และ helpers (`src/pages/AdminPage.tsx`)
  - [ ] 3.1 ปรับ shape ของ `monForm` และ `resetMonForm`
    - เปลี่ยน `scopeRef: string` → `scopeRefs: string[]` และเพิ่ม `allDepartments: boolean`
    - ค่าเริ่มต้น: `scopeType: 'department'`, `scopeRefs: []`, `allDepartments: false`
    - เปลี่ยน `scopeType` → clear ทั้ง `scopeRefs: []` และ `allDepartments: false`
    - _Requirements: 2.5_
  - [ ] 3.2 ปรับ `buildScopeLabel` เป็นแบบ per-target และคง `getScopeTargetOptions`
    - รับ `(scopeType, ref)` เดี่ยว คืน label ต่อรายการ พร้อม fallback เป็น ref ดิบเมื่อหา master ไม่พบ
    - _Requirements: 4.1_
  - [ ]* 3.3 Write property test for scope-type change reset
    - **Property 4: Scope-type change resets targets**
    - **Validates: Requirements 2.5**
    - หมายเหตุ: ต้องเพิ่ม Vitest + fast-check เข้าโปรเจกต์ก่อน (โปรเจกต์ยังไม่มี test framework)

- [ ] 4. Multi-select และ ตัวเลือก "ทุกฝ่าย" ใน Monitor Modal (`src/pages/AdminPage.tsx`)
  - [ ] 4.1 เพิ่ม department multi-select checkbox list + toggle "ทุกฝ่าย"
    - แสดง checkbox list ของ `DEPARTMENTS` (multi-select) เมื่อ `scopeType === 'department'`
    - toggle ฝ่าย → เพิ่ม/ลบค่าใน `scopeRefs`
    - toggle "ทุกฝ่าย" → set `allDepartments`; เมื่อ true ให้ `scopeRefs: []` + disable รายฝ่าย; เมื่อ false ให้ enable กลับ
    - scope อื่น (workgroup/user/doc_direction) → เลือกเป้าหมายจาก `getScopeTargetOptions()` จัดเก็บเป็น `scopeRefs`
    - ใช้สีธีม Deves (Navy `#012169` / Gold `#FFCD00`)
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 7.2_
  - [ ]* 4.2 Write property test for all-departments toggle invariant
    - **Property 3: All-departments toggle invariant**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [ ] 5. Save/Edit logic และ active-user picker (`src/pages/AdminPage.tsx`)
  - [ ] 5.1 ปรับ `saveMonitor` พร้อม validity guard และคง multiple-assignment
    - block save เมื่อ `!allDepartments && scopeRefs.length === 0` (คง modal เปิด)
    - เมื่อ `allDepartments === true` ให้บันทึก `scopeRefs: []`; `allDepartments` เป็น true ได้เฉพาะ `scopeType === 'department'`
    - บันทึก `monitorUserId`/`monitorUserName`/`monitorUserDept` ตรงกับผู้ใช้ที่เลือก; ไม่ dedup (ผู้ใช้เดียวมีได้หลาย assignment); แสดง success toast
    - Monitor_User_Picker list เฉพาะ `USERS` ที่ `active === true`
    - _Requirements: 1.5, 2.4, 3.5, 5.1, 5.2, 5.3, 5.4, 7.1, 7.3_
  - [ ] 5.2 ปรับ `openEditMonitor` ให้ populate `scopeRefs` และ `allDepartments`
    - copy `scopeRefs` (`[...m.scopeRefs]`) และ `allDepartments: m.allDepartments ?? false` เข้าฟอร์ม
    - _Requirements: 4.4_
  - [ ]* 5.3 Write property test for save-validity invariant
    - **Property 1: Save-validity invariant**
    - **Validates: Requirements 1.5, 2.4, 3.5**
  - [ ]* 5.4 Write property test for multi-scope storage round-trip
    - **Property 2: Multi-scope storage round-trip**
    - **Validates: Requirements 2.2, 2.3, 4.4**
  - [ ]* 5.5 Write property test for monitor user picker fidelity
    - **Property 6: Monitor user picker fidelity**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 6. แสดงขอบเขตหลายรายการในตาราง Monitor (`src/pages/AdminPage.tsx`)
  - [ ] 6.1 Render Scope column แบบ multi-chip + scope-type badge
    - `allDepartments === true` → chip เดียวข้อความ "ทุกฝ่าย"
    - อื่น ๆ → หนึ่ง chip ต่อหนึ่ง `scopeRefs` entry ด้วย `buildScopeLabel(mon.scopeType, ref)`
    - แสดง scope-type badge (`SCOPE_LABELS[mon.scopeType]`) เสมอ
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 6.2 Write property test for scope column chip rendering
    - **Property 5: Scope column chip rendering**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 7. Checkpoint - ยืนยัน build ผ่าน
  - รัน `pnpm build` (tsc --noEmit + Vite build) ให้ผ่านโดยไม่มี TypeScript error และไม่มีการอ้าง `scopeRef`/`scopeLabel` เดิมเหลืออยู่
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 9.1, 9.2_

- [ ] 8. ปรับปรุงเอกสารวิเคราะห์ (Documentation Only)
  - [ ] 8.1 อัปเดต `P2026-040_Analysis.md` ให้สะท้อน multi-scope + all-departments
    - อัปเดตหมวด 3.5 ให้อธิบาย Monitor เฝ้าติดตามได้หลายฝ่าย + ตัวเลือก "ทุกฝ่าย (all departments)"
    - อัปเดตกฎ BR-5.3 ให้ครอบคลุมการเลือกหลายเป้าหมายและตัวเลือกทุกฝ่าย
    - อัปเดต Data Model `MONITOR_ASSIGNMENT` ให้สะท้อน `scope_refs` (แทน `scope_ref`) และ flag `all_departments`
    - append change-log entry ใหม่ (documentation-only ไม่แก้ตรรกะกระบวนการ/State Machine/Notification Matrix)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

## Notes

- Task ที่มี `*` เป็น property test ที่เป็นทางเลือก — ต้องเพิ่ม Vitest + fast-check เข้าโปรเจกต์ก่อน เนื่องจากยังไม่มี test framework การตรวจสอบหลักคือ `pnpm build` และตรวจด้วยสายตาบน dev server
- Task 1 (`types.ts`) เป็นจุดตั้งต้น breaking change ต้องทำก่อน task อื่นที่แตะโค้ด
- Task 2 (mock) และ task 3–6 (AdminPage) พึ่งพา type ใหม่ แต่แก้คนละไฟล์กันจึงรันขนานกันได้ ยกเว้น task ใน AdminPage ที่แก้ไฟล์เดียวกันต้องเรียงลำดับกัน
- Task 8 เป็น documentation-only ในไฟล์นอก `src/` จึงเป็นอิสระและรันขนานได้ตั้งแต่ต้น
- แต่ละ task อ้างอิง requirement clause เฉพาะเพื่อ traceability
- คำสั่ง `pnpm build` / `pnpm dev` ให้ผู้ใช้รันเองในเทอร์มินัล (ไม่รันใน watch mode)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "8.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["4.1", "4.2"] },
    { "id": 4, "tasks": ["5.1", "5.3", "5.5"] },
    { "id": 5, "tasks": ["5.2", "5.4"] },
    { "id": 6, "tasks": ["6.1", "6.2"] }
  ]
}
```

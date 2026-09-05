# Implementation Plan: Delegation SubTree & Stateful Custody

## Overview

แผนการพัฒนานี้แปลงเอกสารออกแบบเป็นชุดงานเขียนโค้ดแบบเพิ่มทีละขั้น สำหรับ Mockup (Frontend-only React + TypeScript + Tailwind, Vite, ธีม Deves) โดยกระจายการเปลี่ยนแปลงใน 4 ไฟล์โค้ด + 1 ไฟล์เอกสาร ตามลำดับพึ่งพา (file-level parallelism):

- `src/types.ts` (รากฐาน) → เพิ่ม `parentId?: string`
- `src/components/ui.tsx` และ `src/mock.ts` ทำขนานกับรากฐานได้
- `src/pages/DocumentDetailPage.tsx` ขึ้นกับทั้งสามไฟล์ข้างต้น จึงทำเป็นลำดับหลัง
- `P2026-040_Analysis.md` เป็น documentation-only ทำเมื่อใดก็ได้

โปรเจกต์นี้**ไม่มี Test Framework** งานทดสอบคุณสมบัติ (property tests) จึงถูกทำเครื่องหมาย `*` (optional/ข้าม) และการตรวจสอบจริงใช้ `pnpm build` + `pnpm exec tsc --noEmit` และการทดสอบด้วยมือ

## Tasks

- [ ] 1. เพิ่มฟิลด์ `parentId` ใน `SubAssignment` (รากฐาน)
  - [ ] 1.1 เพิ่ม `parentId?: string` ใน `src/types.ts`
    - แก้อินเทอร์เฟซ `SubAssignment` ให้มีฟิลด์ `parentId?: string` (id ของ Parent_Sub, `undefined` = root)
    - คงฟิลด์เดิมทั้งหมด (`id`, `docId`, `assigneeName`, `assigneeType`, `department`, `status`, `acceptedAt?`, `note?`, `forwardedTo?`) โดยไม่เปลี่ยนความหมาย
    - ไม่แตะอินเทอร์เฟซ `CustodyEntry` และ `TimelineEvent`
    - _Requirements: 1.1, 1.3, 1.4_

- [ ] 2. ปรับ `Timeline` ให้เรนเดอร์แบบเรียกซ้ำไม่จำกัดระดับ
  - [ ] 2.1 Refactor recursive Timeline ใน `src/components/ui.tsx`
    - แยกการเรนเดอร์ลูกออกเป็นคอมโพเนนต์ `TimelineChildNode` ที่ map `child.children` เรียกตัวเองซ้ำทุกความลึก (เพิ่มพารามิเตอร์ `depth` คุมระยะเยื้อง `pl-12` ต่อชั้น)
    - คง public API เดิม: `Timeline({ events })` และ `TimelineNode`
    - ดึงบล็อกเดิมมาใช้ซ้ำเป็น `renderNodeBody`, `NodeCircleTop`, `NodeCircleChild` โดยคงสไตล์ Deves (เส้นเชื่อมแนวตั้ง, elbow 33px, วงกลมโหนดสองสไตล์, การ์ด `customNode`)
    - โหนดที่ไม่มีลูก (`hasChildren === false`) เรนเดอร์ตามพฤติกรรมเดิมโดยไม่แสดงชั้นซ้อนเพิ่ม
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 3. เพิ่มข้อมูลจำลองการมอบหมายซ้อนชั้น
  - [ ] 3.1 เพิ่มตัวอย่าง nested delegation บน doc-001 ใน `src/mock.ts`
    - เพิ่ม `sa-001-8` (งานฝ่ายการเงิน, `assigneeType: 'department'`, `status: 'accepted'`, root) ต่อท้าย `SUB_ASSIGNMENTS['doc-001']`
    - เพิ่ม `sa-001-9` (`นายสมชาย ใจดี`, `assigneeType: 'person'`, `status: 'accepted'`, `parentId: 'sa-001-8'`) เป็นลูก
    - ตรวจชื่อผู้ใช้ให้มีอยู่ใน `USERS` และสอดคล้อง `DEPARTMENT_OWNERS`/`subordinateCandidates` (owner = `นายวิชัย เจริญผล`)
    - คงข้อมูลเดิมทั้งหมด (`sa-001-1`…`sa-001-7`, `CUSTODY_LOG`) ไว้ valid ไม่เปลี่ยนความหมาย
    - _Requirements: 5.1, 5.2_

- [ ] 4. ปรับ `DocumentDetailPage` ให้สร้าง SubTree และติดตามการถือครองแบบ stateful
  - [ ] 4.1 Delegation lineage + tree builder + relax delegate button
    - แก้ `buildDelegation` ให้กำหนด `parentId: parent.id`, `department: parent.department`, `status: 'pending'` (รองรับมอบต่ออีกทอดอัตโนมัติผ่าน `handleConfirmDelegate` เดิมที่ append เข้า `subsState`)
    - เพิ่ม helper ระดับโมดูล `buildSubTree(subs, toEvent)` แปลง flat → nested: sub ที่ `parentId` ตรง id ที่มีอยู่จริง → วางเป็น child; ไม่มี `parentId` หรือ orphan (`parentId` ชี้ id ที่ไม่มีใน list) → root (กันข้อมูลสูญหาย)
    - แนบผลลัพธ์เข้าโหนด assign (t5) ผ่าน `assignNode.children = buildSubTree(subsState, toSubEvent)` (nested แทน flat) โดย `toSubEvent` reuse การ์ด sub เดิม (`customNode`)
    - ผ่อนเงื่อนไขปุ่ม delegate เป็น "แสดงเมื่อ `status === 'accepted'`" (ทั้งงานฝ่ายและงานบุคคลที่รับแล้ว) เพื่อให้ chain งอกต่อได้ทุกความลึก; คงปุ่ม accept-as-owner เดิม (`assigneeType === 'department' && status === 'pending'`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 4.2 Stateful custody + การ์ดผู้ถือครองปัจจุบัน
    - เปลี่ยน custody เป็น state: `const [custodyState, setCustodyState] = useState<CustodyEntry[]>(CUSTODY_LOG[doc.id] ?? [])`
    - เพิ่ม `trackCustody = doc.type === 'physical' && doc.docDirection === 'incoming'` และ helper `appendCustody(holder, department, action, note?)` ที่ append รายการใหม่ต่อท้าย (คงลำดับเดิม) เฉพาะเมื่อ `trackCustody === true` (no-op สำหรับ email/outgoing)
    - เรียก `appendCustody(...)` ใน Custody_Change_Action: `handleAccept` (`holding`), `handleAcceptAsOwner` (`holding`), `handleConfirmDelegate` (`handed-over`), และ forward ถ้ามี (`handed-over`)
    - render แท็บ Chain of Custody จาก `custodyState` และคงป้าย "ถือครองล่าสุด" ที่ `index === custodyState.length - 1`; คง gating เดิม (`isPhysical && !isOutgoing`) และ `count: custodyState.length`
    - เปลี่ยนหัวข้อการ์ดคอลัมน์ขวาเป็น "ผู้ถือครองปัจจุบัน (เอกสารตัวจริง)" โดยดึงจาก `custodyState[custodyState.length - 1]` (fallback `doc.currentHolder` เมื่อไม่ track)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 9.1, 9.2, 9.3_

  - [ ]* 4.3 เขียน property tests สำหรับ tree builder และ custody (ข้าม — ไม่มี Test Framework)
    - **Property 1: parentId lineage จากการมอบหมายต่อ** — `buildDelegation(p, u)` ต้องได้ `parentId === p.id`, `department === p.department`, `status === 'pending'`
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - **Property 2: ต้นไม้ครอบคลุมทุก sub และ non-root ปรากฏใต้ parent เพียงครั้งเดียว** — จำนวนโหนดรวม = `subs.length`, ไม่ซ้ำไม่หาย
    - **Validates: Requirements 3.1, 3.2, 3.4**
    - **Property 3: orphan/undefined parentId → root** — sub ที่ `parentId` undefined หรือ orphan ต้องเป็น root เสมอ
    - **Validates: Requirements 3.3, 3.5**
    - **Property 4: custody append คงลำดับเดิมและต่อท้าย** — `custodyState` = seed เดิม + รายการเพิ่มตามลำดับ, Current_Holder = รายการสุดท้ายเสมอ
    - **Validates: Requirements 6.2, 6.4, 7.1, 7.4**

- [ ] 5. ปรับปรุงเอกสารวิเคราะห์ (documentation-only)
  - [ ] 5.1 เพิ่ม Change Log ใน `P2026-040_Analysis.md`
    - เพิ่มรายการ Change Log ใหม่ต่อท้าย โดยเพิ่มเลขจาก Draft 1.8.6 → 1.8.7
    - ระบุการแสดง Story Line แบบ SubTree การมอบหมายซ้อนชั้น อ้างอิง **BR-2.4-A (Onward Delegation)**
    - ระบุการติดตามผู้ถือครองเอกสารฉบับจริงปัจจุบัน (Stateful Chain of Custody) อ้างอิง **BR-6.1**
    - คงเนื้อหาส่วน Workflow Logic, State Machine และ Notification Matrix ไว้โดยไม่เปลี่ยนแปลง
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 6. Checkpoint — Build & Type check
  - รัน `pnpm build` และ `pnpm exec tsc --noEmit` ต้องผ่านโดยไม่มีข้อผิดพลาดใหม่
  - ทดสอบด้วยมือ: เปิด doc-001 เห็น SubTree ซ้อนชั้น (`ฝ่ายการเงิน` → `นายสมชาย ใจดี`) เยื้องตามความลึก; กด accept-as-owner แล้ว delegate เกิดลูกใหม่ nested และ chain งอกต่อได้; Chain of Custody เพิ่มรายการต่อท้าย + ป้าย "ถือครองล่าสุด" ย้ายตาม; การ์ดขวาแสดง "ผู้ถือครองปัจจุบัน (เอกสารตัวจริง)"; เอกสาร email/outgoing ไม่มีแท็บ/ข้อมูล custody พฤติกรรมเดิมไม่เปลี่ยน
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 11.1, 11.2_

## Notes

- งานที่ทำเครื่องหมาย `*` เป็น optional และถูกข้าม (โปรเจกต์ไม่มี Test Framework) — คุณสมบัติ (properties) ใช้เป็นแนวตรวจด้วยมือ/เหตุผลเชิงตรรกะ
- แต่ละงานอ้างอิงข้อกำหนดเฉพาะเพื่อ traceability
- ลำดับพึ่งพาไฟล์: `types.ts` (รากฐาน) → `ui.tsx`/`mock.ts`/เอกสาร (ขนาน) → `DocumentDetailPage.tsx` (รวมทุกส่วน)
- Checkpoint ท้ายสุดใช้ `pnpm build` + `pnpm exec tsc --noEmit` เป็นตัวตรวจหลัก

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["4.2"] },
    { "id": 4, "tasks": ["4.3"] }
  ]
}
```

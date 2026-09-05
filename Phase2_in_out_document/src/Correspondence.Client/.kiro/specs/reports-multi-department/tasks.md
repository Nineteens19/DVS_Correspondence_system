# Implementation Plan: reports-multi-department

## Overview

แผนงานนี้แปลง design เป็นชุดงานเขียนโค้ดที่ทำตามลำดับได้จริง: (1) เพิ่ม helpers บริสุทธิ์/deterministic ใน `src/mock.ts` เพื่อคำนวณ Involved Departments, By-Department Aggregate และ Receive Performance Aggregate, (2) แก้ `src/pages/ReportsPage.tsx` ให้ใช้ helpers เหล่านั้นแทน `Math.random()`/ค่าคงที่เดิม พร้อมทำให้ตัวกรองทำงานจริง, (3) ปรับปรุงเอกสารวิเคราะห์ `P2026-040_Analysis.md` (independent, documentation-only) ให้สอดคล้องกับกติกาการนับหลายฝ่าย โปรเจกต์เป็น frontend-only mockup (React + TypeScript + Tailwind + Vite) ไม่มี test framework — การตรวจสอบใช้ `pnpm build` และ `pnpm exec tsc --noEmit` เท่านั้น Correctness Properties ในเอกสารออกแบบเป็น optional (ไม่มี test framework) จึงอ้างอิงไว้เป็นคอมเมนต์ในโค้ดแทนการเขียนเทสอัตโนมัติ

## Tasks

- [x] 1. เพิ่มฟังก์ชันช่วยและ interface ใหม่ใน `src/mock.ts`
  - เพิ่มต่อจาก `SUB_ASSIGNMENTS` ในไฟล์เดิม (ไม่แก้ `DOCUMENTS`/`SUB_ASSIGNMENTS`/`DEPARTMENTS`/`types.ts`)
  - _Requirements: 1.6, 2.4, 3.7_

  - [x] 1.1 เขียน `getInvolvedDepartments(docId: string): string[]`
    - หา `doc` จาก `DOCUMENTS.find(d => d.id === docId)`; ถ้าไม่พบคืน `[]`
    - รวม `SUB_ASSIGNMENTS[docId]?.map(s => s.department) ?? []` กับ `doc.department` และ `doc.originDepartment`
    - dedup แบบคงลำดับการพบครั้งแรกด้วย `Array.from(new Set(...))` และ `.filter(Boolean)` กรองค่าว่าง
    - ห้ามใช้ `Math.random`/`Date.now()` (deterministic)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x]* 1.2 คอมเมนต์อ้างอิง Property 1 และ Property 2 เหนือฟังก์ชัน `getInvolvedDepartments`
    - **Property 1: Involved departments are deduped and deterministic — Validates: Requirements 1.1, 1.5, 1.6**
    - **Property 2: Involved departments cover subs, responsible, and origin — Validates: Requirements 1.2, 1.3, 1.4**
    - บันทึกไว้เป็นเอกสารอ้างอิงเชิงตรรกะ (ไม่มี test framework จึงไม่ implement เป็นเทสอัตโนมัติ)

  - [x] 1.3 เขียน `getDocumentsInvolvingDepartment(dept: string): Document[]`
    - `DOCUMENTS.filter(d => getInvolvedDepartments(d.id).includes(dept))`
    - _Requirements: 2.1, 2.2_

  - [x] 1.4 เขียน `export interface DeptAggregateRow` และฟังก์ชัน `reportByDepartment(docs: Document[] = DOCUMENTS): DeptAggregateRow[]`
    - สำหรับทุก `dept` ใน `DEPARTMENTS`: `involved = docs.filter(d => getInvolvedDepartments(d.id).includes(dept))`
    - คืน `{ dept, total: involved.length, completed: involved.filter(status==='completed').length, overdue: involved.filter(deadlineFlag==='overdue').length }`
    - deterministic, ไม่ใช้ `Math.random`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x]* 1.5 คอมเมนต์อ้างอิง Property 3 และ Property 4 เหนือฟังก์ชัน `reportByDepartment`
    - **Property 3: A document is counted under every department it involves — Validates: Requirements 2.1, 2.2**
    - **Property 4: Completed and overdue counts are bounded and deterministic — Validates: Requirements 2.3, 2.4**
    - บันทึกไว้เป็นเอกสารอ้างอิงเชิงตรรกะ (ไม่มี test framework จึงไม่ implement เป็นเทสอัตโนมัติ)

  - [x] 1.6 เขียน `export interface ReceivePerfRow` และฟังก์ชัน `reportReceivePerformance(docs: Document[] = DOCUMENTS): ReceivePerfRow[]`
    - รวบรวม `subs = docs.flatMap(d => SUB_ASSIGNMENTS[d.id] ?? [])`
    - สำหรับแต่ละ `dept` ใน `DEPARTMENTS` (คงลำดับ master): กรอง `deptSubs`, คำนวณ `assigned` (status !== 'cancelled'), `accepted` (∈ {'accepted','success'}), `rejected` ('rejected'), `recalled` ('recalled')
    - `rejectRate = assigned > 0 ? Math.round(rejected/assigned*100) : 0`
    - คืนเฉพาะแถวที่ `assigned > 0` เรียงตามลำดับ `DEPARTMENTS`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x]* 1.7 คอมเมนต์อ้างอิง Property 5 และ Property 6 เหนือฟังก์ชัน `reportReceivePerformance`
    - **Property 5: Receive-performance counts match sub-assignment statuses — Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7**
    - **Property 6: Reject rate stays within [0, 100] with zero-guard — Validates: Requirements 3.5, 3.6**
    - บันทึกไว้เป็นเอกสารอ้างอิงเชิงตรรกะ (ไม่มี test framework จึงไม่ implement เป็นเทสอัตโนมัติ)

- [x] 2. Checkpoint — ตรวจสอบ mock.ts ก่อนแก้หน้า Reports
  - รัน `pnpm exec tsc --noEmit` ให้ผ่านโดยไม่มี error ใหม่จาก helpers ที่เพิ่ม
  - ตรวจด้วยตาว่า `getInvolvedDepartments('doc-001')` ครอบคลุมฝ่ายจาก sub-assignments ทั้งหมดของ doc-001 (ฝ่ายการเงิน, ฝ่ายกฎหมาย, ฝ่ายบริหาร, ฝ่ายพัสดุและจัดซื้อ, ฝ่ายวิศวกรรม, ฝ่ายทรัพยากรบุคคล, ฝ่ายสารสนเทศ)
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. แก้ `src/pages/ReportsPage.tsx` ให้ใช้ helpers แทน `Math.random()`/ค่าคงที่เดิม
  - แก้ import: เพิ่ม `getInvolvedDepartments, reportByDepartment, reportReceivePerformance` จาก `'../mock'`; นำ `RECEIVE_PERFORMANCE` ออกจากรายการ import ที่ใช้ตรงในหน้า (คงไว้ใน `mock.ts` ได้)
  - _Requirements: 4.1, 5.1, 6.1_

  - [x] 3.1 สร้าง `filteredDocuments` (derived, reactive) แทนที่การอ้าง `DOCUMENTS` ตรงในรายงานที่ต้องกรอง
    - กรองตาม `filterDirection` (`docDirection` ตรงกับค่าที่เลือก เมื่อไม่ใช่ 'all')
    - กรองตาม `filterDept` (ใช้ `getInvolvedDepartments(d.id).includes(filterDept)` เมื่อไม่ใช่ 'all' — ไม่ใช่แค่ `d.department`)
    - กรองตามช่วงวันที่ `dateFrom`/`dateTo` เทียบ lexicographic กับ `receivedAt` หรือ `deadline` (ผ่านถ้าฟิลด์ใดฟิลด์หนึ่งอยู่ในช่วง; ค่าว่างถือเป็น neutral)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x]* 3.2 คอมเมนต์อ้างอิง Property 7 เหนือการประกาศ `filteredDocuments`
    - **Property 7: Filter soundness and neutral-filter identity — Validates: Requirements 7.1, 7.2, 7.3, 7.5**
    - บันทึกไว้เป็นเอกสารอ้างอิงเชิงตรรกะ (ไม่มี test framework จึงไม่ implement เป็นเทสอัตโนมัติ)

  - [x] 3.3 แทนที่รายงาน "by-dept": ลบ `DEPT_DATA` (ที่ใช้ `Math.random`) และใช้ `const deptData = reportByDepartment(filteredDocuments)`
    - อัปเดตกราฟ/ตารางให้ใช้ `deptData` (`total`/`completed`/`overdue`); `%` = `total > 0 ? Math.round(completed/total*100) : 0`
    - เพิ่มข้อความหมายเหตุในบริเวณรายงานตามฝ่าย: "1 เอกสารเกี่ยวข้องได้หลายฝ่าย ยอดรวมรายฝ่ายจึงอาจมากกว่าจำนวนเอกสารจริง"
    - _Requirements: 2.5, 4.1, 4.2, 4.3_

  - [x] 3.4 แทนที่รายงาน "receive": ใช้ `const receiveData = reportReceivePerformance(filteredDocuments)` แทนการอ้าง `RECEIVE_PERFORMANCE` ตรงในกราฟ/ตาราง
    - คงชื่อฟิลด์เดิม (`assigned`/`accepted`/`rejected`/`recalled`/`rejectRate`) ในการเรนเดอร์
    - _Requirements: 5.1, 5.2_

  - [x] 3.5 แก้ชื่อฝ่ายใน `PERFORMANCE_DATA` (page-level constant) ให้ตรงกับ `DEPARTMENTS` จริง และเพิ่มป้ายกำกับ "ค่าตัวอย่าง (illustrative)"
    - เปลี่ยน `ฝ่าย HR` → `ฝ่ายทรัพยากรบุคคล`, `ฝ่ายพัสดุ` → `ฝ่ายพัสดุและจัดซื้อ`, `ฝ่าย IT` → `ฝ่ายสารสนเทศ` (ค่าตัวเลขคงเดิม เป็น deterministic ไม่สุ่ม)
    - เพิ่ม badge/ข้อความ "ค่าตัวอย่าง (illustrative)" ใกล้หัวข้อรายงานประสิทธิภาพการดำเนินงาน
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 3.6 แก้รายงาน "overdue": ใช้ `filteredDocuments` แทน `DOCUMENTS` ตรง และแสดงฝ่ายที่เกี่ยวข้องทุกฝ่ายเป็น chips
    - `overdueList = filteredDocuments.filter(d => d.deadlineFlag === 'overdue' || d.deadlineFlag === 'due-soon')`
    - แทนคอลัมน์ "ฝ่ายที่รับผิดชอบ" (แสดง `doc.department` เดี่ยว) ด้วยคอลัมน์ "ฝ่ายที่เกี่ยวข้อง" ที่เรนเดอร์ chips จาก `getInvolvedDepartments(doc.id)`
    - _Requirements: 7.3, 8.1, 8.2_

  - [x] 3.7 แก้รายงาน "volume": ปรับการ์ดสรุปให้สะท้อน `filterDirection` เท่าที่ทำได้ โดยยังคง `MONTHLY_DATA` เป็นแหล่งข้อมูลกราฟ
    - เมื่อเลือก 'incoming'/'outgoing' ให้การ์ดสรุปแสดงเฉพาะยอดของทิศทางนั้น (หรือเน้น/ซ่อนการ์ดอีกด้าน) แทนค่าคงที่ตายตัวทั้งสองทิศทางเสมอ
    - _Requirements: 9.1, 9.2_

- [x] 4. Checkpoint — ตรวจสอบหน้า Reports หลังแก้ทั้งหมด
  - รัน `pnpm build` และ `pnpm exec tsc --noEmit` ให้ผ่านโดยไม่มี error ใหม่
  - ตรวจด้วยตา: หมายเหตุหลายฝ่ายปรากฏในรายงาน by-dept, ตัวเลขในรายงาน receive ไม่ใช่ค่า static (`RECEIVE_PERFORMANCE`), ชื่อฝ่ายในรายงาน performance ตรงกับ `DEPARTMENTS` พร้อมป้าย illustrative, รายงาน overdue แสดง chips หลายฝ่าย, เปลี่ยนตัวกรอง (`filterDept`/`filterDirection`/ช่วงวันที่) แล้วผลลัพธ์เปลี่ยนตามทันที
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. ปรับปรุงเอกสารวิเคราะห์ `Phase2_in_out_document/P2026-040_Analysis.md` (documentation-only, ทำขนานได้ตั้งแต่ wave แรก)
  - งานนี้ไม่พึ่งพาโค้ดใน `mock.ts`/`ReportsPage.tsx` — แก้ไขได้อิสระ
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 5.1 อธิบายกติกาการนับหลายฝ่ายและที่มาของรายงานประสิทธิภาพการรับงาน
    - เพิ่ม/ปรับหมายเหตุว่าเอกสารที่เกี่ยวข้องหลายฝ่ายจะถูกนับ **ภายใต้ทุกฝ่ายที่เกี่ยวข้อง** ในรายงานที่จัดกลุ่มตามฝ่าย
    - อธิบายว่ารายงานประสิทธิภาพการรับงาน (RPT-06) คำนวณจาก Sub_Assignment จริง (ไม่ใช่ค่าคงที่)
    - _Requirements: 10.1, 10.2_

  - [x] 5.2 ปรับความหมาย RPT-01 ถึง RPT-06 ให้สอดคล้องกับกติกาการนับหลายฝ่าย
    - ระบุว่ายอดรวมรายฝ่ายอาจมากกว่าจำนวนเอกสารจริงเนื่องจากการนับซ้ำข้ามฝ่าย
    - _Requirements: 10.3_

  - [x] 5.3 เพิ่มรายการ Change Log Draft 1.8.9 (ต่อจาก 1.8.8)
    - ระบุว่าเป็นการปรับนิยามรายงานหลายฝ่าย + แก้ helpers ใน mockup โดยไม่กระทบ State Machine (หมวด 6)
    - _Requirements: 10.4_

  - [x] 5.4 ตรวจสอบว่าส่วน State Machine ไม่ถูกแก้ไข
    - เปรียบเทียบเนื้อหาหมวด State Machine ก่อน/หลังแก้ไขให้เหมือนเดิมทุกตัวอักษร
    - _Requirements: 10.5_

- [x] 6. Checkpoint สุดท้าย — ตรวจสอบรวมทั้ง 3 ไฟล์
  - รัน `pnpm build` และ `pnpm exec tsc --noEmit` อีกครั้งให้ผ่านทั้งหมดโดยไม่มี error ใหม่ (REQ 11.1, 11.2)
  - ตรวจว่าเอกสารวิเคราะห์และโค้ดสอดคล้องกัน (กติกาการนับหลายฝ่ายที่อธิบายในเอกสารตรงกับพฤติกรรมจริงของ `reportByDepartment`/`reportReceivePerformance`)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP — เป็นคอมเมนต์อ้างอิง Correctness Properties เท่านั้น ไม่ใช่เทสอัตโนมัติ เพราะโปรเจกต์นี้ไม่มี test framework
- ทุก task อ้างอิง requirement clause แบบละเอียด (ไม่ใช่แค่ user story) เพื่อการตรวจสอบย้อนกลับ
- Checkpoint tasks (2, 4, 6) ใช้ `pnpm build` + `pnpm exec tsc --noEmit` เป็นกลไกตรวจสอบหลักตามที่ระบุใน design (ไม่มี test framework)
- Task 5 (เอกสารวิเคราะห์) เป็นอิสระจากโค้ดทั้งหมด สามารถทำขนานกับ Task 1 ได้ตั้งแต่ wave แรก
- Task 3 ทั้งหมดพึ่งพา helpers จาก Task 1 จึงต้องอยู่ใน wave ถัดไป

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "5.1"] },
    { "id": 1, "tasks": ["1.2", "5.2"] },
    { "id": 2, "tasks": ["1.3", "5.3"] },
    { "id": 3, "tasks": ["1.4", "5.4"] },
    { "id": 4, "tasks": ["1.5"] },
    { "id": 5, "tasks": ["1.6"] },
    { "id": 6, "tasks": ["1.7"] },
    { "id": 7, "tasks": ["3.1"] },
    { "id": 8, "tasks": ["3.2"] },
    { "id": 9, "tasks": ["3.3"] },
    { "id": 10, "tasks": ["3.4"] },
    { "id": 11, "tasks": ["3.5"] },
    { "id": 12, "tasks": ["3.6"] },
    { "id": 13, "tasks": ["3.7"] }
  ]
}
```

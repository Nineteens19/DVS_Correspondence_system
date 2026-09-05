# Requirements Document

## Introduction

เอกสารนี้กำหนดความต้องการสำหรับการปรับปรุง Mockup (Frontend-only React + TypeScript + Tailwind, Vite) ของระบบสารบรรณภายใน (Deves theme: Navy #012169 / Gold #FFCD00) ในสองประเด็นหลักของเอกสารรับเข้า (Incoming) และเอกสารฉบับจริง (Physical):

1. **Story Line การมอบหมายแบบ SubTree ซ้อนชั้น (Nested Delegation)** — เมื่อมีการมอบหมายต่อ (Delegate) ภายในฝ่ายเดียวกันเป็นทอด ๆ (A → B → C …) เส้นทางเอกสาร (Story Line) ต้องแสดงเป็นโครงสร้างต้นไม้ (SubTree) ที่ซ้อนตามลำดับสายการมอบหมายอย่างถูกต้อง แทนการแสดงแบบรายการแบน (Flat)
2. **การติดตามผู้ถือครองเอกสารฉบับจริงปัจจุบัน (Chain of Custody)** — สำหรับเอกสารฉบับจริง (physical) การถือครองต้องเป็นสถานะ (Stateful) และอัปเดตทุกครั้งที่มีการกระทำที่เปลี่ยนมือ เพื่อให้ทราบได้ว่าเอกสารตัวจริงอยู่ที่ผู้ใด ณ ปัจจุบัน

การเปลี่ยนแปลงนี้เป็น Mockup Frontend เท่านั้น ใช้ข้อมูลจำลอง (mock data) ไม่มี Backend / Database / Authentication จริง และไม่มี Test Framework โดยตรวจสอบความถูกต้องด้วย `pnpm build` และ `pnpm exec tsc --noEmit` งานนี้สอดคล้องกับ BR-2.4-A (Owner-first routing และ Onward Delegation) และ BR-6.1 (Chain of Custody) ของเอกสารวิเคราะห์ P2026-040

## Glossary

- **Mockup_App**: แอปพลิเคชัน Frontend-only (React + TypeScript + Tailwind ผ่าน Vite) ที่ใช้จำลอง UI ของระบบสารบรรณภายใน
- **Story_Line**: แท็บ "เส้นทางเอกสาร (Story Line)" ในหน้า `DocumentDetailPage` ที่แสดงลำดับเหตุการณ์และงานย่อยของเอกสารผ่านคอมโพเนนต์ `Timeline`
- **Timeline_Component**: คอมโพเนนต์ `Timeline` และ `TimelineNode` ใน `src/components/ui.tsx` ที่เรนเดอร์รายการเหตุการณ์และงานย่อย
- **SubAssignment**: อินเทอร์เฟซงานย่อยรายผู้รับใน `src/types.ts` (ผูก Key Reference เดียวกับเอกสารหลัก)
- **Delegation**: การมอบหมายต่อ (Delegate) ที่หัวหน้า/เจ้าของฝ่ายมอบงานที่รับแล้วให้ผู้ใต้บังคับบัญชาในฝ่ายเดียวกัน สร้าง `SubAssignment` ใหม่
- **Parent_Sub**: `SubAssignment` ต้นทางที่ Delegation หนึ่ง ๆ สืบทอดมา อ้างอิงผ่านฟิลด์ `parentId`
- **Delegation_SubTree**: โครงสร้างต้นไม้ของ `SubAssignment` ที่จัดกลุ่มตามความสัมพันธ์ `parentId` และแสดงซ้อนชั้นใน Story_Line
- **Delegation_Detail_Page**: หน้า `DocumentDetailPage` (`src/pages/DocumentDetailPage.tsx`)
- **Sub_State**: React state `subsState` ใน Delegation_Detail_Page ที่เก็บรายการ `SubAssignment` แบบแบน (Flat list)
- **Custody_Log**: บันทึกผู้ถือครองเอกสารฉบับจริง (รายการ `CustodyEntry`) ตาม BR-6.1
- **Custody_State**: React state ที่เก็บ Custody_Log แบบ Stateful ใน Delegation_Detail_Page
- **Current_Holder**: ผู้ถือครองเอกสารฉบับจริงล่าสุด ซึ่งคือ `CustodyEntry` รายการล่าสุดใน Custody_State
- **Physical_Document**: เอกสารที่มี `type === 'physical'`
- **Email_Document**: เอกสารที่มี `type === 'email'` (เอกสารที่ไม่ใช่ฉบับจริง)
- **Incoming_Document**: เอกสารที่มี `docDirection === 'incoming'`
- **Custody_Change_Action**: การกระทำที่ทำให้ผู้ถือครองเอกสารฉบับจริงเปลี่ยนมือ ได้แก่ รับงาน (accept), รับงานแบบหัวหน้า/เจ้าของฝ่าย (accept-as-owner), มอบหมายต่องานที่รับแล้ว (delegate-accepted) และส่งต่อ (forward)
- **Analysis_Doc**: ไฟล์เอกสารวิเคราะห์ `P2026-040_Analysis.md`
- **Build_Checkpoint**: การตรวจสอบด้วยคำสั่ง `pnpm build` และ `pnpm exec tsc --noEmit`

## Requirements

### Requirement 1: บันทึกสายการมอบหมาย (parentId lineage)

**User Story:** As a นักวิเคราะห์ระบบ, I want ให้งานย่อยแต่ละรายการบันทึกงานย่อยต้นทางที่ตนสืบทอดมา, so that ระบบสามารถสร้างสายการมอบหมาย (lineage) ภายในฝ่ายได้ถูกต้อง

#### Acceptance Criteria

1. THE Mockup_App SHALL กำหนดให้อินเทอร์เฟซ SubAssignment มีฟิลด์ `parentId` ชนิด `string` แบบ optional
2. WHERE SubAssignment เป็นงานที่เกิดจาก Delegation, THE Mockup_App SHALL บันทึกค่า `parentId` เป็น `id` ของ Parent_Sub
3. WHERE SubAssignment เป็นงานย่อยต้นทางที่ไม่ได้เกิดจาก Delegation, THE Mockup_App SHALL ปล่อยให้ค่า `parentId` เป็น undefined
4. THE Mockup_App SHALL คงฟิลด์เดิมทั้งหมดของอินเทอร์เฟซ SubAssignment ไว้โดยไม่เปลี่ยนแปลงความหมาย

### Requirement 2: การมอบหมายต่อกำหนด parentId

**User Story:** As a หัวหน้า/เจ้าของฝ่าย, I want ให้ทุกครั้งที่ฉันมอบหมายงานต่อ ระบบผูกงานใหม่เข้ากับงานต้นทางของฉัน, so that สายการมอบหมายซ้อนชั้นได้ไม่จำกัดระดับ

#### Acceptance Criteria

1. WHEN หัวหน้า/เจ้าของฝ่ายยืนยันการมอบหมายต่อให้ผู้ใต้บังคับบัญชาในฝ่ายเดียวกัน, THE Mockup_App SHALL สร้าง SubAssignment ใหม่ที่มี `parentId` เท่ากับ `id` ของ Parent_Sub ที่ถูกมอบหมายต่อ
2. WHEN SubAssignment ที่เกิดจาก Delegation ถูกมอบหมายต่ออีกทอดหนึ่ง, THE Mockup_App SHALL สร้าง SubAssignment ใหม่ที่มี `parentId` ชี้ไปยัง SubAssignment ทอดก่อนหน้า
3. WHEN สร้าง SubAssignment จาก Delegation, THE Mockup_App SHALL กำหนด `department` ของงานใหม่ให้เป็นฝ่ายเดียวกับ Parent_Sub
4. WHEN สร้าง SubAssignment จาก Delegation, THE Mockup_App SHALL กำหนดสถานะเริ่มต้นของงานใหม่เป็น `pending`
5. WHEN สร้าง SubAssignment จาก Delegation, THE Mockup_App SHALL เพิ่มงานใหม่เข้าไปใน Sub_State

### Requirement 3: สร้างต้นไม้จากรายการแบน (Tree building)

**User Story:** As a ผู้ใช้งานที่ตรวจสอบเอกสาร, I want ให้ Story Line จัดกลุ่มงานย่อยตามสายการมอบหมาย, so that ฉันเห็นว่างานถูกมอบหมายต่อจากใครไปสู่ใคร

#### Acceptance Criteria

1. THE Delegation_Detail_Page SHALL สร้าง Delegation_SubTree จาก Sub_State แบบแบน โดยจัดกลุ่มงานย่อยตามความสัมพันธ์ `parentId`
2. WHERE SubAssignment มีค่า `parentId` ตรงกับ `id` ของงานย่อยอื่น, THE Delegation_Detail_Page SHALL วางงานย่อยนั้นเป็นลูก (child) ของงานย่อยต้นทาง
3. WHERE SubAssignment ไม่มีค่า `parentId`, THE Delegation_Detail_Page SHALL วางงานย่อยนั้นเป็นโหนดระดับบนสุด (root) ใต้โหนดขั้นตอนการมอบหมาย (assign node) ของ Story_Line
4. THE Delegation_Detail_Page SHALL แนบ Delegation_SubTree เข้ากับโหนดขั้นตอนการมอบหมายของ Story_Line ผ่านฟิลด์ `children`
5. IF SubAssignment อ้างถึง `parentId` ที่ไม่มีอยู่ใน Sub_State, THEN THE Delegation_Detail_Page SHALL วางงานย่อยนั้นเป็นโหนดระดับบนสุดเพื่อป้องกันการสูญหายของข้อมูล

### Requirement 4: การเรนเดอร์ Timeline แบบเรียกซ้ำไม่จำกัดระดับ

**User Story:** As a ผู้ใช้งานที่ตรวจสอบเอกสาร, I want ให้ Story Line แสดงงานย่อยซ้อนชั้นได้ทุกระดับความลึก, so that ฉันเห็นสายการมอบหมายที่ยาวเป็นทอด ๆ ได้ครบถ้วน

#### Acceptance Criteria

1. THE Timeline_Component SHALL เรนเดอร์งานย่อย (`children`) แบบเรียกซ้ำ (recursive) ที่ระดับความลึกใด ๆ
2. WHERE โหนดงานย่อยมีลูก (`children`) ในระดับที่ลึกกว่าหนึ่งชั้น, THE Timeline_Component SHALL เรนเดอร์ลูกในทุกระดับที่ซ้อนกัน
3. THE Timeline_Component SHALL คงรูปแบบภาพตามธีม Deves ไว้ ได้แก่ เส้นเชื่อม (connector line), วงกลมโหนด (node circle) และการ์ด customNode
4. WHERE โหนดงานย่อยไม่มีลูก, THE Timeline_Component SHALL เรนเดอร์โหนดนั้นตามพฤติกรรมเดิมโดยไม่แสดงชั้นซ้อนเพิ่ม

### Requirement 5: ข้อมูลจำลองตัวอย่างการมอบหมายซ้อนชั้น

**User Story:** As a ผู้ตรวจรับ Mockup, I want ให้มีตัวอย่างข้อมูลจำลองที่มีการมอบหมายซ้อนชั้น, so that ฉันเห็นการแสดงผล SubTree ได้ทันทีโดยไม่ต้องกดสร้างเอง

#### Acceptance Criteria

1. THE Mockup_App SHALL มีข้อมูลจำลองที่ประกอบด้วยงานย่อยรายฝ่ายที่หัวหน้า/เจ้าของฝ่ายรับงานแล้ว และมีการมอบหมายต่ออย่างน้อยหนึ่งระดับผ่านฟิลด์ `parentId`
2. THE Mockup_App SHALL แสดงตัวอย่างข้อมูลจำลองดังกล่าวเป็น Delegation_SubTree ซ้อนชั้นใน Story_Line เมื่อเปิดเอกสารตัวอย่าง

### Requirement 6: การถือครองเอกสารฉบับจริงเป็นสถานะ (Stateful Custody)

**User Story:** As a ผู้ใช้งานที่ดูแลเอกสารฉบับจริง, I want ให้ประวัติการถือครองปรับเปลี่ยนตามการกระทำในหน้าเอกสาร, so that ข้อมูลผู้ถือครองสะท้อนสถานการณ์ปัจจุบัน

#### Acceptance Criteria

1. WHERE เอกสารเป็น Physical_Document และเป็น Incoming_Document, THE Delegation_Detail_Page SHALL เก็บ Custody_Log ไว้ใน Custody_State แบบ Stateful
2. WHEN เกิด Custody_Change_Action บน Physical_Document, THE Delegation_Detail_Page SHALL เพิ่ม CustodyEntry ใหม่ที่ระบุผู้ถือครองรายใหม่เข้าไปใน Custody_State
3. WHEN เพิ่ม CustodyEntry ใหม่, THE Delegation_Detail_Page SHALL บันทึกชื่อผู้ถือครอง ฝ่าย และเวลาถือครองของรายการใหม่
4. THE Delegation_Detail_Page SHALL คงลำดับรายการ Custody_Log เดิมไว้และเพิ่มรายการใหม่ต่อท้าย

### Requirement 7: การแสดงผู้ถือครองปัจจุบัน (Current Holder)

**User Story:** As a ผู้ใช้งานที่ดูแลเอกสารฉบับจริง, I want ให้เห็นชัดเจนว่าใครถือเอกสารตัวจริง ณ ปัจจุบัน, so that ฉันติดตามเอกสารตัวจริงได้

#### Acceptance Criteria

1. THE Delegation_Detail_Page SHALL แสดง Current_Holder ซึ่งคือ CustodyEntry รายการล่าสุดใน Custody_State
2. THE Delegation_Detail_Page SHALL แสดงป้าย "ถือครองล่าสุด" กำกับ CustodyEntry รายการล่าสุดในแท็บการถือครอง (Chain of Custody)
3. THE Delegation_Detail_Page SHALL แสดงข้อมูลผู้ถือครองปัจจุบันภายใต้หัวข้อ "ผู้ถือครองปัจจุบัน (เอกสารตัวจริง)" ในการ์ดผู้ถือครองปัจจุบัน
4. WHEN Custody_State มีการเพิ่ม CustodyEntry ใหม่, THE Delegation_Detail_Page SHALL อัปเดตการแสดง Current_Holder ให้ตรงกับรายการล่าสุด

### Requirement 8: เอกสารที่ไม่ใช่ฉบับจริงไม่ติดตามการถือครอง

**User Story:** As a ผู้ใช้งาน, I want ให้เอกสารอีเมลไม่แสดงการถือครองเอกสารฉบับจริง, so that ข้อมูลไม่สับสนกับเอกสารที่ไม่มีตัวจริง

#### Acceptance Criteria

1. WHERE เอกสารเป็น Email_Document, THE Delegation_Detail_Page SHALL ไม่ติดตามและไม่แสดงการถือครองเอกสารฉบับจริง
2. THE Delegation_Detail_Page SHALL คงพฤติกรรมเดิมของ Email_Document ไว้โดยไม่เปลี่ยนแปลง

### Requirement 9: การคงเงื่อนไขการเปิดแท็บการถือครอง (Gating)

**User Story:** As a ผู้ดูแลระบบ, I want ให้แท็บการถือครองแสดงเฉพาะกรณีที่เหมาะสม, so that ตรรกะการเข้าถึงเดิมยังคงถูกต้อง

#### Acceptance Criteria

1. WHERE เอกสารเป็น Physical_Document และเป็น Incoming_Document, THE Delegation_Detail_Page SHALL แสดงแท็บการถือครอง (Chain of Custody)
2. IF เอกสารไม่ใช่ Physical_Document หรือไม่ใช่ Incoming_Document, THEN THE Delegation_Detail_Page SHALL ไม่แสดงแท็บการถือครอง
3. THE Delegation_Detail_Page SHALL คงเงื่อนไขการเปิดแท็บการถือครองเดิม (physical-only และ incoming-only) ไว้โดยไม่ผ่อนปรน

### Requirement 10: ปรับปรุงเอกสารวิเคราะห์ (Documentation)

**User Story:** As a ผู้จัดทำเอกสารวิเคราะห์, I want ให้บันทึกการเปลี่ยนแปลงลงใน Analysis_Doc, so that เอกสารสอดคล้องกับ Mockup ที่ปรับปรุง

#### Acceptance Criteria

1. THE Mockup_App SHALL เพิ่มรายการ Change Log ใหม่ต่อท้ายใน Analysis_Doc
2. THE Analysis_Doc SHALL ระบุการแสดง Story Line แบบ SubTree การมอบหมายซ้อนชั้น โดยอ้างอิง BR-2.4-A (Onward Delegation)
3. THE Analysis_Doc SHALL ระบุการติดตามผู้ถือครองเอกสารฉบับจริงปัจจุบัน โดยอ้างอิง BR-6.1 (Chain of Custody)
4. THE Mockup_App SHALL คงเนื้อหาส่วน Workflow Logic, State Machine และ Notification Matrix ใน Analysis_Doc ไว้โดยไม่เปลี่ยนแปลง

### Requirement 11: จุดตรวจการ Build (Build Checkpoint)

**User Story:** As a ผู้พัฒนา, I want ให้โค้ดผ่านการ build และตรวจชนิดข้อมูล, so that การเปลี่ยนแปลงไม่ทำให้เกิดข้อผิดพลาดใหม่

#### Acceptance Criteria

1. WHEN รันคำสั่ง `pnpm build`, THE Mockup_App SHALL build สำเร็จโดยไม่มีข้อผิดพลาดใหม่
2. WHEN รันคำสั่ง `pnpm exec tsc --noEmit`, THE Mockup_App SHALL ผ่านการตรวจชนิดข้อมูลโดยไม่มีข้อผิดพลาดใหม่

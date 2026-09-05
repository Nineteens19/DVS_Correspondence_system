# Design Document

## Overview

เอกสารออกแบบนี้อธิบายการปรับปรุง Mockup (Frontend-only React + TypeScript + Tailwind ผ่าน Vite, ธีม Deves: Navy `#012169` / Gold `#FFCD00`) ในสองประเด็นของเอกสารรับเข้าฉบับจริง (Incoming + Physical) ตาม `requirements.md`:

1. **Nested Delegation SubTree** — แสดง Story Line การมอบหมายซ้อนชั้น (A → B → C …) เป็นโครงสร้างต้นไม้ แทนรายการแบน โดยผูกความสัมพันธ์ผ่านฟิลด์ใหม่ `parentId` บน `SubAssignment`, สร้างต้นไม้จากรายการแบนใน `DocumentDetailPage`, และปรับ `Timeline` ให้เรนเดอร์ `children` แบบเรียกซ้ำ (recursive) ไม่จำกัดระดับ (BR-2.4-A · Onward Delegation)
2. **Stateful Chain of Custody** — ทำให้การถือครองเอกสารฉบับจริงเป็นสถานะ (React state) และ append `CustodyEntry` ใหม่ทุกครั้งที่เอกสารตัวจริงเปลี่ยนมือ พร้อมแสดง "ผู้ถือครองปัจจุบัน (เอกสารตัวจริง)" จากรายการล่าสุด (BR-6.1 · Chain of Custody)

ขอบเขตเป็น Mockup เท่านั้น ใช้ข้อมูลจำลอง ไม่มี Backend / DB / Auth จริง และไม่มี Test Framework ตรวจสอบความถูกต้องด้วย `pnpm build` และ `pnpm exec tsc --noEmit` และการทดสอบด้วยมือ (manual)

ภาษาที่ใช้ในตัวอย่างโค้ด: **TypeScript / React (TSX)** ตามที่ตรวจพบใน workspace

### Non-Goals

- ไม่แก้ไข Backend / API / ฐานข้อมูล (ไม่มีอยู่จริง)
- ไม่แตะส่วน Workflow Logic / State Machine / Notification Matrix ใน `P2026-040_Analysis.md`
- ไม่เปลี่ยนเงื่อนไขการเปิดแท็บการถือครอง (คง physical-only + incoming-only)
- ไม่ติดตามการถือครองสำหรับเอกสารอีเมล (Email_Document)

## Architecture

### แผนผังไฟล์และลำดับการทำงาน (File-level parallelism)

การเปลี่ยนแปลงกระจายใน 4 ไฟล์โค้ด + 1 ไฟล์เอกสาร โดยมีลำดับพึ่งพาดังนี้:

```
                 ┌─────────────────────────┐
                 │ src/types.ts (รากฐาน)   │  ← เพิ่ม parentId?: string
                 └────────────┬────────────┘
             ┌────────────────┼──────────────────┐
             ▼                ▼                  ▼
   ┌──────────────────┐  ┌──────────┐   ┌──────────────────────────┐
   │ ui.tsx           │  │ mock.ts  │   │ DocumentDetailPage.tsx    │
   │ (recursive       │  │ (nested  │   │ (tree builder + custody   │
   │  Timeline)       │  │  example)│   │  state) — ขึ้นกับทั้งสาม   │
   └──────────────────┘  └──────────┘   └──────────────────────────┘

   P2026-040_Analysis.md — เอกสารอิสระ (documentation-only)
```

- `types.ts` เป็น**รากฐาน**: ต้องทำก่อน เพราะทั้ง `DocumentDetailPage.tsx` และ `mock.ts` อ้าง `SubAssignment.parentId`
- `ui.tsx` (recursive `Timeline`) และ `mock.ts` (ข้อมูลตัวอย่าง) **เป็นอิสระต่อกัน** ทำขนานกันได้
- `DocumentDetailPage.tsx` **ขึ้นกับ** `types.ts` + `Timeline` ที่ recursive แล้ว + ตัวอย่างใน `mock.ts` จึงควรทำเป็นลำดับหลัง
- `P2026-040_Analysis.md` เป็น documentation-only ทำเมื่อใดก็ได้

### Data Flow: การสร้างต้นไม้และการเรนเดอร์แบบเรียกซ้ำ

```
subsState: SubAssignment[]  (แบน, มี parentId?)
        │
        ▼   buildSubTree(subsState)   ← pure helper ใน DocumentDetailPage
rootNodes: TimelineEvent[]  (โครงสร้างซ้อนชั้นผ่าน children)
        │
        ▼   assignNode.children = rootNodes
activeTimeline: TimelineEvent[]  (โหนด t5 มี children เป็น subtree)
        │
        ▼   <Timeline events={activeTimeline} />
Timeline → TimelineNode (root) → TimelineChildNode (recursive ทุกความลึก)
```

### Data Flow: Stateful Custody

```
CUSTODY_LOG[doc.id]  (seed แบน)
        │
        ▼   useState
custodyState: CustodyEntry[]
        │
        ├── Custody_Change_Action (accept / accept-as-owner / delegate-accepted / forward)
        │       └── setCustodyState(prev => [...prev, newEntry])   (เฉพาะ physical + incoming)
        │
        ├── แท็บ Chain of Custody → render จาก custodyState (ป้าย "ถือครองล่าสุด" ที่ index สุดท้าย)
        └── การ์ดผู้ถือครองปัจจุบัน → currentHolder = custodyState[custodyState.length - 1]
```

## Components and Interfaces

### 1. `src/types.ts` — เพิ่มฟิลด์ `parentId` (รากฐาน)

เพิ่ม `parentId?: string` ให้อินเทอร์เฟซ `SubAssignment` โดย**คงฟิลด์เดิมทั้งหมด** (R1.1, R1.4):

```ts
export interface SubAssignment {
  id: string
  docId: string
  assigneeName: string
  assigneeType: 'person' | 'department' // รายบุคคล / รายฝ่าย
  department: string
  status: SubStatus
  acceptedAt?: string
  note?: string        // เหตุผลปฏิเสธ ฯลฯ
  forwardedTo?: string // ถ้า status = forwarded
  parentId?: string    // ★ ใหม่ — id ของ Parent_Sub ที่งานนี้สืบทอดมา (Onward Delegation lineage)
}
```

- `parentId` เป็น optional → งานย่อยต้นทาง (ไม่ได้เกิดจาก Delegation) จะปล่อยเป็น `undefined` (R1.3)
- ไม่แตะ `CustodyEntry` (มีครบตามที่ต้องใช้แล้ว)

### 2. `src/components/ui.tsx` — Timeline แบบเรียกซ้ำ

ปัจจุบัน `TimelineNode` เรนเดอร์ `ev.children` แบบ **inline ชั้นเดียว** (ลูกของลูกถูกละเลย) ต้อง refactor ให้เรียกซ้ำได้ทุกระดับ โดย**คง public API เดิม** (`Timeline({ events })`, `TimelineNode`) ไม่เปลี่ยน (R4 ทั้งหมด)

**แนวทาง:** แยกการเรนเดอร์ลูกออกเป็นคอมโพเนนต์ `TimelineChildNode` ที่เรนเดอร์ตัวเอง แล้ว **map `child.children` เรียกตัวเองซ้ำ** เพิ่ม `depth` เพื่อคุมระยะเยื้องซ้ายต่อระดับ

```tsx
export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      {events.map((ev, idx) => (
        <TimelineNode key={ev.id} ev={ev} isLast={idx === events.length - 1} />
      ))}
    </div>
  )
}

function TimelineNode({ ev, isLast }: { ev: TimelineEvent; isLast: boolean }) {
  const hasChildren = !!(ev.children && ev.children.length > 0)
  return (
    <div className="relative pb-6 last:pb-0">
      {/* เส้นเชื่อมแนวตั้ง (connector line) — คงสไตล์ Deves เดิม */}
      {!isLast && (
        <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${ev.status === 'pending' ? 'bg-[#E9ECEF]' : 'bg-[#DEE2E6]'}`} />
      )}

      <div className="flex gap-4 relative z-10">
        {/* วงกลมโหนดระดับบนสุด (completed / current / pending) — เดิม */}
        <NodeCircleTop status={ev.status} />
        <div className="flex-1 pt-0.5 pb-2 min-w-0">
          {renderNodeBody(ev)}   {/* customNode หรือเนื้อหา default เดิม */}
        </div>
      </div>

      {/* ★ recursion: เรนเดอร์ลูกทุกตัวผ่าน TimelineChildNode (depth=1) */}
      {hasChildren && (
        <div className="relative mt-2">
          {isLast && <div className="absolute left-[15px] -top-8 bottom-6 w-0.5 bg-[#DEE2E6]" />}
          {ev.children!.map((child, i) => (
            <TimelineChildNode
              key={child.id}
              ev={child}
              depth={1}
              isLast={i === ev.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ★ คอมโพเนนต์เรียกซ้ำ — เรนเดอร์ตัวเอง แล้ว map child.children เรียกตัวเองอีก
function TimelineChildNode({ ev, depth, isLast }: { ev: TimelineEvent; depth: number; isLast: boolean }) {
  const hasChildren = !!(ev.children && ev.children.length > 0)
  return (
    <div className="relative pl-12 pb-5 last:pb-0">
      {/* elbow connector แนวนอน 33px — คงสไตล์ Deves เดิม */}
      <div className="absolute left-[15px] top-[14px] w-[33px] h-0.5 bg-[#DEE2E6]" />

      <div className="flex gap-3 relative z-10">
        <NodeCircleChild status={ev.status} />
        <div className="flex-1 pt-0.5 min-w-0">
          {renderNodeBody(ev)}   {/* customNode ของการ์ด sub ถูกนำมาใช้ซ้ำ */}
        </div>
      </div>

      {/* ★ recursion จริง — ลูกของลูก ที่ทุกความลึก (depth+1) */}
      {hasChildren && (
        <div className="relative mt-1">
          {ev.children!.map((c, i) => (
            <TimelineChildNode
              key={c.id}
              ev={c}
              depth={depth + 1}
              isLast={i === ev.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

หมายเหตุการออกแบบ:
- `renderNodeBody(ev)`, `NodeCircleTop`, `NodeCircleChild` คือการดึงบล็อกเดิมออกมาใช้ซ้ำ (customNode → `pending` italic → default action/timestamp/actor/note) — **ไม่เปลี่ยนสไตล์ภาพ** (R4.3)
- ระยะเยื้องต่อระดับใช้ `pl-12` ต่อชั้น (นับซ้อนจริงเพราะ `TimelineChildNode` ที่ลึกกว่าอยู่ภายใน DOM ของแม่ ทำให้ padding สะสม → เห็นการซ้อนชัดขึ้นตามความลึก) (R4.2)
- โหนดที่ไม่มีลูก: `hasChildren === false` → เรนเดอร์ตามเดิมไม่มีชั้นซ้อนเพิ่ม (R4.4)
- คงเส้นเชื่อมแนวตั้ง, elbow 33px, วงกลมโหนด (สองสไตล์: บนสุด ring-blue-50 / ลูก ring-amber-100), การ์ด `customNode` (R4.3)

### 3. `src/pages/DocumentDetailPage.tsx` — Tree builder + Custody state

**3.1 `buildDelegation` กำหนด `parentId`** (R2.1–R2.5)

```ts
function buildDelegation(parent: SubAssignment, subordinate: UserModel): SubAssignment {
  return {
    id: `sa-del-${Date.now()}`,
    docId: parent.docId,
    assigneeName: subordinate.name,
    assigneeType: 'person',
    department: parent.department,   // R2.3 — ฝ่ายเดียวกับ Parent_Sub
    status: 'pending',               // R2.4 — เริ่มต้นที่ pending
    parentId: parent.id,             // ★ R2.1/R2.2 — ผูกสายการมอบหมาย
    note: `มอบหมายต่อโดยหัวหน้าฝ่าย (${resolveDepartmentOwner(parent.department).name})`,
  }
}
```

เนื่องจาก `handleConfirmDelegate` เดิม append ผลลัพธ์ของ `buildDelegation` เข้า `subsState` อยู่แล้ว จึงรองรับ R2.2 (มอบต่ออีกทอด) โดยอัตโนมัติ เพราะ `delegatingSub` อาจเป็นงานที่เกิดจาก Delegation ทอดก่อนหน้าก็ได้ → `parentId` จะชี้ไปยังทอดนั้น

**3.2 Tree builder (flat → nested)** (R3.1–R3.5)

helper ระดับโมดูลที่แปลง flat list เป็น root nodes รูปแบบ `TimelineEvent`:

```ts
// map SubAssignment → TimelineEvent (customNode = การ์ด sub เดิม), เว้น children ให้ builder เติม
type SubNode = TimelineEvent

function buildSubTree(
  subs: SubAssignment[],
  toEvent: (s: SubAssignment) => SubNode,   // สร้าง node + customNode (การ์ด sub เดิม)
): SubNode[] {
  const nodeById = new Map<string, SubNode>()
  subs.forEach(s => nodeById.set(s.id, toEvent(s)))

  const idSet = new Set(subs.map(s => s.id))
  const roots: SubNode[] = []

  subs.forEach(s => {
    const node = nodeById.get(s.id)!
    const hasValidParent = s.parentId !== undefined && idSet.has(s.parentId)
    if (hasValidParent) {
      const parent = nodeById.get(s.parentId!)!
      ;(parent.children ??= []).push(node)   // R3.2 — วางเป็นลูกของงานต้นทาง
    } else {
      roots.push(node)                        // R3.3 (ไม่มี parentId) + R3.5 (orphan parentId → root)
    }
  })
  return roots
}
```

- `hasValidParent` ครอบคลุมทั้ง R3.3 (ไม่มี `parentId`) และ R3.5 (`parentId` ชี้ไป id ที่ไม่มีใน list → กลายเป็น root ไม่ให้ข้อมูลสูญหาย)
- ผลลัพธ์นำไปแนบ `assignNode.children = roots` (R3.4)
- ฟังก์ชัน `toEvent` คือส่วนที่ map แต่ละ `SubAssignment` เป็น node พร้อม `customNode` = **การ์ด sub เดิม** (ปุ่ม accept-as-owner สำหรับงานฝ่าย pending, ปุ่ม delegate สำหรับงานฝ่าย accepted, `SubStatusBadge`, note, forwardedTo) — reuse ตรง ๆ จากบล็อกเดิมที่เคย map แบบ FLAT

**การเชื่อมกับ Story Line:** จุดที่เดิมทำ `assignNode.children = subsState.map(...)` (FLAT) เปลี่ยนเป็น:

```ts
if (assignNodeIdx !== -1 && subsState.length > 0) {
  const assignNode = { ...activeTimeline[assignNodeIdx] }
  assignNode.children = buildSubTree(subsState, toSubEvent)   // ★ nested แทน flat
  activeTimeline[assignNodeIdx] = assignNode
}
```

**การมอบหมายต่อที่ทุกความลึก:** ปุ่ม delegate ยังคงแสดงบนงานที่ `status === 'accepted'` โดยไม่จำกัดความลึก ดังนั้นสายการมอบหมายจึงต่อยาวได้เรื่อย ๆ ปัจจุบันเงื่อนไขปุ่มผูกกับ `assigneeType === 'department'`; เพื่อให้ chain งอกต่อจากงานที่ถูก delegate (ซึ่งเป็น `assigneeType === 'person'`) ได้ ให้ผ่อนเงื่อนไขปุ่ม delegate เป็น "แสดงเมื่อ `status === 'accepted'`" (ทั้งงานฝ่ายและงานบุคคลที่รับแล้ว) ส่วนปุ่ม accept-as-owner คงเงื่อนไขเดิม (`assigneeType === 'department' && status === 'pending'`)

**3.3 Stateful Custody** (R6, R7, R8, R9)

เปลี่ยน custody จากค่าคงที่เป็น state:

```ts
// เดิม: const custody = CUSTODY_LOG[doc.id] ?? []
const [custodyState, setCustodyState] = useState<CustodyEntry[]>(CUSTODY_LOG[doc.id] ?? [])

const trackCustody = doc.type === 'physical' && doc.docDirection === 'incoming'  // R6.1 / R8.1

function appendCustody(holder: string, department: string, action: CustodyEntry['action'], note?: string) {
  if (!trackCustody) return   // R8.1 — email/outgoing ไม่ติดตาม
  const heldAt = new Date().toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  setCustodyState(prev => [
    ...prev,   // R6.4 — คงลำดับเดิม แล้วต่อท้าย
    { id: `cu-${Date.now()}`, docId: doc.id, holder, department, heldAt, action, note },   // R6.2 / R6.3
  ])
}
```

เรียก `appendCustody(...)` ภายใน Custody_Change_Action (เฉพาะเมื่อ `trackCustody === true`):

| Action | เงื่อนไข | holder / department ที่บันทึก | action |
|---|---|---|---|
| `handleAccept` | ผู้ใช้กดรับงานเอกสารฉบับจริง | `CURRENT_USER.name` / `CURRENT_USER.department` | `holding` |
| `handleAcceptAsOwner(sub)` | หัวหน้า/เจ้าของฝ่ายรับงานฝ่าย | `resolveDepartmentOwner(sub.department).name` / `sub.department` | `holding` |
| `handleConfirmDelegate` | มอบหมายต่องานที่รับแล้ว (เปลี่ยนมือตัวจริง) | `subordinate.name` / `subordinate.department` | `handed-over` |
| forward (ถ้ามีการส่งต่อจริง) | ส่งต่อผู้รับถัดไป | ชื่อผู้รับถัดไป / ฝ่ายผู้รับ | `handed-over` |

- สำหรับเอกสารที่ไม่ใช่ physical/incoming: `appendCustody` return ทันที ไม่ append และไม่แสดง (R8.1, R8.2)
- แท็บ Chain of Custody render จาก `custodyState` (แทน `custody`) และคง badge "ถือครองล่าสุด" ที่ `index === custodyState.length - 1` (R7.2)
- gating แท็บ (`isPhysical && !isOutgoing`) และ `count: custodyState.length` คงเดิม (R9)

**3.4 Current Holder = รายการล่าสุด** (R7)

การ์ด "ผู้ถือครองปัจจุบัน" (คอลัมน์ขวา) เปลี่ยนหัวข้อเป็น **"ผู้ถือครองปัจจุบัน (เอกสารตัวจริง)"** สำหรับเอกสารฉบับจริง และดึงข้อมูลจากรายการ custody ล่าสุด:

```ts
const currentCustody = trackCustody && custodyState.length > 0
  ? custodyState[custodyState.length - 1]   // R7.1 — รายการล่าสุด
  : undefined
const holderName = currentCustody?.holder ?? doc.currentHolder
const holderDept = currentCustody?.department ?? doc.currentHolderDept
```

- เมื่อ `custodyState` ถูก append รายการใหม่ → การ์ดอัปเดตอัตโนมัติเพราะอ่านจาก state (R7.4)
- เอกสารที่ไม่ track (email/outgoing) fallback เป็น `doc.currentHolder` เดิม คงพฤติกรรมเดิม (R8.2)

### 4. `src/mock.ts` — ตัวอย่าง Nested Delegation

เพิ่มสายการมอบหมายซ้อนชั้นบน **doc-001** (physical + incoming) โดยผูก `parentId` ให้เห็น SubTree ทันทีเมื่อเปิดเอกสาร (R5.1, R5.2) ชื่อทุกคนต้องมีอยู่ใน `USERS`:

```ts
// เพิ่มต่อท้ายอาร์เรย์ SUB_ASSIGNMENTS['doc-001'] — โซ่การมอบหมายซ้อนชั้น
// ระดับ 0 (root): งานฝ่ายการเงินที่หัวหน้า/เจ้าของฝ่ายรับแล้ว
{ id: 'sa-001-8', docId: 'doc-001', assigneeName: 'ฝ่ายการเงิน', assigneeType: 'department',
  department: 'ฝ่ายการเงิน', status: 'accepted', acceptedAt: '30 ก.ค. 68, 09:30',
  note: 'รับงานโดยหัวหน้า/เจ้าของฝ่าย (นายวิชัย เจริญผล)' },
// ระดับ 1: หัวหน้ามอบหมายต่อให้ลูกทีม (parentId → sa-001-8)
{ id: 'sa-001-9', docId: 'doc-001', assigneeName: 'นายสมชาย ใจดี', assigneeType: 'person',
  department: 'ฝ่ายการเงิน', status: 'accepted', acceptedAt: '30 ก.ค. 68, 10:30',
  parentId: 'sa-001-8', note: 'มอบหมายต่อโดยหัวหน้าฝ่าย (นายวิชัย เจริญผล)' },
```

- `นายวิชัย เจริญผล` (`wichai.c`) = owner ของ `ฝ่ายการเงิน` ตาม `DEPARTMENT_OWNERS`; `นายสมชาย ใจดี` (`somchai.j`) = subordinate ของฝ่ายเดียวกัน → สอดคล้องกับ `subordinateCandidates`
- โครงสร้างผลลัพธ์: assign node (t5) → `sa-001-8` (root, accepted) → `sa-001-9` (child) แสดงเป็น SubTree ซ้อนชั้น
- ต้องการเพิ่มความลึกระดับ 2 (grandchild) ทำได้โดยเพิ่มอีก 1 sub ที่ `parentId: 'sa-001-9'` ในฝ่ายเดียวกัน (ถ้ามีสมาชิกฝ่ายที่สามใน `USERS`) — เป็นทางเลือก R5.1 ระบุ "อย่างน้อยหนึ่งระดับ" หนึ่งระดับจึงเพียงพอ
- ข้อมูลเดิมทั้งหมด (`sa-001-1` … `sa-001-7`, `CUSTODY_LOG`, ฯลฯ) คงไว้ valid ไม่เปลี่ยนความหมาย

### 5. `P2026-040_Analysis.md` — Change Log (documentation-only)

เพิ่มรายการ Change Log ใหม่ต่อท้าย โดย**เพิ่มเลขจาก Draft 1.8.6 → 1.8.7** (R10.1) เนื้อหาระบุ:
- การแสดง Story Line แบบ **SubTree การมอบหมายซ้อนชั้น** อ้างอิง **BR-2.4-A (Onward Delegation)** (R10.2)
- การติดตาม **ผู้ถือครองเอกสารฉบับจริงปัจจุบัน (Stateful Chain of Custody)** อ้างอิง **BR-6.1** (R10.3)
- **ไม่แตะ** ส่วน Workflow Logic / State Machine / Notification Matrix (R10.4)

## Data Models

### `SubAssignment` (ปรับปรุง)

| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | `string` | เดิม |
| `docId` | `string` | เดิม |
| `assigneeName` | `string` | เดิม |
| `assigneeType` | `'person' \| 'department'` | เดิม |
| `department` | `string` | เดิม |
| `status` | `SubStatus` | เดิม |
| `acceptedAt?` | `string` | เดิม |
| `note?` | `string` | เดิม |
| `forwardedTo?` | `string` | เดิม |
| **`parentId?`** | **`string`** | **ใหม่** — id ของ Parent_Sub (Onward Delegation lineage); `undefined` = root |

### `TimelineEvent` (ใช้เป็นโครงต้นไม้ ไม่แก้ชนิด)

ใช้ `children?: TimelineEvent[]` เดิมรองรับความลึกไม่จำกัด และ `customNode?: React.ReactNode` เดิมสำหรับการ์ด sub — **ไม่ต้องแก้ `types.ts` ส่วนนี้**

### `CustodyEntry` (ไม่แก้ชนิด — ใช้เป็น state)

`{ id, docId, holder, department, heldAt, action, note? }` — โครงสร้างเดิมเพียงพอ ทำให้เป็น stateful ผ่าน `useState<CustodyEntry[]>`

## Error Handling

- **Orphan `parentId`** (`parentId` ชี้ไป id ที่ไม่มีใน `subsState`): `buildSubTree` ตรวจ `idSet.has(parentId)` ถ้าไม่พบ → วางเป็น **root** เพื่อกันข้อมูลสูญหาย (R3.5)
- **`parentId === undefined`**: จัดเป็น root ตามปกติ (R3.3)
- **Custody ว่าง** (`custodyState.length === 0`): แท็บ Chain of Custody แสดงข้อความ "ไม่มีข้อมูลการถือครอง" เดิม; การ์ดผู้ถือครองปัจจุบัน fallback เป็น `doc.currentHolder`
- **เอกสารไม่ใช่ physical/incoming**: `appendCustody` และ `trackCustody` เป็น no-op → ไม่มีการติดตาม/แสดง custody (R8.1)
- **วงจร parentId (cycle) ที่อาจเกิดจากข้อมูลผิด**: การ build ใช้การ push ครั้งเดียวต่อ node ตาม flat list จึงไม่ recurse ระหว่าง build (ไม่ค้าง); กรณี cycle จริงในข้อมูล mock ไม่เกิดเพราะ id ถูกสร้างใหม่เสมอ (`sa-del-${Date.now()}`) และ parent มีอยู่ก่อนแล้ว — ถือเป็น out-of-scope สำหรับ Mockup
- **ชื่อผู้ใช้ไม่พบใน USERS**: helper `resolveDepartmentOwner` มี fallback (`DEFAULT_OWNER_FALLBACK`) ไม่ throw

## Correctness Properties

> **(Optional)** หมายเหตุ: โปรเจกต์นี้**ไม่มี Test Framework** คุณสมบัติด้านล่างเป็น **ข้อกำหนดเชิงออกแบบ (design-level, optional)** เพื่อเป็นแนวตรวจด้วยมือ/เหตุผลเชิงตรรกะ ไม่ได้บังคับให้เขียนเป็นการทดสอบอัตโนมัติ การตรวจสอบจริงใช้ `pnpm build`, `pnpm exec tsc --noEmit` และการทดสอบด้วยมือ

### Property 1: parentId lineage จากการมอบหมายต่อ

*For any* Parent_Sub `p` และผู้ใต้บังคับบัญชา `u` ใด ๆ, ผลลัพธ์ของ `buildDelegation(p, u)` ต้องมี `parentId === p.id`, `department === p.department`, และ `status === 'pending'`

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 2: ต้นไม้ครอบคลุมทุก sub และ non-root ปรากฏใต้ parent เพียงครั้งเดียว

*For any* รายการแบน `subs` ใด ๆ, ต้นไม้จาก `buildSubTree(subs)` ต้องมีจำนวนโหนดรวม (root + ทุก children ทุกความลึก) เท่ากับ `subs.length` และ sub ที่มี `parentId` ตรงกับ id ที่มีอยู่จริงต้องปรากฏเป็นลูกของโหนดนั้น **พอดีหนึ่งครั้ง** ไม่ซ้ำและไม่หาย

**Validates: Requirements 3.1, 3.2, 3.4**

### Property 3: orphan/undefined parentId → root

*For any* sub ที่ `parentId` เป็น `undefined` หรือชี้ไป id ที่ไม่มีใน `subs`, โหนดนั้นต้องปรากฏเป็น root node เสมอ (ไม่มีข้อมูลสูญหาย)

**Validates: Requirements 3.3, 3.5**

### Property 4: custody append คงลำดับเดิมและต่อท้าย

*For any* ลำดับของ Custody_Change_Action บนเอกสาร physical+incoming, ค่า `custodyState` ณ เวลาใด ๆ ต้องเป็น seed เดิมตามด้วยรายการที่เพิ่มเรียงตามลำดับการกระทำ (prefix เดิมไม่ถูกแก้/สลับ) และ Current_Holder ต้องเท่ากับ `custodyState[custodyState.length - 1]` เสมอ

**Validates: Requirements 6.2, 6.4, 7.1, 7.4**

## Testing Strategy

เนื่องจากไม่มี Test Framework ใช้การตรวจสอบสองชั้น:

**1. Build / Type checkpoint (บังคับ — R11)**
- `pnpm build` ต้องสำเร็จโดยไม่มีข้อผิดพลาดใหม่ (R11.1)
- `pnpm exec tsc --noEmit` ต้องผ่านการตรวจชนิดโดยไม่มีข้อผิดพลาดใหม่ (R11.2)

**2. Manual verification (ทดสอบด้วยมือ)**
- เปิด **doc-001** → แท็บ Story Line: เห็น SubTree ซ้อนชั้น (`ฝ่ายการเงิน` → `นายสมชาย ใจดี`) เยื้องตามความลึก (R5.2, R4.1–R4.2)
- กดปุ่ม "รับงาน (หัวหน้า/เจ้าของฝ่าย)" บนงานฝ่าย pending → กลายเป็น accepted; จากนั้นกด "มอบหมายต่อ (Delegate)" → เกิดลูกใหม่ใต้โหนดเดิม (nested) และงานที่รับแล้วยังกด delegate ต่อได้อีกทอด (chain งอก)
- แท็บ Chain of Custody: ทำ Custody_Change_Action แล้วเห็นรายการใหม่ต่อท้าย + ป้าย "ถือครองล่าสุด" ย้ายไปรายการสุดท้าย (R6, R7.2)
- การ์ดคอลัมน์ขวาแสดง "ผู้ถือครองปัจจุบัน (เอกสารตัวจริง)" ตรงกับรายการ custody ล่าสุด (R7.3, R7.4)
- เปิดเอกสาร **email** และ **outgoing**: ไม่มีแท็บ/ข้อมูล custody, พฤติกรรมเดิมไม่เปลี่ยน (R8, R9)

## Design-to-Requirements Mapping

| Requirement | ครอบคลุมโดย |
|---|---|
| R1 (parentId lineage) | §2.1 `types.ts` เพิ่ม `parentId?: string` |
| R2 (delegation กำหนด parentId) | §3.1 `buildDelegation` + `handleConfirmDelegate` เดิม |
| R3 (tree building) | §3.2 `buildSubTree` (root/child/orphan) |
| R4 (recursive Timeline) | §2 `TimelineChildNode` recursive + คงสไตล์ Deves |
| R5 (mock nested example) | §4 `mock.ts` sa-001-8/9 บน doc-001 |
| R6 (stateful custody) | §3.3 `custodyState` + `appendCustody` |
| R7 (current holder) | §3.4 การ์ด "ผู้ถือครองปัจจุบัน (เอกสารตัวจริง)" |
| R8 (email ไม่ track) | §3.3 `trackCustody` guard |
| R9 (gating คงเดิม) | §3.3 คง `isPhysical && !isOutgoing` |
| R10 (documentation) | §5 `P2026-040_Analysis.md` Change Log 1.8.7 |
| R11 (build checkpoint) | §Testing Strategy — `pnpm build` + `tsc --noEmit` |

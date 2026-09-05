# Design Document — Monitor Multi-Scope

## Overview

ฟีเจอร์ **Monitor Multi-Scope** ปรับให้ Monitor Assignment หนึ่งรายการอ้างอิงเป้าหมายได้หลายรายการ โดยเปลี่ยนโครงสร้างข้อมูลจากเป้าหมายเดี่ยว (`scopeRef: string` + `scopeLabel: string`) เป็นเป้าหมายหลายรายการ (`scopeRefs: string[]`) พร้อม flag `allDepartments?: boolean` สำหรับตัวเลือก "ทุกฝ่าย"

งานทั้งหมดเป็น **frontend-only mockup** (React + TypeScript + Tailwind บน Vite) ใช้ mock data ไม่มี backend/database/auth จริง คงธีม Deves (Navy `#012169` + Gold `#FFCD00`) และคงกฎ Monitor เดิม (BR-5.3: ดู + Follow up เท่านั้น)

ขอบเขตการแก้ไข:
- `src/types.ts` — เปลี่ยนสัญญาข้อมูลของ `MonitorAssignment` (breaking field change)
- `src/mock.ts` — ย้ายข้อมูล `MONITOR_ASSIGNMENTS` เข้าโครงสร้างใหม่ + เพิ่มแถวสาธิต multi-dept และ all-departments
- `src/pages/AdminPage.tsx` — ปรับ state ฟอร์ม, multi-select UI, ตัวเลือกทุกฝ่าย, การ render chip ในตาราง, และ edit population
- `P2026-040_Analysis.md` — ปรับปรุงเอกสาร (documentation only) หมวด 3.5, BR-5.3, Data Model `MONITOR_ASSIGNMENT` + เพิ่ม change-log entry

การตรวจสอบใช้ TypeScript compiler + Vite build (โปรเจกต์ไม่มี test framework)

## Architecture

การเปลี่ยนแปลงกระจายเป็น 4 เลเยอร์ที่ต่อเนื่องกัน โดย type layer เป็นจุดตั้งต้นที่บังคับให้เลเยอร์อื่นต้องปรับตาม (Requirement 9.2 — compiler จะรายงานทุกจุดที่ยังอ้าง `scopeRef` เดิม)

```
types.ts (สัญญาข้อมูล)
   │  MonitorAssignment: scopeRefs: string[] + allDepartments?: boolean
   ▼
mock.ts (ข้อมูลตั้งต้น)
   │  MONITOR_ASSIGNMENTS แถวใหม่ทั้งหมดใช้ scopeRefs / allDepartments
   ▼
AdminPage.tsx (UI + logic)
   ├─ monForm state (scopeRefs, allDepartments)
   ├─ Add/Edit Monitor Modal (multi-select + ทุกฝ่าย toggle)
   ├─ saveMonitor / openEditMonitor (validity + round-trip)
   └─ Monitor table Scope column (chips + badge)
   ▼
P2026-040_Analysis.md (documentation reflection)
```

หลักการออกแบบสำคัญ: **derive labels at render** แทนการเก็บ `scopeLabel` ไว้ในข้อมูล ฟังก์ชัน `buildScopeLabel` ปรับให้รับเป้าหมายรายตัว (per-target) แล้วเรียกซ้ำต่อสมาชิกใน `scopeRefs` ตอน render ทำให้ label ไม่มีทางไม่ตรงกับ master data (single source of truth) และลดฟิลด์ที่ต้อง sync

## Components and Interfaces

### 1. Data Model (`src/types.ts`)

ปรับ interface `MonitorAssignment`:

```typescript
export interface MonitorAssignment {
  id: string
  monitorUserId: string
  monitorUserName: string
  monitorUserDept: string
  scopeType: MonitorScopeType
  scopeRefs: string[]          // (เดิม: scopeRef: string) เป้าหมายหลายรายการ
  allDepartments?: boolean     // ใหม่: true = ครอบคลุมทุกฝ่ายปัจจุบัน+อนาคต
  docDirectionFilter: 'incoming' | 'outgoing' | 'all'
  notifyEnabled: boolean
  effectiveFrom?: string
  effectiveTo?: string
  status: 'active' | 'inactive'
  createdBy: string
  createdAt: string
}
```

หมายเหตุ:
- ลบฟิลด์ `scopeRef: string` และ `scopeLabel: string` — label จะ derive ตอน render
- ฟิลด์อื่น (`scopeType`, `docDirectionFilter`, `notifyEnabled`, `status`, `createdBy`, `createdAt`, `effectiveFrom/To`) คงเดิม (Req 1.3)
- เป็น breaking change — ทุก reader ที่อ้าง `scopeRef`/`scopeLabel` ต้องแก้ (Req 9.2 บังคับผ่าน compiler)

### 2. Mock Data (`src/mock.ts`)

ย้ายทุกแถวใน `MONITOR_ASSIGNMENTS` เข้าโครงสร้างใหม่ โดยคงค่า user fields / scopeType / docDirectionFilter / notifyEnabled / status / createdBy / createdAt เดิม (Req 6.4) และลบ `scopeLabel`:

| แถว | เดิม | ใหม่ |
|-----|------|------|
| mon-001 | `scopeRef: 'ฝ่ายการเงิน'` | `scopeRefs: ['ฝ่ายการเงิน', 'ฝ่ายพัสดุและจัดซื้อ']` — สาธิต **multi-dept** (Req 6.2) |
| mon-002 | `scopeRef: 'wg-04'` | `scopeRefs: ['wg-04']` (workgroup เดี่ยว) |
| mon-003 | `scopeRef: 'ฝ่ายพัสดุและจัดซื้อ'` | `scopeRefs: [], allDepartments: true` — สาธิต **all-departments** (Req 6.3) |

ผลลัพธ์: มีอย่างน้อยหนึ่งแถว multi-dept และหนึ่งแถว all-departments ตามที่กำหนด

### 3. Monitor Form State (`AdminPage.tsx`)

ปรับ shape ของ `monForm` และ `resetMonForm`:

```typescript
const [monForm, setMonForm] = useState<{
  monitorUserId: string
  scopeType: MonitorScopeType
  scopeRefs: string[]          // (เดิม: scopeRef: string)
  allDepartments: boolean      // ใหม่
  docDirectionFilter: 'incoming' | 'outgoing' | 'all'
  notifyEnabled: boolean
}>({
  monitorUserId: '',
  scopeType: 'department',
  scopeRefs: [],
  allDepartments: false,
  docDirectionFilter: 'all',
  notifyEnabled: true,
})

const resetMonForm = () =>
  setMonForm({ monitorUserId: '', scopeType: 'department', scopeRefs: [], allDepartments: false, docDirectionFilter: 'all', notifyEnabled: true })
```

พฤติกรรม state:
- **เปลี่ยน scopeType** → clear ทั้ง `scopeRefs: []` และ `allDepartments: false` (Req 2.5)
- **toggle ฝ่ายใน multi-select** → เพิ่ม/ลบค่าใน `scopeRefs` (เฉพาะเมื่อ `!allDepartments`)
- **toggle "ทุกฝ่าย"** → ตั้ง `allDepartments`; เมื่อ true ให้ `scopeRefs: []` และ disable รายฝ่าย (Req 3.2, 3.3); เมื่อ false ให้ enable กลับ (Req 3.4)

### 4. Scope Target Helpers

`getScopeTargetOptions()` คงหน้าที่ให้ source list ตาม `scopeType`:

```typescript
const getScopeTargetOptions = (): { value: string; label: string }[] => {
  switch (monForm.scopeType) {
    case 'department':    return DEPARTMENTS.map(d => ({ value: d, label: d }))
    case 'workgroup':     return WORKGROUPS.map(w => ({ value: w.id, label: `${w.name} (${w.department})` }))
    case 'user':          return USERS.filter(u => u.active).map(u => ({ value: u.id, label: `${u.name} (${u.department})` }))
    case 'doc_direction': return DIR_OPTIONS.map(o => ({ value: o.value, label: o.label }))
  }
}
```

`buildScopeLabel` ปรับเป็น **per-target** (รับ scopeType + หนึ่ง ref) แล้วเรียกซ้ำต่อสมาชิกตอน render:

```typescript
const buildScopeLabel = (scopeType: MonitorScopeType, ref: string): string => {
  if (scopeType === 'department') return `${ref} (ทั้งฝ่าย)`
  if (scopeType === 'workgroup') {
    const wg = WORKGROUPS.find(w => w.id === ref)
    return wg ? `${wg.name} (${wg.department})` : ref
  }
  if (scopeType === 'user') {
    const u = USERS.find(u => u.id === ref)
    return u ? `${u.name} (${u.department})` : ref
  }
  if (scopeType === 'doc_direction') return DIR_LABELS[ref as 'incoming' | 'outgoing' | 'all'] ?? ref
  return ref
}
```

### 5. Save & Edit Logic

`saveMonitor` — บังคับ validity ก่อนบันทึก:

```typescript
const saveMonitor = () => {
  const selectedUser = USERS.find(u => u.id === monForm.monitorUserId)
  if (!selectedUser) return

  // Save-validity guard (Req 2.4, 3.5, 1.5)
  const hasTargets = monForm.allDepartments || monForm.scopeRefs.length > 0
  if (!hasTargets) return  // block save, keep modal open

  // department scope ที่ allDepartments=true ต้องเก็บ scopeRefs ว่างเสมอ
  const scopeRefs = monForm.allDepartments ? [] : monForm.scopeRefs
  const allDepartments = monForm.scopeType === 'department' ? monForm.allDepartments : false

  const payload = {
    monitorUserId: monForm.monitorUserId,
    monitorUserName: selectedUser.name,
    monitorUserDept: selectedUser.department,
    scopeType: monForm.scopeType,
    scopeRefs,
    allDepartments,
    docDirectionFilter: monForm.docDirectionFilter,
    notifyEnabled: monForm.notifyEnabled,
  }
  // editingMonitor ? update row : append new row (ไม่ dedup ต่อ user → Req 5.3)
  // ... show success toast
}
```

`openEditMonitor` — populate ฟอร์มด้วย `scopeRefs` และ `allDepartments` ที่บันทึกไว้ (Req 4.4):

```typescript
const openEditMonitor = (m: MonitorAssignment) => {
  setEditingMonitor(m)
  setMonForm({
    monitorUserId: m.monitorUserId,
    scopeType: m.scopeType,
    scopeRefs: [...m.scopeRefs],
    allDepartments: m.allDepartments ?? false,
    docDirectionFilter: m.docDirectionFilter,
    notifyEnabled: m.notifyEnabled,
  })
  setShowAddMonitor(true)
}
```

### 6. Monitor Modal UI (Scope section)

เมื่อ `scopeType === 'department'`:
- แสดง toggle **"ทุกฝ่าย (all departments)"** ด้านบน (Req 3.1)
- แสดง checkbox list ของ `DEPARTMENTS` (multi-select) — `disabled` เมื่อ `allDepartments === true` (Req 2.1, 3.3)

เมื่อ `scopeType` เป็น `workgroup` / `user` / `doc_direction`:
- แสดงตัวเลือกเป้าหมายจาก `getScopeTargetOptions()` และเก็บลง `scopeRefs` (Req 2.3) — mockup เลือกเป้าหมายเดี่ยว จัดเก็บเป็น `scopeRefs: [target]`

โครง JSX (department):

```tsx
{monForm.scopeType === 'department' && (
  <div className="space-y-2">
    <label className="flex items-center justify-between p-3 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl">
      <span className="text-xs font-semibold text-[#212529]">ทุกฝ่าย (all departments)</span>
      <input
        type="checkbox"
        checked={monForm.allDepartments}
        onChange={e => setMonForm(f => ({
          ...f,
          allDepartments: e.target.checked,
          scopeRefs: e.target.checked ? [] : f.scopeRefs,
        }))}
      />
    </label>
    <div className={monForm.allDepartments ? 'opacity-50 pointer-events-none' : ''}>
      {DEPARTMENTS.map(d => (
        <label key={d} className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            disabled={monForm.allDepartments}
            checked={monForm.scopeRefs.includes(d)}
            onChange={e => setMonForm(f => ({
              ...f,
              scopeRefs: e.target.checked
                ? [...f.scopeRefs, d]
                : f.scopeRefs.filter(x => x !== d),
            }))}
          />
          <span className="text-xs">{d}</span>
        </label>
      ))}
    </div>
  </div>
)}
```

Modal confirm button (บันทึก) จะไม่ปิด modal เมื่อ save ถูก block (validity guard ใน `saveMonitor`)

### 7. Monitor Table — Scope Column

Render badge ประเภท scope + chips ตามข้อมูล:
- `allDepartments === true` → chip เดียวข้อความ **"ทุกฝ่าย"** (Req 4.2)
- อื่น ๆ → หนึ่ง chip ต่อหนึ่ง `scopeRefs` entry ด้วย label จาก `buildScopeLabel(mon.scopeType, ref)` (Req 4.1)
- แสดง `SCOPE_LABELS[mon.scopeType]` badge เสมอ (Req 4.3)

```tsx
<td className="px-4 py-3.5">
  <div className="flex flex-col gap-1">
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${SCOPE_COLORS[mon.scopeType]}`}>
      <MapPin size={9} />
      {SCOPE_LABELS[mon.scopeType]}
    </span>
    <div className="flex flex-wrap gap-1">
      {mon.allDepartments ? (
        <span className="text-xs px-2 py-0.5 rounded bg-[#FFF3CD] text-[#856404]">ทุกฝ่าย</span>
      ) : (
        mon.scopeRefs.map(ref => (
          <span key={ref} className="text-xs px-2 py-0.5 rounded bg-[#F0F2F5] text-[#212529]">
            {buildScopeLabel(mon.scopeType, ref)}
          </span>
        ))
      )}
    </div>
  </div>
</td>
```

### 8. Analysis Document (`P2026-040_Analysis.md`) — Documentation Only

- **หมวด 3.5** — เพิ่มคำอธิบายว่า Monitor หนึ่งรายการเฝ้าติดตามได้หลายฝ่ายพร้อมกัน และมีตัวเลือก "ทุกฝ่าย (all departments)" ครอบคลุมทุกฝ่ายปัจจุบัน+อนาคต
- **BR-5.3** (และหมวด 3.5.1 โครงสร้างการตั้งค่า) — ปรับให้ครอบคลุมการเลือกหลายเป้าหมาย + flag ทุกฝ่าย
- **Data Model `MONITOR_ASSIGNMENT`** (หมวด 10) — สะท้อนการเก็บเป้าหมายหลายรายการ (`scope_refs` แทน `scope_ref`) และ flag `all_departments`
- **Change Log** — append entry ใหม่ (documentation-only, ไม่แก้ตรรกะกระบวนการ/State Machine/Notification Matrix — Req 8.4)

## Data Models

หลัง migration:

```typescript
// เป้าหมายหลายรายการ
{ scopeType: 'department', scopeRefs: ['ฝ่ายการเงิน', 'ฝ่ายพัสดุและจัดซื้อ'], allDepartments: false }
// ทุกฝ่าย
{ scopeType: 'department', scopeRefs: [], allDepartments: true }
// scope อื่น (เดี่ยว)
{ scopeType: 'workgroup', scopeRefs: ['wg-04'], allDepartments: false }
```

Invariant ของข้อมูลที่บันทึกได้:
- `allDepartments === true` ⇒ `scopeRefs.length === 0` และ `scopeType === 'department'`
- `allDepartments !== true` ⇒ `scopeRefs.length >= 1`

## Error Handling

- **Save ที่ไม่มีเป้าหมาย** (`scopeRefs` ว่าง และ `allDepartments` false) → `saveMonitor` return ก่อนบันทึก, modal คงเปิด (Req 2.4)
- **ไม่ได้เลือกผู้ใช้** (`monitorUserId` ว่าง หรือหา user ไม่พบ) → return ก่อนบันทึก
- **Label ของ ref ที่หา master ไม่พบ** → `buildScopeLabel` fallback เป็นค่า ref ดิบ (ไม่ throw)
- **เปลี่ยน scopeType** → reset `scopeRefs`/`allDepartments` ป้องกันข้อมูลค้างข้ามประเภท (Req 2.5)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

หมายเหตุ: โปรเจกต์ไม่มี test framework การตรวจสอบหลักคือ TypeScript compiler + Vite build คุณสมบัติด้านล่างระบุพฤติกรรมที่ logic (`saveMonitor`, `openEditMonitor`, การ toggle, การ render) ต้องคงไว้ และใช้เป็นเกณฑ์ตรวจด้วยมือ/ตรวจสายตาบน mockup

### Property 1: Save-validity invariant

*For any* สถานะฟอร์ม Monitor ที่ผู้ใช้กดบันทึก การบันทึกจะสำเร็จก็ต่อเมื่อ (`allDepartments === true`) หรือ (`scopeRefs.length >= 1`) เท่านั้น และเมื่อสำเร็จ assignment ที่ได้ต้องเป็นไปตาม invariant: ถ้า `allDepartments === true` แล้ว `scopeRefs` ว่าง มิฉะนั้น `scopeRefs.length >= 1`

**Validates: Requirements 1.5, 2.4, 3.5**

### Property 2: Multi-scope storage round-trip

*For any* ประเภท scope และเซ็ตเป้าหมายที่เลือก (ไม่ใช่ all-departments) การบันทึกแล้วเปิดแก้ไข (`openEditMonitor`) แล้วบันทึกซ้ำโดยไม่เปลี่ยนแปลง จะได้ `scopeRefs` เป็นเซ็ตเดียวกันและ `allDepartments` ค่าเดิม (การเลือก department หลายรายการถูกเก็บครบใน `scopeRefs`)

**Validates: Requirements 2.2, 2.3, 4.4**

### Property 3: All-departments toggle invariant

*For any* สถานะฟอร์มที่ `scopeType === 'department'` เมื่อเปิด "ทุกฝ่าย" ผลลัพธ์คือ `allDepartments === true` และ `scopeRefs` ว่างพร้อม disable การเลือกรายฝ่าย และการเปิดแล้วปิด "ทุกฝ่าย" (round trip) จะได้ `allDepartments === false` พร้อม enable การเลือกรายฝ่ายกลับคืน

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 4: Scope-type change resets targets

*For any* สถานะฟอร์มก่อนหน้า เมื่อผู้ใช้เปลี่ยนค่า `scopeType` ฟอร์มจะมี `scopeRefs` ว่างและ `allDepartments === false` เสมอ

**Validates: Requirements 2.5**

### Property 5: Scope column chip rendering

*For any* Monitor_Assignment ในตาราง ถ้า `allDepartments === true` จะ render Scope_Chip เดียวที่มีข้อความ "ทุกฝ่าย" มิฉะนั้นจำนวน Scope_Chip จะเท่ากับ `scopeRefs.length` โดยแต่ละ chip มี label ตรงกับ `buildScopeLabel(scopeType, ref)` และมี badge ประเภท scope ตรงกับ `scopeType` เสมอ

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Monitor user picker fidelity

*For any* รายการ `USERS` ตัวเลือกใน Monitor_User_Picker จะประกอบด้วยผู้ใช้ที่ `active === true` เท่านั้น และเมื่อบันทึก assignment สำหรับผู้ใช้ที่เลือก ค่า `monitorUserId` / `monitorUserName` / `monitorUserDept` ของแถวที่บันทึกจะตรงกับผู้ใช้นั้น โดยผู้ใช้คนเดียวกันสามารถมีได้หลาย assignment (ไม่มีการ dedup)

**Validates: Requirements 5.1, 5.2, 5.3**

## Testing Strategy

โปรเจกต์เป็น frontend-only mockup ที่ **ไม่มี test framework** — การตรวจสอบหลักตาม Requirement 9:

1. **TypeScript type check** — รัน `tsc --noEmit` (หรือ `pnpm build` ที่รวม tsc) เพื่อยืนยันว่าไม่มี type error และทุกจุดที่อ้าง `scopeRef`/`scopeLabel` เดิมถูกแก้ครบ (Req 9.1, 9.2)
2. **Vite build** — รัน `pnpm build` เพื่อยืนยันว่า bundle สำเร็จ
3. **Manual verification บน dev server** — ตรวจด้วยสายตาบน `AdminPage` แท็บ Monitor ตาม Property 1–6:
   - เพิ่ม Monitor แบบ multi-dept, all-departments, และ scope อื่น
   - ตรวจ block save เมื่อไม่เลือกเป้าหมาย
   - ตรวจ toggle ทุกฝ่าย (clear + disable + re-enable)
   - ตรวจการ render chips ในตาราง และการ populate ตอน edit

คำสั่งที่ผู้ใช้ควรรันเอง (ไม่รันใน watch mode):
- `pnpm build` — type check + production build ครั้งเดียว
- `pnpm dev` — dev server สำหรับตรวจด้วยสายตา (รันเองในเทอร์มินัล)

การเปลี่ยนแปลงใน `P2026-040_Analysis.md` เป็น documentation-only ตรวจด้วยการอ่านทาน ไม่มีผลต่อ build

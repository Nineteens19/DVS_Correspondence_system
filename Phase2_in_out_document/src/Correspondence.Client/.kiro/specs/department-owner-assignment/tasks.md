# Implementation Plan: Department Owner Assignment

## Overview

This plan implements department-level assignment with owner-first routing and onward delegation in the DVS Correspondence System mockup (React + TypeScript + Tailwind, Vite, mock data only). The domain layer (pure helpers in `src/mock.ts`) is built first because `RegisterPage`, `AdminPage`, `DocumentDetailPage`, and `TaskInboxPage` all depend on it. The pages are then extended incrementally, followed by a build-verification checkpoint. The analysis-document update (P2026-040) is documentation-only and independent of the code tasks.

Verification uses TypeScript type-check and Vite build (`pnpm exec tsc --noEmit`, `pnpm run build`); no test framework is installed. Property-based test sub-tasks are marked optional (`*`) and require adding Vitest + fast-check first.

## Tasks

- [ ] 1. Build the department-owner domain layer in `src/mock.ts`
  - [ ] 1.1 Add owner mapping and resolver helpers
    - Keep `DEPARTMENTS` as `string[]` (no structural change) for backward compatibility
    - Add `DEPARTMENT_OWNERS: Record<string, string>` mapping each department to an owner username, including `ฝ่ายการเงิน` → `wichai.c` and `ฝ่ายทรัพยากรบุคคล` → `preeya.w`; ensure every value is a username present in `USERS`
    - Add `DEFAULT_OWNER_FALLBACK: User` guaranteed to be an active, existing user
    - Implement `resolveDepartmentOwner(department: string): User` that resolves via `DEPARTMENT_OWNERS` and falls back to `DEFAULT_OWNER_FALLBACK`, never throwing
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 1.2 Write property test for owner resolution integrity
    - **Property 1: Owner resolution integrity** — for any `d` in `DEPARTMENTS`, `resolveDepartmentOwner(d)` returns exactly one `User` present in `USERS`
    - **Validates: Requirements 2.1, 2.3, 2.6**
    - Note: requires adding Vitest + fast-check to the project first (min 100 iterations)

  - [ ]* 1.3 Write property test for manager-first owner rule
    - **Property 2: Manager-first owner rule** — for any department with at least one active manager-role user, `resolveDepartmentOwner` returns a `manager`-role user of that department
    - **Validates: Requirements 2.2**
    - Note: requires Vitest + fast-check (min 100 iterations)

  - [ ] 1.4 Add candidate-filter helpers
    - Implement `ownerCandidates(department: string): User[]` returning active users whose `department` matches
    - Implement `subordinateCandidates(department: string): User[]` returning active same-department users excluding the resolved owner
    - _Requirements: 3.2, 5.2_

  - [ ]* 1.5 Write property tests for candidate filters
    - **Property 4: Owner-candidate filter validity** — every user from `ownerCandidates(d)` is active and in department `d`
    - **Property 6: Subordinate-candidate filter validity** — every user from `subordinateCandidates(d)` is active, in department `d`, and is not the owner
    - **Validates: Requirements 3.2, 5.2**
    - Note: requires Vitest + fast-check (min 100 iterations)

- [ ] 2. Extend RegisterPage with department-as-assignee (REQ 1)
  - [ ] 2.1 Introduce typed assignee selection state
    - Define `AssigneeSelection` interface (`key`, `label`, `assigneeType`, `department`, `ownerName?`) and change state to `useState<AssigneeSelection[]>([])`
    - Implement `togglePerson(user)` producing `assigneeType: 'person'` and `toggleDepartment(dept)` producing `assigneeType: 'department'` with `ownerName` from `resolveDepartmentOwner`; toggles are set-like (add if absent, remove if present)
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

  - [ ] 2.2 Extend the assignee picker modal with a person/department toggle
    - Reuse the existing `Modal` from `components/ui`; add a two-segment toggle (บุคคล / ฝ่าย)
    - Person list uses the current `USERS` filter; department list renders `DEPARTMENTS` with each row showing the department name and subtitle `หัวหน้า/เจ้าของฝ่าย: {resolveDepartmentOwner(dept).name}`
    - Selected-list panel renders both kinds (department rows show owner line; persons keep avatar/department line); removing either calls the matching toggle
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

  - [ ]* 2.3 Write property test for selection type tagging
    - **Property 3: Selection type tagging** — department entries have `assigneeType === 'department'` with `department` equal to the selected department; person entries have `assigneeType === 'person'` with `department` equal to the user's department
    - **Validates: Requirements 1.2, 1.3, 1.6**
    - Note: requires Vitest + fast-check (min 100 iterations)

- [ ] 3. Add the Master Data ฝ่าย/หัวหน้า tab to AdminPage (REQ 3)
  - [ ] 3.1 Add master-data tab and owner list view
    - Add a `master-data` tab labelled "Master Data ฝ่าย/หัวหน้า" to the existing tab bar
    - Keep local owner state `useState<Record<string,string>>(DEPARTMENT_OWNERS)`; render a table of `DEPARTMENTS` with each current owner name resolved through `USERS`
    - _Requirements: 3.1_

  - [ ] 3.2 Add the owner editor modal
    - Open a per-department editor whose `<select>` is populated by `ownerCandidates(department)`
    - Disable the confirm button while no user is selected
    - On confirm, update the local owner map for that department and call `showToast` naming the department and new owner (e.g. `กำหนดหัวหน้า/เจ้าของฝ่าย {dept} เป็น {ownerName} เรียบร้อย`)
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Owner-first display and delegation in DocumentDetailPage (REQ 4, 5)
  - [ ] 4.1 Show owner-first for department sub-assignments and accept-as-owner
    - Seed local `useState<SubAssignment[]>` from `SUB_ASSIGNMENTS[doc.id]`
    - For entries where `assigneeType === 'department'`, display the responsible person as `resolveDepartmentOwner(s.department).name` with label `ผู้รับผิดชอบ (หัวหน้า/เจ้าของฝ่าย)`
    - Accepting a department sub-assignment sets status to `accepted` and records the accepting user as the owner (derived `acceptedBy = owner.name`)
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ]* 4.2 Write property test for owner-first routing derivation
    - **Property 5: Owner-first routing derivation** — for any entry with `assigneeType === 'department'`, the displayed responsible acceptor equals `resolveDepartmentOwner(entry.department)`
    - **Validates: Requirements 4.1, 4.2**
    - Note: requires Vitest + fast-check (min 100 iterations)

  - [ ] 4.3 Add the delegate action and `buildDelegation`
    - Implement `buildDelegation(parent, subordinate)` returning a new person-type sub-assignment (`assigneeType: 'person'`, `assigneeName` = subordinate name, same `department`, `status: 'pending'`, delegation note)
    - Show a "มอบหมายต่อ (Delegate)" button on accepted department sub-assignment cards when the acting user is the owner; open a `Modal` whose `<select>` is populated by `subordinateCandidates(s.department)` with an empty-state message when none exist
    - Disable confirm while no subordinate is selected; on confirm, append the new `pending` sub-assignment to local state and show a toast naming the delegated subordinate
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7_

  - [ ]* 4.4 Write property test for delegation construction invariants
    - **Property 7: Delegation construction invariants** — `buildDelegation(parent, subordinate)` yields `assigneeType === 'person'`, `assigneeName` = subordinate name, `department` = parent department, and `status === 'pending'`
    - **Validates: Requirements 5.3, 5.4**
    - Note: requires Vitest + fast-check (min 100 iterations)

- [ ] 5. Reflect owner-first and delegated routing in TaskInboxPage (REQ 4.3, 5.5)
  - [ ] 5.1 Attribute accept actions to owner/subordinate
    - For pending department sub-assignments, present the accept action (in the `waiting-accept` tab) with recipient attribution derived from `resolveDepartmentOwner(s.department)` so the accept is addressed to the owner
    - For delegation sub-assignments, attribute the accept action to the selected subordinate; leave the existing accept confirmation flow otherwise unchanged
    - _Requirements: 4.3, 5.5_

- [ ] 6. Checkpoint - Ensure the mockup builds cleanly
  - Run `pnpm exec tsc --noEmit` and `pnpm run build`; both must pass with no errors
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 7.1, 7.2_

- [ ] 7. Update the P2026-040 analysis document (REQ 6) — independent, can run in parallel
  - [ ] 7.1 Document owner-first-then-delegate routing and change log
    - In `P2026-040_Analysis.md` (at `Phase2_in_out_document/P2026-040_Analysis.md`), describe that a department-type assignment routes first to the Department_Owner, referencing the existing `DEPARTMENT.head_user_ref` concept
    - Describe that, after the owner accepts, they may delegate onward to a subordinate in the same department, aligned with BR-2.4
    - Add a new version entry to the change log describing this documentation change; limit edits to terminology, rules, and data-model description, leaving unrelated process logic unchanged
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for a faster MVP; they require adding Vitest + fast-check to the project first (none is installed today).
- Each task references specific requirements sub-clauses for traceability.
- The domain layer (Task 1) is the dependency for all page tasks and is implemented first.
- Task 7 (analysis-doc update) is documentation-only and independent of the code tasks, so it can run in parallel with the code work.
- The checkpoint (Task 6) validates the whole mockup via TypeScript type-check and Vite build, the only verification available without a test framework.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "7.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5", "2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "3.2", "4.1"] },
    { "id": 4, "tasks": ["2.3", "4.2", "4.3", "5.1"] },
    { "id": 5, "tasks": ["4.4"] }
  ]
}
```

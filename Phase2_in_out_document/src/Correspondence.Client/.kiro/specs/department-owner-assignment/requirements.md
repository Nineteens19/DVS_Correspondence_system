# Requirements Document

## Introduction

This feature adds department-level assignment with owner-first routing and onward delegation to the DVS Correspondence System mockup (frontend-only React + TypeScript + Tailwind, Vite, Deves theme, mock data only, no backend). Today, on the incoming register screen a registrar can only pick individual people as assignees, and each department in the master data has no concept of an owner (หัวหน้า/เจ้าของฝ่าย). This feature introduces three connected capabilities:

1. **Department-as-assignee** — the registrar may select an entire department as a sub-assignment target (`assigneeType = 'department'`) for cases where the specific responsible person is unknown at registration time.
2. **Department owner master data** — each department in `DEPARTMENTS` carries a reference to an owner user, editable through a Master Data management area in the Admin screen.
3. **Owner-first routing and delegation** — when a department is chosen as the assignee, the department owner becomes the first responsible acceptor. After the owner accepts, the owner can assign onward (delegate) to a subordinate in the same department, creating a new sub-assignment.

The feature also includes a documentation-only update to the P2026-040 analysis document to describe owner-first-then-delegate routing, aligned with the existing `DEPARTMENT.head_user_ref` concept and BR-2.4 (Multiple Select). All behavior is simulated with mock data (`USERS`, `DEPARTMENTS`); AD/LDAP is simulated. Verification is performed via TypeScript type-check and Vite build, since no test framework is installed.

## Glossary

- **Register_Page**: The incoming/outgoing document registration screen (`src/pages/RegisterPage.tsx`). Department-as-assignee applies to incoming registration only.
- **Admin_Page**: The user and master-data administration screen (`src/pages/AdminPage.tsx`).
- **Document_Detail_Page**: The document detail screen (`src/pages/DocumentDetailPage.tsx`) where sub-assignments and actions are shown.
- **Task_Inbox_Page**: The task inbox screen (`src/pages/TaskInboxPage.tsx`) where a user acts on tasks assigned to them.
- **Department**: An organizational unit listed in `DEPARTMENTS` (`src/mock.ts`).
- **Department_Owner**: The user designated as the head/owner (หัวหน้า/เจ้าของฝ่าย) of a Department, referenced from the department master data. Corresponds to the analysis-document concept `DEPARTMENT.head_user_ref`.
- **User**: A person record in `USERS` (`src/mock.ts`) with fields including `name`, `username`, `department`, `position`, and `role`.
- **Assignee_Type**: The discriminator on a Sub_Assignment indicating whether the target is an individual (`'person'`) or a whole department (`'department'`), per the existing `SubAssignment.assigneeType` type.
- **Sub_Assignment**: A per-recipient work item bound to a document (`SubAssignment` in `src/types.ts`).
- **Department_Sub_Assignment**: A Sub_Assignment whose `assigneeType` is `'department'`.
- **Owner_First_Routing**: The rule that the first responsible acceptor of a Department_Sub_Assignment is that department's Department_Owner.
- **Delegation**: The action by which a Department_Owner, after accepting, assigns onward to a subordinate in the same department, producing a new Sub_Assignment.
- **Delegation_Sub_Assignment**: The new Sub_Assignment created by a Delegation.
- **Subordinate**: A User whose `department` equals the Department_Owner's department and who is not the Department_Owner.
- **Analysis_Document**: The file `P2026-040_Analysis.md` in the `Phase2_in_out_document` folder.
- **Build_Verification**: TypeScript type-check and Vite production build used to verify the mockup compiles without errors.

## Requirements

### Requirement 1: Select a department as assignee during incoming registration

**User Story:** As a registrar, I want to select a department as the assignee when I do not know the specific responsible person, so that the document can still be routed to the correct organizational unit.

#### Acceptance Criteria

1. WHEN the Register_Page is displayed for an incoming document, THE Register_Page SHALL present a control to select one or more Departments as assignees in addition to the existing control for selecting individual Users.
2. WHEN a registrar selects a Department as an assignee, THE Register_Page SHALL record that selection with Assignee_Type equal to `'department'`.
3. WHEN a registrar selects an individual User as an assignee, THE Register_Page SHALL record that selection with Assignee_Type equal to `'person'`.
4. WHERE at least one Department is selected as an assignee, THE Register_Page SHALL display, for each selected Department, the Department name and the name of that Department's Department_Owner.
5. WHEN a registrar removes a selected Department from the assignee list, THE Register_Page SHALL remove that Department from the recorded assignee selection.
6. THE Register_Page SHALL allow a registrar to select both Departments and individual Users within the same registration.

### Requirement 2: Department owner master data

**User Story:** As an administrator, I want each department to carry a reference to its owner user, so that owner-first routing can determine who is responsible first.

#### Acceptance Criteria

1. THE Department master data in `src/mock.ts` SHALL associate each Department with exactly one Department_Owner referenced by a User identifier.
2. WHERE a Department has an assigned manager-role User, THE Department master data SHALL set that Department's Department_Owner to a manager-role User of that Department.
3. WHERE a Department has no manager-role User, THE Department master data SHALL set that Department's Department_Owner to an active User as a defined fallback.
4. THE Department master data SHALL define the Department_Owner of `ฝ่ายการเงิน` as the User with username `wichai.c`.
5. THE Department master data SHALL define the Department_Owner of `ฝ่ายทรัพยากรบุคคล` as the User with username `preeya.w`.
6. WHEN the Department master data is read for any Department listed in `DEPARTMENTS`, THE Department master data SHALL resolve to a User that exists in `USERS`.

### Requirement 3: Manage department owner in the Admin master data UI

**User Story:** As an administrator, I want to view and edit the owner of each department in the Admin screen, so that I can maintain owner-first routing without changing code.

#### Acceptance Criteria

1. THE Admin_Page SHALL provide a master-data management view that lists each Department together with its current Department_Owner name.
2. WHEN an administrator opens the department owner editor for a Department, THE Admin_Page SHALL present a selection control populated with active Users of that Department.
3. WHEN an administrator selects a new Department_Owner and confirms the change, THE Admin_Page SHALL update the displayed Department_Owner for that Department to the selected User.
4. WHEN an administrator confirms a Department_Owner change, THE Admin_Page SHALL display a confirmation message identifying the Department and the new Department_Owner.
5. WHILE the department owner editor is open, IF no User is selected as the Department_Owner, THEN THE Admin_Page SHALL disable confirmation of the change.

### Requirement 4: Owner-first routing for department assignments

**User Story:** As a department owner, I want to be the first responsible acceptor when my department is assigned a document, so that I can triage the work before it reaches my team.

#### Acceptance Criteria

1. WHEN a Department_Sub_Assignment is created, THE Document_Detail_Page SHALL identify the responsible first acceptor as the Department_Owner of that Department.
2. WHEN a Department_Sub_Assignment is displayed, THE Document_Detail_Page SHALL display the Department_Owner name as the current responsible person for that Sub_Assignment.
3. WHILE a Department_Sub_Assignment is in `pending` status, THE Task_Inbox_Page SHALL present the accept action for that Sub_Assignment to the Department_Owner.
4. WHEN the Department_Owner accepts a Department_Sub_Assignment, THE Document_Detail_Page SHALL set that Sub_Assignment status to `accepted` and record the accepting User as the Department_Owner.

### Requirement 5: Onward delegation to a subordinate

**User Story:** As a department owner who has accepted a department assignment, I want to delegate the work onward to a subordinate in my department, so that the responsible team member handles it.

#### Acceptance Criteria

1. WHILE a Department_Sub_Assignment is in `accepted` status and the acting User is its Department_Owner, THE Document_Detail_Page SHALL present a delegate action for that Sub_Assignment.
2. WHEN the Department_Owner opens the delegate action, THE Document_Detail_Page SHALL present a selection control populated with Subordinates of the Department_Owner's Department.
3. WHEN the Department_Owner selects a Subordinate and confirms the delegation, THE Document_Detail_Page SHALL create a Delegation_Sub_Assignment with Assignee_Type equal to `'person'`, the selected Subordinate as assignee, and the same Department.
4. WHEN a Delegation_Sub_Assignment is created, THE Document_Detail_Page SHALL set its initial status to `pending`.
5. WHEN a Delegation_Sub_Assignment is created, THE Task_Inbox_Page SHALL present the accept action for that Sub_Assignment to the selected Subordinate.
6. WHILE the delegate action is open, IF no Subordinate is selected, THEN THE Document_Detail_Page SHALL disable confirmation of the delegation.
7. WHEN a delegation is confirmed, THE Document_Detail_Page SHALL display a confirmation message identifying the delegated Subordinate.

### Requirement 6: Document owner-first-then-delegate routing in the analysis document

**User Story:** As a business analyst, I want the analysis document to describe owner-first-then-delegate routing, so that the specification stays aligned with the implemented mockup and existing rules.

#### Acceptance Criteria

1. THE Analysis_Document SHALL describe that a department-type assignment routes first to the Department_Owner, referencing the existing `DEPARTMENT.head_user_ref` concept.
2. THE Analysis_Document SHALL describe that, after the Department_Owner accepts, the Department_Owner may delegate onward to a subordinate within the same Department, aligned with BR-2.4.
3. THE Analysis_Document SHALL record the update in its change log with a new version entry describing the owner-first-then-delegate routing documentation change.
4. THE Analysis_Document update SHALL be limited to terminology, rules, and data-model description and SHALL leave unrelated process logic descriptions unchanged.

### Requirement 7: Build verification

**User Story:** As a developer, I want the mockup to compile cleanly, so that the added department assignment behavior does not break the build.

#### Acceptance Criteria

1. WHEN Build_Verification runs after the changes, THE mockup SHALL complete the TypeScript type-check with no type errors.
2. WHEN Build_Verification runs after the changes, THE mockup SHALL complete the Vite production build with no build errors.

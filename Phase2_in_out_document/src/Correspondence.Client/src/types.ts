export type Screen =
  | 'login'
  | 'dashboard'
  | 'document-list-incoming'
  | 'document-list-outgoing'
  | 'document-detail'
  | 'task-inbox'
  | 'register-incoming'
  | 'register-outgoing'
  | 'admin'
  | 'reports'

export type UrgencyLevel = 'normal' | 'urgent' | 'very-urgent'

// รอบการแจ้งเตือนตามระดับความเร่งด่วน (จำนวนวัน จำนวนเต็มบวก) — Reminder Interval Config
export type ReminderIntervalConfig = Record<UrgencyLevel, number>

// สถานะเอกสารรับเข้า (Main Document) — หมวด 6.1
export type IncomingDocStatus =
  | 'registered'              // Registered
  | 'pending-acceptance'      // Pending Acceptance
  | 'in-progress'             // In Progress
  | 'awaiting-physical-return' // Awaiting Physical Return (ฉบับจริงเท่านั้น)
  | 'completed'               // Completed
  | 'cancelled'               // Cancelled

// สถานะเอกสารส่งออก — หมวด 6.3
export type OutgoingDocStatus =
  | 'registered'    // Registered
  | 'attached'      // Attached
  | 'ready-to-send' // Ready To Send
  | 'sent'          // Sent
  | 'delivered'     // Delivered
  | 'completed'     // Completed
  | 'cancelled'     // Cancelled

// Deadline Flag — หมวด 6.4 (สถานะเสริม คู่ขนานกับสถานะหลัก)
export type DeadlineFlag = 'on-track' | 'due-soon' | 'overdue' | 'cleared'

// ใช้รวมสำหรับ UI List/Filter (ครอบคลุมทั้งสองประเภท)
export type DocStatus =
  | 'registered'
  | 'pending-acceptance'
  | 'in-progress'
  | 'awaiting-physical-return'
  | 'attached'
  | 'ready-to-send'
  | 'sent'
  | 'delivered'
  | 'completed'
  | 'cancelled'

// ระดับชั้นความลับของเอกสาร — หมวด 3.4 & BR-1.4-A
export type ConfidentialityLevel = 'normal' | 'confidential' | 'top-secret'

// ประเภทงานเอกสาร — doc_direction (แทน Phase) หมวด 10
export type DocDirection = 'incoming' | 'outgoing'

export type UserRole = 'staff' | 'manager' | 'executive' | 'admin'

export interface Document {
  id: string
  docNumber: string
  docNumberEN?: string        // รหัสเอกสารภาษาอังกฤษคู่ขนาน (Dual Key CR)
  subject: string
  type: 'email' | 'physical'
  urgency: UrgencyLevel
  confidentiality?: ConfidentialityLevel // ปกติ / ลับ / ลับมาก (BR-1.4-A)
  status: DocStatus
  deadlineFlag: DeadlineFlag   // Deadline Flag แยกจาก status หลัก
  originDepartment: string     // ฝ่ายต้นทาง (Origin_Department) — ฝ่ายของผู้สร้าง/ต้นเรื่อง
  department: string           // ฝ่ายที่รับผิดชอบ (Responsible_Department) — ฝ่ายที่ดำเนินการ/ปลายทาง
  sender: string
  receiver: string
  deadline: string
  progress: number
  docDirection: DocDirection   // incoming / outgoing (แทน phase)
  currentHolder: string
  currentHolderDept: string
  receivedAt: string
  description: string
  attachments: string[]
  assignedTo?: string[]        // รายชื่อผู้ได้รับมอบหมาย (สำหรับตรวจสิทธิ์ ลับมาก)
  deliveryMethod?: string      // รูปแบบการส่ง (Delivery Method id — เฉพาะเอกสารส่งออก)
  createdBy?: string
}

export interface OutgoingDocItem {
  id: string
  description: string
  recipientName: string
  note?: string
}

export interface OutgoingRecipient {
  id: string
  name: string
  position: string
  department: string
}

export interface OutgoingSigner {
  id: string
  name: string
  position: string
}

export interface OutgoingDocRequest {
  orgType: 'general' | 'special'
  confidentiality?: ConfidentialityLevel
  externalOrg: string
  customOrgName?: string
  subject: string
  remark?: string
  items: OutgoingDocItem[]
  recipients: OutgoingRecipient[]
  signers: OutgoingSigner[]
  requesterName: string
  requesterDept: string
  requestDate: string
}

export interface TimelineEvent {
  id: string
  actor: string
  action: string
  timestamp: string
  note?: string
  status: 'completed' | 'current' | 'pending'
  department: string
  duration?: string
  isBottleneck?: boolean
  children?: TimelineEvent[]
  customNode?: React.ReactNode
}

export interface Task {
  id: string
  docId: string
  assignmentId?: string
  docNumber: string
  subject: string
  urgency: UrgencyLevel
  taskType: 'accept' | 'review' | 'forward' | 'return' | 'close'
  group: 'waiting-accept' | 'in-progress' | 'waiting-forward' | 'waiting-return' | 'outgoing'
  senderName: string
  receivedAt: string
  deadline: string
  description: string
  deadlineFlag?: DeadlineFlag
}

export interface User {
  id: string
  name: string
  username: string
  department: string
  departmentId?: string
  position: string
  role: UserRole
  roleId?: string
  active: boolean
  email: string
  lastLogin?: string
}

export interface NavItem {
  id: Screen
  label: string
  icon: string
  badge?: number
  subItems?: { id: Screen; label: string }[]
}

// ─── Workflow ตาม SRS P2026-040 ───────────────────────────────────────────────

// สถานะงานย่อยรายผู้รับ (Assignment / Sub Doc) — หมวด 6.2
export type SubStatus =
  | 'pending'     // Pending Acceptance
  | 'pending-acceptance'
  | 'accepted'    // Accepted (ยืนยันถือครองเอกสารตัวจริง)
  | 'in-progress' // In progress
  | 'inprogress'  // Legacy in-progress spelling
  | 'delegated'   // Department head has assigned team members
  | 'rejected'    // Rejected / ตีกลับ
  | 'recalled'    // ต้นทางดึงกลับ
  | 'forwarded'   // ส่งต่อลำดับถัดไป (เก็บ Log ไม่นับตัวหาร)
  | 'success'     // ปิดงานสำเร็จ
  | 'cancelled'   // ยกเลิก

// งานย่อยของเอกสารหลัก (ผูก Key Reference เดียวกัน)
export interface SubAssignment {
  id: string
  docId: string
  assigneeId?: string
  assigneeName: string
  assigneeType: 'person' | 'department' // รายบุคคล / รายฝ่าย
  departmentId?: string
  department: string
  status: SubStatus
  acceptedAt?: string
  note?: string     // เหตุผลปฏิเสธ ฯลฯ
  forwardedTo?: string // ถ้า status = forwarded
  parentId?: string // id ของ Parent_Sub ที่งานนี้สืบทอดมา (Onward Delegation lineage); undefined = root
}

// รายการ Chain of Custody (ผู้ถือครองเอกสารฉบับจริง — BR-6.1)
export interface CustodyEntry {
  id: string
  docId: string
  holder: string
  department: string
  heldAt: string
  action: 'received' | 'holding' | 'handed-over' | 'returned'
  note?: string
}

// Audit Log (ประวัติการเปลี่ยนสถานะ — เก็บ 10 ปี, NFR-06)
export interface AuditEntry {
  id: string
  docId: string
  actor: string
  action: string // Register / Assign / Accept / Reject / Forward / Recall / Cancel / Deliver ...
  fromState?: string
  toState?: string
  timestamp: string
  note?: string
  ip?: string
}

// ─── Monitor (Configurable Watcher) — หมวด 3.5 & BR-5.3 ─────────────────────

export type MonitorScopeType = 'department' | 'workgroup' | 'user' | 'doc_direction'

export interface MonitorAssignment {
  id: string
  monitorUserId: string
  monitorUserName: string
  monitorUserDept: string
  scopeType: MonitorScopeType
  scopeRefs: string[]         // เป้าหมายหลายรายการ: department names / workgroup ids / user ids / doc_direction
  allDepartments?: boolean    // true = ครอบคลุมทุกฝ่ายทั้งที่มีอยู่ปัจจุบันและที่จะเพิ่มในอนาคต
  docDirectionFilter: 'incoming' | 'outgoing' | 'all'
  notifyEnabled: boolean
  effectiveFrom?: string
  effectiveTo?: string
  status: 'active' | 'inactive'
  createdBy: string
  createdAt: string
}

// รูปแบบการส่งเอกสารออก (Delivery Method Master) — Master-Driven Data Entry (BR-1.5)
export interface DeliveryMethod {
  id: string
  label: string
  active: boolean
  isPostalPickup?: boolean
}

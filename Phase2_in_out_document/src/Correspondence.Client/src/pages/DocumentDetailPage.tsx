import { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft, Download, User, Building2,
  Calendar, Clock, CheckCircle, XCircle, ArrowRightCircle,
  AlertCircle, FileText, Phone, Bell, RotateCcw, Ban,
  GitBranch, History, ShieldCheck, Send, PackageCheck,
  Camera, Plus, Eye, Image as ImageIcon, Upload, Trash2,
  FileSpreadsheet, Paperclip, X, Check, FileCheck,
  Shield, ShieldAlert, Lock, Unlock, KeyRound, Truck, Loader2, Search, Users
} from 'lucide-react'
import {
  StatusBadge, DeadlineFlagBadge, UrgencyBadge, ConfidentialityBadge, ProgressBar, ProgressRing,
  Timeline, Modal, PageHeader, CameraCaptureModal, OtpVerificationModal, DynamicWatermarkOverlay, type CapturedPhoto
} from '../components/ui'
import { formatDisplayDate, getReminderInterval } from '../utils/date'
import { getCurrentUser } from '../utils/auth'
import { docsApi, mapDtoToDocument, adminApi, masterApi } from '../services/api'
import type { Screen, SubStatus, SubAssignment, User as UserModel, CustodyEntry, TimelineEvent, Document as DocumentModel, AuditEntry } from '../types'

function latestAssigneesPerTree(subs: SubAssignment[]): SubAssignment[] {
  return subs.filter(s => s.status !== 'cancelled')
}

interface Props {
  docId: string
  onNavigate: (screen: Screen, docId?: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

type TabId = 'timeline' | 'subs' | 'custody' | 'audit'

interface ExtraAttachment {
  id: string
  name: string
  type: 'file' | 'camera'
  size: string
  url?: string
  fileType?: string
  uploadedAt?: string
}

interface ForwardAssigneeSelection {
  key: string
  label: string
  assigneeType: 'person' | 'department'
  department: string
  departmentId: string
  ownerName?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(name: string, fileType?: string) {
  const lower = (name || '').toLowerCase()
  if (lower.endsWith('.pdf')) {
    return (
      <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 text-[#DC3545]">
        <FileText size={16} />
      </div>
    )
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) {
    return (
      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-[#28A745]">
        <FileSpreadsheet size={16} />
      </div>
    )
  }
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    return (
      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-[#012169]">
        <FileText size={16} />
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600">
      <Paperclip size={16} />
    </div>
  )
}

const SUB_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'รอรับงาน', cls: 'bg-[#FFF3CD] text-[#856404]' },
  'pending-acceptance': { label: 'รอรับงาน', cls: 'bg-[#FFF3CD] text-[#856404]' },
  accepted: { label: 'รับงานแล้ว', cls: 'bg-blue-50 text-[#012169]' },
  'in-progress': { label: 'กำลังดำเนินการ', cls: 'bg-blue-50 text-[#012169]' },
  inprogress: { label: 'กำลังดำเนินการ', cls: 'bg-blue-50 text-[#012169]' },
  delegated: { label: 'มอบหมายต่อแล้ว', cls: 'bg-[#D1ECF1] text-[#0C5460]' },
  rejected: { label: 'ปฏิเสธ/ตีกลับ', cls: 'bg-[#F8D7DA] text-[#721C24]' },
  recalled: { label: 'ถูกดึงกลับ', cls: 'bg-[#E2E3E5] text-[#383D41]' },
  forwarded: { label: 'ส่งต่อแล้ว', cls: 'bg-[#D1ECF1] text-[#0C5460]' },
  success: { label: 'ปิดงานสำเร็จ', cls: 'bg-[#D4EDDA] text-[#155724]' },
  completed: { label: 'เสร็จสิ้น', cls: 'bg-[#D4EDDA] text-[#155724]' },
  cancelled: { label: 'ยกเลิก', cls: 'bg-[#E2E3E5] text-[#6C757D] line-through' },
}

function SubStatusBadge({ status }: { status: SubStatus | string }) {
  const c = SUB_STATUS[status] || SUB_STATUS.pending || { label: status, cls: 'bg-gray-100 text-gray-700' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c.cls}`}>{c.label}</span>
}

function buildDelegation(parent: SubAssignment, subordinate: UserModel): SubAssignment {
  return {
    id: `sa-del-${Date.now()}`,
    docId: parent.docId,
    assigneeName: subordinate.name,
    assigneeType: 'person',
    department: parent.department,
    status: 'pending',
    parentId: parent.id,
    note: `มอบหมายต่อโดยหัวหน้าฝ่าย (${parent.department})`,
  }
}

function buildSubTree(
  subs: SubAssignment[],
  toEvent: (s: SubAssignment) => TimelineEvent,
): TimelineEvent[] {
  if (!subs || subs.length === 0) return []
  const nodeById = new Map<string, TimelineEvent>()
  subs.forEach(s => nodeById.set(s.id, toEvent(s)))

  const idSet = new Set(subs.map(s => s.id))
  const roots: TimelineEvent[] = []

  subs.forEach(s => {
    const node = nodeById.get(s.id)
    if (!node) return
    const parentId = s.parentId
    const hasValidParent = Boolean(parentId && idSet.has(parentId) && nodeById.has(parentId))
    if (hasValidParent) {
      const parent = nodeById.get(parentId!)
      if (parent) {
        ;(parent.children ??= []).push(node)
      } else {
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  })
  return roots
}

export default function DocumentDetailPage({ docId, onNavigate, showToast }: Props) {
  const [doc, setDoc] = useState<DocumentModel | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [subsState, setSubsState] = useState<SubAssignment[]>([])
  const [custodyState, setCustodyState] = useState<CustodyEntry[]>([])

  useEffect(() => {
    setIsLoading(true)
    docsApi.getDocumentById(docId)
      .then(dto => {
        if (dto && (dto.id || dto.documentNumber)) {
          const mapped = mapDtoToDocument(dto)
          setDoc(mapped)
          if (mapped.assignments && mapped.assignments.length > 0) {
            const flattenList: any[] = []
            const walk = (items: any[]) => {
              for (const a of items) {
                flattenList.push(a)
                if (a.subAssignments && a.subAssignments.length > 0) {
                  walk(a.subAssignments)
                }
              }
            }
            walk(mapped.assignments)

            setSubsState(flattenList.map((a: any) => ({
              id: a.id || `sub-${a.assigneeId || Math.random()}`,
              docId: mapped.id,
              assigneeId: a.assigneeId,
              assigneeName: a.assigneeName || a.assigneeId || 'ผู้รับผิดชอบ',
              assigneeType: (a.assigneeType === 'department' ? 'department' : 'person') as any,
              departmentId: a.departmentId,
              department: a.departmentName || a.department || 'ฝ่ายที่รับผิดชอบ',
              status: (a.status || 'pending').toLowerCase() as SubStatus,
              acceptedAt: a.acceptedAt ? formatDisplayDate(a.acceptedAt) : undefined,
              parentId: a.parentAssignmentId || a.parentId,
              note: a.remarks || a.note
            })))
          } else {
            setSubsState([])
          }
          if (mapped.custodyLogs && mapped.custodyLogs.length > 0) {
            setCustodyState(mapped.custodyLogs.map((c: any) => ({
              id: c.id || `cu-${Math.random()}`,
              docId: mapped.id,
              holder: c.holderName || c.holderId || 'ผู้ถือครอง',
              department: c.departmentName || mapped.department || 'หน่วยงาน',
              heldAt: formatDisplayDate(c.heldAt) || c.heldAt,
              action: c.action as any,
              note: c.remarks
            })))
          } else {
            setCustodyState([])
          }
        } else {
          setDoc(null)
        }
      })
      .catch(() => {
        setDoc(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [docId])

  // Live Database States
  const [dbUsers, setDbUsers] = useState<UserModel[]>([])
  const [dbDepartments, setDbDepartments] = useState<any[]>([])

  useEffect(() => {
    adminApi.getUsers().then(uList => {
      if (uList && uList.length > 0) {
        setDbUsers(uList.map((u: any) => ({
          id: u.id || u.username,
          name: u.displayName || u.username,
          username: u.username,
          email: u.email,
          department: u.departmentName || 'ฝ่ายสารสนเทศ',
          departmentId: u.departmentId || '',
          position: u.position || (u.roleId === 'ROLE-03' ? 'หัวหน้าฝ่าย' : 'เจ้าหน้าที่'),
          role: (u.roleId === 'ROLE-05' || u.roleId === 'ROLE-04') ? 'admin' : (u.roleId === 'ROLE-03' ? 'manager' : 'staff'),
          active: u.status === 'Active' || u.active !== false
        })))
      }
    }).catch(() => {})

    masterApi.getDepartments().then(dList => {
      if (dList && dList.length > 0) {
        setDbDepartments(dList)
      }
    }).catch(() => {})
  }, [])

  const currentUser = getCurrentUser()
  const isPhysical = doc?.type === 'physical' || (doc as any)?.channel === 'physical'
  const isOutgoing = doc?.docDirection === 'outgoing'
  const isTopSecret = doc?.confidentiality === 'top-secret'
  const deliveryMethodLabel = doc?.deliveryMethod || '—'

  const getDeptHeadUsername = (deptNameOrId?: string): string => {
    if (!deptNameOrId || typeof deptNameOrId !== 'string') return ''
    const clean = deptNameOrId.replace('ฝ่าย', '').trim().toLowerCase()
    const d = dbDepartments.find((x: any) => 
      (x.departmentId && String(x.departmentId).toLowerCase() === deptNameOrId.toLowerCase()) ||
      (x.id && String(x.id).toLowerCase() === deptNameOrId.toLowerCase()) ||
      (x.nameTh && String(x.nameTh).toLowerCase() === deptNameOrId.toLowerCase()) ||
      (x.nameTh && String(x.nameTh).replace('ฝ่าย', '').trim().toLowerCase() === clean) ||
      (x.deptCodeEn && String(x.deptCodeEn).toLowerCase() === deptNameOrId.toLowerCase())
    )
    if (d?.headUserRef) return String(d.headUserRef)
    const head = dbUsers.find(u => ((u.department || '') === deptNameOrId || (u.department || '').includes(clean)) && (u.role === 'manager' || (u.position || '').includes('ผอ.') || (u.position || '').includes('หัวหน้า')))
    return head?.username || ''
  }

  const resolveOwnerName = (dept?: string) => {
    if (!dept || typeof dept !== 'string') return 'ผอ. หน่วยงาน'
    const clean = dept.replace('ฝ่าย', '').trim().toLowerCase()
    const d = dbDepartments.find((x: any) => 
      (x.departmentId && String(x.departmentId).toLowerCase() === dept.toLowerCase()) ||
      (x.id && String(x.id).toLowerCase() === dept.toLowerCase()) ||
      (x.nameTh && String(x.nameTh).toLowerCase() === dept.toLowerCase()) ||
      (x.nameTh && String(x.nameTh).replace('ฝ่าย', '').trim().toLowerCase() === clean)
    )
    if (d?.headUserName) return String(d.headUserName)
    const head = dbUsers.find(u => ((u.department || '') === dept || (u.department || '').includes(clean)) && (u.role === 'manager' || (u.position || '').includes('ผอ.') || (u.position || '').includes('หัวหน้า')))
    return head?.name || `ผอ. ${dept}`
  }

  const getDepartmentId = (departmentNameOrId?: string) => {
    if (!departmentNameOrId) return ''
    const department = dbDepartments.find((item: any) =>
      item.departmentId === departmentNameOrId || item.id === departmentNameOrId || item.nameTh === departmentNameOrId || item.nameEn === departmentNameOrId
    )
    return department?.departmentId || department?.id || ''
  }

  // สิทธิ์ในการรับงาน (Accept) และ มอบหมายต่อ (Delegate)
  // กฎเหล็ก: แม้จะเป็น Admin ก็ไม่มีสิทธิ์รับงานของฝ่ายอื่น ยึดจากหัวหน้าฝ่าย Master เท่านั้น
  // 1. มอบหมายเป็นบุคคล: เฉพาะบุคคลนั้นเท่านั้นที่รับงานได้
  // 2. มอบหมายเป็นฝ่าย: เฉพาะบุคคลที่ผูกเป็น "หัวหน้าฝ่าย" (HeadUserRef ใน Master Data) ของฝ่ายนั้นเท่านั้นที่รับแทนและ assign ต่อได้

  // ตรวจสอบการมอบหมายรายบุคคล
  const legacyDirectAssignee = Boolean(
    doc?.assignedTo?.some(a => typeof a === 'string' && (a.toLowerCase() === (currentUser.username || '').toLowerCase() || a.toLowerCase() === (currentUser.name || '').toLowerCase())) ||
    (doc as any)?.assignments?.some((a: any) => 
      ((a.assigneeId && String(a.assigneeId).toLowerCase() === (currentUser.username || '').toLowerCase()) || 
       (a.assigneeName && String(a.assigneeName).toLowerCase() === (currentUser.name || '').toLowerCase()) ||
       (a.assigneeName && String(a.assigneeName).toLowerCase() === (currentUser.username || '').toLowerCase())) &&
      a.status !== 'cancelled' && a.status !== 'rejected'
    ) ||
    subsState.some(s => 
      s.assigneeType === 'person' &&
      ((s.assigneeName && String(s.assigneeName).toLowerCase() === (currentUser.username || '').toLowerCase()) || 
       (s.assigneeName && String(s.assigneeName).toLowerCase() === (currentUser.name || '').toLowerCase())) &&
      s.status !== 'cancelled' && s.status !== 'rejected'
    )
  )

  // ตรวจสอบการมอบหมายรายฝ่าย — ยึดจาก HeadUserRef ใน Master Data เท่านั้น
  const targetDepartmentName = doc?.department || (doc as any)?.responsibleDepartmentName || ''
  const targetDepartmentHeadUsername = getDeptHeadUsername(targetDepartmentName)
  const legacyDeptHeadOfResponsibleDept = Boolean(
    targetDepartmentHeadUsername && 
    targetDepartmentHeadUsername.toLowerCase() === (currentUser.username || '').toLowerCase()
  )

  const legacyIsAssignedToDepartment = Boolean(
    targetDepartmentName && !legacyDirectAssignee
  )

  // มีสิทธิ์กดรับงานหรือไม่: เฉพาะผู้ได้รับมอบหมายตรง หรือ หัวหน้าฝ่ายตาม Master Data เท่านั้น (Admin ก็รับแทนฝ่ายอื่นไม่ได้)
  const legacyCanAccept = legacyDirectAssignee || legacyDeptHeadOfResponsibleDept

  // มีสิทธิ์มอบหมายต่อ (Delegate) หรือไม่: เฉพาะผู้ได้รับมอบหมายตรง หรือ หัวหน้าฝ่ายตาม Master Data เท่านั้น
  const normalizeUserId = (value?: string) => (value || '').trim().toLowerCase()
  const currentUsername = normalizeUserId(currentUser.username)
  const isOwnPersonAssignment = (assignment: SubAssignment) =>
    assignment.assigneeType === 'person' &&
    normalizeUserId(assignment.assigneeId || assignment.assigneeName) === currentUsername
  const isManagedDepartmentAssignment = (assignment: SubAssignment) =>
    assignment.assigneeType === 'department' &&
    normalizeUserId(getDeptHeadUsername(assignment.departmentId || assignment.department)) === currentUsername
  const isPendingAssignment = (assignment: SubAssignment) => assignment.status === 'pending' || assignment.status === 'pending-acceptance'
  const isActiveAssignment = (assignment: SubAssignment) => assignment.status === 'accepted' || assignment.status === 'in-progress' || assignment.status === 'inprogress'

  // These entries represent exactly the signed-in user's branch. Do not use
  // MAIN_DOC.Status here: it is aggregate progress for all parallel branches.
  const pendingDirectAssignment = subsState.find(assignment =>
    isOwnPersonAssignment(assignment) && isPendingAssignment(assignment),
  )
  const activeDirectAssignment = subsState.find(assignment =>
    isOwnPersonAssignment(assignment) && isActiveAssignment(assignment),
  )
  const departmentAssignmentForDelegation = subsState.find(assignment =>
    isManagedDepartmentAssignment(assignment) &&
    (isPendingAssignment(assignment) || isActiveAssignment(assignment)),
  )
  const isDirectAssignee = Boolean(pendingDirectAssignment || activeDirectAssignment)
  const isDeptHeadOfResponsibleDept = Boolean(departmentAssignmentForDelegation)
  const isAssignedToDepartment = Boolean(departmentAssignmentForDelegation)
  const canAccept = Boolean(pendingDirectAssignment)
  const canDelegate = Boolean(departmentAssignmentForDelegation)

  // ตรวจสอบสิทธิ์สำหรับเอกสารลับมาก
  const isAssigned = isTopSecret && doc
    ? (
        isDirectAssignee ||
        isDeptHeadOfResponsibleDept ||
        currentUser.role === 'admin' ||
        currentUser.role === 'executive'
      )
    : true

  // ตรวจสอบสิทธิ์ "ต้นทาง (Origin / Creator / Registrar / Admin)"
  // ดึงงานกลับ (Recall) หรือ ยกเลิกเอกสาร (Cancel) ต้องเป็นต้นทางเท่านั้นที่ทำได้
  const isOrigin = Boolean(
    currentUser.role === 'admin' ||
    currentUser.roleId === 'ROLE-05' ||
    currentUser.roleId === 'ROLE-01' ||
    currentUser.department === 'งานสารบรรณ' ||
    currentUser.department === 'ฝ่ายสารบรรณ' ||
    (doc?.createdBy && (
      String(doc.createdBy).toLowerCase() === String(currentUser.username || '').toLowerCase() ||
      String(doc.createdBy).toLowerCase() === String(currentUser.id || '').toLowerCase() ||
      String(doc.createdBy).toLowerCase() === String(currentUser.name || '').toLowerCase()
    )) ||
    (doc?.originDepartment && (
      doc.originDepartment === currentUser.department ||
      doc.originDepartment === (currentUser as any).departmentName
    ))
  )

  const trackCustody = isPhysical && !isOutgoing

  const appendCustody = (holder: string, department: string, action: CustodyEntry['action'], note?: string) => {
    if (!trackCustody || !doc) return
    const heldAt = new Date().toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    setCustodyState(prev => [
      ...prev,
      { id: `cu-${Date.now()}`, docId: doc.id, holder, department, heldAt, action, note },
    ])
  }

  // Audit Logs จาก Database Histories หรือสร้างจากสถานะปัจจุบัน
  const audit: AuditEntry[] = (doc && (doc as any).histories && (doc as any).histories.length > 0)
    ? (doc as any).histories.map((h: any) => ({
        id: h.id || `au-${Math.random()}`,
        docId: doc.id,
        actor: h.actorName || h.actorId || 'ระบบ',
        action: h.actionSummaryTh || h.action || 'กิจกรรม',
        fromState: h.fromStatus,
        toState: h.toStatus || 'ดำเนินการ',
        timestamp: formatDisplayDate(h.createdAt) || h.createdAt,
        note: h.remarks,
      }))
    : (doc
        ? [
            {
              id: `au-${doc.id}-init`,
              docId: doc.id,
              actor: doc.currentHolder || doc.sender || 'เจ้าหน้าที่สารบรรณ',
              action: doc.docDirection === 'outgoing' ? 'ลงทะเบียนเอกสารส่งออก' : 'ลงทะเบียนเอกสารรับเข้า',
              fromState: undefined,
              toState: doc.status || 'registered',
              timestamp: doc.receivedAt || '',
              note: `เอกสารเลขที่ ${doc.docNumber}`,
            }
          ]
        : [])

  const countable = subsState.filter(s => s.status !== 'cancelled' && s.status !== 'delegated')
  const successCount = subsState.filter(s => s.status === 'success').length
  const computedProgress = countable.length === 0 ? (doc?.progress || 0) : Math.round((successCount / countable.length) * 100)

  const reminderDays = doc ? getReminderInterval(doc.urgency) : 5
  const reminderOriginName = doc ? (doc.sender || doc.originDepartment || 'งานสารบรรณ') : ''
  const reminderLatest = latestAssigneesPerTree(subsState)
  const reminderRecipients = Array.from(new Set<string>([reminderOriginName, ...reminderLatest.map(s => s.assigneeName)].filter(Boolean)))

  const [tab, setTab] = useState<TabId>('timeline')
  const [modal, setModal] = useState<null | 'accept' | 'reject' | 'forward' | 'followup' | 'recall' | 'cancel' | 'return' | 'complete' | 'p2-send' | 'p2-deliver'>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [completeNote, setCompleteNote] = useState('')
  
  // Forward Modal state (support both Department & Person like Register page)
  const [forwardPickerMode, setForwardPickerMode] = useState<'department' | 'person'>('department')
  const [forwardSearch, setForwardSearch] = useState('')
  const [selectedForwardAssignees, setSelectedForwardAssignees] = useState<ForwardAssigneeSelection[]>([])
  const [forwardNote, setForwardNote] = useState('')

  const [deliverFiles, setDeliverFiles] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [extraAttachments, setExtraAttachments] = useState<ExtraAttachment[]>([])
  const [previewPhoto, setPreviewPhoto] = useState<ExtraAttachment | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // มอบหมายต่อ (Delegate)
  const [delegatingSub, setDelegatingSub] = useState<SubAssignment | null>(null)
  const [selectedSubordinateIds, setSelectedSubordinateIds] = useState<string[]>([])
  const delegatingDepartmentId = delegatingSub?.departmentId || (delegatingSub ? getDepartmentId(delegatingSub.department) : '')
  const delegateCandidates = delegatingDepartmentId
    ? dbUsers.filter(user => user.active && user.departmentId === delegatingDepartmentId && user.username !== currentUser.username)
    : []
  const closeDelegate = () => { setDelegatingSub(null); setSelectedSubordinateIds([]) }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const deliverFileInputRef = useRef<HTMLInputElement>(null)

  const close = () => {
    setModal(null)
    setRejectNote('')
    setCompleteNote('')
    setSelectedForwardAssignees([])
    setForwardNote('')
    setForwardSearch('')
  }

  const toggleForwardPerson = (user: UserModel) => {
    if (!user.departmentId) return
    const key = user.username
    setSelectedForwardAssignees(previous => {
      if (previous.some(item => item.key === key)) return previous.filter(item => item.key !== key)
      if (previous.length > 0 && previous[0].departmentId !== user.departmentId) {
        showToast('การส่งต่อหนึ่งครั้งเลือกผู้รับได้เฉพาะฝ่ายปลายทางเดียว', 'error')
        return previous
      }
      return [...previous, { key, label: user.name, assigneeType: 'person', department: user.department, departmentId: user.departmentId }]
    })
  }

  const toggleForwardDepartment = (department: any) => {
    const departmentId = department.departmentId || department.id
    const departmentName = department.nameTh || department.nameEn || department.name
    if (!departmentId || !departmentName) return
    setSelectedForwardAssignees(previous => {
      if (previous.some(item => item.key === departmentId)) return previous.filter(item => item.key !== departmentId)
      if (previous.length > 0 && previous[0].departmentId !== departmentId) {
        showToast('การส่งต่อหนึ่งครั้งเลือกผู้รับได้เฉพาะฝ่ายปลายทางเดียว', 'error')
        return previous
      }
      return [...previous, { key: departmentId, label: departmentName, assigneeType: 'department', department: departmentName, departmentId, ownerName: resolveOwnerName(departmentId) }]
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="text-[#012169] animate-spin" />
        <p className="text-sm font-semibold text-[#6C757D]">กำลังโหลดข้อมูลเอกสาร...</p>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="ไม่พบข้อมูลเอกสาร"
          breadcrumb={[
            { label: 'รายการเอกสาร', onClick: () => onNavigate('document-list-incoming') },
            { label: docId },
          ]}
          actions={
            <button onClick={() => onNavigate('document-list-incoming')} className="btn-outline text-xs gap-1.5 shadow-sm">
              <ArrowLeft size={14} />
              กลับหน้ารายการ
            </button>
          }
        />

        <div className="card p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#212529]">ไม่พบเอกสารเลขที่ "{docId}" ในระบบ</h3>
            <p className="text-xs text-[#6C757D] mt-1 leading-relaxed">
              เอกสารนี้อาจยังไม่ได้ลงทะเบียน หรือถูกล้างข้อมูลออก ท่านสามารถลงทะเบียนเอกสารใหม่เพื่อทดลองระบบได้
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={() => onNavigate('register-incoming')}
              className="btn-primary text-xs py-2 px-4 shadow-sm w-full sm:w-auto"
            >
              + ลงทะเบียนเอกสารรับเข้าใหม่
            </button>
            <button
              onClick={() => onNavigate('document-list-incoming')}
              className="btn-outline text-xs py-2 px-4 shadow-sm w-full sm:w-auto"
            >
              ดูรายการเอกสารทั้งหมด
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleAccept = async () => {
    if (!pendingDirectAssignment) {
      showToast('ไม่มี assignment รายบุคคลของท่านที่รอรับงาน', 'error')
      close()
      return
    }
    close()
    try {
      await docsApi.accept(doc.id, pendingDirectAssignment.id, 'รับงานเรียบร้อย')
      const updated = await docsApi.getDocumentById(doc.id)
      if (updated) {
        const mapped = mapDtoToDocument(updated)
        setDoc(mapped)
        if (mapped.assignments && mapped.assignments.length > 0) {
          const flattenList: any[] = []
          const walk = (items: any[]) => {
            for (const a of items) {
              flattenList.push(a)
              if (a.subAssignments && a.subAssignments.length > 0) walk(a.subAssignments)
            }
          }
          walk(mapped.assignments)
          setSubsState(flattenList.map((a: any) => ({
            id: a.id || `sub-${a.assigneeId || Math.random()}`,
            docId: mapped.id,
            assigneeName: a.assigneeName || a.assigneeId || 'ผู้รับผิดชอบ',
            assigneeType: (a.assigneeType === 'department' ? 'department' : 'person') as any,
            department: a.departmentName || a.department || 'ฝ่ายที่รับผิดชอบ',
            status: (a.status || 'pending').toLowerCase() as SubStatus,
            acceptedAt: a.acceptedAt ? formatDisplayDate(a.acceptedAt) : undefined,
            parentId: a.parentAssignmentId || a.parentId,
            note: a.remarks || a.note
          })))
        }
      }
      showToast('รับงานสำเร็จ · บันทึกผู้ถือครองเอกสารแล้ว', 'success')
    } catch (err: any) {
      showToast(err?.message || 'เกิดข้อผิดพลาดในการรับงาน', 'error')
    }
  }

  const handleComplete = async () => {
    if (!activeDirectAssignment) {
      showToast('ไม่มี assignment ของท่านที่รับงานแล้วสำหรับปิดงาน', 'error')
      close()
      return
    }
    close()
    try {
      await docsApi.complete(doc.id, activeDirectAssignment.id, completeNote || 'ดำเนินการเรียบร้อย')
      const updated = await docsApi.getDocumentById(doc.id)
      if (updated) {
        const mapped = mapDtoToDocument(updated)
        setDoc(mapped)
        if (mapped.assignments && mapped.assignments.length > 0) {
          const flattenList: any[] = []
          const walk = (items: any[]) => {
            for (const a of items) {
              flattenList.push(a)
              if (a.subAssignments && a.subAssignments.length > 0) walk(a.subAssignments)
            }
          }
          walk(mapped.assignments)
          setSubsState(flattenList.map((a: any) => ({
            id: a.id || `sub-${a.assigneeId || Math.random()}`,
            docId: mapped.id,
            assigneeName: a.assigneeName || a.assigneeId || 'ผู้รับผิดชอบ',
            assigneeType: (a.assigneeType === 'department' ? 'department' : 'person') as any,
            department: a.departmentName || a.department || 'ฝ่ายที่รับผิดชอบ',
            status: (a.status || 'pending').toLowerCase() as SubStatus,
            acceptedAt: a.acceptedAt ? formatDisplayDate(a.acceptedAt) : undefined,
            parentId: a.parentAssignmentId || a.parentId,
            note: a.remarks || a.note
          })))
        }
      }
      showToast('บันทึกผลการดำเนินงานเสร็จสิ้นเรียบร้อย', 'success')
    } catch (err: any) {
      showToast(err?.message || 'เกิดข้อผิดพลาดในการปิดงาน', 'error')
    }
  }

  const handleAcceptAsOwner = async (sub: SubAssignment) => {
    const headUsername = getDeptHeadUsername(sub.department)
    const isHead = Boolean(headUsername && headUsername.toLowerCase() === (currentUser.username || '').toLowerCase())
    if (!isHead) {
      showToast(`เฉพาะหัวหน้าฝ่าย (${resolveOwnerName(sub.department)}) ที่ระบุใน Master Data เท่านั้นที่มีสิทธิ์กดรับงานแทนฝ่าย`, 'error')
      return
    }
    const ownerName = resolveOwnerName(sub.department)
    try {
      await docsApi.accept(doc.id, sub.id, `รับงานโดยหัวหน้า/เจ้าของฝ่าย (${ownerName})`)
      const updated = await docsApi.getDocumentById(doc.id)
      if (updated) {
        const mapped = mapDtoToDocument(updated)
        setDoc(mapped)
        if (mapped.assignments && mapped.assignments.length > 0) {
          const flattenList: any[] = []
          const walk = (items: any[]) => {
            for (const a of items) {
              flattenList.push(a)
              if (a.subAssignments && a.subAssignments.length > 0) walk(a.subAssignments)
            }
          }
          walk(mapped.assignments)
          setSubsState(flattenList.map((a: any) => ({
            id: a.id || `sub-${a.assigneeId || Math.random()}`,
            docId: mapped.id,
            assigneeName: a.assigneeName || a.assigneeId || 'ผู้รับผิดชอบ',
            assigneeType: (a.assigneeType === 'department' ? 'department' : 'person') as any,
            department: a.departmentName || a.department || 'ฝ่ายที่รับผิดชอบ',
            status: (a.status || 'pending').toLowerCase() as SubStatus,
            acceptedAt: a.acceptedAt ? formatDisplayDate(a.acceptedAt) : undefined,
            parentId: a.parentAssignmentId || a.parentId,
            note: a.remarks || a.note
          })))
        }
      }
      showToast(`หัวหน้าฝ่าย ${ownerName} รับงานฝ่าย ${sub.department} เรียบร้อย`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'เกิดข้อผิดพลาดในการรับงาน', 'error')
    }
  }

  const handleConfirmDelegate = async () => {
    if (!canDelegate) {
      showToast('เฉพาะหัวหน้าฝ่ายหรือผู้ได้รับมอบหมายเท่านั้นที่สามารถมอบหมายงานต่อได้', 'error')
      closeDelegate()
      return
    }
    if (!delegatingSub || selectedSubordinateIds.length === 0) return

    const recipients = delegateCandidates.filter(user => selectedSubordinateIds.includes(user.username))
    if (recipients.length === 0) return

    try {
      const updated = await docsApi.delegate(
        doc.id,
        recipients.map(user => user.username),
        `มอบหมายต่อให้ ${recipients.map(user => user.name).join(', ')}`,
        delegatingSub.id,
      )
      const mapped = mapDtoToDocument(updated)
      setDoc(mapped)
      const flattenList: any[] = []
      const walk = (items: any[]) => {
        for (const assignment of items) {
          flattenList.push(assignment)
          if (assignment.subAssignments?.length) walk(assignment.subAssignments)
        }
      }
      walk(mapped.assignments || [])
      setSubsState(flattenList.map((assignment: any) => ({
        id: assignment.id || `sub-${assignment.assigneeId || Math.random()}`,
        docId: mapped.id,
        assigneeId: assignment.assigneeId,
        assigneeName: assignment.assigneeName || assignment.assigneeId || 'ผู้รับผิดชอบ',
        assigneeType: assignment.assigneeType === 'department' ? 'department' : 'person',
        departmentId: assignment.departmentId,
        department: assignment.departmentName || assignment.department || 'ฝ่ายที่รับผิดชอบ',
        status: (assignment.status || 'pending').toLowerCase() as SubStatus,
        acceptedAt: assignment.acceptedAt ? formatDisplayDate(assignment.acceptedAt) : undefined,
        parentId: assignment.parentAssignmentId || assignment.parentId,
        note: assignment.remarks || assignment.note,
      })))
      appendCustody(recipients.map(user => user.name).join(', '), delegatingSub.department, 'handed-over', 'มอบหมายต่อให้ผู้รับผิดชอบหลายคน')
      closeDelegate()
      showToast(`มอบหมายต่อให้ ${recipients.length} คนเรียบร้อย · รอผู้รับกดรับงาน`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถมอบหมายงานต่อได้', 'error')
    }
  }

  const handleReject = async () => {
    if (!rejectNote.trim()) return
    setDoc(prev => prev ? ({ ...prev, status: 'rejected' as any }) : null)
    close()
    try {
      await docsApi.reject(doc.id, rejectNote)
    } catch {}
    showToast('ปฏิเสธและส่งคืนต้นทางเรียบร้อย', 'info')
  }

  const handleForward = async () => {
    if (selectedForwardAssignees.length === 0) return
    const targetDepartmentId = selectedForwardAssignees[0].departmentId
    const targetUserIds = selectedForwardAssignees.filter(item => item.assigneeType === 'person').map(item => item.key)

    try {
      const updated = await docsApi.forward(doc.id, targetDepartmentId, targetUserIds, forwardNote)
      setDoc(mapDtoToDocument(updated))
      close()
      showToast(`ส่งต่อเอกสารไปยัง ${selectedForwardAssignees[0].department} เรียบร้อยแล้ว`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถส่งต่อเอกสารได้', 'error')
    }
  }

  const handleFollowup = () => {
    close()
    showToast('ส่งการติดตาม (Follow up) แจ้งเตือน 3 ช่องทางแล้ว', 'success')
  }

  const handleRecall = async () => {
    if (!isOrigin) {
      showToast('เฉพาะผู้สร้าง/สารบรรณต้นทาง หรือผู้ดูแลระบบเท่านั้นที่มีสิทธิ์ดึงงานกลับ', 'error')
      close()
      return
    }
    close()
    try {
      await docsApi.recall(doc.id, 'ดึงงานกลับโดยผู้มอบหมาย')
    } catch {}
    showToast('ดึงงานกลับเรียบร้อย · แจ้งผู้ถูกดึงงานแล้ว', 'info')
  }

  const handleCancel = async () => {
    if (!isOrigin) {
      showToast('เฉพาะผู้สร้าง/สารบรรณต้นทาง หรือผู้ดูแลระบบเท่านั้นที่มีสิทธิ์ยกเลิกเอกสาร', 'error')
      close()
      return
    }
    setDoc(prev => prev ? ({ ...prev, status: 'cancelled' }) : null)
    close()
    try {
      await docsApi.cancel(doc.id, 'ยกเลิกเอกสาร')
    } catch {}
    showToast('ยกเลิกเอกสารเรียบร้อย (ไม่นำมาคิด Progress)', 'info')
  }

  const handleReturn = async () => {
    setDoc(prev => prev ? ({ ...prev, status: 'completed', progress: 100 }) : null)
    appendCustody('สารบรรณกลาง', 'งานสารบรรณ', 'returned', 'ยืนยันรับเอกสารฉบับจริงคืนเข้าคลัง')
    close()
    try {
      await docsApi.deliver(doc.id, { remarks: 'ยืนยันรับคืนเอกสารฉบับจริง' })
    } catch {}
    showToast('ยืนยันรับเอกสารฉบับจริงคืน · ปลดล็อกให้ Assign ใหม่ได้', 'success')
  }

  const handleP2Send = () => {
    setDoc(prev => prev ? ({ ...prev, status: 'sent' }) : null)
    close()
    showToast('บันทึกการนำส่งเรียบร้อย · สถานะ = Sent', 'success')
  }

  const handleP2Deliver = async () => {
    if (!deliverFiles) return
    setDoc(prev => prev ? ({ ...prev, status: 'delivered' }) : null)
    close()
    try {
      await docsApi.deliver(doc.id, {
        deliveredToPerson: doc.receiver,
        remarks: 'ยืนยันนำส่งปลายทางเรียบร้อย'
      })
    } catch {}
    showToast('ยืนยันปลายทางรับแล้ว · สถานะ = Delivered', 'success')
  }

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => file.size <= 25 * 1024 * 1024)
    if (fileArray.length === 0) {
      showToast('ไฟล์แนบต้องมีขนาดไม่เกิน 25 MB', 'error')
      return
    }

    try {
      await Promise.all(fileArray.map(file => docsApi.addAttachment(doc.id, file)))
      const updated = await docsApi.getDocumentById(doc.id)
      setDoc(mapDtoToDocument(updated))
      setDeliverFiles(true)
      showToast(`แนบไฟล์จริงเข้าสู่ระบบ ${fileArray.length} รายการ`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถแนบไฟล์ได้', 'error')
    }
  }

  const removeExtraAttachment = (id: string, name: string) => {
    setExtraAttachments(prev => prev.filter(x => x.id !== id))
    showToast(`ลบไฟล์แนบ "${name}" เรียบร้อย`, 'info')
  }

  const handleDownload = async (name: string, url?: string) => {
    if (isTopSecret && !isOtpVerified) {
      setShowOtpModal(true)
      return
    }
    if (!url) {
      showToast('ไม่พบลิงก์ดาวน์โหลดไฟล์นี้', 'error')
      return
    }
    try {
      await docsApi.downloadAttachment(url, name)
      showToast(`กำลังดาวน์โหลด ${name}`, 'info')
    } catch (err: any) {
      showToast(err?.message || `ไม่สามารถดาวน์โหลด ${name} ได้`, 'error')
    }
  }

  const handleCameraCapture = async (photo: CapturedPhoto) => {
    try {
      const blob = await (await fetch(photo.dataUrl)).blob()
      const file = new File([blob], photo.name, { type: blob.type || 'image/jpeg' })
      await docsApi.addAttachment(doc.id, file, { isCameraCapture: true })
      const updated = await docsApi.getDocumentById(doc.id)
      setDoc(mapDtoToDocument(updated))
      setDeliverFiles(true)
      showToast(`ถ่ายภาพและแนบเอกสาร ${photo.name} สำเร็จ`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถบันทึกภาพถ่ายได้', 'error')
    }
  }

  const phaseLabel = isOutgoing ? 'เอกสารส่งออก' : 'เอกสารรับเข้า'
  const phaseColor = isOutgoing ? 'bg-amber-50 text-[#856404] border-[#FFEBAA]' : 'bg-blue-50 text-[#012169] border-blue-200'

  const TABS: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'timeline', label: 'เส้นทางเอกสาร (Story Line)', icon: <GitBranch size={13} /> },
    ...(isPhysical && !isOutgoing ? [{ id: 'custody' as TabId, label: 'การถือครอง (Chain of Custody)', icon: <ShieldCheck size={13} />, count: custodyState.length }] : []),
    { id: 'audit', label: 'ประวัติ (Audit Log)', icon: <History size={13} />, count: audit.length },
  ]

  const toSubEvent = (s: SubAssignment): TimelineEvent => ({
    id: s.id,
    actor: s.assigneeName,
    action: `รับงาน (${s.assigneeType === 'department' ? 'รายฝ่าย' : 'รายบุคคล'})`,
    timestamp: s.acceptedAt || '',
    department: s.department,
    status: s.status === 'success' ? 'completed' : s.status === 'pending' ? 'pending' : 'current',
    customNode: (
      <div className={`flex items-start justify-between gap-3 p-3 mt-1 rounded-xl border ${s.status === 'cancelled' ? 'bg-[#F8F9FA] border-[#DEE2E6] opacity-70' : 'bg-white border-[#DEE2E6] shadow-sm'}`}>
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${s.assigneeType === 'department' ? 'bg-[#012169]' : 'bg-[#FFCD00] text-[#012169]'}`}>
            {s.assigneeType === 'department' ? <Building2 size={14} /> : <User size={14} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#212529] truncate">{s.assigneeName}</p>
            <p className="text-[11px] text-[#6C757D]">
              {s.assigneeType === 'department' ? 'มอบหมายรายฝ่าย' : 'มอบหมายรายบุคคล'} · {s.department}
            </p>
            {s.assigneeType === 'department' && (
              <p className="text-[11px] text-[#012169] font-semibold mt-1 flex items-center gap-1">
                <User size={11} className="flex-shrink-0" />
                ผู้รับผิดชอบ (หัวหน้า/เจ้าของฝ่าย): {resolveOwnerName(s.department)}
              </p>
            )}
            {s.note && <p className="text-[11px] text-[#6C757D] italic mt-1 border-l-2 border-[#DEE2E6] pl-2">{s.note}</p>}
            {s.forwardedTo && <p className="text-[11px] text-[#012169] font-semibold mt-1">↳ ส่งต่อให้ {s.forwardedTo}</p>}
            {s.assigneeType === 'department' && isPendingAssignment(s) && (
              isManagedDepartmentAssignment(s) ? (
                <button
                  onClick={() => { setDelegatingSub(s); setSelectedSubordinateIds([]) }}
                  className="btn-outline text-[11px] py-1 px-2.5 gap-1 mt-2 border-[#012169] text-[#012169] hover:bg-blue-50 font-semibold"
                >
                  <ArrowRightCircle size={12} />
                  มอบหมายต่อให้ทีม (Delegate)
                </button>
              ) : (
                <p className="text-[11px] text-amber-700 font-medium mt-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
                  รอหัวหน้าฝ่าย ({resolveOwnerName(s.departmentId || s.department)}) มอบหมายงานต่อ
                </p>
              )
            )}
            {isActiveAssignment(s) && isManagedDepartmentAssignment(s) && (
              <button
                onClick={() => { setDelegatingSub(s); setSelectedSubordinateIds([]) }}
                className="btn-outline text-[11px] py-1 px-2.5 gap-1 mt-2 border-[#012169] text-[#012169] hover:bg-blue-50 font-semibold"
              >
                <ArrowRightCircle size={12} />
                มอบหมายต่อ (Delegate)
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <SubStatusBadge status={s.status} />
          {s.acceptedAt && <span className="text-[10px] text-[#6C757D] font-mono">{s.acceptedAt}</span>}
        </div>
      </div>
    ),
  })

  // สร้างเส้นทางเอกสาร (Story Line Timeline) แบบ Dynamic
  const activeTimeline: TimelineEvent[] = isOutgoing
    ? [
        {
          id: 'o1',
          actor: doc.sender || doc.currentHolder || 'ผู้ลงทะเบียน',
          action: 'ออกเลขเอกสารและลงทะเบียนส่งออก',
          timestamp: doc.receivedAt || '',
          department: doc.originDepartment || 'ฝ่ายที่สร้าง',
          status: 'completed',
        },
        {
          id: 'o2',
          actor: doc.sender || doc.currentHolder || 'ผู้ลงทะเบียน',
          action: 'แนบไฟล์หลักฐานเอกสาร',
          timestamp: doc.receivedAt || '',
          department: doc.originDepartment || 'ฝ่ายที่สร้าง',
          status: (doc.attachments && doc.attachments.length > 0) || extraAttachments.length > 0 ? 'completed' : 'pending',
        },
        {
          id: 'o3',
          actor: doc.sender || doc.currentHolder || 'ผู้ลงทะเบียน',
          action: 'เตรียมพร้อมนำส่ง (Ready To Send)',
          timestamp: '',
          department: doc.originDepartment || 'ฝ่ายที่สร้าง',
          status: doc.status === 'ready-to-send' ? 'current' : (doc.status === 'sent' || doc.status === 'delivered' || doc.status === 'completed' ? 'completed' : 'pending'),
        },
        {
          id: 'o4',
          actor: doc.sender || doc.currentHolder || 'ผู้ลงทะเบียน',
          action: 'บันทึกการนำส่งเอกสาร (Sent)',
          timestamp: doc.status === 'sent' || doc.status === 'delivered' || doc.status === 'completed' ? (doc.receivedAt || '') : '',
          department: doc.originDepartment || 'ฝ่ายที่สร้าง',
          status: doc.status === 'sent' ? 'current' : (doc.status === 'delivered' || doc.status === 'completed' ? 'completed' : 'pending'),
        },
        {
          id: 'o5',
          actor: doc.receiver || 'หน่วยงานปลายทาง',
          action: 'อัปเดตสถานะปลายทางรับแล้ว (Delivered)',
          timestamp: doc.status === 'delivered' || doc.status === 'completed' ? (doc.receivedAt || '') : '',
          department: doc.receiver || '',
          status: doc.status === 'delivered' ? 'current' : (doc.status === 'completed' ? 'completed' : 'pending'),
        },
        {
          id: 'o6',
          actor: '',
          action: 'ปิดงานส่งออก',
          timestamp: '',
          department: '',
          status: doc.status === 'completed' ? 'completed' : 'pending',
        }
      ]
    : [
        {
          id: 't1',
          actor: doc.currentHolder || doc.originDepartment || 'งานสารบรรณ',
          action: 'รับเอกสารและลงทะเบียนเข้าระบบ',
          timestamp: doc.receivedAt || '',
          department: doc.originDepartment || 'งานสารบรรณ',
          status: 'completed',
        },
        {
          id: 't2',
          actor: doc.originDepartment || 'งานสารบรรณ',
          action: `ส่งต่อ ${doc.department}`,
          timestamp: doc.receivedAt || '',
          department: doc.originDepartment || 'งานสารบรรณ',
          status: 'completed',
        },
        {
          id: 't3',
          actor: doc.receiver || doc.department,
          action: `มอบหมายให้ผู้รับผิดชอบดำเนินการ (${subsState.length} งานย่อย)`,
          timestamp: doc.receivedAt || '',
          department: doc.department,
          status: subsState.some(s => s.status === 'success' || s.status === 'in-progress') ? 'completed' : 'current',
          note: 'กระจายงานให้ผู้รับผิดชอบตรวจสอบ',
          children: buildSubTree(subsState, toSubEvent)
        },
        {
          id: 't4',
          actor: doc.department,
          action: 'ดำเนินการและจัดทำรายงาน',
          timestamp: doc.status === 'in-progress' ? 'อยู่ระหว่างดำเนินการ' : '',
          department: doc.department,
          status: doc.status === 'in-progress' ? 'current' : (doc.status === 'completed' ? 'completed' : 'pending'),
        },
        {
          id: 't5',
          actor: 'งานสารบรรณ',
          action: 'ปิดงานและจัดเก็บเอกสารเข้าคลัง',
          timestamp: doc.status === 'completed' ? (doc.receivedAt || '') : '',
          department: 'งานสารบรรณ',
          status: doc.status === 'completed' ? 'completed' : 'pending',
        }
      ]

  const selectedForwardDepartmentId = selectedForwardAssignees[0]?.departmentId || ''
  const filteredForwardUsers = dbUsers.filter(user =>
    user.active &&
    (!selectedForwardDepartmentId || user.departmentId === selectedForwardDepartmentId) &&
    (((user.name || '').toLowerCase().includes((forwardSearch || '').toLowerCase())) ||
     ((user.department || '').toLowerCase().includes((forwardSearch || '').toLowerCase())) ||
     ((user.username || '').toLowerCase().includes((forwardSearch || '').toLowerCase())))
  )

  const filteredForwardDepartments = dbDepartments.filter((department: any) => {
    const name = department.nameTh || department.nameEn || department.name || ''
    return Boolean(name) && name.toLowerCase().includes((forwardSearch || '').toLowerCase())
  })

  return (
    <div>
      <PageHeader
        title={doc.docNumber || 'รายละเอียดเอกสาร'}
        breadcrumb={[
          { label: 'รายการเอกสาร', onClick: () => onNavigate(isOutgoing ? 'document-list-outgoing' : 'document-list-incoming') },
          { label: doc.docNumber || 'รายละเอียด' },
        ]}
        actions={
          <button onClick={() => onNavigate(isOutgoing ? 'document-list-outgoing' : 'document-list-incoming')} className="btn-outline text-xs gap-1.5 shadow-sm">
            <ArrowLeft size={14} />
            กลับ
          </button>
        }
      />

      {/* Awaiting Physical Return banner (ฉบับจริง) — BR-2.2 */}
      {isPhysical && doc.status === 'awaiting-physical-return' && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-[#FFE5D0] border border-[#f5c6cb] rounded-xl px-4 py-3">
          <div className="flex items-start gap-2.5">
            <RotateCcw size={16} className="text-[#7C3A00] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#7C3A00]">รอรับเอกสารฉบับจริงคืน (Awaiting Physical Return)</p>
              <p className="text-xs text-[#7C3A00]/80 mt-0.5">ต้องยืนยันรับเอกสารตัวจริงคืนก่อนจึงจะ Assign ใหม่ได้ (VAL-09)</p>
            </div>
          </div>
          <button onClick={() => setModal('return')} className="btn-primary text-xs whitespace-nowrap gap-1.5 shadow-sm">
            <PackageCheck size={14} />
            ยืนยันรับคืน
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-4">

          {/* Subject card */}
          <div className="card p-5">
            <div className="flex flex-wrap items-start gap-2 mb-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${phaseColor}`}>{phaseLabel}</span>
              <StatusBadge status={doc.status} />
              <UrgencyBadge urgency={doc.urgency} />
              <ConfidentialityBadge level={doc.confidentiality ?? 'normal'} />
              <DeadlineFlagBadge flag={doc.deadlineFlag} />
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${isPhysical ? 'bg-[#FFF3CD] text-[#856404] border-[#FFEBAA]' : 'bg-[#D1ECF1] text-[#0C5460] border-sky-200'}`}>
                {isPhysical ? '📄 เอกสารฉบับจริง' : '📧 อีเมล'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#212529] leading-snug mb-3">{doc.subject}</h2>
            <p className="text-sm text-[#495057] leading-relaxed">{doc.description || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#DEE2E6]">
              {(isOutgoing
                ? [
                    { icon: <Building2 size={13} />, label: 'หน่วยงานปลายทาง', value: doc.receiver || doc.sender },
                    { icon: <User size={13} />, label: 'ผู้ส่ง/ผู้รับผิดชอบ', value: doc.sender || doc.currentHolder },
                    { icon: <Calendar size={13} />, label: 'วันที่ส่ง', value: doc.receivedAt || '-' },
                    { icon: <Clock size={13} />, label: 'กำหนดส่ง', value: doc.deadline || '-' },
                    { icon: <Building2 size={13} />, label: 'ฝ่ายต้นทาง / ฝ่ายที่รับผิดชอบ', value: doc.originDepartment },
                    { icon: <Truck size={13} />, label: 'รูปแบบการส่ง (Delivery Method)', value: deliveryMethodLabel },
                  ]
                : [
                    { icon: <Building2 size={13} />, label: 'หน่วยงานส่ง', value: doc.sender },
                    { icon: <User size={13} />, label: 'ผู้รับผิดชอบ', value: doc.receiver },
                    { icon: <Calendar size={13} />, label: 'วันที่รับ', value: doc.receivedAt || '-' },
                    { icon: <Clock size={13} />, label: 'กำหนดส่ง', value: doc.deadline || '-' },
                    { icon: <Building2 size={13} />, label: 'ฝ่ายต้นทาง', value: doc.originDepartment },
                    { icon: <Building2 size={13} />, label: 'ฝ่ายที่รับผิดชอบ', value: doc.department },
                    { icon: <User size={13} />, label: 'ผู้ถือเอกสาร', value: doc.currentHolder },
                  ]
              ).map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#6C757D] mt-0.5 flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-[11px] text-[#6C757D] font-medium">{item.label}</p>
                    <p className="text-sm text-[#212529] font-semibold">{item.value || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabbed detail */}
          <div className="card p-5">
            <div className="flex gap-1 bg-[#F8F9FA] rounded-xl p-1 mb-5 overflow-x-auto border border-[#DEE2E6]">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${tab === t.id ? 'bg-[#012169] text-white shadow-sm' : 'text-[#6C757D] hover:text-[#212529]'}`}
                >
                  {t.icon}
                  {t.label}
                  {t.count !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t.id ? 'bg-[#FFCD00] text-[#012169]' : 'bg-[#E9ECEF] text-[#6C757D]'}`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Timeline / Story Line */}
            {tab === 'timeline' && (
              <>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DEE2E6]">
                  <div>
                    <h3 className="section-title text-base mb-1">เส้นทางเอกสาร (Story Line)</h3>
                    <p className="section-sub text-xs">แสดงระยะเวลาต่อ stage และงานย่อย (Key Reference)</p>
                  </div>
                  {!isOutgoing && (
                    <div className="text-right">
                      <p className="text-2xl font-bold font-mono text-[#012169]">{computedProgress}%</p>
                      <p className="text-[11px] text-[#6C757D]">งานย่อยปิดสำเร็จ {successCount}/{countable.length}</p>
                    </div>
                  )}
                </div>
                <Timeline events={activeTimeline} />
              </>
            )}

            {/* Custody log */}
            {tab === 'custody' && (
              <>
                <h3 className="section-title text-base mb-1">ประวัติการถือครอง (Chain of Custody)</h3>
                <p className="section-sub text-xs mb-5">บันทึกผู้ถือครองเอกสารตัวจริงทุกครั้งที่เปลี่ยนมือ (BR-6.1)</p>
                {custodyState.length === 0 ? (
                  <p className="text-sm text-[#6C757D] py-6 text-center">ไม่มีข้อมูลการถือครอง</p>
                ) : (
                  <div className="space-y-2.5">
                    {custodyState.map((c, i) => (
                      <div key={c.id} className={`flex items-start gap-3 p-3.5 rounded-xl border ${i === custodyState.length - 1 ? 'bg-blue-50/60 border-blue-200 shadow-sm' : 'bg-white border-[#DEE2E6]'}`}>
                        <div className="w-9 h-9 rounded-full bg-[#012169] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(c.holder || 'ผ').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-[#212529]">{c.holder}</p>
                            {i === custodyState.length - 1 && <span className="text-[10px] font-bold text-[#012169] bg-[#FFCD00] px-2 py-0.5 rounded-full">ถือครองล่าสุด</span>}
                          </div>
                          <p className="text-[11px] text-[#6C757D] font-mono mt-0.5">{c.department} · {c.heldAt}</p>
                          {c.note && <p className="text-xs text-[#495057] mt-1 italic">{c.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Audit log */}
            {tab === 'audit' && (
              <>
                <h3 className="section-title text-base mb-1">ประวัติการเปลี่ยนสถานะ (Audit Log)</h3>
                <p className="section-sub text-xs mb-5">บันทึกทุกการกระทำสำคัญ พร้อม from-state → to-state (เก็บรักษา 10 ปีตามนโยบาย)</p>
                {audit.length === 0 ? (
                  <p className="text-sm text-[#6C757D] py-6 text-center">ไม่มีประวัติการบันทึกสถานะ</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#F8F9FA] border-b border-[#DEE2E6]">
                          <th className="text-left px-3 py-2.5 text-[11px] font-bold text-[#6C757D] uppercase">เวลา</th>
                          <th className="text-left px-3 py-2.5 text-[11px] font-bold text-[#6C757D] uppercase">ผู้กระทำ</th>
                          <th className="text-left px-3 py-2.5 text-[11px] font-bold text-[#6C757D] uppercase">การกระทำ</th>
                          <th className="text-left px-3 py-2.5 text-[11px] font-bold text-[#6C757D] uppercase">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DEE2E6]">
                        {audit.map(a => (
                          <tr key={a.id} className="align-top">
                            <td className="px-3 py-2.5 text-[11px] text-[#6C757D] font-mono whitespace-nowrap">{a.timestamp}</td>
                            <td className="px-3 py-2.5 text-xs font-semibold text-[#212529]">{a.actor}</td>
                            <td className="px-3 py-2.5">
                              <span className="text-xs font-semibold text-[#212529]">{a.action}</span>
                              {a.note && <p className="text-[11px] text-[#6C757D] mt-0.5 max-w-[220px]">{a.note}</p>}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {a.fromState && <span className="text-[10px] text-[#6C757D]">{a.fromState} → </span>}
                              <span className="text-[11px] font-bold text-[#012169]">{a.toState}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Attachments Card */}
          <div
            className={`card p-5 transition-all ${isDragging ? 'ring-2 ring-[#012169] bg-blue-50/20' : ''}`}
            onDragOver={e => {
              if (isTopSecret && (!isAssigned || !isOtpVerified)) return
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              if (isTopSecret && (!isAssigned || !isOtpVerified)) return
              e.preventDefault()
              setIsDragging(false)
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files)
              }
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="section-title text-base flex items-center gap-2">
                  <span>ไฟล์แนบและภาพถ่าย</span>
                  {(!isTopSecret || isOtpVerified) && (
                    <span className="text-xs font-normal text-[#6C757D] bg-[#F8F9FA] border border-[#DEE2E6] px-2 py-0.5 rounded-full">
                      {(doc.attachments || []).length + extraAttachments.length} รายการ
                    </span>
                  )}
                  {isTopSecret && (
                    <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock size={11} /> ลับมาก
                    </span>
                  )}
                </h3>
                <p className="section-sub text-xs">เอกสารสแกน ภาพถ่ายหลักฐาน และไฟล์ประกอบ</p>
              </div>

              {(!isTopSecret || isOtpVerified) && (
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && handleFileUpload(e.target.files)}
                    accept=".pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.zip"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-outline text-xs py-1.5 px-3 gap-1.5 text-[#012169] border-[#012169] hover:bg-blue-50 shadow-sm"
                  >
                    <Upload size={13} />
                    แนบไฟล์เพิ่ม
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="btn-primary text-xs py-1.5 px-3 gap-1.5 shadow-sm"
                  >
                    <Camera size={13} />
                    ถ่ายภาพแนบเพิ่ม
                  </button>
                </div>
              )}
            </div>

            {isTopSecret && (!isAssigned || !isOtpVerified) ? (
              <div className="p-6 bg-[#F8F9FA] border border-red-200 rounded-2xl text-center space-y-3 my-2">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#212529]">ไฟล์แนบถูกจำกัดการเข้าถึง (เอกสารชั้นความลับ: ลับมาก)</h4>
                  <p className="text-xs text-[#6C757D] mt-1 max-w-md mx-auto leading-relaxed">
                    {isAssigned
                      ? 'ท่านเป็นผู้ได้รับมอบหมายในสายงานเอกสารนี้ กรุณายืนยันตัวตนด้วยรหัส OTP ทางอีเมลเพื่อปลดล็อกการดูและดาวน์โหลดไฟล์แนบ'
                      : 'ท่านไม่มีสิทธิ์เข้าถึงไฟล์แนบของเอกสารลับมาก เนื่องจากไม่ได้รับมอบหมายในสายงานของเอกสารนี้ (BR-1.4-C)'}
                  </p>
                </div>
                {isAssigned && (
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(true)}
                    className="btn-primary text-xs py-2 px-4 gap-2 bg-[#012169] shadow-md hover:bg-[#001a52]"
                  >
                    <KeyRound size={14} />
                    ขอรหัส OTP เพื่อเปิดดูไฟล์แนบ
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="border border-dashed border-[#CED4DA] rounded-xl p-3 text-center bg-[#F8F9FA] mb-4 text-xs text-[#6C757D] flex items-center justify-center gap-2">
                  <Upload size={14} className="text-[#012169]" />
                  <span>ลากไฟล์มาวางในบริเวณนี้เพื่อแนบไฟล์ทันที (PDF, DOCX, XLSX, รูปภาพ, ZIP สูงสุด 25 MB)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(doc.attachments || []).map((name, i) => (
                    <div key={`primary-${i}`} className="flex items-center justify-between p-3 rounded-xl border border-[#DEE2E6] bg-white shadow-sm hover:border-[#012169]/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getFileIcon(name)}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#212529] truncate" title={name}>{name}</p>
                          <p className="text-[10px] text-[#6C757D]">เอกสารประกอบ</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownload(name, (doc as any).rawAttachments?.[i]?.downloadUrl)}
                          className="p-1.5 rounded-lg text-[#012169] hover:bg-blue-50 transition-colors"
                          title="ดาวน์โหลด"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {extraAttachments.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-[#DEE2E6] bg-white shadow-sm hover:border-[#012169]/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.url ? (
                          <div
                            onClick={() => setPreviewPhoto(item)}
                            className="w-9 h-9 rounded-lg overflow-hidden border border-[#DEE2E6] flex-shrink-0 cursor-pointer hover:opacity-90 relative group"
                          >
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                              <Eye size={12} />
                            </div>
                          </div>
                        ) : (
                          getFileIcon(item.name, item.fileType)
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#212529] truncate" title={item.name}>{item.name}</p>
                          <p className="text-[10px] text-[#6C757D] flex items-center gap-1">
                            <span>{item.size}</span>
                            <span>·</span>
                            <span>{item.type === 'camera' ? '📷 ภาพถ่าย' : 'แนบเพิ่ม'}</span>
                            {item.uploadedAt && <span>· {item.uploadedAt}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.url && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            title="ดูตัวอย่าง"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownload(item.name, item.url)}
                          className="p-1.5 rounded-lg text-[#012169] hover:bg-blue-50 transition-colors"
                          title="ดาวน์โหลด"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExtraAttachment(item.id, item.name)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="ลบไฟล์แนบ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Quick Actions Card */}
          <div className="card p-5 space-y-3">
            <h3 className="section-title text-sm mb-3">การดำเนินการ (Quick Actions)</h3>

            {!isOutgoing && doc.status !== 'completed' && doc.status !== 'cancelled' && (
              <div className="space-y-2.5">
                {departmentAssignmentForDelegation && (
                  <>
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center gap-2 text-xs">
                      <Building2 size={15} className="text-amber-700 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-900">งานระดับฝ่ายของท่าน</span>
                        <span className="text-amber-800 ml-1">โปรดมอบหมายต่อให้ผู้ปฏิบัติงาน</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDelegatingSub(departmentAssignmentForDelegation)
                        setSelectedSubordinateIds([])
                      }}
                      className="btn-outline w-full py-2 text-xs justify-center gap-2 text-[#012169] border-[#012169] hover:bg-blue-50 shadow-2xs font-semibold"
                    >
                      <ArrowRightCircle size={14} />
                      มอบหมายต่อในฝ่าย (Delegate)
                    </button>
                  </>
                )}

                {pendingDirectAssignment && (
                  <button
                    onClick={() => setModal('accept')}
                    className="btn-primary w-full py-2.5 text-xs justify-center gap-2 shadow-sm font-bold bg-[#012169] hover:bg-[#0b2d75]"
                  >
                    <CheckCircle size={15} />
                    รับงานของฉัน (Accept)
                  </button>
                )}

                {activeDirectAssignment && (
                  <>
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center gap-2 text-xs">
                      <Clock size={15} className="text-[#012169] shrink-0" />
                      <div>
                        <span className="font-bold text-[#012169]">งานของท่านรับแล้ว</span>
                        <span className="text-[#495057] ml-1">(อยู่ระหว่างดำเนินการ)</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setModal('complete')}
                      className="btn-primary w-full py-2.5 text-xs justify-center gap-2 shadow-sm font-bold bg-[#28A745] hover:bg-[#218838]"
                    >
                      <CheckCircle size={15} />
                      เสร็จสิ้นงานของฉัน (Complete)
                    </button>
                  </>
                )}

                {!pendingDirectAssignment && !activeDirectAssignment && !departmentAssignmentForDelegation && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    งานนี้กำลังดำเนินการใน assignment ของผู้รับรายอื่น จึงไม่มีการรับงานหรือปิดงานให้ท่าน
                  </div>
                )}

                {/* Secondary Actions */}
                <button
                  onClick={() => {
                    setSelectedForwardAssignees([])
                    setForwardNote('')
                    setForwardSearch('')
                    setModal('forward')
                  }}
                  className="btn-outline w-full py-2 text-xs justify-center gap-2 text-[#012169] border-[#012169] hover:bg-blue-50 shadow-2xs font-semibold"
                >
                  <ArrowRightCircle size={14} />
                  ส่งต่อ / มอบหมายงาน (Forward)
                </button>

                {(doc.status === 'pending-acceptance' || doc.status === 'registered' || doc.status === 'forwarded') && (
                  <button
                    onClick={() => setModal('reject')}
                    className="btn-outline w-full py-2 text-xs justify-center gap-2 text-[#DC3545] border-[#DC3545] hover:bg-red-50 shadow-2xs font-semibold"
                  >
                    <XCircle size={14} />
                    ปฏิเสธ / ส่งคืน (Reject)
                  </button>
                )}

                <button
                  onClick={() => setModal('followup')}
                  className="btn-outline w-full py-2 text-xs justify-center gap-2 text-[#FD7E14] border-[#FD7E14] hover:bg-amber-50 shadow-2xs font-semibold"
                >
                  <Bell size={14} />
                  ติดตามงาน (Follow up)
                </button>

                {/* Management Actions: Only visible if isOrigin is true (ต้นทางเท่านั้น) */}
                {isOrigin && (
                  <div className="pt-3 border-t border-[#DEE2E6] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#6C757D]">การจัดการโดยต้นทาง (Origin Only)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setModal('recall')}
                        className="btn-outline py-2 px-2 text-xs justify-center gap-1.5 text-[#495057] border-[#CED4DA] hover:bg-slate-50 hover:text-[#212529] rounded-lg transition-colors font-medium shadow-2xs"
                        title="ดึงงานกลับมาที่ต้นทาง (เฉพาะผู้สร้าง/สารบรรณต้นทาง)"
                      >
                        <RotateCcw size={13} className="text-[#6C757D]" />
                        <span>ดึงงานกลับ</span>
                      </button>
                      <button
                        onClick={() => setModal('cancel')}
                        className="btn-outline py-2 px-2 text-xs justify-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg transition-colors font-medium shadow-2xs"
                        title="ยกเลิกเอกสารนี้ (เฉพาะผู้สร้าง/สารบรรณต้นทาง)"
                      >
                        <Ban size={13} className="text-red-600" />
                        <span>ยกเลิกเอกสาร</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isOutgoing && (
              <>
                {doc.status === 'ready-to-send' && (
                  <button
                    onClick={() => setModal('p2-send')}
                    className="btn-primary w-full py-2.5 text-xs justify-center gap-2 bg-[#012169] shadow-sm"
                  >
                    <Send size={14} />
                    บันทึกการนำส่ง (Sent)
                  </button>
                )}
                {doc.status === 'sent' && (
                  <button
                    onClick={() => setModal('p2-deliver')}
                    className="btn-primary w-full py-2.5 text-xs justify-center gap-2 bg-[#28A745] hover:bg-[#218838] shadow-sm"
                  >
                    <PackageCheck size={14} />
                    ยืนยันปลายทางรับ (Delivered)
                  </button>
                )}
                <div className="pt-2 border-t border-[#DEE2E6]">
                  <a
                    href="https://pickuppostal.thailandpost.com"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline w-full py-2 text-xs justify-center gap-1.5 text-[#012169] border-[#012169] hover:bg-blue-50 text-center block"
                  >
                    <Truck size={13} className="inline mr-1" />
                    ระบบ ปณ. มารับ (ภายนอก)
                  </a>
                </div>
              </>
            )}

            {doc.status === 'completed' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle size={20} className="text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-800">เอกสารนี้ดำเนินการเสร็จสิ้นสมบูรณ์แล้ว</p>
              </div>
            )}

            {doc.status === 'cancelled' && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                <Ban size={20} className="text-red-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-red-800">เอกสารถูกยกเลิกแล้ว (Cancelled)</p>
                <p className="text-[11px] text-red-600 mt-0.5">ไม่สามารถดำเนินการขั้นตอนถัดไปได้</p>
              </div>
            )}
          </div>

          {!isOutgoing && (
            <div className="card p-5 space-y-3">
              <h3 className="section-title text-sm flex items-center gap-1.5">
                <Bell size={14} className="text-[#012169]" />
                <span>นโยบายการแจ้งเตือน (Reminder)</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DEE2E6]">
                  <span className="text-[#6C757D]">รอบเตือนซ้ำ:</span>
                  <span className="font-bold text-[#012169]">ทุก {reminderDays} วัน (ตามระดับความเร่งด่วน)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DEE2E6]">
                  <span className="text-[#6C757D]">เงื่อนไขการหยุด:</span>
                  <span className="font-bold text-[#28A745]">จนกว่าจะ Completed</span>
                </div>
                <div className="py-1">
                  <span className="text-[#6C757D] block mb-1">ผู้รับการแจ้งเตือน ({reminderRecipients.length} คน):</span>
                  <div className="space-y-1 pl-2 border-l-2 border-[#012169]/30">
                    {reminderRecipients.map((name, i) => (
                      <p key={i} className="text-[11px] font-semibold text-[#212529]">• {name}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isOutgoing && (
            <div className="card p-5">
              <h3 className="section-title text-sm mb-3">ความคืบหน้ารวม</h3>
              <div className="flex items-center gap-4">
                <ProgressRing progress={computedProgress} size={64} strokeWidth={6} />
                <div className="space-y-1">
                  <p className="text-base font-bold text-[#212529]">{computedProgress}% เสร็จสิ้น</p>
                  <p className="text-xs text-[#6C757D]">คำนวณจากงานย่อยปิดสำเร็จ</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── Modals ─── */}

      {modal === 'accept' && (
        <Modal title="ยืนยันการรับงาน (Accept Assignment)" onClose={close}>
          <div className="space-y-4 text-sm">
            <p className="text-[#495057]">
              ท่านกำลังยืนยันรับงานเอกสารเลขที่ <strong className="text-[#012169]">{doc.docNumber}</strong>
            </p>
            {isPhysical && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <ShieldCheck size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <span>สำหรับเอกสารฉบับจริง การกดรับงานจะเป็นการ <strong>บันทึกยืนยันถือครองเอกสารตัวจริง (Chain of Custody)</strong> ในระบบ</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={close} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleAccept} className="btn-primary text-xs px-4 py-1.5">ยืนยันรับงาน</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'reject' && (
        <Modal title="ปฏิเสธ / ตีกลับเอกสาร (Reject)" onClose={close}>
          <div className="space-y-4 text-sm">
            <p className="text-[#495057]">ระบุเหตุผลการปฏิเสธเพื่อส่งคืนฝ่ายต้นทาง ({doc.originDepartment})</p>
            <div>
              <label className="block text-xs font-bold text-[#495057] mb-1">เหตุผลการปฏิเสธ *</label>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="เช่น ไม่ใช่งานของฝ่าย, เอกสารไม่สมบูรณ์..."
                rows={3}
                className="input-base text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={close} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleReject} disabled={!rejectNote.trim()} className="btn-primary bg-red-600 hover:bg-red-700 text-xs px-4 py-1.5 disabled:opacity-50">ปฏิเสธและส่งคืน</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ส่งต่อเอกสาร (Forward Document) — รองรับทั้งฝ่ายและรายบุคคลเหมือนหน้าลงทะเบียน */}
      {modal === 'forward' && (
        <Modal
          title="ส่งต่อเอกสาร (Forward Document)"
          onClose={close}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex bg-[#F8F9FA] p-1 rounded-xl border border-[#DEE2E6]">
              <button
                type="button"
                onClick={() => setForwardPickerMode('department')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  forwardPickerMode === 'department'
                    ? 'bg-[#012169] text-white shadow-xs'
                    : 'text-[#6C757D] hover:text-[#212529]'
                }`}
              >
                <Building2 size={13} />
                ส่งต่อรายฝ่าย (Department)
              </button>
              <button
                type="button"
                onClick={() => setForwardPickerMode('person')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  forwardPickerMode === 'person'
                    ? 'bg-[#012169] text-white shadow-xs'
                    : 'text-[#6C757D] hover:text-[#212529]'
                }`}
              >
                <Users size={13} />
                ส่งต่อรายบุคคล (Person)
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]" />
              <input
                type="text"
                placeholder={forwardPickerMode === 'person' ? 'ค้นหาชื่อผู้รับ, ฝ่าย หรือตำแหน่ง...' : 'ค้นหาชื่อฝ่ายปลายทาง...'}
                value={forwardSearch}
                onChange={e => setForwardSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl focus:outline-none focus:border-[#012169] focus:bg-white transition-colors"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {forwardPickerMode === 'department' ? (
                filteredForwardDepartments.map((department: any) => {
                  const departmentId = department.departmentId || department.id
                  const departmentName = department.nameTh || department.nameEn || department.name
                  const isSelected = selectedForwardAssignees.some(item => item.key === departmentId)
                  const ownerName = resolveOwnerName(departmentId)

                  return (
                    <div
                      key={departmentId}
                      onClick={() => toggleForwardDepartment(department)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-[#DEE2E6] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#012169] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <Building2 size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212529]">{departmentName}</p>
                          <p className="text-[11px] text-[#6C757D]">ผู้รับผิดชอบ (หัวหน้า/เจ้าของฝ่าย): {ownerName}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle size={16} className="text-[#012169] flex-shrink-0" />}
                    </div>
                  )
                })
              ) : (
                filteredForwardUsers.map(u => {
                  const isSelected = selectedForwardAssignees.some(a => a.key === u.username)

                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleForwardPerson(u)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-[#DEE2E6] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#FFCD00] text-[#012169] text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
                          {u.name.length > 2 ? u.name.substring(2, 4) : 'ผ'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212529]">{u.name}</p>
                          <p className="text-[11px] text-[#6C757D]">{u.position || u.role} · {u.department}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle size={16} className="text-[#012169] flex-shrink-0" />
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {selectedForwardAssignees.length > 0 && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <p className="text-xs font-bold text-[#012169] mb-1.5">
                  ผู้รับส่งต่อที่เลือก ({selectedForwardAssignees.length} รายการ):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedForwardAssignees.map(a => (
                    <span
                      key={a.key}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-blue-200 text-xs font-semibold text-[#012169] shadow-xs"
                    >
                      {a.assigneeType === 'department' ? <Building2 size={11} /> : <User size={11} />}
                      <span>{a.label}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedForwardAssignees(prev => prev.filter(x => x.key !== a.key))}
                        className="hover:text-red-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#495057] mb-1">บันทึกเหตุผลการส่งต่อ</label>
              <textarea
                value={forwardNote}
                onChange={e => setForwardNote(e.target.value)}
                placeholder="ระบุข้อความประกอบการส่งต่อหรือคำสั่งการ..."
                rows={2}
                className="input-base text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={close} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button
                onClick={handleForward}
                disabled={selectedForwardAssignees.length === 0}
                className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
              >
                ยืนยันส่งต่อ ({selectedForwardAssignees.length})
              </button>
            </div>
          </div>
        </Modal>
      )}

      {delegatingSub && (
        <Modal title={`มอบหมายต่อภายในฝ่าย (${delegatingSub.department})`} onClose={closeDelegate}>
          <div className="space-y-4 text-sm">
            <p className="text-[#495057]">
              หัวหน้าฝ่าย ({resolveOwnerName(delegatingSub.department)}) มอบหมายงานต่อให้ลูกทีมได้หลายคน
            </p>
            <div>
              <label className="block text-xs font-bold text-[#495057] mb-1">เลือกผู้ใต้บังคับบัญชาในฝ่าย *</label>
              <select
                multiple
                value={selectedSubordinateIds}
                onChange={event => setSelectedSubordinateIds(Array.from(event.currentTarget.selectedOptions, option => option.value))}
                className="input-base text-xs min-h-36"
              >
                {delegateCandidates.map(user => (
                  <option key={user.id} value={user.username}>{user.name} ({user.position || user.role})</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#6C757D]">กด Command (⌘) ค้างเพื่อเลือกหลายคน</p>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={closeDelegate} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleConfirmDelegate} disabled={selectedSubordinateIds.length === 0} className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50">ยืนยันมอบหมายต่อ ({selectedSubordinateIds.length})</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'followup' && (
        <Modal title="ส่งการติดตามงาน (Follow up)" onClose={close}>
          <div className="space-y-4 text-sm">
            <p className="text-[#495057]">ส่งการแจ้งเตือนไปยังผู้รับมอบหมายปัจจุบันทันทีผ่าน 3 ช่องทาง (Email, Line, In-app)</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={close} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleFollowup} className="btn-primary text-xs px-4 py-1.5 bg-[#FD7E14]">ส่งการแจ้งเตือน</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'complete' && (
        <Modal title="บันทึกผลการดำเนินการเสร็จสิ้น (Complete)" onClose={close}>
          <div className="space-y-4 text-sm">
            <p className="text-[#495057]">
              ยืนยันว่าการดำเนินการตามเอกสารเลขที่ <strong>{doc.docNumber || doc.id}</strong> เสร็จสิ้นสมบูรณ์แล้ว
            </p>
            <div>
              <label className="block text-xs font-bold text-[#495057] mb-1">บันทึกผลการดำเนินงาน / หมายเหตุ (ถ้ามี)</label>
              <textarea
                rows={3}
                value={completeNote}
                onChange={e => setCompleteNote(e.target.value)}
                placeholder="ระบุรายละเอียดผลการปฏิบัติงาน เช่น ดำเนินการออกหนังสือตอบกลับแล้ว หรือจัดส่งข้อมูลเรียบร้อย..."
                className="input-base text-xs resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={close} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleComplete} className="btn-primary text-xs px-4 py-1.5 bg-[#28A745] hover:bg-[#218838]">
                ยืนยันปิดงาน (Complete)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'recall' && (
        <Modal title="ยืนยันการดึงงานกลับ (Recall)" onClose={close}>
          <div className="space-y-4 text-sm">
            <p className="text-[#495057]">ท่านต้องการดึงงานกลับมาที่สารบรรณ/ผู้มอบหมายต้นทางหรือไม่?</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={close} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleRecall} className="btn-primary text-xs px-4 py-1.5">ยืนยันดึงงานกลับ</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'cancel' && (
        <Modal title="ยืนยันการยกเลิกเอกสาร (Cancel)" onClose={close}>
          <div className="space-y-4 text-sm">
            <p className="text-red-700 font-bold">คำเตือน: เอกสารที่ถูกยกเลิกจะไม่สามารถดำเนินการต่อได้และจะไม่ถูกนำไปคำนวณ Progress</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={close} className="btn-outline text-xs px-3 py-1.5">ปิด</button>
              <button onClick={handleCancel} className="btn-primary bg-red-600 hover:bg-red-700 text-xs px-4 py-1.5">ยืนยันยกเลิก</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'return' && (
        <Modal title="ยืนยันการรับเอกสารฉบับจริงคืน (Confirm Physical Return)" onClose={close}>
          <div className="space-y-4 text-sm">
            <p className="text-[#495057]">งานสารบรรณยืนยันรับเอกสารฉบับจริงคืนเข้าคลังเรียบร้อยแล้ว สถานะเอกสารจะเปลี่ยนเป็น <strong>Completed (ปิดงานสมบูรณ์)</strong></p>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={close} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleReturn} className="btn-primary text-xs px-4 py-1.5 bg-[#28A745]">ยืนยันรับคืนเข้าคลัง</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'p2-send' && (
        <Modal title="บันทึกการนำส่งเอกสาร (Mark as Sent)" onClose={close}>
          <div className="space-y-4 text-sm">
            <p className="text-[#495057]">ยืนยันการส่งเอกสารออกจากบริษัทไปยังหน่วยงานภายนอก</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={close} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleP2Send} className="btn-primary text-xs px-4 py-1.5">บันทึกนำส่ง</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'p2-deliver' && (
        <Modal title="ยืนยันปลายทางรับเอกสารแล้ว (Mark as Delivered)" onClose={close}>
          <div className="space-y-4 text-sm">
            <p className="text-[#495057]">กรุณาแนบไฟล์หลักฐานใบตอบรับ หรือถ่ายภาพใบเซ็นรับเอกสาร</p>
            <div className="flex items-center gap-2">
              <input
                ref={deliverFileInputRef}
                type="file"
                className="hidden"
                onChange={e => e.target.files && handleFileUpload(e.target.files)}
                accept="image/*,.pdf"
              />
              <button
                type="button"
                onClick={() => deliverFileInputRef.current?.click()}
                className="btn-outline text-xs py-1.5 px-3 gap-1.5"
              >
                <Upload size={13} /> แนบหลักฐาน
              </button>
              <button
                type="button"
                onClick={() => setShowCameraModal(true)}
                className="btn-primary text-xs py-1.5 px-3 gap-1.5"
              >
                <Camera size={13} /> ถ่ายภาพหลักฐาน
              </button>
            </div>
            {deliverFiles && (
              <p className="text-xs text-[#28A745] font-bold flex items-center gap-1">
                <Check size={14} /> แนบหลักฐานเรียบร้อยแล้ว
              </p>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={close} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleP2Deliver} disabled={!deliverFiles} className="btn-primary text-xs px-4 py-1.5 bg-[#28A745] disabled:opacity-50">ยืนยัน Delivered</button>
            </div>
          </div>
        </Modal>
      )}

      {showCameraModal && (
        <CameraCaptureModal
          title="ถ่ายภาพเอกสารแนบ"
          onClose={() => setShowCameraModal(false)}
          onCapture={handleCameraCapture}
        />
      )}

      {previewPhoto && (
        <Modal title={`ตัวอย่างภาพ: ${previewPhoto.name}`} onClose={() => setPreviewPhoto(null)}>
          <div className="space-y-3">
            <div className="relative max-h-[70vh] overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
              <img src={previewPhoto.url} alt={previewPhoto.name} className="max-h-[70vh] object-contain mx-auto" />
              {isTopSecret && (
                <DynamicWatermarkOverlay
                  username={CURRENT_USER.username}
                  displayName={CURRENT_USER.name}
                  ipAddress="192.168.1.100"
                />
              )}
            </div>
            <div className="flex justify-between items-center text-xs text-[#6C757D]">
              <span>ขนาด: {previewPhoto.size}</span>
              <button
                type="button"
                onClick={() => handleDownload(previewPhoto.name, previewPhoto.url)}
                className="btn-primary text-xs py-1 px-3 gap-1"
              >
                <Download size={13} /> ดาวน์โหลดภาพ
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showOtpModal && (
        <OtpVerificationModal
          documentTitle={doc.subject}
          documentNumber={doc.docNumber}
          deliveryEmail={`${CURRENT_USER.username}@deves.co.th`}
          onClose={() => setShowOtpModal(false)}
          onVerifySuccess={() => {
            setIsOtpVerified(true)
            setShowOtpModal(false)
            showToast('ยืนยันตัวตนด้วยรหัส OTP สำเร็จ · ปลดล็อกการเข้าถึงไฟล์แนบแล้ว', 'success')
          }}
        />
      )}
    </div>
  )
}

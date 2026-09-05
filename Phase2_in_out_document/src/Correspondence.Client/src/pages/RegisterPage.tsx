import { useState, useEffect, useRef } from 'react'
import {
  Upload, X, Plus, CheckCircle, Users, Info, Camera,
  Image as ImageIcon, Eye, FileText, Sparkles, Building2, ExternalLink, Truck
} from 'lucide-react'
import { PageHeader, Modal, CameraCaptureModal, type CapturedPhoto } from '../components/ui'
import OutgoingNumberRequestModal from '../components/OutgoingNumberRequestModal'
import { getCurrentUser } from '../utils/auth'
import { docsApi, masterApi, adminApi } from '../services/api'
import type { DocDirection, Screen, User } from '../types'

const POSTAL_PICKUP_URL = 'https://pickuppostal.thailandpost.com'

interface AttachedItem {
  id: string
  name: string
  type: 'file' | 'camera'
  size: string
  file: File
  url?: string
  capturedAt?: string
}

interface DepartmentOption {
  id: string
  name: string
  headUserId?: string
}

interface AssigneeSelection {
  key: string
  label: string
  assigneeType: 'person' | 'department'
  department: string
  departmentId: string
  ownerName?: string
}

interface Props {
  docDirection: DocDirection
  onNavigate: (screen: Screen) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export default function RegisterPage({ docDirection, onNavigate, showToast }: Props) {
  const isIncoming = docDirection === 'incoming'

  const [form, setForm] = useState({
    docType: '',
    channel: '',
    sender: '',
    subject: '',
    urgency: 'normal',
    confidentiality: 'normal',
    deadline: '',
    description: '',
    department: '',
    refDocNumber: '',
    recipientOrg: '',
    deliveryMethod: '',
  })
  const [attachments, setAttachments] = useState<AttachedItem[]>([])
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [showEDRModal, setShowEDRModal] = useState(false)
  const [edrIssuedNumbers, setEdrIssuedNumbers] = useState<{ th: string; en: string } | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<AttachedItem | null>(null)
  const [selectedAssignees, setSelectedAssignees] = useState<AssigneeSelection[]>([])
  const [showRecipientPicker, setShowRecipientPicker] = useState(false)
  const [pickerMode, setPickerMode] = useState<'person' | 'department'>('person')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Live Database States
  const [dbUsers, setDbUsers] = useState<User[]>([])
  const [dbDepartments, setDbDepartments] = useState<DepartmentOption[]>([])
  const [dbDeliveryMethods, setDbDeliveryMethods] = useState<any[]>([])

  useEffect(() => {
    adminApi.getUsers().then(uList => {
      if (uList && uList.length > 0) {
        setDbUsers(uList.map((u: any) => ({
          id: u.id || u.username,
          name: u.displayName || u.username,
          username: u.username,
          email: u.email,
          department: u.departmentName || 'ฝ่ายบริหารทั่วไป',
          departmentId: u.departmentId || '',
          position: u.position || (u.roleId === 'ROLE-03' ? 'หัวหน้าฝ่าย' : 'เจ้าหน้าที่'),
          role: (u.roleId === 'ROLE-05' || u.roleId === 'ROLE-04') ? 'admin' : (u.roleId === 'ROLE-03' ? 'manager' : 'staff'),
          active: u.status === 'Active' || u.active !== false
        })))
      }
    }).catch(() => {})

    masterApi.getDepartments().then(dList => {
      if (dList && dList.length > 0) {
        setDbDepartments(dList.map((d: any) => ({
          id: d.departmentId || d.id,
          name: d.nameTh || d.nameEn || d.name || '',
          headUserId: d.headUserRef,
        })).filter((d: DepartmentOption) => Boolean(d.id && d.name)))
      }
    }).catch(() => {})

    masterApi.getDeliveryMethods().then(mList => {
      if (mList && mList.length > 0) {
        setDbDeliveryMethods(mList.map((m: any) => ({
          id: m.deliveryMethodId || m.id,
          label: m.label,
          isPostalPickup: m.isPostalPickup,
          active: m.isActive !== false
        })))
      }
    }).catch(() => {})
  }, [])

  const currentUser = getCurrentUser()
  // ฝ่ายต้นทางกำหนดจากฝ่ายของผู้ทำรายการ (ผู้ใช้ที่ล็อกอิน)
  const originDepartment = currentUser.department || 'งานสารบรรณ'
  const originDepartmentId = currentUser.departmentId || ''

  const getDepartment = (departmentId: string) => dbDepartments.find(d => d.id === departmentId)

  const resolveOwnerName = (departmentId: string) => {
    const department = getDepartment(departmentId)
    const head = dbUsers.find(u => u.username === department?.headUserId || (u.departmentId === departmentId && u.role === 'manager'))
    return head?.name || `หัวหน้า${department?.name || 'ฝ่าย'}`
  }

  // assignment หนึ่งชุดต้องอยู่ภายใต้ฝ่ายรับผิดชอบหลักเดียวกัน
  const selectedDepartmentId = selectedAssignees[0]?.departmentId || ''
  const responsibleDepartment = getDepartment(selectedDepartmentId)?.name || ''
  const assigneePosition = selectedAssignees[0]?.assigneeType === 'person'
    ? dbUsers.find(u => u.username === selectedAssignees[0]?.key)?.position || ''
    : selectedDepartmentId ? `หัวหน้า/เจ้าของฝ่าย: ${resolveOwnerName(selectedDepartmentId)}` : ''
  const hasAssignee = selectedAssignees.length > 0

  const update = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => { const n = { ...e }; delete n[key]; return n })
  }

  const formatFileSize = (bytes: number) => bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

  const addFiles = (files: FileList | File[]) => {
    const accepted = Array.from(files).filter(file => {
      const isSupported = /\.(pdf|doc|docx|xls|xlsx|png|jpe?g|webp|zip)$/i.test(file.name)
      if (!isSupported || file.size > 25 * 1024 * 1024) {
        showToast(`ไม่สามารถแนบ ${file.name}: รองรับ PDF, Office, รูปภาพ, ZIP ขนาดไม่เกิน 25 MB`, 'error')
        return false
      }
      return true
    })
    if (accepted.length === 0) return

    setAttachments(previous => [
      ...previous,
      ...accepted.filter(file => !previous.some(item => item.name === file.name && item.file.size === file.size)).map((file, index) => ({
        id: `file-${Date.now()}-${index}`,
        name: file.name,
        type: 'file' as const,
        size: formatFileSize(file.size),
        file,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      })),
    ])
  }

  const handleCameraCapture = async (photo: CapturedPhoto) => {
    const blob = await (await fetch(photo.dataUrl)).blob()
    const file = new File([blob], photo.name, { type: blob.type || 'image/jpeg' })
    setAttachments(previous => [
      ...previous,
      { id: photo.id, name: photo.name, type: 'camera', size: formatFileSize(file.size), file, url: photo.dataUrl, capturedAt: photo.capturedAt },
    ])
    showToast(`ถ่ายภาพและแนบเอกสาร ${photo.name} เรียบร้อยแล้ว`, 'success')
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(x => x.id !== id))
  }

  const toggleSelection = (entry: AssigneeSelection) => {
    setSelectedAssignees(previous => {
      if (previous.some(item => item.key === entry.key && item.assigneeType === entry.assigneeType)) {
        return previous.filter(item => !(item.key === entry.key && item.assigneeType === entry.assigneeType))
      }
      return [...previous, entry]
    })
  }

  const togglePerson = (user: User) => {
    if (!user.departmentId) {
      showToast(`ไม่พบรหัสฝ่ายของ ${user.name}`, 'error')
      return
    }
    toggleSelection({
      key: user.username,
      label: user.name,
      assigneeType: 'person',
      department: user.department,
      departmentId: user.departmentId,
    })
  }

  const toggleDepartment = (department: DepartmentOption) => {
    toggleSelection({
      key: department.id,
      label: department.name,
      assigneeType: 'department',
      department: department.name,
      departmentId: department.id,
      ownerName: resolveOwnerName(department.id),
    })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.subject.trim()) e.subject = 'กรุณากรอกหัวข้อเอกสาร'
    if (!form.urgency) e.urgency = 'กรุณาเลือกความเร่งด่วน'
    if (!form.deadline) e.deadline = 'กรุณาระบุกำหนดดำเนินการ'
    if (isIncoming && selectedAssignees.length === 0) e.assignee = 'กรุณาเลือกฝ่ายหรือผู้รับมอบหมายอย่างน้อย 1 รายการ'
    // เอกสารส่งออก: ไฟล์แนบบังคับ (BR-4.1 / VAL-04)
    if (!isIncoming && attachments.length === 0) e.files = 'ต้องแนบไฟล์หลักฐานหรือภาพถ่ายเอกสารก่อนนำส่ง (BR-4.1 / VAL-04)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      let registeredDocument: any
      if (isIncoming) {
        const assignedUserIds = selectedAssignees.filter(a => a.assigneeType === 'person').map(a => a.key)
        const assignedDepartmentIds = selectedAssignees.filter(a => a.assigneeType === 'department').map(a => a.departmentId)

        registeredDocument = await docsApi.registerIncoming({
          title: form.subject,
          channel: form.channel === 'email' ? 'email' : 'physical',
          urgency: form.urgency,
          confidentiality: form.confidentiality,
          senderAgency: form.sender || 'หน่วยงานภายนอก',
          originNumber: form.refDocNumber || undefined,
          originDepartmentId,
          description: form.description,
          responsibleDepartmentId: selectedDepartmentId,
          assignedUserIds,
          assignedDepartmentIds,
          dueDate: form.deadline ? new Date(form.deadline).toISOString() : undefined,
          attachments: [],
        })
      } else {
        registeredDocument = await docsApi.registerOutgoing({
          title: form.subject,
          edrOutgoingNumberTh: edrIssuedNumbers?.th || form.refDocNumber || 'พ001สอ/2569',
          edrOutgoingNumberEn: edrIssuedNumbers?.en,
          urgency: form.urgency,
          confidentiality: form.confidentiality,
          destinationAgency: form.recipientOrg || 'สำนักงานภายนอก',
          originDepartmentId,
          deliveryMethodId: form.deliveryMethod || 'dm-01',
          description: form.description,
          dueDate: form.deadline ? new Date(form.deadline).toISOString() : undefined,
          attachments: [],
        })
      }

      await Promise.all(attachments.map(item => docsApi.addAttachment(
        registeredDocument.id,
        item.file,
        { isCameraCapture: item.type === 'camera' },
      )))
      setShowSuccess(true)
    } catch (err: any) {
      showToast(err?.message || 'เกิดข้อผิดพลาดในการบันทึกเอกสารหรือแนบไฟล์', 'error')
    }
  }

  const handleConfirmSuccess = () => {
    setShowSuccess(false)
    showToast(
      isIncoming
        ? 'ลงทะเบียนเอกสารรับเข้าสำเร็จ · สถานะ: Registered'
        : 'ลงทะเบียนเอกสารส่งออกสำเร็จ',
      'success'
    )
    onNavigate(isIncoming ? 'document-list-incoming' : 'document-list-outgoing')
  }

  const filteredUsers = dbUsers.filter(user =>
    user.active &&
    (recipientSearch === '' || user.name.includes(recipientSearch) || user.department.includes(recipientSearch) || user.username.includes(recipientSearch))
  )

  const filteredDepartments = dbDepartments.filter(department =>
    recipientSearch === '' ||
    department.name.includes(recipientSearch) ||
    resolveOwnerName(department.id).includes(recipientSearch)
  )

  return (
    <div>
      <PageHeader
        title={isIncoming ? 'ลงทะเบียนเอกสารรับเข้า' : 'ลงทะเบียนเอกสารส่งออก'}
        subtitle={isIncoming
          ? 'บันทึกเอกสารที่องค์กรได้รับ · รองรับการแนบไฟล์และการถ่ายภาพด้วยกล้อง'
          : 'บันทึกเอกสารที่องค์กรส่งออก · ไฟล์แนบ/ภาพถ่ายบังคับ (BR-4.1)'}
        breadcrumb={[
          { label: isIncoming ? 'เอกสารรับเข้า' : 'เอกสารส่งออก' },
          { label: 'ลงทะเบียนใหม่' },
        ]}
        actions={
          !isIncoming ? (
            <button
              type="button"
              onClick={() => setShowEDRModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFCD00] hover:bg-[#e6b800] text-[#012169] text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Sparkles size={14} />
              ขอสร้างเลขที่เอกสารใหม่ (ระบบออกเลขที่เอกสาร)
            </button>
          ) : undefined
        }
      />

      <OutgoingNumberRequestModal
        isOpen={showEDRModal}
        onClose={() => setShowEDRModal(false)}
        showToast={showToast}
        onSuccess={(res) => {
          setEdrIssuedNumbers({ th: res.docNumberTH, en: res.docNumberEN })
          setForm(f => ({
            ...f,
            refDocNumber: res.docNumberTH,
            subject: res.subject,
            recipientOrg: res.recipientOrg,
            description: res.remark || `ออกเลขที่เอกสารผ่านระบบออกเลขที่เอกสารเรียบร้อยแล้ว (${res.docNumberTH} / ${res.docNumberEN})`,
          }))
        }}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left / main form */}
          <div className="xl:col-span-2 space-y-4">

            {/* EDR Integration Banner for Outgoing Documents */}
            {!isIncoming && (
              <div className="card p-4 bg-gradient-to-r from-blue-50/80 to-amber-50/60 border border-blue-200">
                {edrIssuedNumbers ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-[#28A745]" size={18} />
                        <h4 className="text-xs font-bold text-[#012169]">
                          ออกเลขที่เอกสารผ่านระบบออกเลขที่เอกสารสำเร็จ (ซิงค์ข้อมูลตรงกัน 2 ฝั่ง 100%)
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#012169] text-white">
                          เลขไทย: {edrIssuedNumbers.th}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFCD00] text-[#012169]">
                          เลขอังกฤษ: {edrIssuedNumbers.en}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEDRModal(true)}
                      className="text-xs text-[#012169] font-bold underline hover:opacity-80 self-start sm:self-auto"
                    >
                      เปลี่ยน / ขอเลขใหม่
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="p-2 bg-[#012169] text-[#FFCD00] rounded-xl shrink-0">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#012169]">
                          ระบบเชื่อมต่อการขอเลขที่เอกสารส่งออกกับระบบออกเลขที่เอกสาร
                        </h4>
                        <p className="text-[11px] text-[#6C757D] mt-0.5">
                          รองรับการขอสร้างเลขธรรมดา (Flow A) และขอเลขพิเศษ (Flow B) ข้อมูลซิงค์เท่ากัน 2 ฝั่ง
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEDRModal(true)}
                      className="px-3.5 py-1.5 bg-[#012169] hover:bg-[#001a52] text-white text-xs font-bold rounded-lg transition-colors shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      + ขอสร้างเลขที่เอกสารทันที
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Basic info */}
            <div className="card p-5">
              <h3 className="section-title text-base mb-4">ข้อมูลเอกสาร</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isIncoming ? (
                  <>
                    <div>
                      <label className="form-label">ประเภทเอกสาร</label>
                      <select className="form-select" value={form.docType} onChange={e => update('docType', e.target.value)}>
                        <option value="">— เลือกประเภท —</option>
                        <option value="physical">เอกสารฉบับจริง (Physical)</option>
                        <option value="email">อีเมลราชการ (Email)</option>
                        <option value="fax">โทรสาร</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">ช่องทางการรับ</label>
                      <select className="form-select" value={form.channel} onChange={e => update('channel', e.target.value)}>
                        <option value="">— เลือกช่องทาง —</option>
                        <option value="mail">ไปรษณีย์</option>
                        <option value="hand">รับด้วยตนเอง</option>
                        <option value="email">อีเมล</option>
                        <option value="fax">โทรสาร</option>
                        <option value="system">ระบบอิเล็กทรอนิกส์</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="form-label">หน่วยงาน / บุคคลที่ส่ง <span className="text-[#DC3545]">*</span></label>
                      <input type="text" className="form-input" placeholder="เช่น กรมสรรพากร, บริษัท ABC จำกัด" value={form.sender} onChange={e => update('sender', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="form-label">เลขที่เอกสารส่งออก</label>
                      <input
                        type="text"
                        className="form-input font-bold text-[#012169] bg-slate-50"
                        placeholder="เช่น พ001สอ/2569 (กดขอสร้างเลขด้านบน)"
                        value={form.refDocNumber}
                        onChange={e => update('refDocNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">หน่วยงานปลายทาง <span className="text-[#DC3545]">*</span></label>
                      <input type="text" className="form-input" placeholder="เช่น สำนักงานตรวจเงินแผ่นดิน" value={form.recipientOrg} onChange={e => update('recipientOrg', e.target.value)} />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="form-label">หัวข้อเอกสาร <span className="text-[#DC3545]">*</span></label>
                  <input
                    type="text"
                    className={`form-input ${errors.subject ? 'border-[#DC3545]' : ''}`}
                    placeholder="ระบุหัวข้อหนังสือหรือชื่อเรื่อง"
                    value={form.subject}
                    onChange={e => update('subject', e.target.value)}
                  />
                  {errors.subject && <p className="text-xs text-[#DC3545] mt-1 font-bold">{errors.subject}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="form-label">รายละเอียด / บันทึก</label>
                  <textarea
                    className="form-input min-h-[90px] resize-none"
                    placeholder="ระบุรายละเอียดเพิ่มเติม ข้อสังเกต หรือคำแนะนำเบื้องต้น"
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Urgency, Confidentiality & deadline */}
            <div className="card p-5">
              <h3 className="section-title text-base mb-4">ความเร่งด่วน ชั้นความลับ และกำหนดเวลา</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">ความเร่งด่วน <span className="text-[#DC3545]">*</span></label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { val: 'normal', label: 'ปกติ', cls: 'border-[#DEE2E6] text-[#6C757D] hover:border-[#012169]', active: 'border-[#012169] bg-blue-50/50 text-[#012169] font-bold' },
                      { val: 'urgent', label: 'ด่วน', cls: 'border-[#FFEBAA] text-[#856404] hover:border-[#FD7E14]', active: 'border-[#FD7E14] bg-[#FFF3CD] text-[#856404] font-bold' },
                      { val: 'very-urgent', label: 'ด่วนมาก', cls: 'border-[#f5c6cb] text-[#DC3545] hover:border-[#DC3545]', active: 'border-[#DC3545] bg-[#F8D7DA] text-[#721C24] font-bold' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => update('urgency', opt.val)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${form.urgency === opt.val ? opt.active : opt.cls + ' bg-white'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label flex items-center justify-between">
                    <span>ระดับชั้นความลับ (BR-1.4-A) <span className="text-[#DC3545]">*</span></span>
                    {form.confidentiality === 'top-secret' && (
                      <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">
                        บังคับยืนยันตัวตนด้วย OTP
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { val: 'normal', label: 'ปกติ', cls: 'border-[#DEE2E6] text-[#6C757D] hover:border-[#012169]', active: 'border-[#012169] bg-blue-50/50 text-[#012169] font-bold' },
                      { val: 'confidential', label: 'ลับ', cls: 'border-[#FFEBAA] text-[#C82333] hover:border-[#C82333]', active: 'border-[#C82333] bg-[#FFE5D0] text-[#721C24] font-bold' },
                      { val: 'top-secret', label: 'ลับมาก (OTP)', cls: 'border-red-300 text-red-700 hover:border-red-600', active: 'border-red-600 bg-red-600 text-white font-black shadow-xs' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          update('confidentiality', opt.val)
                          if (opt.val === 'top-secret') {
                            showToast('เลือกชั้นความลับ [ลับมาก]: ไฟล์แนบจะถูกซ่อนและเข้าถึงได้เฉพาะผู้ได้รับมอบหมายที่ผ่าน OTP เท่านั้น', 'info')
                          }
                        }}
                        className={`flex-1 py-2 text-xs rounded-lg border-2 transition-all ${form.confidentiality === opt.val ? opt.active : opt.cls + ' bg-white'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">กำหนดดำเนินการแล้วเสร็จ <span className="text-[#DC3545]">*</span></label>
                  <input
                    type="date"
                    className={`form-input ${errors.deadline ? 'border-[#DC3545]' : ''}`}
                    value={form.deadline}
                    onChange={e => update('deadline', e.target.value)}
                  />
                  {errors.deadline && <p className="text-xs text-[#DC3545] mt-1 font-bold">{errors.deadline}</p>}
                </div>
                {isIncoming ? (
                  <>
                    <div>
                      <label className="form-label">ฝ่ายต้นทาง</label>
                      <input
                        type="text"
                        className="form-input bg-slate-50 text-[#6C757D] cursor-not-allowed"
                        value={originDepartment}
                        readOnly
                        aria-readonly="true"
                      />
                      <p className="text-[11px] text-[#6C757D] mt-1">กำหนดอัตโนมัติจากผู้ใช้ที่ล็อกอิน</p>
                    </div>
                    <div>
                      <label className="form-label">ฝ่ายที่รับผิดชอบ</label>
                      {hasAssignee ? (
                        <>
                          <input
                            type="text"
                            className="form-input bg-slate-50 text-[#6C757D] cursor-not-allowed"
                            value={responsibleDepartment}
                            readOnly
                            aria-readonly="true"
                          />
                          <p className="text-[11px] text-[#6C757D] mt-1">ตำแหน่งผู้รับมอบหมาย: {assigneePosition}</p>
                        </>
                      ) : (
                        <div className="form-input bg-slate-50 text-[#6C757D] italic flex items-center">
                          ยังไม่ได้เลือกผู้รับมอบหมาย
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="form-label">ฝ่ายต้นทาง / ฝ่ายที่รับผิดชอบ</label>
                    <input
                      type="text"
                      className="form-input bg-slate-50 text-[#6C757D] cursor-not-allowed"
                      value={originDepartment}
                      readOnly
                      aria-readonly="true"
                    />
                    <p className="text-[11px] text-[#6C757D] mt-1">
                      เอกสารส่งออก: ฝ่ายต้นทางเป็นฝ่ายที่รับผิดชอบ (ส่งออกภายนอก ไม่มีการมอบหมายภายใน)
                    </p>
                  </div>
                )}

                {/* รูปแบบการส่ง (Delivery Method) — เฉพาะเอกสารส่งออก */}
                {!isIncoming && (() => {
                  const selectedIsPostalPickup = DELIVERY_METHODS.find(m => m.id === form.deliveryMethod)?.isPostalPickup === true
                  return (
                    <div className="sm:col-span-2">
                      <label className="form-label flex items-center gap-1.5">
                        <Truck size={13} className="text-[#012169]" />
                        รูปแบบการส่ง (Delivery Method)
                      </label>
                      <select
                        className="form-select"
                        value={form.deliveryMethod}
                        onChange={e => update('deliveryMethod', e.target.value)}
                      >
                        <option value="">— เลือกรูปแบบการส่ง —</option>
                        {dbDeliveryMethods.filter(m => m.active).map(m => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            window.open(POSTAL_PICKUP_URL, '_blank')
                            showToast('เปิดระบบภายนอกสำหรับลงทะเบียนให้ ปณ. มารับ (เชื่อมต่อระบบภายนอก)', 'info')
                          }}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#FFCD00] hover:bg-[#e6b800] text-[#012169] shadow-sm transition-all ${selectedIsPostalPickup ? 'ring-2 ring-[#FFCD00] ring-offset-1' : ''}`}
                        >
                          <ExternalLink size={14} />
                          ลงทะเบียนให้ ปณ. มารับ (ระบบภายนอก)
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* File attachments & Camera Capture Section */}
            <div className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="section-title text-base flex items-center gap-2">
                    <span>การแนบไฟล์และภาพถ่าย</span>
                    {!isIncoming && <span className="text-[#DC3545] text-xs">*</span>}
                  </h3>
                  {isIncoming
                    ? <p className="text-xs text-[#6C757D] mt-0.5">เลือกแนบไฟล์จากเครื่อง หรือใช้กล้องถ่ายภาพเอกสารโดยตรง</p>
                    : <p className="text-xs text-[#DC3545] mt-0.5 font-semibold">บังคับ — ต้องแนบไฟล์หลักฐานหรือภาพถ่ายก่อนนำส่ง (BR-4.1)</p>
                  }
                </div>
                {errors.files && <p className="text-xs text-[#DC3545] font-bold">{errors.files}</p>}
              </div>

              {/* 2 Methods of Attachment: Upload File & Camera Photo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Method 1: Dropzone Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.zip"
                  onChange={event => event.target.files && addFiles(event.target.files)}
                />
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-[#012169] bg-blue-50/50' : 'border-[#DEE2E6] hover:border-[#012169] hover:bg-blue-50/30'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-2 text-[#012169]">
                    <Upload size={20} />
                  </div>
                  <p className="text-sm font-bold text-[#212529]">เลือก / ลากไฟล์เอกสาร</p>
                  <p className="text-[11px] text-[#6C757D] mt-1">PDF, DOCX, XLSX, รูปภาพ สูงสุด 20 MB</p>
                </div>

                {/* Method 2: Camera Capture */}
                <div
                  onClick={() => setShowCameraModal(true)}
                  className="border-2 border-dashed border-[#FFCD00]/80 bg-[#FFF3CD]/20 hover:bg-[#FFF3CD]/40 hover:border-[#FFCD00] rounded-xl p-6 text-center cursor-pointer transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FFCD00] flex items-center justify-center mx-auto mb-2 text-[#012169] shadow-sm group-hover:scale-105 transition-transform">
                    <Camera size={20} />
                  </div>
                  <p className="text-sm font-bold text-[#212529]">ถ่ายภาพด้วยกล้องของอุปกรณ์</p>
                  <p className="text-[11px] text-[#856404] mt-1 font-medium">เปิดกล้องมือถือ/แท็บเล็ต/เว็บแคม เพื่อถ่ายภาพ</p>
                </div>
              </div>

              {/* Attachment List */}
              {attachments.length > 0 ? (
                <div className="space-y-2 mt-4 pt-3 border-t border-[#DEE2E6]">
                  <p className="text-xs font-bold text-[#6C757D] mb-2">
                    รายการที่แนบแล้ว ({attachments.length} รายการ)
                  </p>
                  {attachments.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 bg-[#F8F9FA] rounded-xl border border-[#DEE2E6] hover:bg-blue-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.type === 'camera' && item.url ? (
                          <div
                            onClick={() => setPreviewPhoto(item)}
                            className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#FFCD00] flex-shrink-0 cursor-pointer group"
                            title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                          >
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye size={12} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-[#DC3545]">PDF</span>
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-[#212529] truncate">{item.name}</p>
                            {item.type === 'camera' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FFCD00] text-[#012169] px-2 py-0.2 rounded-full shadow-xs">
                                <Camera size={10} />
                                ภาพถ่ายจากกล้อง
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.2 rounded-full">
                                <FileText size={10} />
                                ไฟล์เอกสาร
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6C757D] mt-0.5">
                            {item.size} {item.capturedAt && `· บันทึกเมื่อ ${item.capturedAt}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.type === 'camera' && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(item)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#012169] hover:bg-blue-100 transition-colors"
                            title="ดูรูปภาพ"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6C757D] hover:bg-[#F8D7DA] hover:text-[#DC3545] transition-colors"
                          title="ลบรายการ"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6C757D] text-center py-2 italic">ยังไม่มีไฟล์หรือภาพถ่ายที่แนบ</p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Assign (เอกสารรับเข้าเท่านั้น) — Optional ณ ขั้น Register */}
            {isIncoming && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="section-title text-base">มอบหมายผู้รับงาน (Assign)</h3>
                    <p className="text-xs text-[#6C757D] mt-0.5">Optional ณ ขั้น Register — Assign ทีหลังได้</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRecipientPicker(true)}
                    className="btn-outline text-xs py-1.5 gap-1"
                  >
                    <Plus size={12} />
                    เลือก
                  </button>
                </div>

                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-3 text-xs text-[#012169]">
                  <Info size={13} className="flex-shrink-0 mt-0.5 text-[#012169]" />
                  <span>Register สำเร็จ → สถานะ <strong>Registered</strong> · เมื่อ Assign → <strong>Pending Acceptance</strong></span>
                </div>

                {selectedAssignees.length === 0 ? (
                  <div className="py-6 text-center">
                    <Users size={24} className="mx-auto mb-2 text-[#DEE2E6]" />
                    <p className="text-xs text-[#6C757D]">ยังไม่ได้เลือกผู้รับงาน</p>
                    <p className="text-[11px] text-[#6C757D] mt-0.5">สามารถ Assign ภายหลังได้</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedAssignees.map(entry => (
                      <div key={entry.key} className="flex items-center justify-between p-2.5 bg-blue-50/60 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#012169] text-white flex items-center justify-center flex-shrink-0">
                            {entry.assigneeType === 'department' ? (
                              <Building2 size={13} />
                            ) : (
                              <span className="text-[10px] font-bold">{entry.label[2]}{entry.label[3]}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#212529]">{entry.label}</p>
                            {entry.assigneeType === 'department' ? (
                              <p className="text-[11px] text-[#6C757D]">หัวหน้า/เจ้าของฝ่าย: {entry.ownerName}</p>
                            ) : (
                              <p className="text-[11px] text-[#6C757D]">{entry.department}</p>
                            )}
                          </div>
                        </div>
                        <button type="button" onClick={() => toggleSelection(entry)} className="text-[#6C757D] hover:text-[#DC3545]">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary / submit */}
            <div className="card p-5">
              <h3 className="section-title text-base mb-4">สรุปและยืนยัน</h3>
              <div className="space-y-2.5 text-xs text-[#495057] mb-5">
                <div className="flex justify-between">
                  <span>ประเภท</span>
                  <span className="font-bold text-[#212529]">{isIncoming ? 'เอกสารรับเข้า' : 'เอกสารส่งออก'}</span>
                </div>
                <div className="flex justify-between">
                  <span>สถานะเริ่มต้น</span>
                  <span className="font-bold text-[#012169]">
                    {isIncoming ? (selectedAssignees.length > 0 ? 'Pending Acceptance' : 'Registered') : 'Registered'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ฝ่ายต้นทาง</span>
                  <span className="font-semibold text-[#212529]">{originDepartment || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>ฝ่ายที่รับผิดชอบ</span>
                  <span className="font-semibold text-[#212529]">{isIncoming ? (responsibleDepartment || '—') : originDepartment}</span>
                </div>
                <div className="flex justify-between">
                  <span>กำหนดส่ง</span>
                  <span className={`font-semibold ${form.urgency === 'very-urgent' ? 'text-[#DC3545]' : 'text-[#212529]'}`}>{form.deadline || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>เอกสารแนบ</span>
                  <span className="font-bold text-[#012169]">
                    {attachments.length} รายการ ({attachments.filter(a => a.type === 'camera').length} รูปถ่าย, {attachments.filter(a => a.type === 'file').length} ไฟล์)
                  </span>
                </div>
                {isIncoming && (
                  <div className="flex justify-between">
                    <span>ผู้รับงาน (Assign)</span>
                    <span className="font-semibold text-[#012169]">{selectedAssignees.length > 0 ? `${selectedAssignees.length} รายการ` : 'ยังไม่ระบุ'}</span>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-primary w-full justify-center text-sm py-3 shadow-md">
                <CheckCircle size={15} />
                {isIncoming ? 'ลงทะเบียนรับเข้า' : 'ลงทะเบียนส่งออก'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate(isIncoming ? 'document-list-incoming' : 'document-list-outgoing')}
                className="btn-outline w-full justify-center text-sm py-2.5 mt-2"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        open={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />

      {/* Lightbox / Preview modal for captured photo */}
      <Modal
        open={!!previewPhoto}
        title={`ภาพถ่าย: ${previewPhoto?.name || ''}`}
        onClose={() => setPreviewPhoto(null)}
        confirmLabel="ปิดหน้าต่าง"
        onConfirm={() => setPreviewPhoto(null)}
        size="lg"
      >
        {previewPhoto?.url && (
          <div className="flex flex-col items-center">
            <img
              src={previewPhoto.url}
              alt={previewPhoto.name}
              className="max-h-[65vh] w-auto rounded-lg border border-[#DEE2E6] shadow-sm object-contain"
            />
            <div className="mt-3 flex items-center justify-between w-full text-xs text-[#6C757D] px-2">
              <span className="font-semibold text-[#212529]">{previewPhoto.name}</span>
              <span>ขนาด: {previewPhoto.size} · {previewPhoto.capturedAt}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Recipient picker modal */}
      <Modal
        open={showRecipientPicker}
        title="เลือกผู้รับงาน (Assign)"
        onClose={() => setShowRecipientPicker(false)}
        onConfirm={() => setShowRecipientPicker(false)}
        confirmLabel="ยืนยัน"
        size="lg"
      >
        <p className="text-xs text-[#6C757D] bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg px-3 py-2 mb-3">
          รองรับ Multiple Select (BR-2.4) — เลือกหลายฝ่าย/บุคคลได้ งานย่อยจะผูก Key Reference เดียวกัน
        </p>

        {/* Person / Department mode toggle */}
        <div className="flex gap-1 p-1 bg-[#F1F3F5] rounded-xl mb-3">
          {([
            { mode: 'person' as const, label: 'บุคคล', icon: <Users size={13} /> },
            { mode: 'department' as const, label: 'ฝ่าย', icon: <Building2 size={13} /> },
          ]).map(seg => (
            <button
              key={seg.mode}
              type="button"
              onClick={() => setPickerMode(seg.mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                pickerMode === seg.mode
                  ? 'bg-white text-[#012169] shadow-sm'
                  : 'text-[#6C757D] hover:text-[#012169]'
              }`}
            >
              {seg.icon}
              {seg.label}
            </button>
          ))}
        </div>

        <div className="mb-3">
          <input
            type="text"
            className="form-input"
            placeholder={pickerMode === 'person' ? 'ค้นหาชื่อ หรือฝ่าย...' : 'ค้นหาฝ่าย หรือหัวหน้า/เจ้าของฝ่าย...'}
            value={recipientSearch}
            onChange={e => setRecipientSearch(e.target.value)}
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1.5">
          {pickerMode === 'person' ? (
            filteredUsers.map(u => (
              <div
                key={u.id}
                onClick={() => togglePerson(u)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedAssignees.some(a => a.key === u.username)
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-[#DEE2E6] hover:bg-[#F8F9FA]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#012169] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {u.name[2]}{u.name[3]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#212529]">{u.name}</p>
                    <p className="text-xs text-[#6C757D]">{u.position} · {u.department}</p>
                  </div>
                </div>
                {selectedAssignees.some(a => a.key === u.username) && (
                  <CheckCircle size={16} className="text-[#012169] flex-shrink-0" />
                )}
              </div>
            ))
          ) : (
            filteredDepartments.map(department => (
              <div
                key={department.id}
                onClick={() => toggleDepartment(department)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedAssignees.some(a => a.key === department.id)
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-[#DEE2E6] hover:bg-[#F8F9FA]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#012169] text-white flex items-center justify-center flex-shrink-0">
                    <Building2 size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#212529]">{department.name}</p>
                    <p className="text-xs text-[#6C757D]">หัวหน้า/เจ้าของฝ่าย: {resolveOwnerName(department.id)}</p>
                  </div>
                </div>
                {selectedAssignees.some(a => a.key === department.id) && (
                  <CheckCircle size={16} className="text-[#012169] flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-[#6C757D] mt-3 font-semibold">เลือกแล้ว {selectedAssignees.length} รายการ</p>
      </Modal>

      {/* Success modal */}
      <Modal
        open={showSuccess}
        title={isIncoming ? 'ลงทะเบียนรับเข้าสำเร็จ' : 'ลงทะเบียนส่งออกสำเร็จ'}
        onClose={handleConfirmSuccess}
        onConfirm={handleConfirmSuccess}
        confirmLabel="ดูรายการเอกสาร"
        size="sm"
      >
        <div className="flex flex-col items-center py-4">
          <div className="w-14 h-14 rounded-full bg-[#D4EDDA] flex items-center justify-center mb-3">
            <CheckCircle size={30} className="text-[#28A745]" />
          </div>
          <p className="text-sm font-bold text-[#212529] text-center">
            {isIncoming
              ? selectedAssignees.length > 0
                ? 'ลงทะเบียนและมอบหมายผู้รับงานเรียบร้อย · สถานะ: Pending Acceptance'
                : 'ลงทะเบียนเอกสารสำเร็จ · สถานะ: Registered (Assign ได้ภายหลัง)'
              : 'บันทึกเอกสารส่งออกสำเร็จ'}
          </p>
          <p className="text-xs text-[#6C757D] mt-1.5 text-center">
            แนบเอกสารแล้ว {attachments.length} รายการ · ระบบได้สร้างเลขที่เอกสารและบันทึก Audit Log แล้ว
          </p>
        </div>
      </Modal>
    </div>
  )
}

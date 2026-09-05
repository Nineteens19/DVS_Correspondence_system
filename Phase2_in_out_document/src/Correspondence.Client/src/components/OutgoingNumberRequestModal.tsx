import { useState } from 'react'
import {
  X, Send, Plus, Trash2, Building2, User, FileText, CheckCircle2,
  AlertCircle, Sparkles, ShieldAlert, Clock, ArrowRight
} from 'lucide-react'
import type { OutgoingDocItem, OutgoingRecipient, OutgoingSigner } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: {
    docNumberTH: string
    docNumberEN: string
    subject: string
    recipientOrg: string
    orgType: 'general' | 'special'
    remark?: string
    recipientsCount: number
    signersCount: number
  }) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

const SPECIAL_ORGS = [
  'สำนักงาน คปภ. (สำนักงานคณะกรรมการกำกับและส่งเสริมการประกอบธุรกิจประกันภัย)',
  'สมาคมประกันวินาศภัยไทย',
  'สำนักงานป้องกันและปราบปรามการฟอกเงิน (ปปง.)',
  'กรมสรรพากร (กองการบริหารการเสียภาษีขนาดใหญ่)',
  'ธนาคารแห่งประเทศไทย (ธปท.)',
]

const GENERAL_ORGS = [
  'กรมพัฒนาธุรกิจการค้า กระทรวงพาณิชย์',
  'บริษัท ไทยรับประกันภัยต่อ จำกัด (มหาชน)',
  'สำนักงานตรวจเงินแผ่นดิน (สตง.)',
  'บริษัท กรุงเทพประกันภัย จำกัด (มหาชน)',
  'บริษัท วิริยะประกันภัย จำกัด (มหาชน)',
  'อื่นๆ',
]

export default function OutgoingNumberRequestModal({ isOpen, onClose, onSuccess, showToast }: Props) {
  if (!isOpen) return null

  const [orgType, setOrgType] = useState<'general' | 'special'>('general')
  const [selectedOrg, setSelectedOrg] = useState('')
  const [customOrgName, setCustomOrgName] = useState('')
  const [subject, setSubject] = useState('')
  const [remark, setRemark] = useState('')

  // Pre-flight Context State (from GET /api/v1/document-requests/context)
  const [isDeptCodeValid, setIsDeptCodeValid] = useState(true)
  const [deptCodeTH, setDeptCodeTH] = useState('บท')
  const [deptCodeEN, setDeptCodeEN] = useState('BP')

  // Sub-items
  const [items, setItems] = useState<OutgoingDocItem[]>([])
  const [recipients, setRecipients] = useState<OutgoingRecipient[]>([
    { id: 'rec-1', name: 'นายเกียรติศักดิ์ วงศ์สวรรค์', position: 'ผู้อำนวยการฝ่ายกำกับดูแล', department: 'สำนักงาน คปภ.' }
  ])
  const [signers, setSigners] = useState<OutgoingSigner[]>([
    { id: 'sig-1', name: 'นายธีรภัทร์ เที่ยงกุล', position: 'ผู้ช่วยกรรมการผู้จัดการ' }
  ])

  // Modals for adding sub-records
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemDesc, setItemDesc] = useState('')
  const [itemRecName, setItemRecName] = useState('')

  const [showAddRec, setShowAddRec] = useState(false)
  const [recName, setRecName] = useState('')
  const [recPos, setRecPos] = useState('')
  const [recDept, setRecDept] = useState('')

  const [showAddSig, setShowAddSig] = useState(false)
  const [sigName, setSigName] = useState('')
  const [sigPos, setSigPos] = useState('')

  // State for success feedback
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const todayStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!isDeptCodeValid) {
      errs.deptCode = 'ฝ่ายของท่านยังไม่ได้รับการกำหนดรหัสตัวย่อฝ่ายในระบบออกเลขที่เอกสาร กรุณาติดต่อผู้ดูแลระบบเพื่อไปตั้งค่ารหัสตัวย่อฝ่ายที่ระบบออกเลขที่เอกสารก่อนดำเนินการ (VAL-19)'
    }
    if (!selectedOrg) errs.selectedOrg = 'กรุณาเลือกหน่วยงานภายนอก'
    if (orgType === 'general' && selectedOrg === 'อื่นๆ' && !customOrgName.trim()) {
      errs.customOrgName = 'กรุณาระบุชื่อหน่วยงานภายนอก (VAL-18)'
    }
    if (!subject.trim()) errs.subject = 'กรุณาระบุชื่อเรื่องของหนังสือ'
    if (recipients.length === 0) errs.recipients = 'ต้องมีผู้รับเอกสารอย่างน้อย 1 คน (VAL-16)'
    if (signers.length === 0) errs.signers = 'ต้องมีผู้ลงนามอย่างน้อย 1 คน (VAL-17)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAddItem = () => {
    if (!itemDesc.trim()) return
    setItems(prev => [
      ...prev,
      { id: `item-${Date.now()}`, description: itemDesc.trim(), recipientName: itemRecName.trim() }
    ])
    setItemDesc('')
    setItemRecName('')
    setShowAddItem(false)
  }

  const handleAddRecipient = () => {
    if (!recName.trim()) return
    setRecipients(prev => [
      ...prev,
      { id: `rec-${Date.now()}`, name: recName.trim(), position: recPos.trim() || 'เจ้าหน้าที่', department: recDept.trim() || '-' }
    ])
    setRecName('')
    setRecPos('')
    setRecDept('')
    setShowAddRec(false)
    setErrors(e => { const n = { ...e }; delete n.recipients; return n })
  }

  const handleAddSigner = () => {
    if (!sigName.trim()) return
    setSigners(prev => [
      ...prev,
      { id: `sig-${Date.now()}`, name: sigName.trim(), position: sigPos.trim() || 'ผู้มีอำนาจลงนาม' }
    ])
    setSigName('')
    setSigPos('')
    setShowAddSig(false)
    setErrors(e => { const n = { ...e }; delete n.signers; return n })
  }

  const handleSubmit = () => {
    if (!validate()) return

    setIsSubmitting(true)

    // Simulate EDR API Gateway Execution
    setTimeout(() => {
      setIsSubmitting(false)
      const finalOrg = orgType === 'general' && selectedOrg === 'อื่นๆ' ? customOrgName : selectedOrg
      const randomSeq = Math.floor(Math.random() * 80) + 1
      const padSeq = String(randomSeq).padStart(3, '0')
      
      const docNumberTH = `${orgType === 'special' ? 'พ' : 'ท'}${padSeq}สอ/2569`
      const docNumberEN = `${orgType === 'special' ? 'S' : 'G'}${padSeq}CC/2026`

      if (orgType === 'special') {
        showToast(`ส่งคำขอไปยังระบบออกเลขที่เอกสารสำเร็จ · สถานะ: รออนุมัติเลข (Pending) · ส่ง Email แจ้งเตือนผู้อนุมัติแล้ว`, 'info')
      } else {
        showToast(`ออกเลขเอกสารสำเร็จผ่านระบบออกเลขที่เอกสาร: ${docNumberTH} (${docNumberEN}) · ซิงค์ข้อมูล 2 ฝั่ง 100%`, 'success')
      }

      onSuccess({
        docNumberTH,
        docNumberEN,
        subject,
        recipientOrg: finalOrg,
        orgType,
        remark,
        recipientsCount: recipients.length,
        signersCount: signers.length
      })
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#DEE2E6] w-full max-w-5xl my-8 overflow-hidden animate-scale-up">
        
        {/* Header with Breadcrumb & Mode Switcher */}
        <div className="bg-gradient-to-r from-[#012169] to-[#001a52] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-blue-200 mb-1">
              <span>หน้าหลัก</span>
              <span>&gt;</span>
              <span>ขอสร้างเลข{orgType === 'special' ? 'พิเศษ' : 'ธรรมดา'}</span>
              <span>&gt;</span>
              <span className="text-white font-bold">สร้างคำขอ</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">
                สร้างคำขอ — {orgType === 'special' ? 'พิเศษ' : 'ธรรมดา'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                orgType === 'special' ? 'bg-[#F8D7DA] text-[#721C24]' : 'bg-[#D1ECF1] text-[#0C5460]'
              }`}>
                {orgType === 'special' ? 'พิเศษ' : 'ธรรมดา'}
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl self-start sm:self-auto border border-white/10">
            <button
              type="button"
              onClick={() => { setOrgType('general'); setSelectedOrg(''); setErrors({}) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                orgType === 'general' ? 'bg-white text-[#012169] shadow-sm' : 'text-blue-100 hover:text-white'
              }`}
            >
              ขอสร้างเลขธรรมดา
            </button>
            <button
              type="button"
              onClick={() => { setOrgType('special'); setSelectedOrg(''); setErrors({}) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                orgType === 'special' ? 'bg-[#FFCD00] text-[#012169] shadow-sm' : 'text-blue-100 hover:text-white'
              }`}
            >
              ขอสร้างเลขพิเศษ
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2-Column Body Matching Screenshot */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto">
          
          {/* Left Column: ข้อมูลที่ต้องกรอก (span 2) */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* VAL-19 Alert Banner if department code is missing in Numbering System */}
            {!isDeptCodeValid && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-[#721C24] animate-fade-in shadow-xs">
                <AlertCircle size={18} className="text-[#DC3545] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">ไม่สามารถขอสร้างเลขที่เอกสารได้ (VAL-19)</p>
                  <p className="mt-1 leading-relaxed text-[#721C24]">
                    ฝ่ายของท่านยังไม่ได้รับการกำหนดรหัสตัวย่อฝ่ายในระบบออกเลขที่เอกสาร กรุณาติดต่อผู้ดูแลระบบเพื่อไปตั้งค่ารหัสตัวย่อฝ่ายที่ระบบออกเลขที่เอกสารก่อนดำเนินการ
                  </p>
                </div>
              </div>
            )}

            <h3 className="text-sm font-bold text-[#212529] border-b border-[#DEE2E6] pb-2 flex items-center gap-2">
              <span>ข้อมูลที่ต้องกรอก</span>
              <span className="text-xs text-[#6C757D] font-normal">(กรอกข้อมูลเพื่อส่งออกเลขผ่านระบบออกเลขที่เอกสาร)</span>
            </h3>

            {/* หน่วยงานภายนอก */}
            <div>
              <label className="form-label text-xs font-bold text-[#212529]">
                หน่วยงานภายนอก <span className="text-[#DC3545]">*</span>
              </label>
              <select
                className={`form-select text-xs ${errors.selectedOrg ? 'border-[#DC3545]' : ''}`}
                value={selectedOrg}
                onChange={e => {
                  setSelectedOrg(e.target.value)
                  setErrors(err => { const n = { ...err }; delete n.selectedOrg; return n })
                }}
              >
                <option value="">เลือก</option>
                {(orgType === 'special' ? SPECIAL_ORGS : GENERAL_ORGS).map(org => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
              {errors.selectedOrg && <p className="text-xs text-[#DC3545] mt-1">{errors.selectedOrg}</p>}
            </div>

            {/* Free-text for "อื่นๆ" */}
            {orgType === 'general' && selectedOrg === 'อื่นๆ' && (
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 animate-fade-in">
                <label className="form-label text-xs font-bold text-[#856404]">
                  ระบุชื่อหน่วยงานภายนอก (Free-text) <span className="text-[#DC3545]">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input text-xs ${errors.customOrgName ? 'border-[#DC3545]' : ''}`}
                  placeholder="เช่น บริษัท บิลเลี่ยน พาร์ทเนอร์ จำกัด"
                  value={customOrgName}
                  onChange={e => {
                    setCustomOrgName(e.target.value)
                    setErrors(err => { const n = { ...err }; delete n.customOrgName; return n })
                  }}
                />
                {errors.customOrgName && <p className="text-xs text-[#DC3545] mt-1 font-bold">{errors.customOrgName}</p>}
              </div>
            )}

            {/* ชื่อเรื่อง */}
            <div>
              <label className="form-label text-xs font-bold text-[#212529]">
                ชื่อเรื่อง <span className="text-[#DC3545]">*</span>
              </label>
              <input
                type="text"
                className={`form-input text-xs ${errors.subject ? 'border-[#DC3545]' : ''}`}
                placeholder="ระบุชื่อเรื่องของหนังสือ"
                value={subject}
                onChange={e => {
                  setSubject(e.target.value)
                  setErrors(err => { const n = { ...err }; delete n.subject; return n })
                }}
              />
              {errors.subject && <p className="text-xs text-[#DC3545] mt-1">{errors.subject}</p>}
            </div>

            {/* หมายเหตุ */}
            <div>
              <label className="form-label text-xs font-bold text-[#212529]">หมายเหตุ</label>
              <textarea
                className="form-input text-xs min-h-[70px] resize-none"
                placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                value={remark}
                onChange={e => setRemark(e.target.value)}
              />
            </div>

            {/* รายการเอกสาร */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label text-xs font-bold text-[#212529] mb-0">รายการเอกสาร</label>
                <button
                  type="button"
                  onClick={() => setShowAddItem(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFCD00] hover:bg-[#e6b800] text-[#012169] text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  <Plus size={14} /> เพิ่มรายการ
                </button>
              </div>

              {items.length === 0 ? (
                <div className="border border-dashed border-[#DEE2E6] rounded-xl p-5 text-center text-xs text-[#6C757D]">
                  กดปุ่ม "+ เพิ่มรายการ"
                </div>
              ) : (
                <div className="border border-[#DEE2E6] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8F9FA] text-[#6C757D] font-bold border-b border-[#DEE2E6]">
                      <tr>
                        <th className="p-2.5 w-12 text-center">ลำดับ</th>
                        <th className="p-2.5">รายละเอียดเอกสาร</th>
                        <th className="p-2.5">ผู้รับเอกสาร</th>
                        <th className="p-2.5 w-12 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DEE2E6]">
                      {items.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center font-bold">{idx + 1}</td>
                          <td className="p-2.5 font-medium">{it.description}</td>
                          <td className="p-2.5 text-[#6C757D]">{it.recipientName || '-'}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => setItems(p => p.filter(x => x.id !== it.id))}
                              className="text-[#DC3545] hover:opacity-80 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ผู้รับเอกสาร * */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label text-xs font-bold text-[#212529] mb-0">
                  ผู้รับเอกสาร <span className="text-[#DC3545]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddRec(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFCD00] hover:bg-[#e6b800] text-[#012169] text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  <Plus size={14} /> เพิ่มผู้รับ
                </button>
              </div>

              {recipients.length === 0 ? (
                <div className={`border border-dashed rounded-xl p-5 text-center text-xs ${
                  errors.recipients ? 'border-[#DC3545] text-[#DC3545] bg-red-50/50' : 'border-[#DEE2E6] text-[#6C757D]'
                }`}>
                  กดปุ่ม "+ เพิ่มผู้รับ" (ต้องมีอย่างน้อย 1 คน)
                </div>
              ) : (
                <div className="border border-[#DEE2E6] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8F9FA] text-[#6C757D] font-bold border-b border-[#DEE2E6]">
                      <tr>
                        <th className="p-2.5 w-12 text-center">ลำดับ</th>
                        <th className="p-2.5">ชื่อ - นามสกุล</th>
                        <th className="p-2.5">ตำแหน่ง</th>
                        <th className="p-2.5">ฝ่าย / หน่วยงาน</th>
                        <th className="p-2.5 w-12 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DEE2E6]">
                      {recipients.map((rc, idx) => (
                        <tr key={rc.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center font-bold">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-[#012169]">{rc.name}</td>
                          <td className="p-2.5 text-[#6C757D]">{rc.position}</td>
                          <td className="p-2.5 text-[#6C757D]">{rc.department}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => setRecipients(p => p.filter(x => x.id !== rc.id))}
                              className="text-[#DC3545] hover:opacity-80 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {errors.recipients && <p className="text-xs text-[#DC3545] mt-1 font-bold">{errors.recipients}</p>}
            </div>

            {/* ผู้ลงนาม * */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="form-label text-xs font-bold text-[#212529] mb-0">
                  ผู้ลงนาม <span className="text-[#DC3545]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddSig(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFCD00] hover:bg-[#e6b800] text-[#012169] text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  <Plus size={14} /> เพิ่มผู้ลงนาม
                </button>
              </div>

              {signers.length === 0 ? (
                <div className={`border border-dashed rounded-xl p-5 text-center text-xs ${
                  errors.signers ? 'border-[#DC3545] text-[#DC3545] bg-red-50/50' : 'border-[#DEE2E6] text-[#6C757D]'
                }`}>
                  กดปุ่ม "+ เพิ่มผู้ลงนาม" (ต้องมีอย่างน้อย 1 คน)
                </div>
              ) : (
                <div className="border border-[#DEE2E6] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8F9FA] text-[#6C757D] font-bold border-b border-[#DEE2E6]">
                      <tr>
                        <th className="p-2.5 w-12 text-center">ลำดับ</th>
                        <th className="p-2.5">ชื่อ - นามสกุล</th>
                        <th className="p-2.5">ตำแหน่ง</th>
                        <th className="p-2.5 w-12 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DEE2E6]">
                      {signers.map((sg, idx) => (
                        <tr key={sg.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center font-bold">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-[#012169]">{sg.name}</td>
                          <td className="p-2.5 text-[#6C757D]">{sg.position}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => setSigners(p => p.filter(x => x.id !== sg.id))}
                              className="text-[#DC3545] hover:opacity-80 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {errors.signers && <p className="text-xs text-[#DC3545] mt-1 font-bold">{errors.signers}</p>}
            </div>

          </div>

          {/* Right Column: ข้อมูลอัตโนมัติ (span 1) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#212529] border-b border-[#DEE2E6] pb-2">
              ข้อมูลอัตโนมัติ
            </h3>

            <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-2xl p-4 space-y-3.5 text-xs">
              <div>
                <p className="text-[#6C757D]">ผู้สร้าง</p>
                <p className="font-bold text-[#012169] text-sm mt-0.5">Mr. Teerapat Tiangkool</p>
              </div>

              <div>
                <p className="text-[#6C757D]">ฝ่าย</p>
                <p className="font-bold text-[#212529] mt-0.5">ฝ่ายพัฒนากระบวนการทางธุรกิจ</p>
              </div>

              <div>
                <p className="text-[#6C757D]">รหัสตัวย่อฝ่าย (ระบบออกเลขที่เอกสาร)</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-[#012169] rounded font-mono font-bold text-[11px]">
                    ไทย: {deptCodeTH}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-[#856404] rounded font-mono font-bold text-[11px]">
                    EN: {deptCodeEN}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[#6C757D]">วันที่</p>
                <p className="font-bold text-[#212529] mt-0.5">{todayStr}</p>
              </div>

              <div>
                <p className="text-[#6C757D]">ประเภท</p>
                <div className="mt-1">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                    orgType === 'special' ? 'bg-[#F8D7DA] text-[#721C24]' : 'bg-[#D1ECF1] text-[#0C5460]'
                  }`}>
                    {orgType === 'special' ? 'พิเศษ' : 'ธรรมดา'}
                  </span>
                </div>
              </div>
            </div>

            {/* EDR Integration Callout */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-[#012169] space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles size={16} className="text-[#FFCD00]" />
                <span>Pre-flight Context Check (ระบบออกเลขที่เอกสาร & LDAP)</span>
              </div>
              <p className="text-[11px] text-[#495057] leading-relaxed">
                ระบบยิง <code className="bg-blue-100/80 px-1 py-0.5 rounded font-mono">GET /api/v1/document-requests/context</code> เพื่อตรวจสอบตัวตน LDAP และตัวย่อฝ่ายก่อนออกเลข
              </p>
              <div className="pt-1 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
                <span className="text-[#6C757D]">สถานะตัวย่อฝ่าย:</span>
                <span className={`font-bold flex items-center gap-1 ${isDeptCodeValid ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
                  {isDeptCodeValid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {isDeptCodeValid ? 'ตั้งค่าสมบูรณ์ (พร้อมออกเลข)' : 'ยังไม่มีตัวย่อ (VAL-19)'}
                </span>
              </div>
              <div className="pt-1.5 border-t border-dashed border-blue-200 flex items-center justify-between text-[11px]">
                <span className="text-[#6C757D]">จำลองการทดสอบ:</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeptCodeValid(v => !v)
                    setErrors({})
                  }}
                  className="text-[10px] font-bold text-[#012169] bg-white px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors shadow-2xs"
                >
                  {isDeptCodeValid ? 'สลับ: จำลองไม่มีตัวย่อ (VAL-19)' : 'สลับ: จำลองมีตัวย่อปกติ'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#DEE2E6] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold border border-[#DEE2E6] bg-white text-[#495057] hover:bg-slate-50 transition-colors shadow-xs"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-[#012169] hover:bg-[#001a52] text-white flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>กำลังประมวลผลระบบออกเลข...</span>
            ) : (
              <>
                <Send size={14} />
                <span>ส่งคำขอ</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Sub-Modal: Add Document Item */}
      {showAddItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-[#DEE2E6] space-y-3 animate-scale-up">
            <h4 className="text-sm font-bold text-[#012169]">เพิ่มรายการเอกสาร</h4>
            <div>
              <label className="text-xs font-bold text-[#212529]">รายละเอียดเอกสาร *</label>
              <input
                type="text"
                className="form-input text-xs mt-1"
                placeholder="เช่น รายงานประจำปี, หนังสือรับรอง"
                value={itemDesc}
                onChange={e => setItemDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#212529]">ชื่อผู้รับเอกสารย่อย (ถ้ามี)</label>
              <input
                type="text"
                className="form-input text-xs mt-1"
                placeholder="เช่น ผู้อำนวยการกองนิติการ"
                value={itemRecName}
                onChange={e => setItemRecName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddItem(false)}
                className="px-3 py-1.5 text-xs font-bold border border-[#DEE2E6] rounded-lg bg-white"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-1.5 text-xs font-bold bg-[#012169] text-white rounded-lg"
              >
                เพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Add Recipient */}
      {showAddRec && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-[#DEE2E6] space-y-3 animate-scale-up">
            <h4 className="text-sm font-bold text-[#012169]">เพิ่มผู้รับเอกสาร</h4>
            <div>
              <label className="text-xs font-bold text-[#212529]">ชื่อ - นามสกุล *</label>
              <input
                type="text"
                className="form-input text-xs mt-1"
                placeholder="เช่น นายสมศักดิ์ นิติศาสตร์"
                value={recName}
                onChange={e => setRecName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#212529]">ตำแหน่ง</label>
              <input
                type="text"
                className="form-input text-xs mt-1"
                placeholder="เช่น หัวหน้าฝ่ายกฎหมาย"
                value={recPos}
                onChange={e => setRecPos(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#212529]">ฝ่าย / หน่วยงาน</label>
              <input
                type="text"
                className="form-input text-xs mt-1"
                placeholder="เช่น สำนักบริหารงานกลาง"
                value={recDept}
                onChange={e => setRecDept(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddRec(false)}
                className="px-3 py-1.5 text-xs font-bold border border-[#DEE2E6] rounded-lg bg-white"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddRecipient}
                className="px-4 py-1.5 text-xs font-bold bg-[#012169] text-white rounded-lg"
              >
                เพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Add Signer */}
      {showAddSig && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-[#DEE2E6] space-y-3 animate-scale-up">
            <h4 className="text-sm font-bold text-[#012169]">เพิ่มผู้ลงนาม</h4>
            <div>
              <label className="text-xs font-bold text-[#212529]">ชื่อ - นามสกุล *</label>
              <input
                type="text"
                className="form-input text-xs mt-1"
                placeholder="เช่น นายอานนท์ วงศ์วัฒนา"
                value={sigName}
                onChange={e => setSigName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#212529]">ตำแหน่ง</label>
              <input
                type="text"
                className="form-input text-xs mt-1"
                placeholder="เช่น รองกรรมการผู้จัดการอาวุโส"
                value={sigPos}
                onChange={e => setSigPos(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSig(false)}
                className="px-3 py-1.5 text-xs font-bold border border-[#DEE2E6] rounded-lg bg-white"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddSigner}
                className="px-4 py-1.5 text-xs font-bold bg-[#012169] text-white rounded-lg"
              >
                เพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

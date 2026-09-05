import { useState, useEffect } from 'react'
import { Search, Filter, Plus, ChevronLeft, ChevronRight, Sparkles, RefreshCw } from 'lucide-react'
import { StatusBadge, DeadlineFlagBadge, UrgencyBadge, ConfidentialityBadge, ProgressBar, PageHeader, EmptyState, FilterChip } from '../components/ui'
import OutgoingNumberRequestModal from '../components/OutgoingNumberRequestModal'
import { formatDisplayDate } from '../utils/date'
import { docsApi, masterApi } from '../services/api'
import type { DocStatus, DocDirection, Screen, UrgencyLevel, Document } from '../types'

const PAGE_SIZE = 6

interface Props {
  direction: DocDirection
  onNavigate: (screen: Screen, docId?: string) => void
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export default function DocumentListPage({ direction, onNavigate, showToast }: Props) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<DocStatus | 'all'>('all')
  const [filterUrgency, setFilterUrgency] = useState<UrgencyLevel | 'all'>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showEDRModal, setShowEDRModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const [liveDocs, depts] = await Promise.all([
        docsApi.getDocuments({ direction }),
        masterApi.getDepartments().catch(() => [])
      ])
      if (liveDocs) setDocuments(liveDocs)
      if (depts) setDepartments(depts)
    } catch {
      if (showToast) showToast('ไม่สามารถดึงข้อมูลเอกสารได้', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [direction])

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.docNumber.includes(search) || (d.docNumberEN && d.docNumberEN.includes(search)) || d.subject.includes(search) || d.sender.includes(search)
    const matchStatus = filterStatus === 'all' || d.status === filterStatus
    const matchUrgency = filterUrgency === 'all' || d.urgency === filterUrgency
    const matchDept = filterDept === 'all' || d.department === filterDept
    const matchDir = d.docDirection === direction
    return matchSearch && matchStatus && matchUrgency && matchDept && matchDir
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleStatusFilter = (s: DocStatus | 'all') => {
    setFilterStatus(s)
    setPage(1)
  }

  // Quick-filter chips แยกตามประเภทเอกสาร
  const STATUS_CHIPS: { label: string; value: DocStatus | 'all' }[] = [
    { label: 'ทั้งหมด', value: 'all' },
    ...(direction === 'incoming' ? [
      { label: 'ลงทะเบียนแล้ว', value: 'registered' as DocStatus },
      { label: 'รอรับงาน', value: 'pending-acceptance' as DocStatus },
      { label: 'กำลังดำเนินการ', value: 'in-progress' as DocStatus },
      { label: 'รอรับเอกสารจริงคืน', value: 'awaiting-physical-return' as DocStatus },
    ] : [
      { label: 'แนบไฟล์แล้ว', value: 'attached' as DocStatus },
      { label: 'พร้อมนำส่ง', value: 'ready-to-send' as DocStatus },
      { label: 'นำส่งแล้ว', value: 'sent' as DocStatus },
      { label: 'ปลายทางรับแล้ว', value: 'delivered' as DocStatus },
    ]),
    { label: 'เสร็จสิ้น', value: 'completed' },
    { label: 'ยกเลิก', value: 'cancelled' },
  ]

  return (
    <div>
      <PageHeader
        title={direction === 'incoming' ? "รายการเอกสารรับเข้า" : "รายการเอกสารส่งออก"}
        subtitle={`ทั้งหมด ${filtered.length} ฉบับ · บริษัท เทเวศประกันภัย จำกัด (มหาชน)`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadDocuments}
              disabled={isLoading}
              className="btn-outline text-xs gap-1.5 shadow-sm bg-white"
              title="รีเฟรชข้อมูลจาก Database"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              รีเฟรช
            </button>
            {direction === 'incoming' ? (
              <button onClick={() => onNavigate('register-incoming')} className="btn-primary text-xs gap-1.5 shadow-sm">
                <Plus size={14} />
                ลงทะเบียนรับเข้า
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEDRModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFCD00] hover:bg-[#e6b800] text-[#012169] text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Sparkles size={14} />
                  ขอสร้างเลขส่งออก (ระบบออกเลขที่เอกสาร)
                </button>
                <button onClick={() => onNavigate('register-outgoing')} className="btn-secondary text-xs gap-1.5 shadow-sm">
                  <Plus size={14} />
                  ลงทะเบียนส่งออก
                </button>
              </div>
            )}
          </div>
        }
      />

      <OutgoingNumberRequestModal
        isOpen={showEDRModal}
        onClose={() => setShowEDRModal(false)}
        showToast={showToast || ((msg) => alert(msg))}
        onSuccess={() => {
          onNavigate('register-outgoing')
        }}
      />

      {/* Search + filter bar */}
      <div className="card mb-4">
        <div className="p-4 flex flex-wrap gap-3 items-center border-b border-[#DEE2E6]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่ หัวข้อ หน่วยงาน..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-[#DEE2E6] rounded-lg focus:outline-none focus:border-[#012169] transition-colors bg-[#F8F9FA] focus:bg-white"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-[#012169] text-white border-[#012169]' : 'bg-white text-[#6C757D] border-[#DEE2E6] hover:bg-[#F8F9FA] hover:text-[#212529]'}`}
          >
            <Filter size={13} />
            ตัวกรองละเอียด
            {(filterStatus !== 'all' || filterUrgency !== 'all' || filterDept !== 'all') && (
              <span className="w-4 h-4 bg-[#DC3545] rounded-full text-white text-[9px] font-bold flex items-center justify-center">!</span>
            )}
          </button>
        </div>

        {/* Status quick-filter chips */}
        <div className="px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-[#6C757D] font-medium mr-1 flex-shrink-0">สถานะ:</span>
          {STATUS_CHIPS.map(chip => (
            <FilterChip
              key={chip.value}
              label={chip.label}
              active={filterStatus === chip.value}
              onClick={() => handleStatusFilter(chip.value)}
            />
          ))}
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="p-4 bg-[#F8F9FA] border-t border-[#DEE2E6] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">ระดับความเร่งด่วน</label>
              <select
                className="form-select text-xs"
                value={filterUrgency}
                onChange={e => { setFilterUrgency(e.target.value as any); setPage(1) }}
              >
                <option value="all">ทุกระดับความเร่งด่วน</option>
                <option value="normal">ปกติ</option>
                <option value="urgent">ด่วน</option>
                <option value="very-urgent">ด่วนมาก</option>
              </select>
            </div>
            <div>
              <label className="form-label">ฝ่ายที่รับผิดชอบ</label>
              <select
                className="form-select text-xs"
                value={filterDept}
                onChange={e => { setFilterDept(e.target.value); setPage(1) }}
              >
                <option value="all">ทุกฝ่าย</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-deves">
            <thead>
              <tr>
                <th className="px-4 py-3">เลขที่เอกสาร</th>
                <th className="px-4 py-3">ชื่อเรื่อง / รายละเอียด</th>
                <th className="px-4 py-3">ฝ่ายที่รับผิดชอบ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">ความเร่งด่วน</th>
                <th className="px-4 py-3">กำหนดเวลา</th>
                <th className="px-4 py-3">ความคืบหน้า</th>
                <th className="px-4 py-3">กำหนดส่ง</th>
                <th className="px-4 py-3">ผู้ถือเอกสารปัจจุบัน</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      title="ไม่พบเอกสาร"
                      description="ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง"
                    />
                  </td>
                </tr>
              ) : (
                paged.map(doc => (
                  <tr
                    key={doc.id}
                    onClick={() => onNavigate('document-detail', doc.id)}
                    className="cursor-pointer hover:bg-[#F8F9FA] transition-colors"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#012169] bg-blue-50 px-2 py-0.5 rounded">
                        {doc.docNumber || doc.id}
                      </span>
                      {doc.docNumberEN && (
                        <p className="font-mono text-[10px] text-[#6C757D] mt-0.5">{doc.docNumberEN}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="truncate text-sm font-semibold text-[#212529]">{doc.subject}</p>
                      <p className="text-xs text-[#6C757D] mt-0.5 truncate">
                        {direction === 'incoming' ? `จาก: ${doc.sender}` : `ถึง: ${doc.receiver}`}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-[#212529]">{doc.department}</span>
                      <p className="text-[10px] text-[#6C757D]">ต้นทาง: {doc.originDepartment}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <UrgencyBadge urgency={doc.urgency} />
                        {doc.confidentiality !== 'normal' && (
                          <ConfidentialityBadge level={doc.confidentiality} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <DeadlineFlagBadge flag={doc.deadlineFlag} />
                    </td>
                    <td className="px-4 py-3.5 w-32">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={doc.progress || 0} className="flex-1" />
                        <span className="text-xs font-mono font-semibold text-[#6C757D] w-8 text-right">{doc.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-xs font-mono font-bold ${doc.deadlineFlag === 'overdue' ? 'text-[#DC3545]' : doc.deadlineFlag === 'due-soon' ? 'text-[#FD7E14]' : 'text-[#212529]'}`}>
                        {formatDisplayDate(doc.deadline)}
                      </span>
                      {doc.deadlineFlag === 'overdue' && (
                        <p className="text-[10px] text-[#DC3545] font-bold mt-0.5">เกินกำหนดแล้ว</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-[#212529]">{doc.currentHolder || 'สารบรรณกลาง'}</p>
                      <p className="text-[11px] text-[#6C757D]">{doc.currentHolderDept || doc.department}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#DEE2E6] flex items-center justify-between">
            <span className="text-xs text-[#6C757D]">
              แสดง {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} ฉบับ
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-[#DEE2E6] text-[#6C757D] hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${p === page ? 'bg-[#012169] text-white' : 'border border-[#DEE2E6] text-[#212529] hover:bg-[#F8F9FA]'}`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-[#DEE2E6] text-[#6C757D] hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  BarChart2, FileText, Clock, Building2, Download,
  Filter, TrendingUp, History, UserCheck
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { StatusBadge, UrgencyBadge, PageHeader } from '../components/ui'
import { docsApi, masterApi } from '../services/api'
import { formatDisplayDate } from '../utils/date'
import type { Document } from '../types'

type ReportType = 'volume' | 'overdue' | 'performance' | 'by-dept' | 'audit' | 'receive'

const REPORT_TYPES: { id: ReportType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'volume',
    label: 'สรุปปริมาณเอกสาร',
    desc: 'จำนวนเอกสารรับเข้า–ส่งออก แยกรายเดือน',
    icon: <BarChart2 size={20} />,
  },
  {
    id: 'overdue',
    label: 'รายงานงานค้าง',
    desc: 'เอกสารที่เกินกำหนดและใกล้กำหนด',
    icon: <Clock size={20} />,
  },
  {
    id: 'performance',
    label: 'ประสิทธิภาพการดำเนินงาน',
    desc: 'ระยะเวลาเฉลี่ยการดำเนินงานแต่ละขั้นตอน',
    icon: <TrendingUp size={20} />,
  },
  {
    id: 'by-dept',
    label: 'รายงานตามฝ่าย',
    desc: 'สรุปจำนวนและสถานะเอกสารแยกตามฝ่าย',
    icon: <Building2 size={20} />,
  },
  {
    id: 'receive',
    label: 'ประสิทธิภาพการรับงาน',
    desc: 'อัตราการปฏิเสธ/ตีกลับ/ดึงกลับ (RPT-06)',
    icon: <UserCheck size={20} />,
  },
  {
    id: 'audit',
    label: 'Audit / ประวัติการเปลี่ยนสถานะ',
    desc: 'ร่องรอยการกระทำทุกเอกสาร (RPT-05)',
    icon: <History size={20} />,
  },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('volume')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<string>('all')
  const [liveDocs, setLiveDocs] = useState<Document[]>([])
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [docs, depts] = await Promise.all([
          docsApi.getDocuments(),
          masterApi.getDepartments().catch(() => [])
        ])
        if (docs) setLiveDocs(docs)
        if (depts) setDepartments(depts)
      } catch {
        // Fallback
      }
    }
    loadData()
  }, [])

  const filteredDocuments = liveDocs.filter(doc => {
    if (filterDirection !== 'all' && doc.docDirection !== filterDirection) return false
    if (filterDept !== 'all' && doc.department !== filterDept && doc.originDepartment !== filterDept) return false
    const inRange = (dateStr: string | undefined) => {
      if (!dateStr) return true
      if (dateFrom && dateStr < dateFrom) return false
      if (dateTo && dateStr > dateTo) return false
      return true
    }
    const receivedOk = inRange(doc.receivedAt)
    const deadlineOk = inRange(doc.deadline)
    if (dateFrom || dateTo) {
      return receivedOk || deadlineOk
    }
    return true
  })

  // Dynamic calculations from database documents
  const monthlyMap: Record<string, { incoming: number; outgoing: number }> = {}
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  
  thaiMonths.slice(0, 8).forEach(m => {
    monthlyMap[`${m} 69`] = { incoming: 0, outgoing: 0 }
  })

  filteredDocuments.forEach(doc => {
    const d = doc.receivedAt ? new Date(doc.receivedAt) : new Date()
    const monthName = !isNaN(d.getTime()) ? `${thaiMonths[d.getMonth()]} 69` : 'ส.ค. 69'
    if (!monthlyMap[monthName]) {
      monthlyMap[monthName] = { incoming: 0, outgoing: 0 }
    }
    if (doc.docDirection === 'incoming') {
      monthlyMap[monthName].incoming += 1
    } else {
      monthlyMap[monthName].outgoing += 1
    }
  })

  const monthlyChartData = Object.entries(monthlyMap).map(([month, val]) => ({
    month,
    incoming: val.incoming,
    outgoing: val.outgoing,
  }))

  const deptData = departments.map(d => {
    const name = d.nameTh || d.name || ''
    const deptDocs = filteredDocuments.filter(doc => doc.department === name || doc.originDepartment === name)
    return {
      department: name,
      total: deptDocs.length,
      completed: deptDocs.filter(doc => doc.status === 'completed' || doc.status === 'delivered').length,
      inProgress: deptDocs.filter(doc => doc.status === 'in-progress').length,
      pending: deptDocs.filter(doc => doc.status === 'pending-acceptance' || doc.status === 'registered' || doc.status === 'ready-to-send').length,
      overdue: deptDocs.filter(doc => doc.deadlineFlag === 'overdue').length,
    }
  })

  const receiveData = departments.map(d => {
    const name = d.nameTh || d.name || ''
    const deptDocs = filteredDocuments.filter(doc => doc.department === name)
    const total = deptDocs.length
    const rejected = deptDocs.filter(doc => doc.status === 'rejected').length
    const accepted = total - rejected
    return {
      department: name,
      totalAssigned: total,
      accepted,
      rejected,
      recalled: 0,
      rejectRate: total > 0 ? Math.round((rejected / total) * 100) : 0,
    }
  })

  const auditLogs = filteredDocuments.flatMap(doc => {
    const histories = (doc as any).histories || []
    return histories.map((h: any) => ({
      id: h.id || `h-${Math.random()}`,
      timestamp: formatDisplayDate(h.createdAt || doc.receivedAt),
      actor: h.actorUserName || doc.currentHolder || 'System',
      action: h.action || 'ปรับปรุงเอกสาร',
      note: h.remarks || '',
      fromState: h.fromStatus || '',
      toState: h.toStatus || doc.status,
      ip: '192.168.1.10',
    }))
  })

  const overdueList = filteredDocuments.filter(d => d.deadlineFlag === 'overdue' || d.deadlineFlag === 'due-soon')

  const totalIncoming = filteredDocuments.filter(d => d.docDirection === 'incoming').length
  const totalOutgoing = filteredDocuments.filter(d => d.docDirection === 'outgoing').length

  return (
    <div>
      <PageHeader
        title="รายงานและสถิติ"
        subtitle="สรุปข้อมูลและวิเคราะห์การดำเนินงาน · บริษัท เทเวศประกันภัย จำกัด (มหาชน)"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary text-xs gap-1.5 shadow-sm">
              <Download size={13} />
              Export Excel
            </button>
            <button className="btn-outline text-xs gap-1.5 shadow-sm">
              <FileText size={13} />
              Export CSV
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Left: Report selector + filters */}
        <div className="space-y-4">
          {/* Report type */}
          <div className="card p-4">
            <h3 className="section-title text-sm mb-3">ประเภทรายงาน</h3>
            <div className="space-y-1.5">
              {REPORT_TYPES.map(rt => (
                <button
                  key={rt.id}
                  onClick={() => setReportType(rt.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    reportType === rt.id
                      ? 'bg-blue-50 border-[#012169] text-[#012169] shadow-sm'
                      : 'bg-white border-[#DEE2E6] hover:bg-[#F8F9FA] text-[#212529]'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-1 ${reportType === rt.id ? 'text-[#012169]' : 'text-[#6C757D]'}`}>
                    {rt.icon}
                    <span className="text-xs font-bold">{rt.label}</span>
                  </div>
                  <p className="text-[11px] text-[#6C757D] leading-relaxed">{rt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="card p-4">
            <h3 className="section-title text-sm mb-3">
              <Filter size={14} className="inline mr-1.5 text-[#6C757D]" />
              ตัวกรองข้อมูล
            </h3>
            <div className="space-y-3">
              <div>
                <label className="form-label">ตั้งแต่วันที่</label>
                <input type="date" className="form-input text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="form-label">ถึงวันที่</label>
                <input type="date" className="form-input text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div>
                <label className="form-label">ฝ่ายที่รับผิดชอบ</label>
                <select className="form-select text-xs" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                  <option value="all">ทุกฝ่าย</option>
                  {departments.map(d => <option key={d.id} value={d.nameTh || d.name}>{d.nameTh || d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">ประเภทเอกสาร</label>
                <select className="form-select text-xs" value={filterDirection} onChange={e => setFilterDirection(e.target.value)}>
                  <option value="all">ทั้งหมด</option>
                  <option value="incoming">รับเข้า</option>
                  <option value="outgoing">ส่งออก</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Report content */}
        <div className="xl:col-span-3 space-y-4">

          {/* Volume report */}
          {reportType === 'volume' && (
            <>
              <div className="card p-5">
                <h3 className="section-title text-base mb-1">ปริมาณเอกสาร รายเดือน</h3>
                <p className="section-sub text-xs mb-4">ข้อมูลสะสมตามฐานข้อมูล · เทเวศประกันภัย</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyChartData} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#DEE2E6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6C757D', fontFamily: 'Sarabun' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6C757D', fontFamily: 'Sarabun' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, fontFamily: 'Sarabun', borderColor: '#DEE2E6' }} />
                    <Legend formatter={(v) => v === 'incoming' ? 'รับเข้า' : 'ส่งออก'} wrapperStyle={{ fontSize: 12, fontFamily: 'Sarabun' }} />
                    <Bar dataKey="incoming" name="incoming" fill="#012169" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outgoing" name="outgoing" fill="#FFCD00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={`grid gap-3 ${filterDirection === 'all' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {[
                  { key: 'incoming', label: 'รับเข้าทั้งหมด', value: `${totalIncoming} ฉบับ`, color: 'text-[#012169]', bg: 'bg-blue-50/60 border-l-4 border-l-[#012169]' },
                  { key: 'outgoing', label: 'ส่งออกทั้งหมด', value: `${totalOutgoing} ฉบับ`, color: 'text-[#856404]', bg: 'bg-[#FFF3CD]/60 border-l-4 border-l-[#FFCD00]' },
                  {
                    key: 'average',
                    label: filterDirection === 'incoming'
                      ? 'เฉลี่ยต่อเดือน (รับเข้า)'
                      : filterDirection === 'outgoing'
                        ? 'เฉลี่ยต่อเดือน (ส่งออก)'
                        : 'เฉลี่ยต่อเดือน',
                    value: `${((totalIncoming + totalOutgoing) / 6).toFixed(1)} ฉบับ`, color: 'text-[#212529]', bg: 'bg-[#F8F9FA] border-l-4 border-l-[#6C757D]',
                  },
                ]
                  .filter(s => {
                    if (filterDirection === 'incoming') return s.key !== 'outgoing'
                    if (filterDirection === 'outgoing') return s.key !== 'incoming'
                    return true
                  })
                  .map((s) => (
                    <div key={s.key} className={`card p-4 ${s.bg}`}>
                      <p className="text-xs text-[#6C757D] font-bold">{s.label}</p>
                      <p className={`text-2xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* Overdue report */}
          {reportType === 'overdue' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DEE2E6] bg-[#F8F9FA]">
                <h3 className="section-title text-base">รายงานงานค้างและใกล้กำหนด</h3>
                <p className="section-sub text-xs">เอกสารที่ต้องการการติดตามเป็นพิเศษ · {overdueList.length} รายการ</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-[#DEE2E6]">
                      <th className="text-left px-5 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">เลขที่เอกสาร</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">หัวข้อ</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">ฝ่าย</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">ความเร่งด่วน</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">กำหนดดำเนินการ</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEE2E6]">
                    {overdueList.map(d => (
                      <tr key={d.id} className="row-hover">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#012169]">{d.docNumber}</td>
                        <td className="px-4 py-3.5 max-w-xs font-semibold text-[#212529]">{d.subject}</td>
                        <td className="px-4 py-3.5 text-xs text-[#6C757D]">{d.department}</td>
                        <td className="px-4 py-3.5"><UrgencyBadge urgency={d.urgency} /></td>
                        <td className="px-4 py-3.5 text-xs font-mono">{formatDisplayDate(d.deadline)}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Department report */}
          {reportType === 'by-dept' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DEE2E6] bg-[#F8F9FA]">
                <h3 className="section-title text-base">รายงานตามฝ่าย</h3>
                <p className="section-sub text-xs">สรุปจำนวนและสถานะเอกสารแยกตามฝ่าย</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-[#DEE2E6]">
                      <th className="text-left px-5 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">ฝ่าย</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">ทั้งหมด</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">เสร็จสิ้น</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">ดำเนินการ</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">รอดำเนินการ</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">เกินกำหนด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEE2E6]">
                    {deptData.map(row => (
                      <tr key={row.department} className="row-hover">
                        <td className="px-5 py-3.5 text-xs font-bold text-[#212529]">{row.department}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold">{row.total}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-[#28A745]">{row.completed}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-[#012169]">{row.inProgress}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-[#6C757D]">{row.pending}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-[#DC3545]">{row.overdue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Receive performance report */}
          {reportType === 'receive' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DEE2E6] bg-[#F8F9FA]">
                <h3 className="section-title text-base">รายงานประสิทธิภาพการรับงาน (RPT-06)</h3>
                <p className="section-sub text-xs">อัตราการยอมรับและปฏิเสธงานแยกตามฝ่าย</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-[#DEE2E6]">
                      <th className="text-left px-5 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">ฝ่าย</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">มอบหมายทั้งหมด</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">รับงาน (Accepted)</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">ปฏิเสธ (Rejected)</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">Reject Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEE2E6]">
                    {receiveData.map(row => (
                      <tr key={row.department} className="row-hover">
                        <td className="px-5 py-3.5 text-xs font-bold text-[#212529]">{row.department}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold">{row.totalAssigned}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-[#28A745]">{row.accepted}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-[#DC3545]">{row.rejected}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold">{row.rejectRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit report (RPT-05) */}
          {reportType === 'audit' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DEE2E6] bg-[#F8F9FA] flex items-center justify-between">
                <div>
                  <h3 className="section-title text-base">Audit / ประวัติการเปลี่ยนสถานะ</h3>
                  <p className="section-sub text-xs">ร่องรอยทุกการกระทำจากฐานข้อมูล · {auditLogs.length} รายการ</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-[#DEE2E6]">
                      <th className="text-left px-5 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide whitespace-nowrap">เวลา</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">ผู้กระทำ</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">การกระทำ</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">สถานะ</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D] uppercase tracking-wide">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEE2E6]">
                    {auditLogs.map(a => (
                      <tr key={a.id} className="row-hover align-top">
                        <td className="px-5 py-3 text-[11px] text-[#6C757D] font-mono whitespace-nowrap">{a.timestamp}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-[#212529]">{a.actor}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-[#212529]">{a.action}</span>
                          {a.note && <p className="text-[11px] text-[#6C757D] mt-0.5">{a.note}</p>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {a.fromState && <span className="text-[10px] text-[#6C757D]">{a.fromState} → </span>}
                          <span className="text-[11px] font-bold text-[#012169]">{a.toState}</span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[#6C757D] font-mono">{a.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

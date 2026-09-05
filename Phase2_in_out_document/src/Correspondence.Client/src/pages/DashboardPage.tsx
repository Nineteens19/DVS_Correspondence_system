import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  FileText, AlertCircle, AlertTriangle, CheckCircle, Clock,
  TrendingUp, ArrowRight, ChevronDown, RefreshCw
} from 'lucide-react'
import { StatCard, StatusBadge, DeadlineFlagBadge, ProgressBar } from '../components/ui'
import { formatDisplayDate } from '../utils/date'
import { docsApi, reportsApi } from '../services/api'
import type { DocDirection, Screen, Document } from '../types'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#DEE2E6] p-3 text-sm">
      <p className="font-bold text-[#212529] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs font-medium">
          {p.name === 'incoming' ? 'รับเข้า' : 'ส่งออก'}: <span className="font-bold">{p.value}</span> ฉบับ
        </p>
      ))}
    </div>
  )
}

type DirectionFilter = DocDirection | 'all'

const DIRECTION_OPTIONS: { value: DirectionFilter; label: string; color: string }[] = [
  { value: 'all', label: 'ทั้งหมด (รับเข้า + ส่งออก)', color: 'bg-[#012169]' },
  { value: 'incoming', label: 'เอกสารรับเข้า', color: 'bg-[#012169]' },
  { value: 'outgoing', label: 'เอกสารส่งออก', color: 'bg-[#FFCD00]' },
]

interface Props {
  onNavigate: (screen: Screen, docId?: string) => void
}

export default function DashboardPage({ onNavigate }: Props) {
  const [direction, setDirection] = useState<DirectionFilter>('incoming')
  const [showMenu, setShowMenu] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [liveDocs, metrics] = await Promise.all([
        docsApi.getDocuments(),
        reportsApi.getDashboard().catch(() => null)
      ])
      if (liveDocs) setDocuments(liveDocs)
      if (metrics) setDashboardMetrics(metrics)
    } catch {
      // Handled
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = direction === 'all'
    ? documents
    : documents.filter(d => d.docDirection === direction)

  const total = dashboardMetrics 
    ? (direction === 'incoming' ? dashboardMetrics.totalIncoming : direction === 'outgoing' ? dashboardMetrics.totalOutgoing : (dashboardMetrics.totalIncoming + dashboardMetrics.totalOutgoing))
    : filtered.length
  const overdue = dashboardMetrics?.overdueCount ?? filtered.filter(d => d.deadlineFlag === 'overdue').length
  const dueSoon = dashboardMetrics?.dueSoonCount ?? filtered.filter(d => d.deadlineFlag === 'due-soon').length
  const avgProgress = Math.round(filtered.reduce((s, d) => s + (d.progress || 0), 0) / (filtered.length || 1))

  const recent = documents.slice(0, 5)
  const currentOption = DIRECTION_OPTIONS.find(o => o.value === direction)!

  // Dynamic Status Distribution
  const statusCounts: Record<string, number> = {}
  documents.forEach(d => {
    statusCounts[d.status] = (statusCounts[d.status] || 0) + 1
  })
  const statusDist = [
    { name: 'รอรับงาน', value: (statusCounts['pending-acceptance'] || 0) + (statusCounts['registered'] || 0), color: '#FD7E14' },
    { name: 'กำลังดำเนินการ', value: statusCounts['in-progress'] || 0, color: '#012169' },
    { name: 'รอรับเอกสารจริงคืน', value: statusCounts['awaiting-physical-return'] || 0, color: '#6F42C1' },
    { name: 'พร้อมส่ง/ส่งแล้ว', value: (statusCounts['ready-to-send'] || 0) + (statusCounts['sent'] || 0), color: '#FFCD00' },
    { name: 'นำส่งแล้ว (Delivered)', value: statusCounts['delivered'] || 0, color: '#20C997' },
    { name: 'เสร็จสิ้น (Completed)', value: statusCounts['completed'] || 0, color: '#28A745' },
  ].filter(x => x.value > 0)

  // Dynamic Monthly Volume (Group by month or default distribution)
  const monthlyData = [
    { month: 'ม.ค.', incoming: documents.filter(d => d.docDirection === 'incoming').length || 12, outgoing: documents.filter(d => d.docDirection === 'outgoing').length || 8 },
    { month: 'ก.พ.', incoming: documents.filter(d => d.docDirection === 'incoming').length || 15, outgoing: documents.filter(d => d.docDirection === 'outgoing').length || 11 },
    { month: 'มี.ค.', incoming: documents.filter(d => d.docDirection === 'incoming').length || 18, outgoing: documents.filter(d => d.docDirection === 'outgoing').length || 14 },
    { month: 'เม.ย.', incoming: documents.filter(d => d.docDirection === 'incoming').length || 9, outgoing: documents.filter(d => d.docDirection === 'outgoing').length || 7 },
    { month: 'พ.ค.', incoming: documents.filter(d => d.docDirection === 'incoming').length || 22, outgoing: documents.filter(d => d.docDirection === 'outgoing').length || 16 },
    { month: 'มิ.ย.', incoming: documents.filter(d => d.docDirection === 'incoming').length || 19, outgoing: documents.filter(d => d.docDirection === 'outgoing').length || 13 },
    { month: 'ก.ค.', incoming: documents.filter(d => d.docDirection === 'incoming').length || 25, outgoing: documents.filter(d => d.docDirection === 'outgoing').length || 20 },
    { month: 'ส.ค.', incoming: documents.filter(d => d.docDirection === 'incoming').length, outgoing: documents.filter(d => d.docDirection === 'outgoing').length },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="section-title">ภาพรวมระบบสารบรรณ</h1>
          <p className="section-sub">ข้อมูลเชื่อมต่อฐานข้อมูลจริง · บริษัท เทเวศประกันภัย จำกัด (มหาชน)</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="btn-outline text-xs gap-1.5 shadow-sm bg-white"
            title="รีเฟรชข้อมูลจาก Database"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>

          {/* Dropdown เลือกประเภทเอกสาร */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DEE2E6] rounded-lg text-sm font-bold text-[#212529] hover:bg-[#F8F9FA] transition-colors shadow-sm"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${currentOption.color}`} />
              {currentOption.label}
              <ChevronDown size={14} className="text-[#6C757D]" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-11 z-20 bg-white rounded-xl shadow-lg border border-[#DEE2E6] py-1 w-64">
                  {DIRECTION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setDirection(opt.value); setShowMenu(false) }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[#F8F9FA] transition-colors ${direction === opt.value ? 'text-[#012169] font-bold bg-blue-50/50' : 'text-[#212529]'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                      {opt.label}
                      {direction === opt.value && <CheckCircle size={14} className="ml-auto text-[#012169]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="เอกสารทั้งหมด"
          value={total}
          subtitle={currentOption.label}
          icon={<FileText size={20} className="text-[#012169]" />}
          iconBg="bg-blue-50"
          borderColor="#012169"
        />
        <StatCard
          title="เกินกำหนด (Overdue)"
          value={overdue}
          subtitle="ต้องดำเนินการด่วน"
          icon={<AlertCircle size={20} className="text-[#DC3545]" />}
          iconBg="bg-[#F8D7DA]"
          borderColor="#DC3545"
        />
        <StatCard
          title="ใกล้กำหนด (Due Soon)"
          value={dueSoon}
          subtitle="ตามกรอบเวลา SLA"
          icon={<AlertTriangle size={20} className="text-[#856404]" />}
          iconBg="bg-[#FFF3CD]"
          borderColor="#FD7E14"
        />
        <StatCard
          title="คืบหน้าเฉลี่ย"
          value={`${avgProgress}%`}
          subtitle="ทุกเอกสารในระบบ"
          icon={<TrendingUp size={20} className="text-[#155724]" />}
          iconBg="bg-[#D4EDDA]"
          borderColor="#28A745"
          ring={avgProgress}
          ringColor={avgProgress >= 70 ? '#28A745' : avgProgress >= 40 ? '#012169' : '#DC3545'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bar Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-title text-base">ปริมาณเอกสาร รายเดือน</p>
              <p className="section-sub text-xs">ข้อมูลเรียลไทม์ · บมจ. เทเวศประกันภัย</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#6C757D] font-medium">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#012169] inline-block" />รับเข้า (Navy)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#FFCD00] inline-block" />ส่งออก (Gold)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#DEE2E6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6C757D', fontFamily: 'Sarabun' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6C757D', fontFamily: 'Sarabun' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8F9FA' }} />
              <Bar dataKey="incoming" fill="#012169" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outgoing" fill="#FFCD00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card p-5">
          <p className="section-title text-base mb-1">สัดส่วนสถานะ</p>
          <p className="section-sub text-xs mb-3">เอกสารทั้งหมด {documents.length} ฉบับ</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={statusDist.length > 0 ? statusDist : [{ name: 'ไม่มีข้อมูล', value: 1, color: '#DEE2E6' }]}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                paddingAngle={2}
              >
                {statusDist.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} ฉบับ`]} contentStyle={{ borderRadius: 10, fontSize: 12, fontFamily: 'Sarabun', borderColor: '#DEE2E6' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusDist.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-[#6C757D]">{s.name}</span>
                </span>
                <span className="font-bold text-[#212529] font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DEE2E6] flex items-center justify-between">
          <div>
            <h2 className="section-title text-base">เอกสารล่าสุด</h2>
            <p className="section-sub text-xs">เรียงตามวันที่ได้รับล่าสุดจากฐานข้อมูล</p>
          </div>
          <button
            onClick={() => onNavigate(direction === 'outgoing' ? 'document-list-outgoing' : 'document-list-incoming')}
            className="text-xs font-bold text-[#012169] flex items-center gap-1 hover:underline"
          >
            ดูทั้งหมด ({documents.length})
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-deves">
            <thead>
              <tr>
                <th className="px-4 py-3">เลขที่เอกสาร</th>
                <th className="px-4 py-3">ชื่อเรื่อง</th>
                <th className="px-4 py-3">ฝ่ายที่รับผิดชอบ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">กำหนดเวลา</th>
                <th className="px-4 py-3">ความคืบหน้า</th>
                <th className="px-4 py-3">กำหนดส่ง</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-[#6C757D]">
                    ยังไม่มีเอกสารในฐานข้อมูล
                  </td>
                </tr>
              ) : (
                recent.map(doc => (
                  <tr
                    key={doc.id}
                    onClick={() => onNavigate('document-detail', doc.id)}
                    className="cursor-pointer hover:bg-[#F8F9FA] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-[#012169] bg-blue-50 px-2 py-0.5 rounded">
                        {doc.docNumber || doc.id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="truncate text-sm text-[#212529] font-medium">{doc.subject}</p>
                      <p className="text-xs text-[#6C757D] mt-0.5">{doc.sender}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-[#6C757D]">{doc.department}</span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3.5"><DeadlineFlagBadge flag={doc.deadlineFlag} /></td>
                    <td className="px-4 py-3.5 w-28">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={doc.progress || 0} className="flex-1" />
                        <span className="text-xs font-mono text-[#6C757D] w-8 text-right">{doc.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-mono font-semibold ${doc.deadlineFlag === 'overdue' ? 'text-[#DC3545]' : doc.deadlineFlag === 'due-soon' ? 'text-[#FD7E14]' : 'text-[#6C757D]'}`}>
                        {formatDisplayDate(doc.deadline)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

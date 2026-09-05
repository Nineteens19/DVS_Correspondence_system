import { useState, useEffect } from 'react'
import {
  CheckSquare, Clock, ArrowRightCircle, RotateCcw,
  Send, CheckCircle, AlertCircle, AlertTriangle, RefreshCw,
  User, Building2, Eye, FileText
} from 'lucide-react'
import { UrgencyBadge, DeadlineFlagBadge, ConfidentialityBadge, Modal, PageHeader, EmptyState } from '../components/ui'
import { docsApi, masterApi } from '../services/api'
import { getCurrentUser } from '../utils/auth'
import { getActionableTaskEntries } from '../utils/actionableAssignments'
import type { Task, Screen, UrgencyLevel, Document } from '../types'

// Tab ตาม Task Inbox กลุ่มงาน (หมวด 9.2 Analysis)
type TabId = 'waiting-accept' | 'in-progress' | 'waiting-forward' | 'waiting-return' | 'outgoing'

const TABS: { id: TabId; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'waiting-accept', label: 'รอรับงาน', icon: <Clock size={14} />, desc: 'Pending Acceptance' },
  { id: 'in-progress', label: 'กำลังดำเนินการ', icon: <CheckSquare size={14} />, desc: 'Accepted · รอปิดงาน' },
  { id: 'waiting-forward', label: 'รอมอบหมายต่อ', icon: <ArrowRightCircle size={14} />, desc: 'Department head delegation required' },
  { id: 'waiting-return', label: 'รอรับเอกสารจริงคืน', icon: <RotateCcw size={14} />, desc: 'Awaiting Physical Return' },
  { id: 'outgoing', label: 'เอกสารส่งออก', icon: <Send size={14} />, desc: 'รอนำส่ง / รออัปเดต Delivered' },
]

interface Props {
  onNavigate: (screen: Screen, docId?: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

function formatSafeDate(dateStr?: string): string {
  if (!dateStr || dateStr === '-' || dateStr === '—') return '—'
  if (dateStr.includes('/')) return dateStr
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  } catch {}
  return dateStr.replace('2568-', '').replace('2569-', '').split('-').join('/')
}

function getFirstTabWithTasks(tasks: Task[]): TabId {
  return TABS.find(tab => tasks.some(task => task.group === tab.id))?.id ?? 'waiting-accept'
}

export default function TaskInboxPage({ onNavigate, showToast }: Props) {
  // Do not select a fixed empty tab while the API data is loading. A user click
  // is retained, but an empty/removed tab falls back to the first tab with work.
  const [activeTab, setActiveTab] = useState<TabId | null>(null)
  const [confirmTask, setConfirmTask] = useState<Task | null>(null)
  const [confirmType, setConfirmType] = useState<'accept' | 'done' | 'forward'>('accept')
  const [tasks, setTasks] = useState<Task[]>([])
  const [liveDocs, setLiveDocs] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadTasks = async () => {
    setIsLoading(true)
    const user = getCurrentUser()

    try {
      const [docs, departments] = await Promise.all([
        docsApi.getDocuments(),
        masterApi.getDepartments().catch(() => []),
      ])
      setLiveDocs(docs || [])

      // Task Inbox must use the assignment branch, not MAIN_DOC's one legacy
      // responsible department. This includes delegated children and parallel
      // department branches while keeping owner-first department authorization.
      const actionableEntries = getActionableTaskEntries(docs || [], user, departments || [])
      const mapped: Task[] = actionableEntries.map(({ document, assignment, status }) => {
        let group: TabId = 'waiting-accept'
        let taskType: Task['taskType'] = 'accept'

        if (document.docDirection === 'outgoing') {
          group = 'outgoing'
          taskType = 'review'
        } else if (assignment?.assigneeType === 'department' && (status === 'pending' || status === 'pending-acceptance')) {
          // Department work belongs to its configured head, who must delegate
          // it to one or more team members rather than accept it as personal work.
          group = 'waiting-forward'
          taskType = 'forward'
        } else if (document.status === 'awaiting-physical-return') {
          group = 'waiting-return'
          taskType = 'return'
        } else if (status === 'in-progress' || status === 'inprogress' || status === 'accepted') {
          group = 'in-progress'
          taskType = 'close'
        }

        return {
          id: `task-${document.id}-${assignment?.id || 'outgoing'}`,
          docId: document.id,
          assignmentId: assignment?.id,
          docNumber: document.docNumber || document.id,
          subject: document.subject || 'เอกสารไม่มีชื่อเรื่อง',
          urgency: (document.urgency as UrgencyLevel) || 'normal',
          group,
          taskType,
          deadline: document.deadline || '—',
          deadlineFlag: document.deadlineFlag || 'on-track',
          senderName: document.sender || document.receiver || 'สำนักงาน',
          receivedAt: document.receivedAt || '—',
          description: document.description || document.subject || '',
        }
      })
      setTasks(mapped)
      setActiveTab(currentTab =>
        currentTab && mapped.some(task => task.group === currentTab)
          ? currentTab
          : getFirstTabWithTasks(mapped),
      )
    } catch {
      showToast('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const selectedTab = activeTab ?? getFirstTabWithTasks(tasks)
  const tabTasks = tasks.filter(t => t.group === selectedTab)

  const counts: Record<TabId, number> = {
    'waiting-accept': tasks.filter(t => t.group === 'waiting-accept').length,
    'in-progress': tasks.filter(t => t.group === 'in-progress').length,
    'waiting-forward': tasks.filter(t => t.group === 'waiting-forward').length,
    'waiting-return': tasks.filter(t => t.group === 'waiting-return').length,
    outgoing: tasks.filter(t => t.group === 'outgoing').length,
  }

  const handleAction = (task: Task, type: 'accept' | 'done' | 'forward') => {
    setConfirmTask(task)
    setConfirmType(type)
  }

  const handleConfirm = async () => {
    if (!confirmTask) return
    const docId = confirmTask.docId
    const docNum = confirmTask.docNumber

    try {
      if (confirmType === 'accept') {
        if (!confirmTask.assignmentId) throw new Error('ไม่พบ assignment สำหรับรับงาน')
        await docsApi.accept(docId, confirmTask.assignmentId, 'รับงานเรียบร้อย')
        showToast(`รับงาน ${docNum} สำเร็จ · สถานะอัปเดตแล้ว`, 'success')
      } else if (confirmType === 'done') {
        if (confirmTask.group === 'outgoing') {
          await docsApi.deliver(docId, { deliveredToPerson: 'ผู้รับเอกสารปลายทาง', remarks: 'นำส่งสำเร็จ' })
          showToast(`อัปเดตสถานะนำส่งสำเร็จ (Delivered) ${docNum} แล้ว`, 'success')
        } else {
          if (!confirmTask.assignmentId) throw new Error('ไม่พบ assignment สำหรับปิดงาน')
          await docsApi.complete(docId, confirmTask.assignmentId, 'ดำเนินการเสร็จสมบูรณ์')
          showToast(`ดำเนินการเอกสาร ${docNum} เสร็จสิ้นแล้ว`, 'success')
        }
      } else if (confirmType === 'forward') {
        onNavigate('document-detail', docId)
        return
      }
    } catch (err: any) {
      showToast(`ดำเนินการ: ${err?.message || 'สำเร็จ'}`, 'info')
    } finally {
      setConfirmTask(null)
      await loadTasks()
    }
  }

  // เรียงลำดับ: overdue -> very-urgent -> urgent -> normal
  const urgencyOrder: Record<UrgencyLevel, number> = {
    'very-urgent': 1,
    urgent: 2,
    normal: 3,
  }

  const sortedTasks = [...tabTasks].sort((a, b) => {
    if (a.deadlineFlag === 'overdue' && b.deadlineFlag !== 'overdue') return -1
    if (b.deadlineFlag === 'overdue' && a.deadlineFlag !== 'overdue') return 1
    return (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3)
  })

  return (
    <div>
      <PageHeader
        title="Task Inbox (งานที่ต้องดำเนินการของฉัน)"
        subtitle="แสดงเฉพาะเอกสารที่ได้รับมอบหมายหรือเกี่ยวข้องกับบทบาทของท่าน"
        actions={
          <button
            onClick={loadTasks}
            disabled={isLoading}
            className="btn-outline text-xs gap-1.5 shadow-sm bg-white"
            title="รีเฟรชข้อมูลจาก Database"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-[#DEE2E6] pb-3">
        {TABS.map(tab => {
          const count = counts[tab.id]
          const isActive = selectedTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#012169] text-white shadow-sm'
                  : 'bg-white text-[#495057] border border-[#DEE2E6] hover:bg-[#F8F9FA]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-[#FFCD00] text-[#012169]'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Task list */}
      {sortedTasks.length === 0 ? (
        <div className="card p-12 text-center">
          <EmptyState
            title="ไม่มีงานที่ต้องดำเนินการในกลุ่มนี้"
            description="เอกสารที่ได้รับมอบหมายตรงกับท่านหรือฝ่ายของท่านจะปรากฏที่นี่"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map(task => {
            const isOverdue = task.deadlineFlag === 'overdue'

            return (
              <div
                key={task.id}
                className={`card p-4 transition-all hover:shadow-md border-l-4 ${
                  isOverdue
                    ? 'border-l-[#DC3545]'
                    : task.urgency === 'very-urgent'
                    ? 'border-l-[#FD7E14]'
                    : 'border-l-[#012169]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Task details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-[#012169] bg-blue-50 px-2 py-0.5 rounded">
                        {task.docNumber}
                      </span>
                      <UrgencyBadge urgency={task.urgency} />
                      {task.deadlineFlag && <DeadlineFlagBadge flag={task.deadlineFlag} />}
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#721C24] bg-[#F8F9FA] px-2 py-0.5 rounded-full border border-red-200">
                          <AlertTriangle size={10} className="text-[#DC3545]" />
                          เกินกำหนด
                        </span>
                      )}
                      {task.group === 'in-progress' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#155724] bg-[#D4EDDA] px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} />
                          กำลังดำเนินการ
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onNavigate('document-detail', task.docId)}
                      className="text-sm font-bold text-[#212529] hover:text-[#012169] cursor-pointer transition-colors leading-snug mb-1"
                    >
                      {task.subject}
                    </h3>
                    <p className="text-xs text-[#6C757D] line-clamp-2 leading-relaxed mb-3">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#6C757D]">
                      <span>ต้นทาง: <strong className="text-[#212529]">{task.senderName}</strong></span>
                      <span>รับเมื่อ: <strong className="text-[#212529]">{formatSafeDate(task.receivedAt)}</strong></span>
                      <span>
                        กำหนดส่ง:{' '}
                        <strong className={isOverdue ? 'text-[#DC3545] font-bold' : 'text-[#212529]'}>
                          {formatSafeDate(task.deadline)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 flex-shrink-0 self-end sm:self-start">
                    {selectedTab === 'waiting-accept' && (
                      <button
                        onClick={() => handleAction(task, 'accept')}
                        className="btn-primary text-xs py-1.5 px-3 shadow-sm"
                      >
                        รับงาน
                      </button>
                    )}
                    {selectedTab === 'in-progress' && (
                      <button
                        onClick={() => handleAction(task, 'done')}
                        className="btn-success text-xs py-1.5 px-3 shadow-sm"
                      >
                        ดำเนินการเสร็จสิ้น
                      </button>
                    )}
                    {selectedTab === 'waiting-forward' && (
                      <button
                        onClick={() => onNavigate('document-detail', task.docId)}
                        className="btn-secondary text-xs py-1.5 px-3 shadow-sm"
                      >
                        ส่งต่อเอกสาร
                      </button>
                    )}
                    {selectedTab === 'waiting-return' && (
                      <button
                        onClick={() => onNavigate('document-detail', task.docId)}
                        className="btn-secondary text-xs py-1.5 px-3 shadow-sm"
                      >
                        ยืนยันรับเอกสารคืน
                      </button>
                    )}
                    {selectedTab === 'outgoing' && (
                      <button
                        onClick={() => handleAction(task, 'done')}
                        className="btn-primary text-xs py-1.5 px-3 shadow-sm"
                      >
                        อัปเดตส่งสำเร็จ
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate('document-detail', task.docId)}
                      className="btn-outline text-xs py-1.5 px-2.5 text-[#6C757D] shadow-sm hover:text-[#012169]"
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmTask && (
        <Modal
          isOpen={!!confirmTask}
          onClose={() => setConfirmTask(null)}
          title={
            confirmType === 'accept'
              ? 'ยืนยันการรับงาน'
              : confirmType === 'done'
              ? 'ยืนยันปิดงาน / นำส่งสำเร็จ'
              : 'ยืนยันส่งต่อเอกสาร'
          }
          onConfirm={handleConfirm}
          confirmLabel="ยืนยัน"
          size="sm"
        >
          <div className="py-2 space-y-2 text-xs text-[#495057]">
            <p>
              ท่านกำลังจะดำเนินการกับเอกสารเลขที่ <strong className="text-[#012169]">{confirmTask.docNumber}</strong>
            </p>
            <p className="font-semibold text-[#212529]">{confirmTask.subject}</p>
            <p className="text-[11px] text-[#6C757D]">
              {confirmType === 'accept'
                ? 'สถานะเอกสารจะเปลี่ยนเป็น "In Progress" และบันทึกเข้าสู่ระบบ'
                : confirmType === 'done'
                ? 'สถานะเอกสารจะเปลี่ยนเป็น "Completed" / "Delivered" และบันทึกประวัติการปิดงาน'
                : 'ระบบจะนำท่านไปยังหน้ารายละเอียดเพื่อเลือกผู้รับส่งต่อ'}
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}

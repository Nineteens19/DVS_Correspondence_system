import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Inbox, Send, FileText, CheckSquare,
  BarChart2, Users, Settings, Bell, Search, LogOut,
  ChevronDown, ChevronRight, Plus, X, AlertCircle, Clock, CheckCircle
} from 'lucide-react'
import { docsApi, masterApi } from '../services/api'
import { getActionableTaskEntries } from '../utils/actionableAssignments'
import type { Screen } from '../types'

interface NavEntryBase {
  id: Screen
  label: string
  icon: React.ReactNode
  badge?: number
}

interface NavEntryDivider {
  type: 'divider'
  label: string
}

interface NavEntryGroup {
  id: Screen
  label: string
  icon: React.ReactNode
  children: { id: Screen; label: string }[]
}

type NavEntry = NavEntryBase | NavEntryDivider | NavEntryGroup

interface SidebarProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
  taskCount?: number
}

export function Sidebar({ currentScreen, onNavigate, taskCount = 0 }: SidebarProps) {
  const [expandedGroup, setExpandedGroup] = useState<Screen | null>(
    currentScreen === 'register-incoming' ? 'register-incoming' :
      currentScreen === 'register-outgoing' ? 'register-outgoing' : null
  )

  const toggleGroup = (id: Screen) => {
    setExpandedGroup(prev => (prev === id ? null : id))
  }

  const navItems: NavEntry[] = [
    { id: 'dashboard', label: 'ภาพรวม', icon: <LayoutDashboard size={17} /> },
    {
      id: 'register-incoming',
      label: 'เอกสารรับเข้า',
      icon: <Inbox size={17} />,
      children: [
        { id: 'register-incoming', label: 'ลงทะเบียนรับเข้า' },
        { id: 'document-list-incoming', label: 'รายการรับเข้า' },
      ],
    },
    {
      id: 'register-outgoing',
      label: 'เอกสารส่งออก',
      icon: <Send size={17} />,
      children: [
        { id: 'register-outgoing', label: 'ลงทะเบียนส่งออก' },
        { id: 'document-list-outgoing', label: 'รายการส่งออก' },
      ],
    },
    { id: 'task-inbox', label: 'กล่องงาน', icon: <CheckSquare size={17} />, badge: taskCount > 0 ? taskCount : undefined },
    { id: 'reports', label: 'รายงาน', icon: <BarChart2 size={17} /> },
    { id: 'admin', label: 'จัดการผู้ใช้ & Monitor', icon: <Users size={17} /> },
  ]

  return (
    <aside className="sidebar">
      {/* Logo block */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/เทเวศประกันภัย.png"
            alt="Deves Insurance"
            className="w-12 h-10 rounded-md bg-white object-contain flex-shrink-0 shadow-sm"
          />
          <div className="sidebar-label min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">e-Document Tracking</p>
            <p className="text-white/70 text-[11px] leading-tight mt-0.5 truncate">บมจ. เทเวศประกันภัย</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        {navItems.map((item, idx) => {
          if ('type' in item) {
            return (
              <div key={idx} className="px-3 pt-4 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 sidebar-label">
                  {item.label}
                </p>
              </div>
            )
          }

          const hasChildren = 'children' in item && item.children
          const isActive = currentScreen === item.id || (hasChildren && item.children.some(c => c.id === currentScreen))
          const isExpanded = expandedGroup === item.id

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleGroup(item.id)
                  } else {
                    onNavigate(item.id)
                  }
                }}
                className={`nav-item w-full text-left justify-between ${isActive && !hasChildren ? 'active' : ''}`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="nav-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </span>
                <span className="flex items-center gap-1.5 sidebar-label">
                  {'badge' in item && item.badge ? (
                    <span className="flex items-center justify-center px-1.5 min-w-[20px] h-5 rounded-full bg-[#DC3545] text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                  {hasChildren && (
                    isExpanded
                      ? <ChevronDown size={13} className="opacity-70" />
                      : <ChevronRight size={13} className="opacity-70" />
                  )}
                </span>
              </button>

              {hasChildren && isExpanded && (
                <div className="mt-1 space-y-0.5 pl-2">
                  <button
                    onClick={() => onNavigate(item.children[0].id)}
                    className={`nav-item nav-sub w-full text-left ${currentScreen === item.children[0].id ? 'active' : ''}`}
                  >
                    <Plus size={13} className="opacity-70" />
                    <span className="sidebar-label">{item.children[0].label}</span>
                  </button>
                  <button
                    onClick={() => onNavigate(item.children[1].id)}
                    className={`nav-item nav-sub w-full text-left ${currentScreen === item.children[1].id ? 'active' : ''}`}
                  >
                    <FileText size={13} className="opacity-70" />
                    <span className="sidebar-label">{item.children[1].label}</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom user area */}
      <div className="px-3 py-3 border-t border-white/10">
        <button onClick={() => onNavigate('admin')} className="nav-item w-full">
          <Settings size={16} />
          <span className="sidebar-label">ตั้งค่าระบบ</span>
        </button>
      </div>
    </aside>
  )
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<Screen, string> = {
  login: 'เข้าสู่ระบบ',
  dashboard: 'ภาพรวม',
  'document-list-incoming': 'รายการเอกสารรับเข้า',
  'document-list-outgoing': 'รายการเอกสารส่งออก',
  'document-detail': 'รายละเอียดเอกสาร',
  'task-inbox': 'กล่องงาน',
  'register-incoming': 'ลงทะเบียนเอกสารรับเข้า',
  'register-outgoing': 'ลงทะเบียนเอกสารส่งออก',
  admin: 'จัดการผู้ใช้ & Monitor',
  reports: 'รายงาน',
}

interface TopBarProps {
  currentScreen: Screen
  onNavigate: (screen: Screen, docId?: string) => void
  onLogout: () => void
  notifications?: any[]
}

export function TopBar({ currentScreen, onNavigate, onLogout, notifications = [] }: TopBarProps) {
  const [showNotif, setShowNotif] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const unreadCount = notifications.length

  return (
    <header className="bg-white border-b border-[#DEE2E6] h-[60px] flex items-center px-6 gap-4 flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[#6C757D] font-medium cursor-pointer hover:text-[#012169]" onClick={() => onNavigate('dashboard')}>
          e-Document Tracking
        </span>
        <span className="text-[#6C757D] text-xs">&gt;</span>
        <span className="text-[#012169] font-bold">
          {PAGE_TITLES[currentScreen]}
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs ml-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่เอกสาร หัวข้อ..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg focus:outline-none focus:border-[#012169] focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotif(v => !v)}
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#012169] transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#DC3545] rounded-full text-[9px] text-white font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotif && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
            <div className="absolute right-0 top-11 z-40 w-80 bg-white rounded-xl shadow-lg border border-[#DEE2E6] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#DEE2E6] bg-[#F8F9FA]">
                <p className="text-sm font-bold text-[#212529]">การแจ้งเตือนงาน ({unreadCount})</p>
                <button onClick={() => setShowNotif(false)} className="text-[#6C757D] hover:text-[#212529]">
                  <X size={15} />
                </button>
              </div>
              <div className="divide-y divide-[#DEE2E6] max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6C757D]">
                    <CheckCircle size={20} className="mx-auto mb-1 text-emerald-600" />
                    ไม่มีงานค้างที่ต้องดำเนินการ
                  </div>
                ) : (
                  notifications.map((n, idx) => (
                    <div
                      key={n.id || idx}
                      className="px-4 py-3 cursor-pointer hover:bg-[#F8F9FA] transition-colors bg-[#FFF3CD]/20"
                      onClick={() => {
                        if (n.docId) {
                          onNavigate('document-detail', n.docId)
                        } else {
                          onNavigate('task-inbox')
                        }
                        setShowNotif(false)
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.type === 'urgent' || n.type === 'overdue' ? 'bg-[#DC3545]'
                            : n.type === 'due-soon' ? 'bg-[#FD7E14]'
                              : 'bg-[#012169]'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#212529] leading-relaxed truncate">{n.message}</p>
                          <p className="text-[11px] text-[#6C757D] mt-0.5">{n.time || 'รอการดำเนินการ'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-[#DEE2E6] text-center bg-[#F8F9FA]">
                <button
                  onClick={() => { onNavigate('task-inbox'); setShowNotif(false) }}
                  className="text-xs text-[#012169] font-bold hover:underline"
                >
                  เปิดดูกล่องงานทั้งหมด
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User avatar */}
      {(() => {
        let user: any = null
        try {
          const raw = localStorage.getItem('dvs_user')
          if (raw) user = JSON.parse(raw)
        } catch {}

        const displayName = user?.displayName || user?.name || 'ผู้ใช้งานระบบ'
        const deptName = user?.departmentName || 'เทเวศประกันภัย'
        const initials = displayName.length > 2 ? displayName.substring(0, 2) : 'DVS'

        return (
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#DEE2E6]">
            <div className="w-8 h-8 rounded-full bg-[#012169] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-[#212529] leading-tight">{displayName}</p>
              <p className="text-[11px] text-[#6C757D] leading-tight">{deptName}</p>
            </div>
            <button
              onClick={onLogout}
              className="ml-1 w-8 h-8 rounded-lg flex items-center justify-center text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#DC3545] transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut size={15} />
            </button>
          </div>
        )
      })()}
    </header>
  )
}

// ─── App Shell ────────────────────────────────────────────────────────────────

interface AppShellProps {
  currentScreen: Screen
  onNavigate: (screen: Screen, docId?: string) => void
  onLogout: () => void
  children: React.ReactNode
}

export function AppShell({ currentScreen, onNavigate, onLogout, children }: AppShellProps) {
  const [taskCount, setTaskCount] = useState<number>(0)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    // Fetch live documents to compute accurate task count for current user
    let user: any = null
    try {
      const raw = localStorage.getItem('dvs_user')
      if (raw) user = JSON.parse(raw)
    } catch {}

    Promise.all([
      docsApi.getDocuments(),
      masterApi.getDepartments().catch(() => []),
    ]).then(([docs, departments]) => {
      const actionableEntries = getActionableTaskEntries(docs || [], user, departments || [])
      const activeEntries = actionableEntries.filter(({ document, status }) =>
        document.status !== 'completed' && document.status !== 'cancelled' &&
        status !== 'success' && status !== 'cancelled',
      )

      setTaskCount(activeEntries.filter(({ status, document }) =>
        status === 'pending' || status === 'pending-acceptance' || document.status === 'ready-to-send',
      ).length)

      setNotifications(activeEntries
        .slice(0, 8)
        .map(({ document, assignment }, index) => ({
          id: assignment?.id || `${document.id}-${index}`,
          docId: document.id,
          message: `${document.docNumber || document.id}: ${document.subject || 'เอกสารรอดำเนินการ'}`,
          time: document.deadline ? `กำหนดส่ง: ${document.deadline}` : 'รอดำเนินการ',
          type: document.deadlineFlag === 'overdue' ? 'overdue' : document.urgency === 'very-urgent' ? 'urgent' : 'due-soon',
        })))
    }).catch(() => {
      setTaskCount(0)
      setNotifications([])
    })
  }, [currentScreen])

  return (
    <div className="app-shell">
      <Sidebar currentScreen={currentScreen} onNavigate={onNavigate} taskCount={taskCount} />
      <div className="main-area">
        <TopBar currentScreen={currentScreen} onNavigate={onNavigate} onLogout={onLogout} notifications={notifications} />
        <div className="content-area">{children}</div>
      </div>
    </div>
  )
}

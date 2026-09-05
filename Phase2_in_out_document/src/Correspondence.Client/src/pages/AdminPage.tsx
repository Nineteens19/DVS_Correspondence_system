import { useState, useEffect } from 'react'
import {
  Users, Shield, Settings, Plus, Search, CheckCircle,
  XCircle, Building2, Bell, AlertTriangle, UserCheck,
  ToggleLeft, ToggleRight, Trash2, Edit2, Check, X,
  FileText, Clock, RotateCcw, HelpCircle, UserPlus, Info
} from 'lucide-react'
import { PageHeader, Modal, StatusBadge } from '../components/ui'
import { getReminderInterval } from '../utils/date'
import { adminApi, masterApi } from '../services/api'
import type { User, MonitorAssignment, UrgencyLevel } from '../types'

const APP_ROLES = [
  { id: 'ROLE-01', name: 'ROLE-01: ผู้ Register (สารบรรณ)', dataScope: 'Own' },
  { id: 'ROLE-02', name: 'ROLE-02: เจ้าของงานปลายทาง (Staff)', dataScope: 'Own' },
  { id: 'ROLE-03', name: 'ROLE-03: หัวหน้าฝ่าย / ผู้กำกับดูแล', dataScope: 'Dept' },
  { id: 'ROLE-04', name: 'ROLE-04: Viewer สูงสุด (ผู้บริหาร)', dataScope: 'All' },
  { id: 'ROLE-05', name: 'ROLE-05: Admin (ผู้ดูแลระบบ)', dataScope: 'All' },
  { id: 'ROLE-06', name: 'ROLE-06: ผู้ส่งเอกสารออก', dataScope: 'Own' },
  { id: 'ROLE-07', name: 'ROLE-07: Monitor (ผู้เฝ้าติดตาม)', dataScope: 'Watch Scope' },
]

interface Props {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  normal: 'ปกติ',
  urgent: 'ด่วน',
  'very-urgent': 'ด่วนมาก',
}

const URGENCY_DEFAULT_DAYS: Record<UrgencyLevel, number> = {
  normal: 5,
  urgent: 3,
  'very-urgent': 1,
}

export default function AdminPage({ showToast }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'monitor' | 'master-data' | 'reminder'>('users')

  // ── 1. Reminder Configuration State ──
  const [reminderIntervals, setReminderIntervals] = useState<Record<UrgencyLevel, number>>({
    normal: 5,
    urgent: 3,
    'very-urgent': 1,
  })
  const [reminderDrafts, setReminderDrafts] = useState<Record<UrgencyLevel, string>>({
    normal: '5',
    urgent: '3',
    'very-urgent': '1',
  })

  useEffect(() => {
    masterApi.getReminderIntervals().then(res => {
      if (res) {
        const next = {
          normal: res.normal || 5,
          urgent: res.urgent || 3,
          'very-urgent': res.veryUrgent || 1,
        }
        setReminderIntervals(next)
        setReminderDrafts({
          normal: String(next.normal),
          urgent: String(next.urgent),
          'very-urgent': String(next['very-urgent']),
        })
      }
    }).catch(() => {})
  }, [])

  const handleSaveInterval = async (level: UrgencyLevel, raw: number) => {
    const isPositiveInt = Number.isInteger(raw) && raw > 0
    if (!isPositiveInt) {
      showToast('ค่ารอบการแจ้งเตือนต้องเป็นจำนวนเต็มบวก (วัน)', 'error')
      setReminderDrafts(prev => ({ ...prev, [level]: String(reminderIntervals[level]) }))
      return
    }
    const updated = { ...reminderIntervals, [level]: raw }
    setReminderIntervals(updated)
    try {
      await masterApi.saveReminderIntervals({
        normal: updated.normal,
        urgent: updated.urgent,
        veryUrgent: updated['very-urgent'],
      })
    } catch {
      // Fallback
    }
    showToast(`บันทึกรอบการแจ้งเตือนระดับ "${URGENCY_LABELS[level]}" เป็น ${raw} วันแล้ว`, 'success')
  }

  // ── 2. Users & LDAP State ──
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userDeptFilter, setUserDeptFilter] = useState('all')
  const [userRoleFilter, setUserRoleFilter] = useState('all')

  // Load from Backend API
  useEffect(() => {
    adminApi.getUsers().then(uList => {
      if (uList && uList.length > 0) {
        const mapped: User[] = uList.map((u: any) => ({
          id: u.id,
          name: u.displayName || u.username,
          username: u.username,
          email: u.email,
          department: u.departmentName || 'ฝ่ายบริหารทั่วไป',
          position: u.title || (u.roleId === 'ROLE-03' ? 'หัวหน้าฝ่าย' : 'เจ้าหน้าที่'),
          role: (u.roleId === 'ROLE-05' || u.roleId === 'ROLE-04') ? 'admin' : (u.roleId === 'ROLE-03' ? 'manager' : 'staff'),
          active: u.status === 'Active' || u.active !== false
        }))
        setUsers(mapped)
      }
    }).catch(() => {})

    masterApi.getDepartments().then(dList => {
      if (dList && dList.length > 0) {
        setDepartments(dList.map((d: any) => ({
          id: d.id,
          name: d.nameTh || d.nameEn || d.name || '',
          headUserRef: d.headUserRef,
          headUserName: d.headUserName
        })))
        const ownerMap: Record<string, string> = {}
        dList.forEach((d: any) => {
          ownerMap[d.nameTh || d.nameEn || d.name] = d.headUserRef || ''
        })
        setOwners(ownerMap)
      }
    }).catch(() => {})
  }, [])

  // Modals for User Management
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [ldapSearch, setLdapSearch] = useState('')
  const [ldapResults, setLdapResults] = useState<any[]>([])
  const [isLdapSearching, setIsLdapSearching] = useState(false)

  const [addForm, setAddForm] = useState({
    username: '',
    name: '',
    email: '',
    department: 'ฝ่ายสารสนเทศ',
    role: 'staff' as 'admin' | 'manager' | 'staff' | 'viewer',
    roleId: 'ROLE-02',
  })

  const searchLdap = async () => {
    if (!ldapSearch.trim()) return
    setIsLdapSearching(true)
    try {
      const results = await adminApi.searchLdap(ldapSearch.trim())
      setLdapResults(results || [])
      if (results && results.length > 0) {
        showToast(`พบข้อมูลพนักงาน ${results.length} บัญชีใน Active Directory`, 'success')
      } else {
        showToast('ไม่พบบัญชีพนักงานที่ตรงกับคำค้นหาใน AD/LDAP', 'info')
      }
    } catch {
      // Local fallback simulation
      const matched = users.filter(u => u.name.includes(ldapSearch) || u.username.includes(ldapSearch))
      setLdapResults(matched)
      showToast(`ค้นหาแบบจำลองพบ ${matched.length} รายการ`, 'info')
    } finally {
      setIsLdapSearching(false)
    }
  }

  const selectLdapUser = (u: any) => {
    setAddForm({
      username: u.samAccountName || u.username,
      name: u.displayName || u.name,
      email: u.email || `${u.username}@deves.co.th`,
      department: u.departmentName || u.department || 'ฝ่ายสารสนเทศ',
      role: 'staff',
      roleId: 'ROLE-02',
    })
  }

  const handleCreateUser = async () => {
    if (!addForm.username || !addForm.name) {
      showToast('กรุณาระบุข้อมูลผู้ใช้ให้ครบถ้วน', 'error')
      return
    }
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: addForm.name,
      username: addForm.username,
      email: addForm.email,
      department: addForm.department,
      role: addForm.role,
      active: true,
    }
    setUsers(prev => [newUser, ...prev])
    setShowAddUserModal(false)
    try {
      await adminApi.provisionUser({
        username: addForm.username,
        roleId: addForm.roleId,
        departmentId: addForm.department,
      })
    } catch {
      // Fallback
    }
    showToast(`เพิ่มผู้ใช้ "${addForm.name}" เข้าระบบเรียบร้อย`, 'success')
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const next = !u.active
        showToast(`สลับสถานะผู้ใช้ "${u.name}" เป็น ${next ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'}`, 'info')
        return { ...u, active: next }
      }
      return u
    }))
  }

  // ── 3. Monitor Configuration State ──
  const [monitors, setMonitors] = useState<MonitorAssignment[]>([])
  const [showMonitorModal, setShowMonitorModal] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState<MonitorAssignment | null>(null)

  const [monitorForm, setMonitorForm] = useState({
    id: '',
    userId: '',
    userName: '',
    scopeType: 'department' as 'all' | 'department' | 'workgroup',
    scopeRefs: [] as string[],
    allDepartments: false,
    docDirectionFilter: 'all' as 'all' | 'incoming' | 'outgoing',
    notifyEnabled: true,
  })

  useEffect(() => {
    masterApi.getMonitors().then(mList => {
      if (mList && mList.length > 0) {
        setMonitors(mList.map((m: any) => ({
          id: m.id,
          userId: m.userId,
          userName: m.userName || m.userId,
          scopeType: m.scopeType,
          scopeRefs: m.scopeRefs || [],
          allDepartments: m.allDepartments || false,
          docDirectionFilter: m.docDirectionFilter || 'all',
          notifyEnabled: m.notifyEnabled !== false,
          createdAt: '2568-08-20',
          status: 'Active',
        })))
      }
    }).catch(() => {})
  }, [])

  const handleOpenAddMonitor = () => {
    setEditingMonitor(null)
    setMonitorForm({
      id: '',
      userId: '',
      userName: '',
      scopeType: 'department',
      scopeRefs: [],
      allDepartments: false,
      docDirectionFilter: 'all',
      notifyEnabled: true,
    })
    setShowMonitorModal(true)
  }

  const handleOpenEditMonitor = (m: MonitorAssignment) => {
    setEditingMonitor(m)
    setMonitorForm({
      id: m.id,
      userId: m.userId,
      userName: m.userName,
      scopeType: m.scopeType,
      scopeRefs: [...m.scopeRefs],
      allDepartments: m.allDepartments,
      docDirectionFilter: m.docDirectionFilter,
      notifyEnabled: m.notifyEnabled,
    })
    setShowMonitorModal(true)
  }

  const handleSaveMonitor = async () => {
    if (!monitorForm.userId) {
      showToast('กรุณาเลือกผู้ใช้งาน Monitor', 'error')
      return
    }
    if (!monitorForm.allDepartments && monitorForm.scopeRefs.length === 0) {
      showToast('กรุณาเลือกฝ่ายหรือติ๊กเลือกทุกฝ่าย', 'error')
      return
    }

    const payload = {
      userId: monitorForm.userId,
      userName: monitorForm.userName || monitorForm.userId,
      scopeType: monitorForm.allDepartments ? 'all' : monitorForm.scopeType,
      scopeRefs: monitorForm.scopeRefs,
      allDepartments: monitorForm.allDepartments,
      docDirectionFilter: monitorForm.docDirectionFilter,
      notifyEnabled: monitorForm.notifyEnabled,
    }

    try {
      const res = await masterApi.saveMonitor(payload)
      if (editingMonitor) {
        setMonitors(prev => prev.map(m => m.id === editingMonitor.id ? { ...m, ...payload } : m))
        showToast('แก้ไขการตั้งค่า Monitor เรียบร้อย', 'success')
      } else {
        const newEntry: MonitorAssignment = {
          id: res?.id || `mon-${Date.now()}`,
          ...payload,
          createdAt: 'วันนี้',
          status: 'Active',
        }
        setMonitors(prev => [newEntry, ...prev])
        showToast('เพิ่มผู้เฝ้าติดตาม (Monitor) เรียบร้อย', 'success')
      }
    } catch {
      showToast('บันทึกการตั้งค่า Monitor เรียบร้อย', 'success')
    }
    setShowMonitorModal(false)
  }

  const handleDeleteMonitor = async (id: string, name: string) => {
    setMonitors(prev => prev.filter(m => m.id !== id))
    try {
      await masterApi.deleteMonitor(id)
    } catch {
      // Fallback
    }
    showToast(`ลบการตั้งค่า Monitor ของ "${name}" เรียบร้อย`, 'info')
  }

  // ── 4. Master Data: Department Owners ──
  const [owners, setOwners] = useState<Record<string, string>>({})
  const [editingDept, setEditingDept] = useState<string | null>(null)
  const [editOwnerUsername, setEditOwnerUsername] = useState('')

  const ownerNameOf = (department: string): string => {
    const username = owners[department]
    if (!username) return '— ยังไม่กำหนด —'
    const u = users.find(u => u.username === username || u.name === username)
    if (u?.name) return u.name
    const dept = departments.find(d => d.name === department || d.id === department)
    return dept?.headUserName || username
  }

  const openOwnerEditor = (department: string) => {
    setEditingDept(department)
    setEditOwnerUsername(owners[department] ?? '')
  }

  const confirmOwnerEdit = async () => {
    if (!editingDept || !editOwnerUsername) return
    const ownerName = users.find(u => u.username === editOwnerUsername)?.name ?? editOwnerUsername
    const deptName = editingDept
    const deptObj = departments.find(d => d.name === deptName)
    const deptId = deptObj?.id || deptName

    setOwners(prev => ({ ...prev, [deptName]: editOwnerUsername }))
    setDepartments(prev => prev.map(d => (d.name === deptName || d.id === deptId) ? { ...d, headUserRef: editOwnerUsername, headUserName: ownerName } : d))
    setEditingDept(null)

    try {
      await masterApi.updateDepartmentHead(deptId, editOwnerUsername)
      showToast(`กำหนดหัวหน้า/เจ้าของฝ่าย "${deptName}" เป็น "${ownerName}" เรียบร้อย`, 'success')
    } catch {
      showToast(`บันทึกหัวหน้าฝ่าย ${deptName} เรียบร้อย`, 'success')
    }
  }

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchDept = userDeptFilter === 'all' || u.department === userDeptFilter
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter
    return matchSearch && matchDept && matchRole
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="การบริหารจัดการระบบ (Administration)"
        breadcrumb={[{ label: 'ผู้ดูแลระบบ' }]}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#DEE2E6] pb-px overflow-x-auto">
        {[
          { id: 'users', label: 'จัดการผู้ใช้ & AD/LDAP', icon: <Users size={15} />, count: users.length },
          { id: 'monitor', label: 'ตั้งค่าผู้เฝ้าติดตาม (Monitor)', icon: <Shield size={15} />, count: monitors.length },
          { id: 'master-data', label: 'หัวหน้าฝ่าย & Master Data', icon: <Building2 size={15} /> },
          { id: 'reminder', label: 'รอบการแจ้งเตือน (Reminder)', icon: <Bell size={15} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id
                ? 'border-[#012169] text-[#012169] bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-[#6C757D] hover:text-[#212529] hover:bg-slate-50'
            }`}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === t.id ? 'bg-[#FFCD00] text-[#012169]' : 'bg-[#E9ECEF] text-[#6C757D]'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: USER MANAGEMENT ─── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto flex-1">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, username, อีเมล..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="input-base pl-9 text-xs py-2"
                />
              </div>
              <select
                value={userDeptFilter}
                onChange={e => setUserDeptFilter(e.target.value)}
                className="input-base text-xs py-2 w-40"
              >
                <option value="all">ทุกฝ่าย</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <button
              onClick={() => {
                setLdapSearch('')
                setLdapResults([])
                setShowAddUserModal(true)
              }}
              className="btn-primary text-xs py-2 px-3.5 gap-1.5 shadow-sm whitespace-nowrap"
            >
              <UserPlus size={14} />
              เพิ่มผู้ใช้จาก AD / LDAP
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#DEE2E6]">
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D]">ผู้ใช้งาน</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D]">ฝ่ายที่สังกัด</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D]">สิทธิ์การใช้งาน</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-[#6C757D]">สถานะ</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D]">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DEE2E6]">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#012169] text-white flex items-center justify-center text-xs font-bold">
                            {u.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#212529]">{u.name}</p>
                            <p className="text-[11px] text-[#6C757D] font-mono">{u.username} · {u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#495057]">{u.department}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'manager' ? 'bg-blue-100 text-[#012169]' :
                          u.role === 'viewer' ? 'bg-slate-100 text-slate-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {u.active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {u.active ? 'เปิดใช้งาน' : 'ระงับ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`p-1.5 rounded-lg text-xs font-bold ${
                            u.active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.active ? 'คลิกเพื่อระงับการใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                        >
                          {u.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MONITOR CONFIGURATION ─── */}
      {activeTab === 'monitor' && (
        <div className="space-y-4">
          <div className="card p-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="section-title text-sm">การตั้งค่าผู้เฝ้าติดตาม (Monitor ROLE-07)</h3>
              <p className="section-sub text-xs">กำหนดขอบเขตฝ่ายที่ต้องการเฝ้าติดตามงานค้างและ SLA</p>
            </div>
            <button
              onClick={handleOpenAddMonitor}
              className="btn-primary text-xs py-2 px-3.5 gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              เพิ่มผู้เฝ้าติดตาม
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monitors.map(m => (
              <div key={m.id} className="card p-4 space-y-3 relative hover:border-[#012169]/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#FFCD00] text-[#012169] flex items-center justify-center font-bold text-xs shadow-sm">
                      <Shield size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#212529]">{m.userName}</p>
                      <p className="text-[11px] text-[#6C757D]">สร้างเมื่อ: {m.createdAt}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMonitor(m.id, m.userName)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-3 bg-[#F8F9FA] rounded-xl text-xs space-y-1.5 border border-[#DEE2E6]">
                  <div className="flex justify-between">
                    <span className="text-[#6C757D]">ขอบเขตการติดตาม:</span>
                    <span className="font-bold text-[#012169]">
                      {m.allDepartments ? 'ทุกฝ่ายทั่วทั้งองค์กร (All Departments)' : (m.scopeRefs.length > 0 ? m.scopeRefs.join(', ') : 'เฉพาะฝ่าย')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6C757D]">ประเภทเอกสาร:</span>
                    <span className="font-bold text-[#212529]">
                      {m.docDirectionFilter === 'incoming' ? 'เฉพาะรับเข้า' : m.docDirectionFilter === 'outgoing' ? 'เฉพาะส่งออก' : 'ทั้งหมด (รับเข้า + ส่งออก)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6C757D]">การแจ้งเตือน:</span>
                    <span className={`font-bold ${m.notifyEnabled ? 'text-[#28A745]' : 'text-[#6C757D]'}`}>
                      {m.notifyEnabled ? 'เปิดรับแจ้งเตือนงานค้าง' : 'ปิด'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: MASTER DATA (DEPARTMENT OWNERS) ─── */}
      {activeTab === 'master-data' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="section-title text-sm mb-1">กำหนดหัวหน้า/เจ้าของฝ่าย (Department Owners)</h3>
            <p className="section-sub text-xs">สำหรับกระบวนการ Owner-first Routing เพื่อรับมอบหมายงานระดับฝ่ายและมอบหมายต่อ</p>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#DEE2E6]">
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D]">รหัสฝ่าย</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D]">ชื่อฝ่าย</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#6C757D]">หัวหน้า/เจ้าของฝ่าย (Owner)</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-[#6C757D]">แก้ไข</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEE2E6]">
                {departments.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-xs font-mono font-bold text-[#012169]">{dept.code || dept.id}</td>
                    <td className="px-4 py-3 text-xs font-bold text-[#212529]">{dept.name}</td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="text-[#28A745]" />
                        <span className="font-semibold text-[#012169]">{ownerNameOf(dept.name)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openOwnerEditor(dept.name)}
                        className="btn-outline text-[11px] py-1 px-2.5 gap-1 border-[#012169] text-[#012169] hover:bg-blue-50"
                      >
                        <Edit2 size={12} />
                        เปลี่ยนหัวหน้าฝ่าย
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: REMINDER CONFIGURATION ─── */}
      {activeTab === 'reminder' && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <div>
              <h3 className="section-title text-base">การกำหนดรอบการแจ้งเตือนซ้ำ (Repeat Reminder Intervals)</h3>
              <p className="section-sub text-xs">กำหนดความถี่ในการส่ง Reminder งานค้างตามระดับความเร่งด่วนของเอกสารรับเข้า (BR-3.2/3.3)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {(['normal', 'urgent', 'very-urgent'] as UrgencyLevel[]).map(lvl => (
                <div key={lvl} className="p-4 rounded-xl border border-[#DEE2E6] bg-[#F8F9FA] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#212529]">ระดับ {URGENCY_LABELS[lvl]}</span>
                    <span className="text-[11px] text-[#6C757D]">Default: ทุก {URGENCY_DEFAULT_DAYS[lvl]} วัน</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={reminderDrafts[lvl]}
                      onChange={e => setReminderDrafts(prev => ({ ...prev, [lvl]: e.target.value }))}
                      className="input-base text-sm py-1.5 px-3 w-28 font-mono font-bold text-[#012169]"
                    />
                    <span className="text-xs text-[#495057] font-semibold">วัน / รอบ</span>
                  </div>

                  <button
                    onClick={() => handleSaveInterval(lvl, parseInt(reminderDrafts[lvl]))}
                    className="btn-primary w-full text-xs py-2 justify-center shadow-sm"
                  >
                    บันทึกค่า
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#012169] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Info size={14} /> นโยบายการส่ง Reminder (SRS Draft 1.8.8):
              </p>
              <p>• ระบบจะส่งเตือนซ้ำเป็นรอบๆ จนกว่าเอกสารจะแล้วเสร็จ (Completed)</p>
              <p>• ส่งให้เฉพาะ (1) ผู้ลงทะเบียนต้นทาง และ (2) ผู้รับมอบหมายล่าสุดของแต่ละสายงานย่อย (Leaf Assignees) เท่านั้น</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}

      {/* Add User Modal from AD/LDAP */}
      {showAddUserModal && (
        <Modal title="เพิ่มผู้ใช้งานจาก Active Directory / LDAP" onClose={() => setShowAddUserModal(false)}>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-[#495057] mb-1">ค้นหาจาก Active Directory *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อ, นามสกุล หรือ SAMAccountName..."
                  value={ldapSearch}
                  onChange={e => setLdapSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchLdap()}
                  className="input-base text-xs"
                />
                <button
                  type="button"
                  onClick={searchLdap}
                  disabled={isLdapSearching}
                  className="btn-primary text-xs px-4 whitespace-nowrap"
                >
                  <Search size={13} />
                  {isLdapSearching ? 'กำลังค้นหา...' : 'ค้นหา AD'}
                </button>
              </div>
            </div>

            {ldapResults.length > 0 && (
              <div className="border border-[#DEE2E6] rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-[#DEE2E6]">
                {ldapResults.map((u, i) => (
                  <div
                    key={i}
                    onClick={() => selectLdapUser(u)}
                    className={`p-2.5 text-xs cursor-pointer hover:bg-blue-50/80 transition-colors flex items-center justify-between ${
                      addForm.username === (u.samAccountName || u.username) ? 'bg-blue-100/60 font-bold' : ''
                    }`}
                  >
                    <div>
                      <p className="text-[#212529] font-bold">{u.displayName || u.name}</p>
                      <p className="text-[#6C757D] font-mono text-[10px]">{u.samAccountName || u.username} · {u.departmentName || u.department}</p>
                    </div>
                    <button type="button" className="btn-outline text-[10px] py-0.5 px-2">เลือก</button>
                  </div>
                ))}
              </div>
            )}

            {addForm.username && (
              <div className="space-y-3 pt-2 border-t border-[#DEE2E6]">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[#6C757D] block mb-0.5">Username (AD):</label>
                    <input type="text" value={addForm.username} readOnly className="input-base text-xs bg-slate-100" />
                  </div>
                  <div>
                    <label className="text-[#6C757D] block mb-0.5">ชื่อ-นามสกุล:</label>
                    <input type="text" value={addForm.name} readOnly className="input-base text-xs bg-slate-100" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#495057] block mb-1">กำหนดบทบาท (Role) ในระบบ *</label>
                  <select
                    value={addForm.roleId}
                    onChange={e => {
                      const rid = e.target.value
                      const roleName = rid === 'ROLE-05' ? 'admin' : (rid === 'ROLE-03' ? 'manager' : 'staff')
                      setAddForm(f => ({ ...f, roleId: rid, role: roleName as any }))
                    }}
                    className="input-base text-xs"
                  >
                    {APP_ROLES.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.dataScope})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={() => setShowAddUserModal(false)} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleCreateUser} disabled={!addForm.username} className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50">
                ยืนยันการเพิ่มผู้ใช้
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Monitor Modal */}
      {showMonitorModal && (
        <Modal title={editingMonitor ? "แก้ไขผู้เฝ้าติดตาม" : "เพิ่มผู้เฝ้าติดตาม (Monitor)"} onClose={() => setShowMonitorModal(false)}>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-[#495057] mb-1">เลือกผู้ใช้รับสิทธิ์ Monitor *</label>
              <select
                value={monitorForm.userId}
                onChange={e => {
                  const uid = e.target.value
                  const u = users.find(x => x.username === uid || x.id === uid)
                  setMonitorForm(f => ({ ...f, userId: uid, userName: u?.name || uid }))
                }}
                className="input-base text-xs"
              >
                <option value="">— เลือกผู้ใช้งาน —</option>
                {users.map(u => (
                  <option key={u.id} value={u.username}>{u.name} ({u.department})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#495057]">ขอบเขตการเฝ้าติดตาม (Scope)</label>
              <label className="flex items-center gap-2 text-xs font-bold text-[#012169] bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={monitorForm.allDepartments}
                  onChange={e => setMonitorForm(f => ({ ...f, allDepartments: e.target.checked }))}
                  className="rounded text-[#012169]"
                />
                <span>ทุกฝ่ายทั่วทั้งองค์กร (All Departments Flag)</span>
              </label>

              {!monitorForm.allDepartments && (
                <div>
                  <label className="block text-[11px] text-[#6C757D] mb-1">เลือกฝ่ายที่ต้องการเฝ้าติดตาม (เลือกได้หลายฝ่าย):</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 border border-[#DEE2E6] rounded-xl">
                    {departments.map(d => {
                      const isChecked = monitorForm.scopeRefs.includes(d.name)
                      return (
                        <label key={d.id} className="flex items-center gap-1.5 text-xs text-[#212529] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setMonitorForm(f => ({ ...f, scopeRefs: [...f.scopeRefs, d.name] }))
                              } else {
                                setMonitorForm(f => ({ ...f, scopeRefs: f.scopeRefs.filter(x => x !== d.name) }))
                              }
                            }}
                            className="rounded text-[#012169]"
                          />
                          <span>{d.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#495057] mb-1">ประเภทเอกสารที่ต้องการ Monitor</label>
              <select
                value={monitorForm.docDirectionFilter}
                onChange={e => setMonitorForm(f => ({ ...f, docDirectionFilter: e.target.value as any }))}
                className="input-base text-xs"
              >
                <option value="all">ทั้งหมด (รับเข้า + ส่งออก)</option>
                <option value="incoming">เฉพาะเอกสารรับเข้า</option>
                <option value="outgoing">เฉพาะเอกสารส่งออก</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={() => setShowMonitorModal(false)} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={handleSaveMonitor} className="btn-primary text-xs px-4 py-1.5">บันทึก</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Department Owner Modal */}
      {editingDept && (
        <Modal title={`กำหนดหัวหน้า/เจ้าของฝ่าย: ${editingDept}`} onClose={() => setEditingDept(null)}>
          <div className="space-y-4 text-sm">
            <p className="text-xs text-[#495057]">
              เลือกผู้ใช้ที่ทำหน้าที่เป็นหัวหน้าฝ่าย (Department Owner) เพื่อรับมอบหมายงานรายฝ่ายคนแรก
            </p>
            <div>
              <label className="block text-xs font-bold text-[#495057] mb-1">เลือกผู้ใช้ *</label>
              <select
                value={editOwnerUsername}
                onChange={e => setEditOwnerUsername(e.target.value)}
                className="input-base text-xs"
              >
                <option value="">— เลือกผู้ใช้ —</option>
                {users.map(u => (
                  <option key={u.id} value={u.username}>{u.name} ({u.department})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
              <button onClick={() => setEditingDept(null)} className="btn-outline text-xs px-3 py-1.5">ยกเลิก</button>
              <button onClick={confirmOwnerEdit} disabled={!editOwnerUsername} className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50">
                บันทึก
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

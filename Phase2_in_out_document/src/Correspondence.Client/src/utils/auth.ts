import type { User } from '../types'

export function getCurrentUser(): User {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('dvs_user') : null
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        id: parsed.id || parsed.username || 'user',
        name: parsed.displayName || parsed.name || 'ผู้ใช้งาน',
        username: parsed.username || 'user',
        department: parsed.departmentName || parsed.department || 'งานสารบรรณ',
        departmentId: parsed.departmentId || parsed.departmentRef || '',
        position: parsed.title || parsed.position || (parsed.roleId === 'ROLE-03' ? 'หัวหน้าฝ่าย' : 'เจ้าหน้าที่'),
        role: (parsed.roleId === 'ROLE-05' || parsed.roleId === 'ROLE-04') ? 'admin' : (parsed.roleId === 'ROLE-03' ? 'manager' : 'staff'),
        roleId: parsed.roleId || 'ROLE-02',
        active: true,
        email: parsed.email || `${parsed.username || 'user'}@deves.co.th`,
      }
    }
  } catch {}
  return {
    id: 'admin',
    name: 'ผู้ดูแลระบบ เทเวศประกันภัย',
    username: 'admin',
    department: 'ฝ่ายสารสนเทศ',
    departmentId: 'dept-it',
    position: 'System Administrator',
    role: 'admin',
    roleId: 'ROLE-05',
    active: true,
    email: 'admin@deves.co.th',
  }
}

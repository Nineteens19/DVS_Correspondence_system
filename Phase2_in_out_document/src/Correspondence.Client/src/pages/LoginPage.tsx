import { useState } from 'react'
import { Eye, EyeOff, AlertCircle, Loader2, BriefcaseBusiness, UserRound } from 'lucide-react'
import { authApi } from '../services/api'

interface LoginPageProps {
  onLogin: (user?: any) => void
}

type DemoRole = 'director' | 'staff'

const DEMO_ACCOUNTS: Record<DemoRole, { username: string; label: string; department: string }[]> = {
  director: [
    { username: 'anong.s', label: 'หัวหน้าสารบรรณ', department: 'งานสารบรรณ' },
    { username: 'wilai.p', label: 'ผอ.ฝ่ายบริหาร', department: 'ฝ่ายบริหาร' },
    { username: 'prasit.m', label: 'ผอ.ฝ่ายวิศวกรรม', department: 'ฝ่ายวิศวกรรม' },
    { username: 'wichai.c', label: 'ผอ.ฝ่ายการเงิน', department: 'ฝ่ายการเงิน' },
    { username: 'preeya.w', label: 'ผอ.ฝ่ายทรัพยากรบุคคล', department: 'ฝ่ายทรัพยากรบุคคล' },
    { username: 'wichai.t', label: 'ผอ.ฝ่ายสารสนเทศ', department: 'ฝ่ายสารสนเทศ' },
    { username: 'veera.c', label: 'ผอ.ฝ่ายกฎหมาย', department: 'ฝ่ายกฎหมาย' },
    { username: 'somchai.j', label: 'ผอ.ฝ่ายการตลาด', department: 'ฝ่ายการตลาด' },
    { username: 'pimchanok.t', label: 'ผอ.ฝ่ายพัสดุและจัดซื้อ', department: 'ฝ่ายพัสดุและจัดซื้อ' },
  ],
  staff: [
    { username: 'somchai.p', label: 'เจ้าหน้าที่สารบรรณ', department: 'งานสารบรรณ' },
    { username: 'kittisak.n', label: 'เจ้าหน้าที่ธุรการ', department: 'ฝ่ายบริหาร' },
    { username: 'nattawut.s', label: 'วิศวกรโยธา', department: 'ฝ่ายวิศวกรรม' },
    { username: 'siriporn.w', label: 'เจ้าหน้าที่การเงิน', department: 'ฝ่ายการเงิน' },
    { username: 'chutima.k', label: 'เจ้าหน้าที่ HR', department: 'ฝ่ายทรัพยากรบุคคล' },
    { username: 'kanda.m', label: 'เจ้าหน้าที่ IT', department: 'ฝ่ายสารสนเทศ' },
    { username: 'boonchai.l', label: 'นิติกรอาวุโส', department: 'ฝ่ายกฎหมาย' },
    { username: 'jintana.t', label: 'เจ้าหน้าที่การตลาด', department: 'ฝ่ายการตลาด' },
    { username: 'ekkachai.p', label: 'เจ้าหน้าที่จัดซื้อ', department: 'ฝ่ายพัสดุและจัดซื้อ' },
  ],
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoRole, setDemoRole] = useState<DemoRole>('director')

  const selectDemoAccount = (value: string) => {
    if (!value) return
    setUsername(value)
    setPassword('password')
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!username.trim()) { setError('กรุณากรอกชื่อผู้ใช้'); return }
    if (!password.trim()) { setError('กรุณากรอกรหัสผ่าน'); return }

    setLoading(true)
    try {
      const response = await authApi.login(username.trim(), password.trim())
      onLogin(response.user)
    } catch (err: any) {
      setError(err?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ตรวจกับ LDAP/AD)')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #001a52 0%, #012169 60%, #0a328c 100%)' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/เทเวศประกันภัย.png"
            alt="Deves Insurance"
            className="w-52 h-auto rounded-lg bg-white/95 p-1.5 shadow-xl border border-white/20"
          />
          <h1 className="text-xl font-bold text-white text-center leading-tight mt-4">e-Document Tracking</h1>
          <p className="text-sm text-white/80 mt-1 text-center font-medium">ติดตามสถานะเอกสารอิเล็กทรอนิกส์</p>
          <div className="mt-2.5 px-3.5 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"><p className="text-xs font-semibold text-[#FFCD00]">บริษัท เทเวศประกันภัย จำกัด (มหาชน)</p></div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-2xl border border-white/20">
          <h2 className="text-base font-bold text-[#212529] mb-5">เข้าสู่ระบบด้วยบัญชีองค์กร</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">ชื่อผู้ใช้ (AD/LDAP)</label>
              <input type="text" className="form-input" placeholder="เช่น somchai.j" value={username} onChange={event => { setUsername(event.target.value); setError('') }} autoComplete="username" autoFocus />
            </div>
            <div>
              <label className="form-label">รหัสผ่าน</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="form-input pr-10" placeholder="••••••••" value={password} onChange={event => { setPassword(event.target.value); setError('') }} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C757D] hover:text-[#212529] transition-colors">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            {error && <div className="flex items-start gap-2 bg-[#F8D7DA] border border-[#f5c6cb] rounded-lg p-3"><AlertCircle size={16} className="text-[#DC3545] flex-shrink-0 mt-0.5" /><p className="text-xs text-[#721C24] font-medium leading-relaxed">{error}</p></div>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-sm py-2.5 mt-2 shadow-md" style={{ opacity: loading ? 0.8 : 1 }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />กำลังเข้าสู่ระบบ...</> : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-[#F8F9FA] border border-[#DEE2E6] p-3">
            <p className="font-bold text-[#012169] text-[11px] mb-2">เข้าสู่ระบบทดสอบตามบทบาท</p>
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#E9ECEF] rounded-lg mb-2">
              <button type="button" onClick={() => setDemoRole('director')} className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold ${demoRole === 'director' ? 'bg-white text-[#012169] shadow-sm' : 'text-[#6C757D]'}`}><BriefcaseBusiness size={13} />ผอ./หัวหน้าฝ่าย</button>
              <button type="button" onClick={() => setDemoRole('staff')} className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold ${demoRole === 'staff' ? 'bg-white text-[#012169] shadow-sm' : 'text-[#6C757D]'}`}><UserRound size={13} />เจ้าหน้าที่</button>
            </div>
            <select onChange={event => selectDemoAccount(event.target.value)} value="" className="input-base text-xs py-1.5 bg-white">
              <option value="">— เลือกบัญชีทดสอบ ({demoRole === 'director' ? 'ผู้รับผิดชอบฝ่าย' : 'ผู้ปฏิบัติงาน'}) —</option>
              {DEMO_ACCOUNTS[demoRole].map(account => <option key={account.username} value={account.username}>{account.label} · {account.department}</option>)}
            </select>
            <p className="text-[10px] text-[#6C757D] mt-2">เมื่อเลือก ระบบจะกรอก username และรหัสผ่านทดสอบให้ (password)</p>
          </div>

          <div className="mt-5 pt-4 border-t border-[#DEE2E6] text-center"><p className="text-xs text-[#6C757D]">หากลืมรหัสผ่านหรือไม่สามารถเข้าสู่ระบบได้</p><button className="text-xs text-[#012169] font-bold hover:underline mt-0.5">ติดต่อผู้ดูแลระบบ (ฝ่ายสารสนเทศ)</button></div>
        </div>
        <p className="text-center text-[11px] text-white/60 mt-5">ระบบนี้สำหรับพนักงานองค์กรเท่านั้น · เวอร์ชัน 2.4.1</p>
      </div>
    </div>
  )
}

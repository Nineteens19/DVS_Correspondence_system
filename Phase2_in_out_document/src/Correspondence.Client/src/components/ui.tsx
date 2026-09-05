import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle, Clock, Play, AlertCircle, AlertTriangle,
  Check, X, XCircle, Info, FileX, Loader2, Ban, PackageCheck,
  Send, FileCheck, RotateCcw, Camera, RefreshCw, Sparkles, SwitchCamera,
  Image, Maximize2, ScanLine, FlipHorizontal, RotateCw,
  Shield, ShieldAlert, ShieldCheck, Lock, Unlock, KeyRound, Mail
} from 'lucide-react'
import type { DocStatus, DeadlineFlag, UrgencyLevel, TimelineEvent, ConfidentialityLevel } from '../types'

// ─── Status Badge (ตามตาราง Deves Theme เป๊ะๆ) ─────────────────────────────

const statusConfig: Record<DocStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  // เอกสารรับเข้า
  registered: {
    label: 'ลงทะเบียนแล้ว',
    cls: 'bg-[#E2E3E5] text-[#383D41]',
    icon: <FileCheck size={12} />,
  },
  'pending-acceptance': {
    label: 'รอรับงาน',
    cls: 'bg-[#FFF3CD] text-[#856404]',
    icon: <Clock size={12} />,
  },
  'in-progress': {
    label: 'กำลังดำเนินการ',
    cls: 'bg-[#D1ECF1] text-[#0C5460]',
    icon: <Play size={12} />,
  },
  'awaiting-physical-return': {
    label: 'รอรับเอกสารจริงคืน',
    cls: 'bg-[#FFE5D0] text-[#7C3A00]',
    icon: <RotateCcw size={12} />,
  },
  // เอกสารส่งออก
  attached: {
    label: 'แนบไฟล์แล้ว',
    cls: 'bg-[#D1ECF1] text-[#0C5460]',
    icon: <FileCheck size={12} />,
  },
  'ready-to-send': {
    label: 'พร้อมนำส่ง',
    cls: 'bg-[#E2E3E5] text-[#383D41]',
    icon: <Send size={12} />,
  },
  sent: {
    label: 'นำส่งแล้ว',
    cls: 'bg-[#D1ECF1] text-[#0C5460]',
    icon: <Send size={12} />,
  },
  delivered: {
    label: 'ปลายทางรับแล้ว',
    cls: 'bg-[#D4EDDA] text-[#155724]',
    icon: <PackageCheck size={12} />,
  },
  // ร่วม
  completed: {
    label: 'เสร็จสิ้น',
    cls: 'bg-[#D4EDDA] text-[#155724]',
    icon: <CheckCircle size={12} />,
  },
  cancelled: {
    label: 'ยกเลิก',
    cls: 'bg-[#F8D7DA] text-[#721C24]',
    icon: <Ban size={12} />,
  },
}

export function StatusBadge({ status }: { status: DocStatus }) {
  const cfg = statusConfig[status] ?? { label: status, cls: 'bg-[#E2E3E5] text-[#6C757D]', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ─── Deadline Flag Badge (หมวด SLA / การติดตามเวลา) ──────────────────────────

const deadlineFlagConfig: Record<DeadlineFlag, { label: string; cls: string; icon: React.ReactNode }> = {
  'on-track': { label: 'On Track', cls: 'bg-[#D4EDDA] text-[#155724]', icon: <CheckCircle size={12} /> },
  'due-soon': { label: 'Due Soon', cls: 'bg-[#FFF3CD] text-[#856404]', icon: <AlertTriangle size={12} /> },
  overdue: { label: 'Overdue', cls: 'bg-[#F8D7DA] text-[#721C24]', icon: <AlertCircle size={12} /> },
  cleared: { label: 'Cleared', cls: 'bg-[#E2E3E5] text-[#6C757D]', icon: <Check size={12} /> },
}

export function DeadlineFlagBadge({ flag }: { flag: DeadlineFlag }) {
  const cfg = deadlineFlagConfig[flag]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ─── Urgency Badge (ความเร่งด่วน) ───────────────────────────────────────────

const urgencyConfig: Record<UrgencyLevel, { label: string; cls: string }> = {
  normal: { label: 'ปกติ', cls: 'bg-[#D1ECF1] text-[#0C5460]' },
  urgent: { label: 'ด่วน', cls: 'bg-[#FFE5D0] text-[#7C3A00]' },
  'very-urgent': { label: 'ด่วนมาก', cls: 'bg-[#DC3545] text-white animate-pulse' },
}

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const cfg = urgencyConfig[urgency]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ─── Confidentiality Badge (ระดับชั้นความลับ — BR-1.4-A) ─────────────────────

const confidentialityConfig: Record<ConfidentialityLevel, { label: string; cls: string; icon: React.ReactNode }> = {
  normal: {
    label: 'ปกติ',
    cls: 'bg-[#E2E3E5] text-[#383D41]',
    icon: <Shield size={12} />,
  },
  confidential: {
    label: 'ลับ',
    cls: 'bg-[#FFE5D0] text-[#C82333] border border-[#F5C6CB]',
    icon: <ShieldAlert size={12} />,
  },
  'top-secret': {
    label: 'ลับมาก (OTP)',
    cls: 'bg-[#DC3545] text-white shadow-sm font-extrabold',
    icon: <Lock size={12} />,
  },
}

export function ConfidentialityBadge({ level = 'normal' }: { level?: ConfidentialityLevel }) {
  const cfg = confidentialityConfig[level] ?? confidentialityConfig.normal
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const color =
    value >= 100 ? 'bg-[#28A745]'
    : value >= 70 ? 'bg-[#012169]'
    : value >= 40 ? 'bg-[#FD7E14]'
    : 'bg-[#DC3545]'
  return (
    <div className={`h-1.5 bg-[#E9ECEF] rounded-full overflow-hidden ${className}`}>
      <div className={`h-full ${color} progress-fill`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

export function ProgressRing({
  value,
  size = 56,
  stroke = 5,
  color = '#012169',
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
}) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = ((100 - Math.min(value, 100)) / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#DEE2E6" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  )
}

// ─── Stat Card / SummaryCard ──────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  iconBg: string
  trend?: { value: string; up?: boolean }
  ring?: number
  ringColor?: string
  borderColor?: string
}

export function StatCard({ title, value, subtitle, icon, iconBg, trend, ring, ringColor, borderColor = '#012169' }: StatCardProps) {
  return (
    <div
      className="card p-5 stat-hover cursor-default border-l-4"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#6C757D] uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-[#212529] mt-1 leading-tight font-mono">{value}</p>
          {subtitle && <p className="text-xs text-[#6C757D] mt-1">{subtitle}</p>}
          {trend && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${trend.up ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
              <span>{trend.up ? '▲' : '▼'}</span>
              <span>{trend.value} จากเดือนก่อน</span>
            </div>
          )}
        </div>
        <div className="ml-3 flex flex-col items-center gap-1 flex-shrink-0">
          {ring !== undefined ? (
            <div className="relative flex items-center justify-center">
              <ProgressRing value={ring} size={52} stroke={4} color={ringColor ?? '#012169'} />
              <div className="absolute text-xs font-bold text-[#212529]">{ring}%</div>
            </div>
          ) : (
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      {events.map((ev, idx) => (
        <TimelineNode key={ev.id} ev={ev} isLast={idx === events.length - 1} />
      ))}
    </div>
  )
}

function TimelineNode({ ev, isLast }: { ev: TimelineEvent, isLast: boolean }) {
  const hasChildren = ev.children && ev.children.length > 0

  return (
    <div className="relative pb-6 last:pb-0">
      {!isLast && (
        <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${ev.status === 'pending' ? 'bg-[#E9ECEF]' : 'bg-[#DEE2E6]'}`} />
      )}

      <div className="flex gap-4 relative z-10">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
            ev.status === 'completed'
              ? 'bg-[#012169] border-[#012169] text-white'
              : ev.status === 'current'
              ? 'bg-white border-[#012169] text-[#012169] ring-4 ring-blue-50'
              : 'bg-white border-[#DEE2E6] text-[#6C757D]'
          }`}
        >
          {ev.status === 'completed' ? (
            <Check size={13} strokeWidth={2.5} />
          ) : ev.status === 'current' ? (
            <Clock size={13} />
          ) : (
            <div className="w-2 h-2 rounded-full bg-[#DEE2E6]" />
          )}
        </div>

        <div className="flex-1 pt-0.5 pb-2 min-w-0">
          {ev.customNode ? (
            ev.customNode
          ) : ev.status === 'pending' ? (
            <p className="text-sm text-[#6C757D] italic">{ev.action}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <p className={`font-semibold text-sm ${ev.status === 'current' ? 'text-[#012169]' : 'text-[#212529]'}`}>
                  {ev.action}
                </p>
                {ev.timestamp && <span className="text-xs text-[#6C757D]">{ev.timestamp}</span>}
              </div>
              {(ev.actor || ev.department) && (
                <p className="text-xs text-[#6C757D] mt-0.5">
                  {ev.actor}
                  {ev.department ? ` · ${ev.department}` : ''}
                </p>
              )}
              {ev.duration && (
                <span className={`inline-flex items-center mt-1.5 text-xs px-2 py-0.5 rounded-full gap-1 ${ev.isBottleneck ? 'bg-[#FFF3CD] text-[#856404] border border-[#FFEBAA]' : 'bg-[#F8F9FA] text-[#6C757D]'}`}>
                  {ev.isBottleneck && <AlertTriangle size={10} />}
                  ⏱ {ev.duration}
                  {ev.isBottleneck && ' — คอขวด'}
                </span>
              )}
              {ev.note && (
                <p className="text-xs text-[#6C757D] mt-1 italic border-l-2 border-[#DEE2E6] pl-2">
                  {ev.note}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {hasChildren && (
        <div className="relative mt-2">
          {isLast && (
            <div className="absolute left-[15px] -top-8 bottom-6 w-0.5 bg-[#DEE2E6]" />
          )}

          {ev.children!.map((child, i) => (
            <TimelineChildNode
              key={child.id}
              ev={child}
              depth={1}
              isLast={i === ev.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TimelineChildNode (recursive — เรนเดอร์ลูกทุกความลึก) ──────────────────────

function TimelineChildNode({ ev, depth, isLast }: { ev: TimelineEvent, depth: number, isLast: boolean }) {
  const hasChildren = ev.children && ev.children.length > 0

  return (
    <div className="relative pl-12 pb-5 last:pb-0">
      <div className="absolute left-[15px] top-[14px] w-[33px] h-0.5 bg-[#DEE2E6]" />

      <div className="flex gap-3 relative z-10">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-white border-2 ${
            ev.status === 'completed'
              ? 'border-[#012169] text-[#012169]'
              : ev.status === 'current'
              ? 'border-[#FFCD00] text-[#012169] ring-2 ring-amber-100'
              : 'border-[#DEE2E6] text-[#6C757D]'
          }`}
        >
          {ev.status === 'completed' ? (
            <Check size={12} strokeWidth={2.5} />
          ) : ev.status === 'current' ? (
            <Clock size={12} />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-[#DEE2E6]" />
          )}
        </div>

        <div className="flex-1 pt-0.5 min-w-0">
          {ev.customNode ? (
            ev.customNode
          ) : ev.status === 'pending' ? (
            <p className="text-sm text-[#6C757D] italic">{ev.action}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className={`font-semibold text-sm ${ev.status === 'current' ? 'text-[#012169]' : 'text-[#212529]'}`}>
                  {ev.action}
                </p>
                {ev.timestamp && <span className="text-xs text-[#6C757D]">{ev.timestamp}</span>}
              </div>
              {(ev.actor || ev.department) && (
                <p className="text-xs text-[#6C757D] mt-0.5">
                  {ev.actor}
                  {ev.department ? ` · ${ev.department}` : ''}
                </p>
              )}
              {ev.note && (
                <p className="text-xs text-[#6C757D] mt-1 italic border-l-2 border-[#DEE2E6] pl-2">
                  {ev.note}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* recursion — ลูกของลูก ที่ทุกความลึก (depth+1) */}
      {hasChildren && (
        <div className="relative mt-1">
          {ev.children!.map((c, i) => (
            <TimelineChildNode
              key={c.id}
              ev={c}
              depth={depth + 1}
              isLast={i === ev.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open?: boolean
  isOpen?: boolean
  title: string
  onClose: () => void
  onConfirm?: () => void
  confirmLabel?: string
  confirmDisabled?: boolean
  danger?: boolean
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  footer?: React.ReactNode
}

export function Modal({ open, isOpen, title, onClose, onConfirm, confirmLabel = 'ยืนยัน', confirmDisabled, danger, children, size = 'md', footer }: ModalProps) {
  const isVisible = open !== undefined ? open : (isOpen !== undefined ? isOpen : true)
  if (!isVisible) return null
  const maxW = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${maxW} max-h-[90vh] flex flex-col border border-[#DEE2E6]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEE2E6] bg-[#F8F9FA] rounded-t-xl">
          <h3 className="text-base font-bold text-[#212529]">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6C757D] hover:bg-[#E9ECEF] hover:text-[#212529] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer ? (
          <div className="px-6 py-4 border-t border-[#DEE2E6] bg-[#F8F9FA] rounded-b-xl">
            {footer}
          </div>
        ) : onConfirm ? (
          <div className="flex gap-2.5 px-6 py-4 border-t border-[#DEE2E6] bg-[#F8F9FA] rounded-b-xl">
            <button onClick={onClose} className="btn-outline flex-1 justify-center">
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={`flex-1 justify-center ${danger ? 'btn-danger' : 'btn-primary'} ${confirmDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {confirmLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ─── Camera Capture Modal (ถ่ายภาพด้วยกล้อง + ฟังก์ชันกลับภาพ/หมุนภาพ) ───────────

export interface CapturedPhoto {
  id: string
  name: string
  dataUrl: string
  size: string
  capturedAt: string
  isCamera: boolean
}

interface CameraCaptureModalProps {
  open?: boolean
  isOpen?: boolean
  onClose: () => void
  onCapture: (photo: CapturedPhoto) => void
}

export function CameraCaptureModal({ open, isOpen, onClose, onCapture }: CameraCaptureModalProps) {
  const isVisible = open !== undefined ? open : (isOpen !== undefined ? isOpen : false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [isMirrored, setIsMirrored] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)

  // เริ่มต้นเปิดกล้อง WebRTC
  useEffect(() => {
    if (!isVisible) {
      stopCamera()
      setCapturedImage(null)
      setCameraError(null)
      return
    }

    startCamera(facingMode)

    return () => {
      stopCamera()
    }
  }, [isVisible, facingMode])

  const startCamera = async (facing: 'environment' | 'user') => {
    stopCamera()
    setCameraError(null)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play().catch(() => {})
        }
      } else {
        setCameraError('อุปกรณ์ไม่รองรับการเปิดกล้องผ่าน WebRTC หรืออยู่ในโหมดจำลอง (Mockup)')
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err)
      setCameraError('ไม่สามารถเข้าถึงกล้องถ่ายภาพได้ (กรุณาอนุญาต Camera Permission หรือใช้วิธีจำลองถ่ายภาพ)')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    // หากสลับเป็นกล้องหน้า แนะนำให้เปิด Mirror เริ่มต้น หรือปรับตามความต้องการ
    if (nextMode === 'user') {
      setIsMirrored(true)
    } else {
      setIsMirrored(false)
    }
  }

  // กดปุ่มชัตเตอร์เพื่อถ่ายภาพ
  const handleShutter = () => {
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 200)

    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext('2d')
      if (ctx) {
        if (isMirrored) {
          // วาดภาพแบบกลับด้านแนวนอน (Horizontal Flip) เพื่อให้อ่านตัวหนังสือได้ถูกต้อง
          ctx.save()
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          ctx.restore()
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(dataUrl)
        return
      }
    }

    // กรณีไม่มีกล้องหรือจำลองถ่ายภาพ (Fallback Mock Document Photo)
    const mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 1130
    const ctx = mockCanvas.getContext('2d')
    if (ctx) {
      // Draw simulated scanned document
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 800, 1130)
      
      // Header band
      ctx.fillStyle = '#012169'
      ctx.fillRect(40, 40, 720, 90)
      
      // Gold emblem box
      ctx.fillStyle = '#FFCD00'
      ctx.fillRect(60, 55, 60, 60)
      ctx.fillStyle = '#012169'
      ctx.font = 'bold 24px Sarabun, sans-serif'
      ctx.fillText('DVS', 68, 93)

      // Header text
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 20px Sarabun, sans-serif'
      ctx.fillText('บริษัท เทเวศประกันภัย จำกัด (มหาชน)', 135, 80)
      ctx.font = '14px Sarabun, sans-serif'
      ctx.fillText('ระบบสารบรรณอิเล็กทรอนิกส์ (DVS) · เอกสารแนบผ่านกล้อง', 135, 108)

      // Document lines
      ctx.fillStyle = '#212529'
      ctx.font = 'bold 18px Sarabun, sans-serif'
      ctx.fillText('บันทึกข้อความ / หนังสือประกอบการพิจารณา', 60, 190)

      ctx.fillStyle = '#495057'
      ctx.font = '14px Sarabun, sans-serif'
      ctx.fillText(`วันที่บันทึกภาพ: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 60, 225)
      ctx.fillText(`โหมดภาพ: ${isMirrored ? 'กลับด้านแนวนอน (Unmirrored)' : 'ปกติ'}`, 60, 250)

      // Sample content lines
      ctx.fillStyle = '#6C757D'
      for (let i = 0; i < 12; i++) {
        const y = 300 + (i * 35)
        const w = 680 - (i % 3 === 0 ? 150 : 0)
        ctx.fillRect(60, y, w, 8)
      }

      // Stamp Box
      ctx.strokeStyle = '#012169'
      ctx.lineWidth = 3
      ctx.strokeRect(480, 850, 260, 160)
      ctx.fillStyle = '#012169'
      ctx.font = 'bold 16px Sarabun, sans-serif'
      ctx.fillText('ตราประทับรับรองเอกสาร', 520, 900)
      ctx.font = '13px Sarabun, sans-serif'
      ctx.fillText('บมจ.เทเวศประกันภัย (DVS)', 530, 935)
      ctx.fillText('ตรวจรับเอกสารฉบับจริงแล้ว', 530, 965)

      const dataUrl = mockCanvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(dataUrl)
    }
  }

  // กลับภาพซ้าย-ขวาบนภาพที่ถ่ายแล้ว (Flip Horizontal on Captured Image)
  const handleFlipCapturedImage = () => {
    if (!capturedImage) return
    const img = new window.Image()
    img.src = capturedImage
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(img, 0, 0)
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.9))
      }
    }
  }

  // หมุนภาพ 90 องศาตามเข็มนาฬิกา (Rotate 90deg Clockwise)
  const handleRotateCapturedImage = () => {
    if (!capturedImage) return
    const img = new window.Image()
    img.src = capturedImage
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalHeight
      canvas.height = img.naturalWidth
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((90 * Math.PI) / 180)
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.9))
      }
    }
  }

  // ถ่ายใหม่
  const handleRetake = () => {
    setCapturedImage(null)
    if (!stream && !cameraError) {
      startCamera(facingMode)
    }
  }

  // ยืนยันการใช้รูปถ่ายนี้
  const handleConfirmPhoto = () => {
    if (!capturedImage) return
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const timeStr = `${now.getFullYear() + 543}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
    const fileName = `CAM_DOC_${timeStr}.jpg`

    onCapture({
      id: `cam-${Date.now()}`,
      name: fileName,
      dataUrl: capturedImage,
      size: '1.4 MB',
      capturedAt: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      isCamera: true,
    })
    onClose()
  }

  // รับไฟล์จาก Native Camera Picker ของมือถือ
  const handleNativeCameraInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A1E24] rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 text-white">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#012169]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFCD00] flex items-center justify-center text-[#012169] font-bold">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ถ่ายภาพเอกสารด้วยกล้อง</h3>
              <p className="text-[11px] text-white/75">เล็งให้เอกสารอยู่ในกรอบสี่เหลี่ยมเพื่อความคมชัด</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Flip Toggle in TopBar */}
            {!capturedImage && (
              <button
                type="button"
                onClick={() => setIsMirrored(v => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                  isMirrored
                    ? 'bg-[#FFCD00] text-[#012169] border-[#FFCD00]'
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
                title="กลับภาพซ้าย-ขวา (แก้ไขตัวอักษรกลับด้านจากกล้องหน้า)"
              >
                <FlipHorizontal size={14} />
                <span>กลับภาพ: {isMirrored ? 'เปิด' : 'ปิด'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewfinder / Camera Area */}
        <div className="relative bg-black flex-1 min-h-[360px] flex items-center justify-center overflow-hidden">
          {/* Flash Effect */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200 pointer-events-none" />
          )}

          {capturedImage ? (
            /* Preview of captured image with Edit / Transform Controls */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              <img
                src={capturedImage}
                alt="Captured Document"
                className="max-h-[340px] max-w-full rounded-lg shadow-lg object-contain border-2 border-[#FFCD00]"
              />
              <div className="absolute top-6 left-6 bg-[#012169]/90 text-[#FFCD00] font-bold text-xs px-3 py-1 rounded-full border border-[#FFCD00]/40 backdrop-blur-sm flex items-center gap-1.5">
                <CheckCircle size={13} className="text-[#28A745]" />
                ภาพถ่ายพร้อมแนบ
              </div>

              {/* Adjust Floating Toolbar (Flip & Rotate) */}
              <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-xl p-1 border border-white/20 shadow-lg">
                <button
                  type="button"
                  onClick={handleFlipCapturedImage}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-colors flex items-center gap-1"
                  title="กลับด้านภาพซ้าย-ขวา"
                >
                  <FlipHorizontal size={14} className="text-[#FFCD00]" />
                  <span>กลับภาพ</span>
                </button>
                <button
                  type="button"
                  onClick={handleRotateCapturedImage}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-colors flex items-center gap-1"
                  title="หมุนภาพ 90 องศา"
                >
                  <RotateCw size={14} className="text-[#FFCD00]" />
                  <span>หมุน 90°</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Feed or Simulation */
            <div className="relative w-full h-full min-h-[360px] flex items-center justify-center bg-zinc-950">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[380px] transition-transform duration-200"
                style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
              />

              {/* Viewfinder Overlay Frame */}
              <div className="absolute inset-6 border-2 border-white/30 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-[#FFCD00] -mt-1 -ml-1 rounded-tl" />
                  <div className="w-6 h-6 border-t-4 border-r-4 border-[#FFCD00] -mt-1 -mr-1 rounded-tr" />
                </div>
                <div className="text-center">
                  <span className="bg-black/60 backdrop-blur-sm text-white/90 text-xs px-3 py-1 rounded-full border border-white/20">
                    📄 จัดวางเอกสารให้อยู่ในกรอบ {isMirrored && '(กำลังกลับภาพซ้าย-ขวา)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-[#FFCD00] -mb-1 -ml-1 rounded-bl" />
                  <div className="w-6 h-6 border-b-4 border-r-4 border-[#FFCD00] -mb-1 -mr-1 rounded-br" />
                </div>
              </div>

              {/* Camera Warning / Fallback Notice */}
              {cameraError && (
                <div className="absolute bottom-4 left-4 right-4 bg-[#001a52]/90 border border-blue-400/40 rounded-xl p-3 text-xs text-white backdrop-blur-md">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-[#FFCD00] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#FFCD00]">โหมดจำลองการถ่ายภาพ (Mockup Scanner)</p>
                      <p className="text-white/80 mt-0.5">กดปุ่มชัตเตอร์ด้านล่างเพื่อจำลองการถ่ายภาพเอกสารความละเอียดสูง หรือเลือกรูปจากกล้องมือถือ</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden Canvas for capture rendering */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls Bar */}
        <div className="p-4 bg-[#111418] border-t border-white/10 flex items-center justify-between gap-3">
          {capturedImage ? (
            /* Actions after capturing photo */
            <div className="w-full flex items-center gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/20 text-white font-bold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={15} />
                ถ่ายใหม่ (Retake)
              </button>
              <button
                onClick={handleConfirmPhoto}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#FFCD00] text-[#012169] font-extrabold text-sm hover:bg-[#e6b800] transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <Check size={17} strokeWidth={3} />
                ใช้ภาพนี้แนบเอกสาร
              </button>
            </div>
          ) : (
            /* Shutter and Camera switch options */
            <div className="w-full flex items-center justify-between">
              {/* Flip Mirror Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMirrored(v => !v)}
                className={`text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors ${
                  isMirrored
                    ? 'bg-[#FFCD00] text-[#012169] border-[#FFCD00] font-bold shadow-sm'
                    : 'text-white/80 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                title="กลับภาพซ้าย-ขวาสำหรับกล้องหน้า"
              >
                <FlipHorizontal size={15} />
                <span>กลับภาพ {isMirrored ? '✓' : ''}</span>
              </button>

              {/* Shutter Button */}
              <button
                onClick={handleShutter}
                className="w-16 h-16 rounded-full bg-white p-1 flex items-center justify-center shadow-[0_0_20px_rgba(255,205,0,0.4)] hover:scale-105 active:scale-95 transition-all"
                title="กดถ่ายภาพ"
              >
                <div className="w-13 h-13 rounded-full border-3 border-[#012169] bg-[#FFCD00] flex items-center justify-center">
                  <Camera size={22} className="text-[#012169]" />
                </div>
              </button>

              {/* Switch Camera Front/Back or Mobile Upload */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="text-xs text-white/80 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  title="สลับกล้องหน้า/หลัง"
                >
                  <SwitchCamera size={15} className="text-[#FFCD00]" />
                  <span className="hidden sm:inline">สลับกล้อง</span>
                </button>

                <label className="cursor-pointer text-xs text-white/80 hover:text-white flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" title="เลือกจากอัลบั้มรูป">
                  <Image size={15} className="text-[#FFCD00]" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleNativeCameraInput}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const cfg = {
    success: { bg: 'bg-[#28A745]', icon: <CheckCircle size={17} /> },
    error: { bg: 'bg-[#DC3545]', icon: <XCircle size={17} /> },
    info: { bg: 'bg-[#012169]', icon: <Info size={17} /> },
  }[type]

  return (
    <div className="fixed bottom-6 right-6 z-50 toast-enter">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white text-sm font-medium ${cfg.bg}`}>
        {cfg.icon}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-xl bg-[#F8F9FA] border border-[#DEE2E6] flex items-center justify-center mb-4 text-[#6C757D]">
        {icon ?? <FileX size={28} />}
      </div>
      <p className="text-base font-bold text-[#212529]">{title}</p>
      {description && <p className="text-sm text-[#6C757D] mt-1 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ─── Loading State ────────────────────────────────────────────────────────────

export function LoadingState({ message = 'กำลังโหลดข้อมูล...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#6C757D]">
      <Loader2 size={28} className="animate-spin text-[#012169]" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  breadcrumb?: { label: string; onClick?: () => void }[]
}

export function PageHeader({ title, subtitle, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#6C757D] mb-1.5">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>&gt;</span>}
                <span
                  onClick={b.onClick}
                  className={b.onClick ? 'cursor-pointer hover:text-[#012169] transition-colors font-medium' : ''}
                >
                  {b.label}
                </span>
              </span>
            ))}
          </div>
        )}
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  )
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
        active
          ? 'bg-[#012169] text-white shadow-sm'
          : 'bg-white text-[#6C757D] border border-[#DEE2E6] hover:bg-[#F8F9FA] hover:text-[#212529]'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

export function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`skeleton h-4 rounded ${i === 1 ? 'w-48' : i === 0 ? 'w-24' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  )
}

// ─── Dynamic Watermark Overlay (สำหรับแสดงบนพรีวิวไฟล์ลับมาก — BR-1.4-D) ──────

export function DynamicWatermarkOverlay({
  userName = 'Teerapat Tiangkool',
  userDept = 'ฝ่ายพัฒนากระบวนการทางธุรกิจ',
  ip = '192.168.1.104'
}: {
  userName?: string
  userDept?: string
  ip?: string
}) {
  const now = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' })
  const text = `${userName} (${userDept}) • ${now} • IP: ${ip} • DEVES TOP SECRET`

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 select-none flex flex-col justify-around opacity-30">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="text-xs font-mono font-bold tracking-wider text-red-600 whitespace-nowrap transform -rotate-12 translate-x-[-10%]"
        >
          {text} &nbsp;&nbsp;&nbsp;&nbsp; {text} &nbsp;&nbsp;&nbsp;&nbsp; {text}
        </div>
      ))}
    </div>
  )
}

// ─── OTP Verification Modal (สำหรับยืนยันตัวตนดูไฟล์ลับมาก — BR-1.4-C) ────────

export function OtpVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  docNumber,
  userEmail = 'teerapat.ti@deves.co.th',
  showToast
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  docNumber: string
  userEmail?: string
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}) {
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(180) // 3 นาที
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [refCode, setRefCode] = useState('REF-8492')
  const [demoCode, setDemoCode] = useState('583920')

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // รีเซ็ตสถานะเมื่อเปิด Modal
  useEffect(() => {
    if (isOpen) {
      setOtpDigits(['', '', '', '', '', ''])
      setTimeLeft(180)
      setErrorMsg('')
      setAttempts(0)
      const randomRef = 'REF-' + Math.floor(1000 + Math.random() * 9000)
      const randomDemo = '' + Math.floor(100000 + Math.random() * 900000)
      setRefCode(randomRef)
      setDemoCode(randomDemo)
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 150)
    }
  }, [isOpen])

  // ตัวนับเวลาถอยหลัง 3 นาที
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen, timeLeft])

  if (!isOpen) return null

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const lastChar = value.slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = lastChar
    setOtpDigits(newDigits)
    setErrorMsg('')

    if (lastChar && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // เมื่อกรอกครบ 6 หลัก ทำการ verify อัตโนมัติ
    if (lastChar && index === 5 && newDigits.every(d => d !== '')) {
      verifyCode(newDigits.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pasted)) {
      const chars = pasted.split('')
      setOtpDigits(chars)
      verifyCode(pasted)
    }
  }

  const verifyCode = (code: string) => {
    setIsVerifying(true)
    setErrorMsg('')

    setTimeout(() => {
      setIsVerifying(false)
      if (timeLeft <= 0) {
        setErrorMsg('รหัส OTP หมดอายุแล้ว กรุณากดขอรหัสใหม่ (VAL-20)')
        showToast('รหัส OTP หมดอายุแล้ว (VAL-20)', 'error')
        return
      }

      if (code === demoCode || code === '123456') {
        showToast('ยืนยันตัวตนสำเร็จ ปลดล็อกไฟล์แนบแล้ว (เข้าถึงได้ 15 นาที)', 'success')
        onSuccess()
        onClose()
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        if (newAttempts >= 3) {
          setErrorMsg('ท่านกรอกรหัส OTP ผิดเกิน 3 ครั้ง ระบบระงับการขอรหัสชั่วคราว 15 นาที (VAL-21)')
          showToast('กรอก OTP ผิดเกินกำหนด (VAL-21)', 'error')
        } else {
          setErrorMsg(`รหัส OTP ไม่ถูกต้อง เหลือโอกาสอีก ${3 - newAttempts} ครั้ง (VAL-20)`)
          showToast(`รหัส OTP ไม่ถูกต้อง (เหลือ ${3 - newAttempts} ครั้ง)`, 'error')
        }
      }
    }, 600)
  }

  const handleResend = () => {
    const newRef = 'REF-' + Math.floor(1000 + Math.random() * 9000)
    const newDemo = '' + Math.floor(100000 + Math.random() * 900000)
    setRefCode(newRef)
    setDemoCode(newDemo)
    setTimeLeft(180)
    setOtpDigits(['', '', '', '', '', ''])
    setErrorMsg('')
    setAttempts(0)
    showToast(`ส่งรหัส OTP ใหม่ไปยังอีเมลเรียบร้อยแล้ว (Ref: ${newRef})`, 'info')
    inputRefs.current[0]?.focus()
  }

  const handleQuickFill = () => {
    const chars = demoCode.split('')
    setOtpDigits(chars)
    verifyCode(demoCode)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative animate-scaleUp">
        
        {/* Header แถบสีแดง-สีกรมท่า สไตล์ Deves Security */}
        <div className="bg-gradient-to-r from-[#012169] via-[#001a52] to-[#8b0000] px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-300">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">ยืนยันตัวตนด้วยรหัส OTP</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white uppercase tracking-wider">
                  ลับมาก
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5 font-mono">
                เอกสารเลขที่: {docNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 text-xs text-amber-900 flex items-start gap-2.5">
            <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">มาตรการรักษาความปลอดภัยเอกสารลับมาก (BR-1.4-C)</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                ระบบได้ส่งรหัส OTP 6 หลัก ไปยังอีเมล <span className="font-bold text-amber-950">{userEmail}</span>
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-lg">
                <span>รหัสอ้างอิง: <strong>{refCode}</strong></span>
                <span>อายุรหัส: <strong className={timeLeft < 30 ? 'text-red-600 font-bold' : ''}>{formatTimer(timeLeft)}</strong></span>
              </div>
            </div>
          </div>

          {/* OTP 6 Digits Inputs */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
              กรุณากรอกรหัสยืนยัน 6 หลัก
            </label>
            <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { inputRefs.current[idx] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={attempts >= 3 || isVerifying}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className={`w-12 h-14 text-center text-2xl font-mono font-bold rounded-xl border-2 transition-all focus:outline-none ${
                    errorMsg
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : digit
                      ? 'border-[#012169] bg-blue-50/50 text-[#012169]'
                      : 'border-slate-300 bg-white hover:border-slate-400 focus:border-[#012169] focus:ring-4 focus:ring-[#012169]/10'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-4 text-xs text-red-700 font-medium flex items-center gap-2 animate-shake">
              <AlertCircle size={15} className="text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Demo Helper Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <KeyRound size={15} className="text-[#012169]" />
              <span>รหัสจำลอง (Demo): <strong className="font-mono text-[#012169] font-bold">{demoCode}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] font-bold text-[#012169] hover:underline bg-blue-100/70 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
            >
              กรอกอัตโนมัติ
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResend}
              disabled={timeLeft > 0 && attempts < 3}
              className={`text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                timeLeft === 0 || attempts >= 3
                  ? 'text-[#012169] hover:bg-blue-50'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw size={13} className={timeLeft === 0 ? 'animate-spin' : ''} />
              ส่งรหัสใหม่ ({formatTimer(timeLeft)})
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => verifyCode(otpDigits.join(''))}
                disabled={otpDigits.some(d => !d) || isVerifying || attempts >= 3}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#012169] text-white hover:bg-[#001a52] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    ยืนยันรหัส OTP
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}


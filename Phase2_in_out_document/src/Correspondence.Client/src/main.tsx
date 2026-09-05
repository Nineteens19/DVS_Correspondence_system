import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #dee2e6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px', fontWeight: 'bold' }}>!</div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', marginBottom: '8px' }}>เกิดข้อผิดพลาดในการโหลดหน้าจอ</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>{this.state.error?.message || 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ'}</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/'
              }}
              style={{ background: '#012169', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              กลับหน้าแรก
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              รีโหลดหน้านี้
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

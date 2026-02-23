'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import { useAlert } from '@/app/lib/alert-context'
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const router = useRouter()
  const { showAlert } = useAlert()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [touched, setTouched] = useState({
    email: false,
    password: false
  })

  const validateFields = () => {
    const errors = {}
    const emailTrimmed = email.trim()

    if (!emailTrimmed) {
      errors.email = 'กรุณากรอกอีเมล'
    } else if (!EMAIL_REGEX.test(emailTrimmed)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    }

    if (!password) {
      errors.password = 'กรุณากรอกรหัสผ่าน'
    } else if (password.length < 8) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    }

    return errors
  }

  const errors = validateFields()

  const handleSubmit = async (e) => {
    e.preventDefault()

    setTouched({
      email: true,
      password: true
    })

    if (Object.keys(errors).length > 0) {
      showAlert('กรุณาตรวจสอบข้อมูลให้ถูกต้อง', 'error')
      return
    }

    try {
      setIsLoading(true)

      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 403 && data.error === 'banned') {
          const reason = data.reason || 'ไม่ระบุเหตุผล'
          const expiresAt = data.expires_at
            ? ` (แบนถึงวันที่ ${new Date(data.expires_at).toLocaleDateString('th-TH')})`
            : ''
          showAlert(`บัญชีของคุณถูกระงับ เหตุผล: ${reason}${expiresAt}`, 'error')
          return
        }
        throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ')
      }

      login(data.user)
      showAlert('เข้าสู่ระบบสำเร็จ', 'success')
      router.push('/forum')
    } catch (err) {
      showAlert(err.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="container">
        <div className="card">
          <div className="icon">
            <LogIn size={24} />
          </div>

          <h1 className="title">เข้าสู่ระบบ</h1>
          <p className="subtitle">กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</p>

          <form className="form" onSubmit={handleSubmit}>
            <label htmlFor="email">อีเมล</label>
            <div className={`inputGroup ${touched.email && errors.email ? 'invalid' : ''}`}>
              <span>
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              />
            </div>
            {touched.email && errors.email ? <p className="errorText">{errors.email}</p> : null}

            <label htmlFor="password">รหัสผ่าน</label>
            <div className={`inputGroup ${touched.password && errors.password ? 'invalid' : ''}`}>
              <span>
                <Lock size={16} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="แสดงหรือซ่อนรหัสผ่าน"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {touched.password && errors.password ? <p className="errorText">{errors.password}</p> : null}

            <button className="loginBtn" type="submit" disabled={isLoading}>
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <p className="divider">หรือ</p>

          <div className="register">
            <p>
              ยังไม่มีบัญชี?
              {' '}
              <Link href="/register" className="register-link">
                สมัครสมาชิก
              </Link>
            </p>
          </div>
        </div>

        <footer className="footer">
          สงวนลิขสิทธิ์ 2025
        </footer>
      </div>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAlert } from '@/app/lib/alert-context'
import { CircleCheck, CircleX, Eye, EyeOff, Lock, Mail, UserPlus, UserRound } from 'lucide-react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const router = useRouter()
  const { showAlert } = useAlert()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedPolicy, setAcceptedPolicy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    acceptedPolicy: false
  })

  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password)
  }), [password])

  const passwordScore = Object.values(passwordChecks).filter(Boolean).length
  const passwordPercent = (passwordScore / 4) * 100
  const hasPasswordValue = Boolean(password)

  const validateFields = () => {
    const errors = {}
    const nameTrimmed = name.trim()
    const emailTrimmed = email.trim()
    const passwordValid = Object.values(passwordChecks).every(Boolean)

    if (!nameTrimmed) {
      errors.name = 'กรุณากรอกชื่อ-นามสกุล'
    }

    if (!emailTrimmed) {
      errors.email = 'กรุณากรอกอีเมล'
    } else if (!EMAIL_REGEX.test(emailTrimmed)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    }

    if (!password) {
      errors.password = 'กรุณากรอกรหัสผ่าน'
    } else if (!passwordValid) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'กรุณายืนยันรหัสผ่าน'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน'
    }

    if (!acceptedPolicy) {
      errors.acceptedPolicy = 'กรุณายอมรับเงื่อนไขการใช้งาน'
    }

    return errors
  }

  const errors = validateFields()

  const handleSubmit = async (e) => {
    e.preventDefault()

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      acceptedPolicy: true
    })

    if (Object.keys(errors).length > 0) {
      showAlert('กรุณาตรวจสอบข้อมูลให้ถูกต้อง', 'error')
      return
    }

    try {
      setIsLoading(true)

      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name.trim(),
          email: email.trim(),
          password
        })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'สมัครสมาชิกไม่สำเร็จ')
      }

      showAlert('สมัครสมาชิกสำเร็จ', 'success')
      router.push('/login')
    } catch (err) {
      showAlert(err.message || 'สมัครสมาชิกไม่สำเร็จ', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="container">
        <div className="registerHeader">
          <div className="registerHeaderIcon">
            <UserPlus size={28} />
          </div>
          <h1 className="registerTitle">สมัครสมาชิก</h1>
          <p className="registerSubtitle">สร้างบัญชีใหม่เพื่อเริ่มใช้งาน</p>
        </div>

        <div className="card">
          <form className="form" onSubmit={handleSubmit}>
            <label htmlFor="name">ชื่อ-นามสกุล</label>
            <div className={`inputGroup ${touched.name && errors.name ? 'invalid' : ''}`}>
              <span>
                <UserRound size={16} />
              </span>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                placeholder="กรอกชื่อ-นามสกุล"
              />
            </div>
            {touched.name && errors.name ? <p className="errorText">{errors.name}</p> : null}

            <label htmlFor="email">อีเมล</label>
            <div className={`inputGroup ${touched.email && errors.email ? 'invalid' : ''}`}>
              <span>
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                placeholder="กรอกอีเมล"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                placeholder="********"
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

            {hasPasswordValue ? (
              <div className="passwordStrengthWrap">
                <div className="passwordMeterTrack">
                  <div className="passwordMeterFill" style={{ width: `${passwordPercent}%` }} />
                </div>
                <span className="passwordMeterText">
                  {passwordScore <= 1 ? 'อ่อนมาก' : passwordScore <= 2 ? 'ปานกลาง' : 'ปลอดภัย'}
                </span>
              </div>
            ) : null}

            {hasPasswordValue ? (
              <div className="passwordRules">
                <div className={passwordChecks.minLength ? 'passwordRule valid' : 'passwordRule'}>
                  {passwordChecks.minLength ? <CircleCheck size={14} /> : <CircleX size={14} />}
                  <span>8 ตัวอักษรขึ้นไป</span>
                </div>
                <div className={passwordChecks.hasUpper ? 'passwordRule valid' : 'passwordRule'}>
                  {passwordChecks.hasUpper ? <CircleCheck size={14} /> : <CircleX size={14} />}
                  <span>ตัวพิมพ์ใหญ่</span>
                </div>
                <div className={passwordChecks.hasLower ? 'passwordRule valid' : 'passwordRule'}>
                  {passwordChecks.hasLower ? <CircleCheck size={14} /> : <CircleX size={14} />}
                  <span>ตัวพิมพ์เล็ก</span>
                </div>
                <div className={passwordChecks.hasNumber ? 'passwordRule valid' : 'passwordRule'}>
                  {passwordChecks.hasNumber ? <CircleCheck size={14} /> : <CircleX size={14} />}
                  <span>ตัวเลข</span>
                </div>
              </div>
            ) : null}
            {touched.password && errors.password ? <p className="errorText">{errors.password}</p> : null}

            <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
            <div className={`inputGroup ${touched.confirmPassword && errors.confirmPassword ? 'invalid' : ''}`}>
              <span>
                <Lock size={16} />
              </span>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                placeholder="********"
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label="แสดงหรือซ่อนยืนยันรหัสผ่าน"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword ? (
              <p className="errorText">{errors.confirmPassword}</p>
            ) : null}

            <label className="policyRow">
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                onBlur={() => setTouched((prev) => ({ ...prev, acceptedPolicy: true }))}
              />
              <span>
                ฉันยอมรับ
                {' '}
                <Link href="#" className="policyLink">ข้อกำหนดการใช้งาน</Link>
                {' '}
                และ
                {' '}
                <Link href="#" className="policyLink">นโยบายความเป็นส่วนตัว</Link>
              </span>
            </label>
            {touched.acceptedPolicy && errors.acceptedPolicy ? (
              <p className="errorText policyError">{errors.acceptedPolicy}</p>
            ) : null}

            <button className="registerBtn" type="submit" disabled={isLoading}>
              {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
            </button>
          </form>

          <p className="divider">หรือ</p>

          <div className="login">
            <p>
              มีบัญชีอยู่แล้ว?
              {' '}
              <Link href="/login" className="login-link">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

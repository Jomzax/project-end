'use client'

import './account.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  UserRound,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Save,
  CircleCheck,
  CircleX
} from 'lucide-react'
import { useAuth } from '@/app/lib/auth-context'
import { useAlert } from '@/app/lib/alert-context'

const MAX_AVATAR_SIZE = 1024 * 1024
const AVATAR_BUCKET_NAME = 'projectend4'
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
])

const normalizeAvatarSrc = (rawValue) => {
  const value = String(rawValue || '').trim()
  if (!value) return ''
  if (value.startsWith('blob:')) return value
  if (value.startsWith('/api/upload/avatar?key=')) return value
  if (value.startsWith('avatars/')) {
    return `/api/upload/avatar?key=${encodeURIComponent(value)}`
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      const marker = `/${AVATAR_BUCKET_NAME}/`
      const markerIndex = parsed.pathname.indexOf(marker)
      if (markerIndex >= 0) {
        const key = decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length))
        if (key) return `/api/upload/avatar?key=${encodeURIComponent(key)}`
      }
    } catch {
      return value
    }
  }

  return value
}

const getAvatarInitial = (rawValue) => {
  const text = String(rawValue || '').trim()
  if (!text) return 'U'

  const chars = Array.from(text.normalize('NFC'))
  const thaiConsonant = chars.find((ch) => /[ก-ฮ]/u.test(ch))
  if (thaiConsonant) return thaiConsonant

  const latinOrDigit = chars.find((ch) => /[A-Za-z0-9]/.test(ch))
  if (latinOrDigit) return latinOrDigit.toUpperCase()

  const firstLetterOrNumber = chars.find((ch) => /[\p{L}\p{N}]/u.test(ch))
  return firstLetterOrNumber ? firstLetterOrNumber.toUpperCase() : 'U'
}

export default function AccountPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const { showAlert } = useAlert()
  const fileInputRef = useRef(null)
  const blobPreviewRef = useRef('')

  const [username, setUsername] = useState('')
  const [initialUsername, setInitialUsername] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null)
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [touched, setTouched] = useState({
    username: false,
    newPassword: false,
    confirmPassword: false
  })
  const [usernameCheck, setUsernameCheck] = useState({
    status: 'idle',
    message: ''
  })

  const usernameTrimmed = username.trim()
  const initialUsernameTrimmed = initialUsername.trim()
  const isUsernameChanged = usernameTrimmed.toLowerCase() !== initialUsernameTrimmed.toLowerCase()
  const avatarSrc = normalizeAvatarSrc(avatarPreview || user?.avatar_url || user?.avatarUrl || '')
  const avatarInitial = getAvatarInitial(username || user?.username || user?.email || '')

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': String(user?.user_id || ''),
    'x-role': user?.role || ''
  })

  const passwordChecks = useMemo(() => ({
    minLength: newPassword.length >= 8,
    hasLower: /[a-z]/.test(newPassword),
    hasUpper: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword)
  }), [newPassword])

  const passwordScore = Object.values(passwordChecks).filter(Boolean).length
  const passwordPercent = (passwordScore / 4) * 100
  const hasPasswordValue = Boolean(newPassword)

  const validateFields = () => {
    const errors = {}
    const hasPasswordInput = Boolean(newPassword || confirmPassword)

    if (!usernameTrimmed) {
      errors.username = 'กรุณากรอกชื่อผู้ใช้'
    } else if (isUsernameChanged && usernameCheck.status === 'taken') {
      errors.username = 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว'
    } else if (isUsernameChanged && usernameCheck.status === 'checking') {
      errors.username = 'กำลังตรวจสอบชื่อผู้ใช้'
    }

    if (hasPasswordInput) {
      const passwordValid = Object.values(passwordChecks).every(Boolean)
      if (!newPassword) {
        errors.newPassword = 'กรุณากรอกรหัสผ่านใหม่'
      } else if (!passwordValid) {
        errors.newPassword = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร พร้อมพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข'
      }

      if (!confirmPassword) {
        errors.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่'
      } else if (newPassword !== confirmPassword) {
        errors.confirmPassword = 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน'
      }
    }

    return errors
  }

  const validationErrors = validateFields()

  const handleChooseAvatar = () => {
    fileInputRef.current?.click()
  }

  const uploadAvatarFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload/avatar', {
      method: 'POST',
      body: formData
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'อัปโหลดรูปไม่สำเร็จ')
    }
    return data.displayUrl || data.url || ''
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      showAlert('อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png, webp, gif, svg) เท่านั้น', 'error')
      event.target.value = ''
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      showAlert('ขนาดรูปต้องไม่เกิน 1MB', 'error')
      event.target.value = ''
      return
    }

    if (blobPreviewRef.current) {
      URL.revokeObjectURL(blobPreviewRef.current)
      blobPreviewRef.current = ''
    }

    const localPreview = URL.createObjectURL(file)
    blobPreviewRef.current = localPreview
    setAvatarLoadFailed(false)
    setAvatarPreview(localPreview)
    setPendingAvatarFile(file)
    event.target.value = ''
  }

  const loadProfile = async () => {
    if (!user?.user_id) return
    try {
      const res = await fetch('http://localhost:5000/api/user/me', {
        method: 'GET',
        headers: getAuthHeaders()
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'โหลดข้อมูลบัญชีไม่สำเร็จ')

      const nextUsername = data.user?.username || user.username || ''
      setUsername(nextUsername)
      setInitialUsername(nextUsername)
      setEmail(data.user?.email || user.email || '')
      const remoteAvatar = data.user?.avatar_url || data.user?.avatarUrl
      if (remoteAvatar) {
        setAvatarPreview(remoteAvatar)
        setAvatarLoadFailed(false)
      }
    } catch (err) {
      showAlert(err.message || 'โหลดข้อมูลบัญชีไม่สำเร็จ', 'error')
    }
  }

  useEffect(() => {
    if (!user?.user_id) return
    if (!usernameTrimmed || !isUsernameChanged) {
      setUsernameCheck({ status: 'idle', message: '' })
      return
    }

    const timer = setTimeout(async () => {
      try {
        setUsernameCheck({ status: 'checking', message: 'กำลังตรวจสอบชื่อผู้ใช้...' })
        const query = encodeURIComponent(usernameTrimmed)
        const res = await fetch(`http://localhost:5000/api/user/check-username?username=${query}`, {
          method: 'GET',
          headers: getAuthHeaders()
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'ไม่สามารถตรวจสอบชื่อผู้ใช้ได้')

        if (data.available) {
          setUsernameCheck({ status: 'available', message: 'ชื่อผู้ใช้นี้สามารถใช้งานได้' })
        } else {
          setUsernameCheck({ status: 'taken', message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' })
        }
      } catch (err) {
        setUsernameCheck({
          status: 'error',
          message: err.message || 'ไม่สามารถตรวจสอบชื่อผู้ใช้ได้'
        })
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [usernameTrimmed, isUsernameChanged, user?.user_id])

  const handleSave = async (event) => {
    event.preventDefault()

    if (!user?.user_id) {
      showAlert('กรุณาเข้าสู่ระบบก่อน', 'error')
      router.push('/login')
      return
    }

    setTouched({
      username: true,
      newPassword: true,
      confirmPassword: true
    })

    const errors = validateFields()
    if (Object.keys(errors).length > 0) {
      showAlert(errors.username || errors.newPassword || errors.confirmPassword || 'กรุณาตรวจสอบข้อมูล', 'error')
      return
    }

    try {
      setIsSaving(true)
      let uploadedAvatarSrc = ''

      if (pendingAvatarFile) {
        setIsAvatarUploading(true)
        uploadedAvatarSrc = await uploadAvatarFile(pendingAvatarFile)
        setAvatarPreview(uploadedAvatarSrc)
        setAvatarLoadFailed(false)
        setPendingAvatarFile(null)
        if (blobPreviewRef.current) {
          URL.revokeObjectURL(blobPreviewRef.current)
          blobPreviewRef.current = ''
        }
      }

      const payload = {
        username: usernameTrimmed,
        ...(newPassword ? { newPassword, confirmPassword } : {})
      }

      const res = await fetch('http://localhost:5000/api/user/me', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'บันทึกข้อมูลไม่สำเร็จ')

      if (data.user) {
        const currentAvatar = avatarPreview || user?.avatar_url || user?.avatarUrl || ''
        const backendAvatar = data.user.avatar_url || data.user.avatarUrl || ''
        const nextAvatar = backendAvatar || uploadedAvatarSrc || currentAvatar
        const mergedUser = {
          ...data.user,
          ...(nextAvatar ? { avatar_url: nextAvatar, avatarUrl: nextAvatar } : {})
        }

        login(mergedUser)
        setUsername(mergedUser.username || '')
        setInitialUsername(mergedUser.username || '')
        setEmail(mergedUser.email || '')
        if (nextAvatar) {
          setAvatarPreview(nextAvatar)
          setAvatarLoadFailed(false)
        }
      }

      setNewPassword('')
      setConfirmPassword('')
      setTouched({
        username: false,
        newPassword: false,
        confirmPassword: false
      })
      setUsernameCheck({ status: 'idle', message: '' })
      showAlert('อัปเดตบัญชีสำเร็จ', 'success')
    } catch (err) {
      showAlert(err.message || 'บันทึกข้อมูลไม่สำเร็จ', 'error')
    } finally {
      setIsAvatarUploading(false)
      setIsSaving(false)
    }
  }

  useEffect(() => {
    document.documentElement.classList.add('account-html')
    document.body.classList.add('account-body')
    return () => {
      document.documentElement.classList.remove('account-html')
      document.body.classList.remove('account-body')
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) {
      showAlert('กรุณาเข้าสู่ระบบก่อน', 'error')
      router.push('/login')
      return
    }

    const nextUsername = user.username || ''
    setUsername(nextUsername)
    setInitialUsername(nextUsername)
    setEmail(user.email || '')
    setAvatarPreview((prev) => user.avatar_url || user.avatarUrl || prev || '')
    setAvatarLoadFailed(false)
    loadProfile()
  }, [loading, user])

  useEffect(() => () => {
    if (blobPreviewRef.current) {
      URL.revokeObjectURL(blobPreviewRef.current)
    }
  }, [])

  return (
    <div className="account-page">
      <div className="account-shell">
        <header className="account-topbar">
          <button
            type="button"
            className="account-back-btn"
            onClick={() => window.history.back()}
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft size={20} />
          </button>
          <h1>ตั้งค่าบัญชี</h1>
        </header>

        <main className="account-content">
          <form onSubmit={handleSave} className="account-form">
            <section className="account-card">
              <div className="account-card-title-wrap">
                <div className="account-card-icon">
                  <UserRound size={16} />
                </div>
                <div>
                  <h2>โปรไฟล์</h2>
                  <p>{email}</p>
                </div>
              </div>

              <div className="avatar-block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  className="avatar-input"
                  onChange={handleAvatarChange}
                />

                <button
                  type="button"
                  className="avatar-circle"
                  onClick={handleChooseAvatar}
                >
                  {avatarSrc && !avatarLoadFailed ? (
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="avatar-image"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  ) : (
                    <span className="avatar-fallback">{avatarInitial}</span>
                  )}
                  <span className="avatar-camera">
                    <Camera size={14} />
                  </span>
                </button>

                <p className="avatar-hint">
                  {isAvatarUploading
                    ? 'กำลังอัปโหลดรูป...'
                    : pendingAvatarFile
                      ? 'เลือกรูปแล้ว กดบันทึกเพื่ออัปโหลด'
                      : 'คลิกเพื่อเปลี่ยนรูปโปรไฟล์ (เฉพาะไฟล์รูปภาพไม่เกิน 1MB)'}
                </p>
              </div>

              <div className="field-group username-field-group">
                <label htmlFor="username">ชื่อผู้ใช้</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                  className={touched.username && validationErrors.username ? 'field-invalid' : ''}
                />
                {touched.username && validationErrors.username ? (
                  <p className="field-error-text">{validationErrors.username}</p>
                ) : null}
                {!validationErrors.username && isUsernameChanged && usernameCheck.message ? (
                  <p className={`field-help-text ${usernameCheck.status}`}>{usernameCheck.message}</p>
                ) : null}
              </div>
            </section>

            <section className="account-card">
              <div className="account-card-title-wrap">
                <div className="account-card-icon">
                  <Lock size={16} />
                </div>
                <div>
                  <h2>เปลี่ยนรหัสผ่าน</h2>
                  <p>เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน</p>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="new-password">รหัสผ่านใหม่</label>
                <div className="field-with-icon">
                  <span className="field-leading-icon"><Lock size={16} /></span>
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, newPassword: true }))}
                    placeholder="********"
                    className={touched.newPassword && validationErrors.newPassword ? 'field-invalid' : ''}
                  />
                  <button
                    type="button"
                    className="field-toggle-icon"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label="แสดงหรือซ่อนรหัสผ่านใหม่"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

                {touched.newPassword && validationErrors.newPassword ? (
                  <p className="field-error-text">{validationErrors.newPassword}</p>
                ) : null}
              </div>

              <div className="field-group">
                <label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</label>
                <div className="field-with-icon">
                  <span className="field-leading-icon"><Lock size={16} /></span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                    placeholder="********"
                    className={touched.confirmPassword && validationErrors.confirmPassword ? 'field-invalid' : ''}
                  />
                  <button
                    type="button"
                    className="field-toggle-icon"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label="แสดงหรือซ่อนการยืนยันรหัสผ่าน"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.confirmPassword && validationErrors.confirmPassword ? (
                  <p className="field-error-text">{validationErrors.confirmPassword}</p>
                ) : null}
              </div>
            </section>

            <button type="submit" className="account-save-btn" disabled={isSaving || isAvatarUploading}>
              <Save size={15} />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}

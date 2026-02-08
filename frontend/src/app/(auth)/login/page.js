'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      alert('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }

    try {
      setIsLoading(true)

      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ')
      }

      
      login(data.user); // 👈 ใช้ data.user ตรง ๆ  // บันทึกข้อมูลผู้ใช้ใน context

      alert('เข้าสู่ระบบสำเร็จ 🎉')
      
    
      // 👉 ไปหน้า forum
      router.push('/forum')

    } catch (err) {
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="container">
        <div className="card">
          <div className="icon">➜</div>

          <h1 className="title">เข้าสู่ระบบ</h1>
          <p className="subtitle">กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</p>

          <form className="form" onSubmit={handleSubmit}>
            <label>อีเมล</label>
            <div className="inputGroup">
              <span>✉️</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <label>รหัสผ่าน</label>
            <div className="inputGroup">
              <span>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                👁
              </button>
            </div>

            <div className="remember">
              <input type="checkbox" />
              <span>จดจำฉัน</span>
            </div>

            <button
              className="loginBtn"
              type="submit"
              onClick={handleSubmit}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : '➜ เข้าสู่ระบบ'}
            </button>
          </form>

          <p className="divider">หรือ</p>

          <div className="register">
            <p>
              ยังไม่มีบัญชี? <span>👤</span>
              <Link href="/register" className="register-link">
                สมัครสมาชิก
              </Link>
            </p>
          </div>
        </div>

        <footer className="footer">
          © 2025 Your Company. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

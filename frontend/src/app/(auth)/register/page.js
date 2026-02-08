'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'


export default function RegirsterPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!name || !email || !password || !confirmPassword) {
            alert('กรุณากรอกข้อมูลให้ครบ')
            return
        }

        if (password !== confirmPassword) {
            alert('รหัสผ่านไม่ตรงกัน')
            return
        }

        try {
            setIsLoading(true)

            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: name,
                    email,
                    password
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'สมัครสมาชิกไม่สำเร็จ')
            }

            alert('สมัครสมาชิกสำเร็จ 🎉')
            router.push('/login')

        } catch (err) {
            alert(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="register-page">
            <div className="container">
                <div className="icon">👤</div>
                <h1 className="title">สมัครสมาชิก</h1>
                <p className="subtitle">สร้างบัญชีใหม่เพื่อเริ่มใช้งาน</p>

                <div className="card">
                    <form className="form">
                        <label>ชื่อ-นามสกุล</label>
                        <div className="inputGroup">
                            <span>👤</span>
                            <input
                                type="text"
                                placeholder="กรอกชื่อ-นามสกุล"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <label>อีเมล</label>
                        <div className="inputGroup">
                            <span>✉️</span>
                            <input
                                type="email"
                                placeholder="กรอกอีเมล์"
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

                        <label>ยืนยันรหัสผ่าน</label>
                        <div className="inputGroup">
                            <span>🔒</span>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="eye"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                👁
                            </button>
                        </div>

                        <button
                            className="registerBtn"
                            type="submit"
                            onClick={handleSubmit}
                        >
                            {isLoading ? 'กำลังสมัคร...' : '➜ สมัครสมาชิก'}
                        </button>
                    </form>

                    <p className="divider">หรือ</p>

                    <div className="login">
                        <p>
                            มีบัญชีอยู่แล้ว? <span>👤</span>
                            <Link href="/login" className="login-link">
                                เข้าสู่ระบบ
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

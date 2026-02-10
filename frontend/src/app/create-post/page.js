'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import './create-post.css'

export default function CreatePostPage() {
    const router = useRouter()
    const textareaRef = useRef(null)
    const [count, setCount] = useState(0)
    const maxLength = 10000

    const handleInput = (e) => {
        const el = textareaRef.current
        if (!el) return

        // auto resize (เหมือน ChatGPT)
        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'

        // count character
        setCount(e.target.value.length)
    }

    return (
        <div className="container">
            <div className="create-post-container">
                <div className="create-post-page">

                    {/* ===== Header ===== */}
                    <div className="create-post-header">
                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h5>สร้างกระทู้ใหม่</h5>
                    </div>

                    {/* ===== Form Card ===== */}
                    <div className="card create-post-card">
                        <div className="card-body">
                            <form>
                                {/* หมวดหมู่ */}
                                <div className="form-group">
                                    <label>
                                        หมวดหมู่ <span className="required">*</span>
                                    </label>

                                    <div className="select-wrapper">
                                        <select className="form-control">
                                            <option value="">เลือกหมวดหมู่</option>
                                            <option>ทั่วไป</option>
                                            <option>คำถาม</option>
                                            <option>แชร์ประสบการณ์</option>
                                        </select>
                                    </div>
                                </div>

                                {/* หัวข้อ */}
                                <div className="form-group">
                                    <label>
                                        หัวข้อกระทู้ <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="พิมพ์หัวข้อกระทู้ที่น่าสนใจ..."
                                        maxLength={200}
                                    />
                                    <div className="char-count">0/200</div>
                                </div>

                                <div className="form-group">
                                    <label>
                                        เนื้อหา <span className="required">*</span>
                                    </label>

                                    <textarea
                                        ref={textareaRef}
                                        className="form-control content-textarea"
                                        placeholder="เขียนเนื้อหากระทู้ของคุณที่นี่... แชร์ความคิดเห็น ถามคำถาม หรือแบ่งปันประสบการณ์"
                                        maxLength={maxLength}
                                        onInput={handleInput}
                                    />

                                    <div className="char-count">
                                        {count.toLocaleString()}/{maxLength.toLocaleString()}
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => router.back()}
                                    >
                                        ยกเลิก
                                    </button>

                                    <button type="submit" className="btn-submit">
                                        <Send size={16} />
                                        สร้างกระทู้
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>

                    {/* ===== Tips ===== */}
                    <div className="tips-box">
                        <h6>💡 เคล็ดลับการเขียนกระทู้ที่ดี</h6>
                        <ul>
                            <li>ตั้งหัวข้อให้ชัดเจนและน่าสนใจ</li>
                            <li>เขียนเนื้อหาให้ละเอียดและตรงประเด็น</li>
                            <li>เลือกหมวดหมู่ให้ตรงกับเนื้อหา</li>
                            <li>ตรวจสอบการสะกดคำก่อนโพสต์</li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    )
}

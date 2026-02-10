'use client'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import './create-post.css'

export default function CreatePostPage() {
    const router = useRouter()
    const textareaRef = useRef(null)
    const [titleCount, setTitleCount] = useState(0)
    const [contentCount, setContentCount] = useState(0)
    const [categoryId, setCategoryId] = useState("")
    const [categories, setCategories] = useState([])

    const [search, setSearch] = useState("")
    const maxLength = 10000
    const maxLengthtit = 200

    const handleContentInput = (e) => {
        const el = textareaRef.current
        if (!el) return

        // auto resize (เหมือน ChatGPT)
        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'

        // count character
        setContentCount(e.target.value.length)
    }

    const handleTitleInput = (e) => {
        setTitleCount(e.target.value.length)
    }

    const filteredCategories = categories
        .filter(cat =>
            cat.name.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 20) // จำกัดไม่เกิน 20 รายการ

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/category/dropdown")
                const json = await res.json()

                if (json.success) {
                    setCategories(json.data)
                }
            } catch (err) {
                console.error("โหลดหมวดหมู่ไม่สำเร็จ", err)
            }
        }

        fetchCategories()
    }, [])

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

                                    {/* input สำหรับค้นหา + แสดงค่าที่เลือก */}
                                    <div className="form-group">
                                        <label className="form-label">
                                            หมวดหมู่ <span className="text-danger">*</span>
                                        </label>

                                        <div className="dropdown w-100">
                                            {/* ปุ่ม dropdown */}
                                            <button
                                                className="btn btn-outline-secondary dropdown-toggle w-100 d-flex justify-content-between align-items-center"
                                                type="button"
                                                data-bs-toggle="dropdown"
                                                aria-expanded="false"
                                            >
                                                {categoryId
                                                    ? categories.find(c => c.category_id === categoryId)?.name
                                                    : "เลือกหมวดหมู่"}
                                            </button>

                                            {/* เมนู dropdown */}
                                            <div className="dropdown-menu w-100 p-2">
                                                {/* ช่องค้นหา */}
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    placeholder="ค้นหาหมวดหมู่..."
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()} // ❗ สำคัญ
                                                />

                                                {/* รายการหมวด */}
                                                <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                                                    {filteredCategories.length === 0 && (
                                                        <div className="dropdown-item text-muted">
                                                            ไม่พบหมวดหมู่
                                                        </div>
                                                    )}

                                                    {filteredCategories.map(cat => (
                                                        <button
                                                            key={cat.category_id}
                                                            className="dropdown-item"
                                                            type="button"
                                                            onClick={() => {
                                                                setCategoryId(cat.category_id)
                                                            }}
                                                        >
                                                            {cat.name}
                                                        </button>
                                                    ))}
                                                </div>

                                                {filteredCategories.length === 20 && (
                                                    <div
                                                        className="px-3 py-2 text-muted small"
                                                        style={{ pointerEvents: "none" }}
                                                    >
                                                        แสดงสูงสุด 20 หมวด — ใช้ค้นหาเพิ่ม
                                                    </div>
                                                )}

                                            </div>
                                        </div>
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
                                        maxLength={maxLengthtit}
                                        onInput={handleTitleInput}
                                    />
                                    <div className="char-count">
                                        {titleCount.toLocaleString()}/{maxLengthtit.toLocaleString()}
                                    </div>
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
                                        onInput={handleContentInput}
                                    />

                                    <div className="char-count">
                                        {contentCount.toLocaleString()}/{maxLength.toLocaleString()}
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

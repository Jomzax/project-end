'use client'
import { useRef, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import { useAlert } from '@/app/lib/alert-context'
import { ArrowLeft, Send } from 'lucide-react'
import * as Icons from 'lucide-react'
import './create-post.css'

export default function CreatePostPage() {

    const { user } = useAuth()
    const { showAlert } = useAlert()
    const router = useRouter()
    const textareaRef = useRef(null)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [categories, setCategories] = useState([])
    const [titleCount, setTitleCount] = useState(0)
    const [contentCount, setContentCount] = useState(0)
    const searchParams = useSearchParams()
    const editId = searchParams.get("id")
    const isEdit = !!editId
    const [search, setSearch] = useState("")
    const maxLength = 10000
    const maxLengthtit = 200
    const filteredCategories = categories
        .filter(cat =>
            cat.name.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 20) // จำกัดไม่เกิน 20 รายการ

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!user) {
            showAlert("กรุณาเข้าสู่ระบบ", 'error')
            return
        }

        if (!categoryId || !title || !content) {
            showAlert("กรอกข้อมูลให้ครบ", 'warning')
            return
        }

        try {


            // ✏️ EDIT MODE
            if (isEdit) {
                const res = await fetch(`http://localhost:5000/api/discussion/${editId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: title,
                        detail: content,
                        category_id: categoryId
                    })
                })

                if (res.ok) {
                    showAlert("แก้ไขกระทู้สำเร็จ", 'success')
                    setTimeout(() => router.replace(`/post/${editId}`), 500)
                } else {
                    showAlert("แก้ไขกระทู้ไม่สำเร็จ", 'error')
                }

                return
            }

            // 🆕 CREATE MODE
            const res = await fetch("http://localhost:5000/api/discussion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: user.user_id,
                    category_id: categoryId,
                    title: title,
                    detail: content
                })
            })

            if (res.ok) {
                showAlert("สร้างกระทู้สำเร็จ", 'success')
                setTimeout(() => router.push("/forum"), 500)
            } else {
                showAlert("สร้างกระทู้ไม่สำเร็จ", 'error')
            }

        } catch (err) {
            console.error(err)
            showAlert("เกิดข้อผิดพลาด: " + err.message, 'error')
        }
    }


    useEffect(() => {
        if (!isEdit) return

        const loadPost = async () => {
            try {
                const metaRes = await fetch(`http://localhost:5000/api/discussion/${editId}`)
                const meta = await metaRes.json()

                const detailRes = await fetch(`http://localhost:5000/api/discussion/${editId}/detail`)
                const detail = await detailRes.json()

                setTitle(meta.title)
                setContent(detail.data.detail)
                setCategoryId(meta.category_id)

                setTitleCount(meta.title.length)
                setContentCount(detail.data.detail.length)

            } catch (err) {
                console.error(err)
            }
        }

        loadPost()
    }, [editId])

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
                            onClick={() => router.push("/forum")}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h5>{isEdit ? "แก้ไขกระทู้" : "สร้างกระทู้ใหม่"}</h5>
                    </div>

                    {/* ===== Form Card ===== */}
                    <div className="card create-post-card">
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
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
                                                {categoryId ? (() => {
                                                    const selected = categories.find(c => c.category_id === categoryId)
                                                    if (!selected) return "เลือกหมวดหมู่"

                                                    const IconComponent = Icons[selected.icon] || Icons.MessageSquare

                                                    return (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <IconComponent size={16} color={selected.color} />
                                                            {selected.name}
                                                        </div>
                                                    )
                                                })() : "เลือกหมวดหมู่"}
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

                                                    {filteredCategories.map(cat => {
                                                        const IconComponent = Icons[cat.icon] || Icons.MessageSquare

                                                        return (
                                                            <button
                                                                key={cat.category_id}
                                                                className="dropdown-item d-flex align-items-center gap-2"
                                                                type="button"
                                                                onClick={() => {
                                                                    setCategoryId(cat.category_id)
                                                                }}
                                                            >
                                                                <IconComponent size={16} color={cat.color} />
                                                                {cat.name}
                                                            </button>
                                                        )
                                                    })}
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
                                        value={title}   // 👈 เพิ่มบรรทัดนี้
                                        placeholder="พิมพ์หัวข้อกระทู้ที่น่าสนใจ..."
                                        maxLength={maxLengthtit}
                                        onChange={(e) => {
                                            setTitle(e.target.value)
                                            setTitleCount(e.target.value.length)
                                        }}
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
                                        placeholder="เขียนเนื้อหากระทู้ของคุณที่นี่..."
                                        maxLength={maxLength}
                                        value={content}
                                        onChange={(e) => {
                                            setContent(e.target.value)
                                            setContentCount(e.target.value.length)

                                            const el = textareaRef.current
                                            if (!el) return
                                            el.style.height = 'auto'
                                            el.style.height = el.scrollHeight + 'px'
                                        }}
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
                                        {isEdit ? "บันทึกการแก้ไข" : "สร้างกระทู้"}
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

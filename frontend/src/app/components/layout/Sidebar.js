'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, User } from 'lucide-react'
import { useAuth } from '@/app/lib/auth-context'
import '../styles/Sidebar.css'

export default function Sidebar({
    categories = [],
    selectedCategory,
    setSelectedCategory,
}) {
    const { user } = useAuth()
    const [query, setQuery] = useState('')

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(query.toLowerCase())
    )

    return (
        <aside>
            <div className="card shadow-sm forum-sidebar">
                <div className="card-body forum-sidebar-body">

                    {/* Title */}
                    <h6 className="fw-bold mb-3">หมวดหมู่</h6>

                    {/* Search */}
                    <div className="mb-3 position-relative">
                        <Search size={16} className="forum-search-icon" />
                        <input
                            type="text"
                            className="form-control ps-5"
                            placeholder="ค้นหาหมวดหมู่..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    {/* Category list */}
                    <div className="forum-category-list mb-4">
                        {filteredCategories.length === 0 && (
                            <div className="text-center text-muted py-3">
                                ไม่พบหมวดหมู่
                            </div>
                        )}

                        <div className="list-group list-group-flush">
                            {filteredCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`list-group-item list-group-item-action forum-category-btn
                    ${selectedCategory === cat.name ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedCategory?.(cat.name)
                                        setQuery('')
                                    }}
                                >
                                    <span className="me-2">{cat.icon}</span>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Guest CTA */}
                    {!user && (
                        <div className="forum-guest-box">
                            <h6 className="fw-semibold mb-2">เข้าร่วมชุมชน</h6>
                            <p className="small text-muted mb-3">
                                เข้าสู่ระบบเพื่อสร้างกระทู้ ไลค์ และแสดงความคิดเห็น
                            </p>

                            <Link
                                href="/login"
                                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                            >
                                <User size={16} />
                                เข้าสู่ระบบ
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </aside>
    )
}

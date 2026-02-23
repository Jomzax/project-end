'use client'

import { useState } from 'react'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import '../styles/Sidebar.css'

export default function Sidebar({ categories = [] }) {
  const router = useRouter()
  const { slug } = useParams()
  const UserIcon = Icons.User
  const SearchIcon = Icons.Search
  const { user } = useAuth()
  const [query, setQuery] = useState('')

  const isSearching = query.trim().length > 0
  const filteredCategories = categories
    .filter((cat) => cat.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20) // จำกัดสูงสุด 20 รายการ

  return (
    <aside>
      <div className="card shadow-sm forum-sidebar">
        <div className="card-body forum-sidebar-body">
          <h6 className="fw-bold mb-3">หมวดหมู่</h6>

          <div className="mb-3 position-relative">
            <SearchIcon size={16} className="forum-search-icon" />
            <input
              type="text"
              className="form-control forum-search-input"
              placeholder="ค้นหาหมวดหมู่..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="forum-category-list mb-4">
            {filteredCategories.length === 0 && (
              <div className="text-center text-muted py-3">ไม่พบหมวดหมู่</div>
            )}

            <div className="list-group list-group-flush">
              {!isSearching && (
                <button
                  type="button"
                  className={`list-group-item list-group-item-action forum-category-btn ${!slug ? 'active' : ''}`}
                  onClick={() => {
                    router.push('/forum')
                    setQuery('')
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <Icons.Home size={16} />
                    <span>ทั้งหมด</span>
                  </div>
                </button>
              )}

              {filteredCategories.map((cat) => {
                const IconComponent = Icons[cat.icon] || Icons.MessageSquare

                return (
                  <button
                    key={cat.category_id}
                    type="button"
                    className={`list-group-item list-group-item-action forum-category-btn ${slug === cat.slug ? 'active' : ''}`}
                    onClick={() => {
                      router.push(`/forum/${cat.slug}`)
                      setQuery('')
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <IconComponent size={16} color={cat.color} />
                      <span>{cat.name}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {filteredCategories.length === 20 && (
              <div className="px-3 py-2 text-muted small" style={{ pointerEvents: 'none' }}>
                แสดงสูงสุด 20 หมวด - ใช้ค้นหาเพิ่ม
              </div>
            )}
          </div>

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
                <UserIcon size={16} />
                เข้าสู่ระบบ
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
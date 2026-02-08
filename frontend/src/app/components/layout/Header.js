'use client'

import Link from 'next/link'
import '../styles/Header.css'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import {
  MessageSquare,
  Search,
  User,
  Plus,
  Shield,
  LogOut,
  Menu,
} from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const isLoggedIn = !!user
  const isAdmin = user?.role === 'admin'
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.replace('/')
  }

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="forum-header py-3">
        <div className="container-fluid d-flex align-items-center px-2 px-md-4">

          {/* ===== LEFT ===== */}
          <div className="d-flex align-items-center gap-2 gap-md-3 me-2 me-md-3">
            {/* Mobile Sidebar Toggle */}
            <button
              type="button"
              className="btn btn-outline-primary d-lg-none sidebar-toggle"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileSidebar"
              aria-controls="mobileSidebar"
              title="หมวดหมู่"
            >
              <Menu size={20} />
            </button>

            {/* Logo */}
            <Link href="/forum" className="d-flex align-items-center gap-2 logo-link">
              <div className="logo-icon d-flex align-items-center justify-content-center">
                <MessageSquare size={20} color="white" />
              </div>
              <span className="logo-text d-none d-sm-block">TalkBoard</span>
            </Link>
          </div>

          {/* ===== CENTER (Desktop Search) ===== */}
          <div className="search-wrapper d-none d-md-block mx-auto">
            <div className="position-relative">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="ค้นหากระทู้..."
                className="form-control search-input"
              />
            </div>
          </div>

          {/* ===== RIGHT ===== */}
          <div className="d-flex align-items-center gap-1 gap-sm-2 gap-lg-3 ms-auto">

            {/* Mobile Search Icon */}
            <button
              type="button"
              className="btn btn-light d-md-none rounded-circle"
              data-bs-toggle="modal"
              data-bs-target="#mobileSearchModal"
              title="ค้นหา"
            >
              <Search size={18} />
            </button>

            {isLoggedIn ? (
              <div className="d-flex align-items-center">

                {/* Create Post */}
                <div className="me-2 me-lg-3 d-flex align-items-center">
                  <Link
                    href="/create-post"
                    className="btn btn-primary d-none d-sm-flex align-items-center gap-2 rounded-pill shadow"
                  >
                    <Plus size={16} />
                    <span>สร้างกระทู้</span>
                  </Link>

                  <Link
                    href="/create-post"
                    className="btn btn-primary d-sm-none rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 40, height: 40 }}
                  >
                    <Plus size={20} />
                  </Link>
                </div>

                <span className="text-muted d-none d-sm-inline mx-1 mx-md-2">|</span>

                <div className="d-flex align-items-center gap-1 gap-md-2 gap-lg-3">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="p-2 rounded-circle hover-bg-light"
                      title="Admin Dashboard"
                    >
                      <Shield size={18} />
                    </Link>
                  )}

                  <Link
                    href="/account"
                    className="rounded-circle d-flex align-items-center justify-content-center avatar-btn"
                    title="บัญชีของฉัน"
                  >
                    <span className="fw-bold text-dark fs-6">
                      {user?.username?.charAt(0)?.toUpperCase()}
                    </span>
                  </Link>

                  {/* Logout*/}
                  <button
                    type="button"
                    className="btn btn-light d-flex align-items-center justify-content-center"
                    title="ออกจากระบบ"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary rounded-pill d-flex align-items-center gap-2"
              >
                <User size={16} />
                <span className="d-none d-sm-inline">เข้าสู่ระบบ</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ================= MOBILE SEARCH MODAL ================= */}
      <div
        className="modal fade"
        id="mobileSearchModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0">
              <h5 className="modal-title">ค้นหากระทู้</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>

            <div className="modal-body">
              <div className="position-relative">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="พิมพ์เพื่อค้นหา..."
                  autoFocus
                />
              </div>
              <button
                type="button"
                className="btn btn-primary w-100 mt-3"
                data-bs-dismiss="modal"
              >
                ค้นหา
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

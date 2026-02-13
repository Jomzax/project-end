'use client'

import '../page.forum.css'
import Link from 'next/link'
import { useAuth } from '@/app/lib/auth-context'
import { useEffect, useState } from 'react'
import { MessageCircle, ThumbsUp, Eye, Calendar, ChevronRight, User, Shield } from 'lucide-react'

export default function ForumPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState([])
  const [hasNext, setHasNext] = useState(false)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/discussion?page=${page}`)
        const data = await res.json()

        if (data.success) {
          setPosts(data.data)
          setHasNext(data.hasNext)
        }
      } catch (err) {
        console.error('โหลดกระทู้ไม่สำเร็จ', err)
      }
    }

    fetchPosts()
  }, [page])

  return (
    <div className="forum-main-content">

      {/* ===== WELCOME BOX ===== */}
      <div className="welcome-box mb-4">
        {!user ? (
          <>
            <h5>ยินดีต้อนรับสู่ TalkBoard!</h5>
            <p>เข้าสู่ระบบเพื่อร่วมแบ่งปันเรื่องราว</p>
          </>
        ) : (
          <>
            <h5>สวัสดี, {user.username}!</h5>
          </>
        )}

        <div className="stats">
          <div>
            <strong>1</strong>
            <span>สมาชิก</span>
          </div>
          <div>
            <strong>567</strong>
            <span>กระทู้ใหม่</span>
          </div>
        </div>
      </div>

      {/* ===== POST LIST ===== */}
      {posts.map((post) => (
        <Link
          key={post.discussion_id}
          href={`/post/${post.discussion_id}`}
          className="post-card mb-3"

        >

          <div className="post-left-avatar">
            {post.username?.charAt(0).toUpperCase()}
          </div>

          <div className="post-content">

            {/* TOP ROW */}
            <div className="post-top">
              <span className="category-badge">{post.category}</span>
              <div className="post-date">
                <Calendar size={14} />
                <span>{new Date(post.created_at).toLocaleDateString('th-TH')}</span>
              </div>
            </div>

            <h6 className="post-title">{post.title}</h6>
            <p className="post-excerpt">{post.detail?.slice(0, 80)}...</p>

            {/* BOTTOM ROW */}
            <div className="post-bottom">
              <div className="post-meta">
                <span>{post.username}</span>
                {post.role === 'Admin' ? (
                  <span className="badge-admin">
                    <Shield size={12} />
                    Admin
                  </span>
                ) : (
                  <span className="badge-user">
                    <User size={12} />
                    User
                  </span>
                )}
              </div>

              <div className="post-stats">
                <span><ThumbsUp size={14} /> {post.like_count}</span>
                <span><MessageCircle size={14} /> {post.comment_count}</span>
                <span><Eye size={14} /> {post.view_count}</span>
              </div>
            </div>
          </div>
          {/* Arrow */}
          <div className="post-arrow">
            <ChevronRight size={20} />
          </div>

        </Link>
      ))}

      <nav className="pagination-wrapper">
        <ul className="pagination">

          <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
          </li>

          <li className="page-item active">
            <span className="page-link">{page}</span>
          </li>

          <li className={`page-item ${!hasNext ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNext}
            >
              Next
            </button>
          </li>

        </ul>
      </nav>


    </div>
  )
}

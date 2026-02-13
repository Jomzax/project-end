'use client'

import '../page.forum.css'
import Link from 'next/link'
import { useAuth } from '@/app/lib/auth-context'
import { MessageCircle, ThumbsUp, Eye, Calendar, ChevronRight, User, Shield } from 'lucide-react'

export default function ForumPage() {
  const { user } = useAuth()

  // 🔥 mock data ก่อน (ยังไม่ดึงจริง)
  const posts = [
    {
      id: 1,
      title: 'หัวข้อ',
      excerpt: 'ฟหกกกกกหกกกกก',
      category: 'อาหาร',
      author: 'da',
      role: 'User',
      date: '4/2/2569',
      likes: 0,
      comments: 0,
      views: 5,
    },
    {
      id: 2,
      title: 'หัวข้อ',
      excerpt: 'อย่างตัวอย่าง',
      category: 'เทคโนโลยี',
      author: 'ตัวอย่าง',
      role: 'Admin',
      date: '13/1/2569',
      likes: 1,
      comments: 2,
      views: 3,
    },
  ]

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
          key={post.id}
          href={`/post/${post.id}`}
          className="post-card mb-3"

        >

          <div className="post-left-avatar">
            {post.author.charAt(0).toUpperCase()}
          </div>

          <div className="post-content">

            {/* TOP ROW */}
            <div className="post-top">
              <span className="category-badge">{post.category}</span>
              <div className="post-date">
                <Calendar size={14} />
                <span>{post.date}</span>
              </div>
            </div>

            <h6 className="post-title">{post.title}</h6>
            <p className="post-excerpt">{post.excerpt}</p>

            {/* BOTTOM ROW */}
            <div className="post-bottom">

              <div className="post-meta">
                <span>{post.author}</span>
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
                <span><ThumbsUp size={14} /> {post.likes}</span>
                <span><MessageCircle size={14} /> {post.comments}</span>
                <span><Eye size={14} /> {post.views}</span>
              </div>
            </div>
          </div>
          {/* Arrow */}
          <div className="post-arrow">
            <ChevronRight size={20} />
          </div>

        </Link>
      ))}

    </div>
  )
}

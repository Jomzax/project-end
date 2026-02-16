'use client'

import '../../page.forum.css'
import Link from 'next/link'
import { useAuth } from '@/app/lib/auth-context'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MessageCircle, ThumbsUp, Eye, Calendar, ChevronRight, User, Shield, ArrowUpDown } from 'lucide-react'

export default function CategoryPage() {

  const { slug } = useParams()
  const { user } = useAuth()

  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState([])
  const [hasNext, setHasNext] = useState(false)
  const [sort, setSort] = useState('latest')
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/discussion?page=${page}&category=${slug}&sort=${sort}`
          + `${sort === 'user' && user ? `&user_id=${user.user_id}` : ''}`
        )

        const data = await res.json()

        if (data.success) {
          setPosts(data.data)
          setHasNext(data.hasNext)
          if (data.data.length > 0) {
            setCategoryName(data.data[0].category)
          }
        }

      } catch (err) {
        console.error(err)
      }
    }

    fetchPosts()
  }, [page, slug, sort])

  return (
    <div className="forum-main-content">

      <div className="welcome-box mb-4">
        <h5>หมวดหมู่: {categoryName}</h5>
      </div>

      {/* ===== SORT BAR ===== */}
      <div className="sort-bar mb-3 d-flex align-items-center gap-3">
        <ArrowUpDown size={14} />
        <span className="text-muted small"> เรียงตาม:</span>

        <button
          className={`sort-btn ${sort === 'latest' ? 'active' : ''}`}
          onClick={() => setSort('latest')}
        >
          <Calendar size={14} /> ล่าสุด
        </button>

        <button
          className={`sort-btn ${sort === 'likes' ? 'active' : ''}`}
          onClick={() => setSort('likes')}
        >
          <ThumbsUp size={14} /> ยอดไลค์
        </button>

        <button
          className={`sort-btn ${sort === 'comments' ? 'active' : ''}`}
          onClick={() => setSort('comments')}
        >
          <MessageCircle size={14} /> ความคิดเห็น
        </button>

        <button
          className={`sort-btn ${sort === 'views' ? 'active' : ''}`}
          onClick={() => setSort('views')}
        >
          <Eye size={14} /> ยอดวิว
        </button>

        {user && (
          <button
            className={`sort-btn ${sort === 'user' ? 'active' : ''}`}
            onClick={() => setSort('user')}
          >
            <User size={14} /> กระทู้ของฉัน
          </button>
        )}

      </div>

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

            <div className="post-top">
              <span className="category-badge">{post.category}</span>
              <div className="post-date">
                <Calendar size={14} />
                <span>{new Date(post.created_at).toLocaleDateString('th-TH')}</span>
              </div>
            </div>

            <h6 className="post-title">{post.title}</h6>

            <div className="post-bottom">
              <div className="post-meta">
                <span>{post.username}</span>
                {post.role === 'admin' ? (
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

          <div className="post-arrow">
            <ChevronRight size={20} />
          </div>

        </Link>
      ))}

    </div>
  )
}

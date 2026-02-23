'use client'

import '../../page.forum.css'
import Link from 'next/link'
import { useAuth } from '@/app/lib/auth-context'
import { getAvatarInitial, normalizeAvatarSrc, pickAvatar } from '@/app/lib/avatar'
import { usePathname, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { MessageCircle, ThumbsUp, Eye, Calendar, ChevronRight, User, Shield, ArrowUpDown, Pin, Flame } from 'lucide-react'

function PostAvatar({ post }) {
  const avatarSrc = normalizeAvatarSrc(pickAvatar(post))
  const avatarInitial = getAvatarInitial(post?.username || '')

  if (avatarSrc) {
    return (
      <>
        <img
          src={avatarSrc}
          alt={post?.username || 'avatar'}
          className="post-left-avatar-image"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
            const fallback = event.currentTarget.nextElementSibling
            if (fallback) fallback.style.display = 'flex'
          }}
        />
        <span className="post-left-avatar-fallback" style={{ display: 'none' }}>
          {avatarInitial}
        </span>
      </>
    )
  }

  return avatarInitial
}

export default function CategoryPage() {

  const { slug } = useParams()
  const pathname = usePathname()
  const { user } = useAuth()

  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState([])
  const [hasNext, setHasNext] = useState(false)
  const [sort, setSort] = useState('latest')
  const [categoryName, setCategoryName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSort = useCallback((newSort) => {
    setPage(1)
    setSort(newSort)
  }, [])

  useEffect(() => {
    if (!slug) return

    const fetchPosts = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(
          `http://localhost:5000/api/discussion?page=${page}&category=${encodeURIComponent(slug)}&sort=${sort}`
          + `${sort === 'user' && user ? `&user_id=${user.user_id}` : ''}`
        )

        const data = await res.json()

        if (data.success) {
          setPosts(data.data)
          setHasNext(data.hasNext)
          if (data.data.length > 0) {
            setCategoryName(data.data[0].category)
          }
        } else {
          setPosts([])
          setHasNext(false)
        }

      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [page, slug, sort, user])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem('forum:returnTo', pathname)
  }, [pathname])

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
          onClick={() => handleSort('latest')}
        >
          <Calendar size={14} /> ล่าสุด
        </button>

        <button
          className={`sort-btn ${sort === 'likes' ? 'active' : ''}`}
          onClick={() => handleSort('likes')}
        >
          <ThumbsUp size={14} /> ยอดไลค์
        </button>

        <button
          className={`sort-btn ${sort === 'comments' ? 'active' : ''}`}
          onClick={() => handleSort('comments')}
        >
          <MessageCircle size={14} /> ความคิดเห็น
        </button>

        <button
          className={`sort-btn ${sort === 'views' ? 'active' : ''}`}
          onClick={() => handleSort('views')}
        >
          <Eye size={14} /> ยอดวิว
        </button>

        {user && (
          <button
            className={`sort-btn ${sort === 'user' ? 'active' : ''}`}
            onClick={() => handleSort('user')}
          >
            <User size={14} /> กระทู้ของฉัน
          </button>
        )}

      </div>

      {isLoading && posts.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">กำลังโหลดกระทู้...</p>
        </div>
      ) : posts.map((post) => (
        <Link
          key={post.discussion_id}
          href={`/post/${post.discussion_id}?from=${encodeURIComponent(`/forum/${slug}`)}`}
          className="post-card mb-3"
        >
          <div className="post-left-avatar">
            <PostAvatar post={post} />
          </div>

          <div className="post-content">

            <div className="post-top">
              <div className="post-tags">
                {Number(post.is_pinned) === 1 && (
                  <span className="status-badge status-pin">
                    <Pin size={12} />
                    ปักหมุด
                  </span>
                )}
                {Number(post.is_hot) === 1 && (
                  <span className="status-badge status-hot">
                    <Flame size={12} />
                    มาแรง
                  </span>
                )}
                <span className="category-badge">{post.category}</span>
              </div>
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

'use client'

import '../page.forum.css'
import Link from 'next/link'
import { useAuth } from '@/app/lib/auth-context'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { MessageCircle, ThumbsUp, Eye, Calendar, ChevronRight, User, Shield, ArrowUpDown } from 'lucide-react'

export default function ForumPage() {
  /* ================= URL PARAMS ================= */
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() || ''
  const category = searchParams.get('category') || ''


  /* ================= STATE ================= */
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState([])
  const [sort, setSort] = useState('latest')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [hasNext, setHasNext] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [stats, setStats] = useState({
    users: 0,
    discussions: 0
  })

  /* ================= DEBOUNCE ================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 500)
    return () => clearTimeout(timer)
  }, [query])


  /* ================= FETCH POSTS ================= */
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/discussion?page=${page}`
          + `${debouncedQuery ? `&q=${debouncedQuery}` : ''}`
          + `${category ? `&category=${encodeURIComponent(category)}` : ''}`
          + `&sort=${sort}`
        )

        const data = await res.json()

        if (data.success) {
          setPosts(data.data)
          setHasNext(data.hasNext)
          setSuggestion(data.suggestion || null)
        }

      } catch (err) {
        console.error('โหลดกระทู้ไม่สำเร็จ', err)
      }
    }

    fetchPosts()

  }, [page, debouncedQuery, category, sort])

  /* ================= FETCH STATS ================= */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stats')
        const data = await res.json()

        if (data.success) {
          setStats({
            users: data.users,
            discussions: data.discussions
          })
        }
      } catch (err) {
        console.error('โหลดสถิติไม่สำเร็จ', err)
      }
    }

    fetchStats()
  }, [])


  /* ================= RESET PAGE ================= */
  useEffect(() => {
    setPage(1)
  }, [query, category])

  /* ================= HIGHLIGHT ================= */
  const highlightedPosts = useMemo(() => {

    if (!debouncedQuery) return posts

    const regex = new RegExp(`(${debouncedQuery})`, 'gi')

    return posts.map(post => ({
      ...post,
      highlightedTitle: post.title.split(regex).map((part, i) =>
        part.toLowerCase() === debouncedQuery.toLowerCase()
          ? <mark key={i} className="search-highlight">{part}</mark>
          : part
      )
    }))

  }, [posts, debouncedQuery])

  return (
    <div className="forum-main-content">

      {/* ===== WELCOME BOX ===== */}
      <div className="welcome-box mb-4">
        <h5>
          {!user ? 'ยินดีต้อนรับสู่ TalkBoard!' : `สวัสดี, ${user.username}!`}
        </h5>

        <div className="stats">
          <div>
            <strong>{stats.users}</strong>
            <span>สมาชิก</span>
          </div>
          <div>
            <strong>{stats.discussions}</strong>
            <span>กระทู้ทั้งหมด</span>
          </div>
        </div>
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

      </div>

      {/* ===== POST LIST ===== */}
      {highlightedPosts.map((post) => (
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

            <h6 className="post-title">
              {post.highlightedTitle || post.title}
            </h6>
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

      {posts.length === 0 && query && (
        <div className="no-result text-center mt-4">
          <h5>ไม่พบกระทู้ที่ค้นหา</h5>

          {suggestion && (
            <p>
              คุณหมายถึง{" "}
              <Link
                href={`/forum?q=${suggestion}`}
                className="text-primary fw-bold"
              >
                {suggestion}
              </Link>{" "}
              หรือไม่?
            </p>
          )}
        </div>
      )}

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

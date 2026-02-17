'use client'

import '../page.forum.css'
import Link from 'next/link'
import { useAuth } from '@/app/lib/auth-context'
import useDebounce from '@/app/hooks/useDebounce'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo, useRef, useCallback, memo } from 'react'
import { MessageCircle, ThumbsUp, Eye, Calendar, ChevronRight, User, Shield, ArrowUpDown } from 'lucide-react'

/* ================= POST CARD COMPONENT (MEMOIZED) ================= */
const PostCard = memo(({ post, query, escapeRegExp }) => {
  // ✅ Format date once
  const formattedDate = useMemo(() => {
    try {
      return new Date(post.created_at).toLocaleDateString('th-TH')
    } catch {
      return '-'
    }
  }, [post.created_at])

  // ✅ Highlight only title (not excerpt untuk performa)
  const highlightedTitle = useMemo(() => {
    if (!query || !post.title) return post.title

    const safeQuery = escapeRegExp(query)
    const regex = new RegExp(safeQuery, 'gi')
    return post.title.replace(
      regex,
      match => `<mark class="search-highlight">${match}</mark>`
    )
  }, [post.title, query, escapeRegExp])

  return (
    <Link
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
            <span>{formattedDate}</span>
          </div>
        </div>

        <h6 className="post-title">{post.title?.slice(0, 50)}...</h6>
        <p className="post-excerpt">{post.detail?.slice(0, 80)}...</p>

        {/* BOTTOM ROW */}
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
      {/* Arrow */}
      <div className="post-arrow">
        <ChevronRight size={20} />
      </div>
    </Link>
  )
})

PostCard.displayName = 'PostCard'

export default function ForumPage() {
  /* ================= URL PARAMS ================= */
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() || ''
  const category = searchParams.get('category') || ''
  const escapeRegExp = useCallback((string) =>
    string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    , [])

  /* ================= SMART DEBOUNCE ================= */
  const delay = query.length < 3 ? 300 : 150
  const debouncedQuery = useDebounce(query, delay)

  /* ================= STATE ================= */
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState([])
  const [sort, setSort] = useState('latest')
  const [hasNext, setHasNext] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [stats, setStats] = useState({
    users: 0,
    discussions: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  // ✅ Cache stats เพื่อไม่ให้ fetch ซ้ำ
  const statsLoadedRef = useRef(false)

  /* ================= FETCH POSTS ================= */
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(
          `http://localhost:5000/api/discussion?page=${page}`
          + `${debouncedQuery ? `&q=${debouncedQuery}` : ''}`
          + `${category ? `&category=${encodeURIComponent(category)}` : ''}`
          + `&sort=${sort}`
          + `${sort === 'user' && user ? `&user_id=${user.user_id}` : ''}`
        )

        const data = await res.json()

        if (data.success) {
          setPosts(data.data)
          setHasNext(data.hasNext)
          setSuggestion(data.suggestion || null)
        }

      } catch (err) {
        console.error('โหลดกระทู้ไม่สำเร็จ', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()

  }, [page, debouncedQuery, category, sort, user])

  /* ================= FETCH STATS (เรียกแค่ครั้งแรก) ================= */
  useEffect(() => {
    if (statsLoadedRef.current) return

    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stats')
        const data = await res.json()

        if (data.success) {
          setStats({
            users: data.users,
            discussions: data.discussions
          })
          statsLoadedRef.current = true
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
  }, [debouncedQuery, category])

  // ✅ useCallback สำหรับ sort handlers
  const handleSort = useCallback((newSort) => {
    setSort(newSort)
  }, [])

  const handlePrevPage = useCallback(() => setPage(p => p - 1), [])
  const handleNextPage = useCallback(() => setPage(p => p + 1), [])

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

      {/* ===== POST LIST ===== */}
      {isLoading && posts.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">กำลังโหลดกระทู้...</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.discussion_id}
              post={post}
              query={debouncedQuery}
              escapeRegExp={escapeRegExp}
            />
          ))}
        </>
      )}

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
              onClick={handlePrevPage}
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
              onClick={handleNextPage}
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

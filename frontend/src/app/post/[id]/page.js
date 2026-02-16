'use client'

import './post-detail.css'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'

import PostCard from './components/PostCard'
import CommentForm from './components/CommentForm'
import CommentItem from './components/CommentItem'
import { useAuth } from '@/app/lib/auth-context'

export default function PostDetailPage() {

  const { user } = useAuth()
  const { id } = useParams()
  const router = useRouter()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])

  /* ================= โหลด META จาก MySQL (จำนวนจริง) ================= */
  const loadPostMeta = async () => {
    if (!id) return

    const res = await fetch(`http://localhost:5000/api/discussion/${id}`)
    const meta = await res.json()

    setPost(prev => ({
      ...(prev || {}),
      views: meta.view_count,
      likes: meta.like_count,
      comments: meta.comment_count ?? 0
    }))
  }
  /* ================= โหลด COMMENTS จาก Mongo ================= */
  const loadComments = async () => {
    if (!id) return

    try {
      const res = await fetch(`http://localhost:5000/api/comment/${id}`)
      const data = await res.json()
      setComments(data)

      // sync จำนวนจริงจาก MySQL
      await loadPostMeta()

    } catch (err) {
      console.error("load comments error", err)
    }
  }

  /* ================= โหลดกระทู้ครั้งแรก ================= */
  useEffect(() => {
    if (!id) return

    const loadPost = async () => {
      try {
        // ---------- META ----------
        const metaRes = await fetch(`http://localhost:5000/api/discussion/${id}`)
        const meta = await metaRes.json()

        // ---------- DETAIL ----------
        const detailRes = await fetch(`http://localhost:5000/api/discussion/${id}/detail`)
        const detail = await detailRes.json()

        setPost({
          id: meta.discussion_id,
          user_id: meta.user_id,
          title: meta.title,
          author: meta.username,
          role: meta.role,
          date: new Date(meta.created_at).toLocaleDateString('th-TH'),
          views: meta.view_count,
          likes: meta.like_count,
          comments: meta.comment_count ?? 0, // ใช้ MySQL เท่านั้น
          liked: false,
          categories: [meta.category],
          content: detail.data.detail
        })

      } catch (err) {
        console.error(err)
      }
    }

    const init = async () => {
      await loadPost()      // โหลดกระทู้ก่อน
      await loadComments()  // แล้วค่อยโหลดคอมเมนต์
    }

    init()

  }, [id])


  /* ================= VIEW COUNT (กันนับซ้ำ) ================= */
  const countedRef = useRef(false)

  useEffect(() => {
    if (!id || countedRef.current) return

    const viewedKey = `viewed_post_${id}`
    const lastViewed = localStorage.getItem(viewedKey)

    if (lastViewed && Date.now() - Number(lastViewed) < 10 * 60 * 1000) {
      countedRef.current = true
      return
    }

    countedRef.current = true
    localStorage.setItem(viewedKey, Date.now())

    fetch(`http://localhost:5000/api/discussion/${id}/view`, {
      method: "POST"
    })

  }, [id])


  /* ================= ลบกระทู้ ================= */
  const deletePost = async () => {
    if (!confirm("ต้องการลบกระทู้นี้?")) return

    try {
      const res = await fetch(`http://localhost:5000/api/discussion/${id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        alert("ลบกระทู้แล้ว")
        router.push("/forum")
      }
    } catch (err) {
      console.error(err)
    }
  }

  /* ================= Loading ================= */
  if (!post || user === undefined)
    return <div className="container mt-5">กำลังโหลดกระทู้...</div>

  return (
    <div className="post-page-wrapper">
      <div className="container post-container">

        {/* HEADER */}
        <div className="post-header d-flex align-items-center mb-4">
          <button className="back-button" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </button>
          <h5 className="mb-0">กระทู้</h5>
        </div>

        {/* POST */}
        <PostCard
          post={post}
          commentsCount={post.comments} //  จำนวนจริงจาก MySQL
          onEdit={() => router.push(`/create-post?id=${id}`)}
          onDelete={deletePost}
        />

        {/* COMMENT FORM */}
        <CommentForm onSuccess={loadComments} currentUser={user} />

        {/* COMMENTS */}
        <div className="card shadow-sm">
          <div className="card-body">
            <h6 className="fw-bold mb-4">
              ความคิดเห็น ({post?.comments ?? 0})
            </h6>

            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                level={0}
                refreshComments={loadComments}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

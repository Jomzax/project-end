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
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentLikes, setCommentLikes] = useState({});

  /* ================= โหลดกระทู้ ================= */
  const loadPost = async () => {
    try {
      const metaRes = await fetch(`http://localhost:5000/api/discussion/${id}`)
      if (!metaRes.ok) throw new Error("meta fail")
      const meta = await metaRes.json()

      const detailRes = await fetch(`http://localhost:5000/api/discussion/${id}/detail`)
      if (!detailRes.ok) throw new Error("detail fail")
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
        comments: meta.comment_count ?? 0,
        liked: false,
        categories: [meta.category],
        content: detail.data.detail
      })

    } catch (err) {
      console.error("โหลดกระทู้ไม่สำเร็จ:", err)
    }
  }

  /* ================= โหลด COMMENTS ================= */
  const loadComments = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/comment/${id}`)
      const data = await res.json()
      setComments(data)
      loadCommentLikes(data);
    } catch (err) {
      console.error("โหลดคอมเมนต์ไม่สำเร็จ:", err)
    }
  }

  const loadCommentLikes = async (commentsData) => {
    if (!commentsData?.length) return;

    const ids = [];
    const walk = (list) => {
      list.forEach(c => {
        ids.push(c.id);
        if (c.replies) walk(c.replies);
      });
    };
    walk(commentsData);

    const res = await fetch(`http://localhost:5000/api/comment/likes/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user?.user_id
      },
      body: JSON.stringify({ ids })
    });

    const data = await res.json();
    setCommentLikes(data);
  };


  /* ================= โหลดสถานะ LIKE ================= */
  const loadLikeStatus = async () => {
    if (!user) return
    try {
      const res = await fetch(`http://localhost:5000/api/discussion/${id}/like`, {
        headers: {
          "x-user-id": user.user_id,
          "x-username": user.username,
          "x-role": user.role
        }
      })

      if (!res.ok) return

      const data = await res.json()

      setPost(prev => ({
        ...prev,
        liked: data.liked,
        likes: Number.isFinite(data.likes) ? data.likes : prev.likes
      }))
    } catch { }
  }


  /* ================= โหลดครั้งแรก ================= */
  useEffect(() => {
    if (!id) return
    loadPost()
    loadComments()
  }, [id])

  useEffect(() => {
    if (!id || !user) return
    loadLikeStatus()
  }, [id, user])

  /* ================= VIEW COUNT ================= */
  const countedRef = useRef(false)

  useEffect(() => {
    if (!id || countedRef.current) return

    countedRef.current = true

    fetch(`http://localhost:5000/api/discussion/${id}/view`, {
      method: "POST"
    })
  }, [id])

  /* ================= LIKE ================= */
  const likingRef = useRef(false)

  const handleLike = async () => {
    if (!user) return alert("กรุณาเข้าสู่ระบบก่อนกดไลค์")
    if (likingRef.current) return
    likingRef.current = true

    // optimistic
    setPost(prev => ({
      ...prev,
      liked: !prev.liked,
      likes: prev.liked ? prev.likes - 1 : prev.likes + 1
    }))

    try {
      const res = await fetch(`http://localhost:5000/api/discussion/${id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.user_id,
          "x-username": user.username,
          "x-role": user.role
        }
      })
      const data = await res.json()

      setPost(prev => ({
        ...prev,
        liked: data.liked,
        likes: Number.isFinite(data.likes) ? data.likes : prev.likes
      }))

    } catch {
      // rollback
      setPost(prev => ({
        ...prev,
        liked: !prev.liked,
        likes: prev.liked ? prev.likes - 1 : prev.likes + 1
      }))
    }

    setTimeout(() => likingRef.current = false, 300)
  }

  /* ================= DELETE ================= */
  const deletePost = async () => {
    if (!confirm("ต้องการลบกระทู้นี้?")) return
    await fetch(`http://localhost:5000/api/discussion/${id}`, { method: "DELETE" })
    router.push("/forum")
  }

  /* ================= LOADING ================= */
  if (!post)
    return <div className="container mt-5">กำลังโหลดกระทู้...</div>

  return (
    <div className="post-page-wrapper">
      <div className="container post-container">

        <div className="post-header d-flex align-items-center mb-4">
          <button className="back-button" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </button>
          <h5 className="mb-0">กระทู้</h5>
        </div>

        <PostCard
          post={post}
          commentsCount={post.comments}
          onLike={handleLike}
          onEdit={() => router.push(`/create-post?id=${id}`)}
          onDelete={deletePost}
        />

        <CommentForm onSuccess={loadComments} currentUser={user} />

        <div className="card shadow-sm">
          <div className="card-body">
            <h6 className="fw-bold mb-4">
              ความคิดเห็น ({post.comments})
            </h6>

            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                level={0}
                refreshComments={loadComments}
                commentLikes={commentLikes}
                setCommentLikes={setCommentLikes}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

'use client'

import './post-detail.css'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'

import PostCard from './components/PostCard'
import CommentForm from './components/CommentForm'
import CommentItem from './components/CommentItem'
import Loading from '@/app/components/Loading'
import { useAuth } from '@/app/lib/auth-context'
import { useAlert } from '@/app/lib/alert-context'

export default function PostDetailPage() {

  const { user } = useAuth()
  const { showAlert } = useAlert()
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentLikes, setCommentLikes] = useState({});

  /* ================= โหลดกระทู้ ================= */
  const loadPost = async () => {
    try {
      // เรียก API แบบ parallel
      const [metaRes, detailRes] = await Promise.all([
        fetch(`http://localhost:5000/api/discussion/${id}`),
        fetch(`http://localhost:5000/api/discussion/${id}/detail`)
      ])

      if (!metaRes.ok) throw new Error("meta fail")
      if (!detailRes.ok) throw new Error("detail fail")

      const [meta, detail] = await Promise.all([
        metaRes.json(),
        detailRes.json()
      ])

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

      // ✅ Initialize commentLikes จาก backend ก่อน
      const initialLikes = {};
      const walk = (list) => {
        list.forEach(c => {
          // ✅ ใช้ liked = true หากมี user_id match หรือสำหรับอื่นๆ ตั้ง false
          initialLikes[c.id] = {
            likes: c.likesCount || 0,
            liked: false  // เริ่มต้นเป็น false เสมอ จะอัพเดทจาก API
          };
          if (c.replies) walk(c.replies);
        });
      };
      walk(data);
      setCommentLikes(initialLikes);

      // จากนั้นโหลด user-specific like status ถ้ามี user
      if (user?.user_id) {
        await loadCommentLikes(data);
      }
    } catch (err) {
      console.error("โหลดคอมเมนต์ไม่สำเร็จ:", err)
    }
  }

  const loadCommentLikes = async (commentsData) => {
    if (!commentsData?.length || !user?.user_id) return;

    const ids = [];
    const walk = (list) => {
      list.forEach(c => {
        ids.push(c.id);
        if (c.replies) walk(c.replies);
      });
    };
    walk(commentsData);

    if (!ids.length) return;

    try {
      const res = await fetch(`http://localhost:5000/api/comment/likes/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.user_id
        },
        body: JSON.stringify({ ids })
      });

      if (!res.ok) throw new Error("Failed to load comment likes");

      const likeStatusData = await res.json();

      // ✅ Merge เพื่อให้ liked status + likes count อยู่ด้วยกัน
      setCommentLikes(prev => {
        const merged = { ...prev };
        Object.entries(likeStatusData).forEach(([commentId, status]) => {
          merged[commentId] = {
            likes: prev[commentId]?.likes || status.likes || 0,
            liked: status.liked || false
          };
        });
        return merged;
      });
    } catch (err) {
      console.error("โหลดสถานะไลค์คอมเมนต์ไม่สำเร็จ:", err);
    }
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

    const loadData = async () => {
      // โหลด post + comments แบบ parallel
      await Promise.all([loadPost(), loadComments()])
    }

    loadData()
  }, [id, user])

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
    if (!user) return showAlert("กรุณาเข้าสู่ระบบก่อนกดไลค์", 'warning')
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
    showAlert("ต้องการลบกระทู้นี้?", 'confirm', '❓ ยืนยันการลบ', async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/discussion/${id}`, { method: "DELETE" })
        if (res.ok) {
          showAlert("ลบกระทู้สำเร็จ", 'success')
          setTimeout(() => router.push("/forum"), 500)
        } else {
          showAlert("ลบกระทู้ไม่สำเร็จ", 'error')
        }
      } catch (err) {
        console.error(err)
        showAlert("เกิดข้อผิดพลาด", 'error')
      }
    })
  }

  /* ================= LOADING ================= */
  if (!post)
    return <Loading fullScreen={true} />

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

'use client'

import './post-detail.css'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
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
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])

  const loadComments = useCallback(async () => {
    if (!id) return

    try {
      const res = await fetch(`http://localhost:5000/api/comment/${id}`)
      const data = await res.json()
      setComments(data)
    } catch (err) {
      console.error("load comments error", err)
    }
  }, [id])

  useEffect(() => {
    if (!id) return

    const loadPost = async () => {
      try {
        const metaRes = await fetch(`http://localhost:5000/api/discussion/${id}`)
        const meta = await metaRes.json()

        setPost({
          id: meta.discussion_id,
          user_id: meta.user_id,
          title: meta.title,
          author: meta.username,
          role: meta.role,
          date: new Date(meta.created_at).toLocaleDateString('th-TH'),
          views: meta.view_count,
          likes: meta.like_count,
          liked: false,
          categories: [meta.category],
          content: ""
        })

        const detailRes = await fetch(`http://localhost:5000/api/discussion/${id}/detail`)
        const detail = await detailRes.json()
        setPost(prev => ({ ...prev, content: detail.data.detail }))

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
    loadComments()

  }, [id, loadComments])






  const deletePost = async () => {
    if (!confirm("ต้องการลบกระทู้นี้?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/discussion/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        alert("ลบกระทู้แล้ว");
        router.push("/forum");
      }
    } catch (err) {
      console.error(err);
    }
  };




  const toggleLike = () => {
    setPost(prev => ({
      ...prev,
      liked: !prev.liked,
      likes: prev.liked ? prev.likes - 1 : prev.likes + 1
    }))
  }
  // 🔥 เพิ่ม reply แบบ recursive ถูกต้อง
  const addReply = (parentId, newReply) => {
    const recursiveUpdate = (items) =>
      items.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            replies: [...item.replies, newReply]
          }
        }

        if (item.replies.length > 0) {
          return {
            ...item,
            replies: recursiveUpdate(item.replies)
          }
        }

        return item
      })

    setComments(prev => recursiveUpdate(prev))
  }

  // 🗑 ลบคอมเมนต์ (recursive)
  const deleteComment = (id) => {
    const removeRecursive = (items) =>
      items
        .filter(item => item.id !== id)
        .map(item => ({
          ...item,
          replies: removeRecursive(item.replies)
        }))

    setComments(prev => removeRecursive(prev))
  }

  // ✏️ แก้ไขข้อความ
  const editComment = (id, newText) => {
    const editRecursive = (items) =>
      items.map(item => {
        if (item.id === id) {
          return { ...item, text: newText }
        }

        return {
          ...item,
          replies: editRecursive(item.replies)
        }
      })

    setComments(prev => editRecursive(prev))
  }


  if (!post || user === undefined) {
    return <div className="container mt-5">กำลังโหลดกระทู้...</div>
  }

  return (
    <div className="post-page-wrapper">
      <div className="container post-container">

        {/* HEADER */}
        <div className="post-header d-flex align-items-center mb-4">
          <button
            type="button"
            className="back-button"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
          </button>
          <h5 className="mb-0">กระทู้</h5>
        </div>

        <PostCard
          post={post}
          commentsCount={comments.length}
          onLike={() => { }}
          // onEdit={handleEditPost}
          onEdit={() => router.push(`/create-post?id=${id}`)}
          onDelete={deletePost}
        />

        <CommentForm
          onSuccess={loadComments}
          currentUser={user}
        />

        <div className="card shadow-sm">
          <div className="card-body">

            <h6 className="fw-bold mb-4">
              ความคิดเห็น ({comments.length})
            </h6>

            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                level={0}
                onReply={addReply}
                onDelete={deleteComment}
                onEdit={editComment}
                refreshComments={loadComments}
                currentUser={user}   // 🔥 สำคัญ
              />
            ))}


          </div>
        </div>

      </div>
    </div>
  )
}

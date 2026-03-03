'use client'

import './post-detail.css'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, useRef } from 'react'
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
  const searchParams = useSearchParams()
  const targetCommentId = searchParams.get('commentId')
  const resolveFromPath = () => {
    if (typeof window !== 'undefined') {
      const from = new URLSearchParams(window.location.search).get('from')
      if (from && from.startsWith('/forum')) return from
      const storedFrom = window.sessionStorage.getItem('forum:returnTo')
      if (storedFrom && storedFrom.startsWith('/forum')) return storedFrom
    }
    return '/forum'
  }
  const fromPath = resolveFromPath()
  const goBackToForum = () => {
    router.push(resolveFromPath())
  }

  const fallbackFromPath = (() => {
    if (fromPath && fromPath.startsWith('/forum')) return fromPath
    if (typeof window !== 'undefined') {
      const storedFrom = window.sessionStorage.getItem('forum:returnTo')
      if (storedFrom && storedFrom.startsWith('/forum')) return storedFrom
    }
    return '/forum'
  })()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentLikes, setCommentLikes] = useState({})
  const [commentPage, setCommentPage] = useState(1)
  const COMMENTS_PAGE_SIZE = 5
  const commentRefs = useRef([])
  const hasAutoScrolledToTargetRef = useRef(false)

  const loadPost = async () => {
    try {
      const [metaRes, detailRes] = await Promise.all([
        fetch(`http://localhost:5000/api/discussion/${id}`),
        fetch(`http://localhost:5000/api/discussion/${id}/detail`)
      ])

      if (!metaRes.ok) throw new Error('meta fail')
      if (!detailRes.ok) throw new Error('detail fail')

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
        is_pinned: Number(meta.is_pinned) || 0,
        is_hot: Number(meta.is_hot) || 0,
        date: meta.created_at,
        views: meta.view_count,
        likes: meta.like_count,
        comments: meta.comment_count ?? 0,
        liked: false,
        categories: [meta.category],
        content: detail.data.detail
      })
    } catch (err) {
      console.error('โหลดกระทู้ไม่สำเร็จ:', err)
    }
  }

  const loadComments = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/comment/${id}`)
      const data = await res.json()
      setComments(data)

      const rootComments = Array.isArray(data) ? data.length : 0
      setPost((prev) => (prev ? { ...prev, comments: rootComments } : prev))

      setCommentLikes((prev) => {
        const merged = { ...prev }
        const walk = (list) => {
          list.forEach((c) => {
            const key = c.id || c._id
            if (!key) return
            merged[key] = {
              likes: Number(c.likesCount || 0),
              liked: typeof prev[key]?.liked === 'boolean' ? prev[key].liked : false
            }
            if (c.replies) walk(c.replies)
          })
        }
        walk(Array.isArray(data) ? data : [])
        return merged
      })

      if (user?.user_id) {
        await loadCommentLikes(data)
      }
    } catch (err) {
      console.error('โหลดคอมเมนต์ไม่สำเร็จ:', err)
    }
  }

  const totalCommentPages = Math.max(1, Math.ceil(comments.length / COMMENTS_PAGE_SIZE))
  const visibleCommentsCount = Math.min(commentPage * COMMENTS_PAGE_SIZE, comments.length)
  const paginatedComments = useMemo(() => {
    return comments.slice(0, visibleCommentsCount)
  }, [comments, visibleCommentsCount])

  const findRootCommentIndex = (list, commentId) => {
    if (!commentId || !Array.isArray(list)) return -1
    const target = String(commentId)

    const hasTargetInTree = (comment) => {
      const currentId = String(comment?.id ?? comment?._id ?? '')
      if (currentId === target) return true
      if (!Array.isArray(comment?.replies) || comment.replies.length === 0) return false
      return comment.replies.some((reply) => hasTargetInTree(reply))
    }

    return list.findIndex((comment) => hasTargetInTree(comment))
  }

  const loadCommentLikes = async (commentsData) => {
    if (!commentsData?.length || !user?.user_id) return

    const ids = []
    const walk = (list) => {
      list.forEach((c) => {
        ids.push(c.id)
        if (c.replies) walk(c.replies)
      })
    }
    walk(commentsData)

    if (!ids.length) return

    try {
      const res = await fetch(`http://localhost:5000/api/comment/likes/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.user_id
        },
        body: JSON.stringify({ ids })
      })

      if (!res.ok) throw new Error('Failed to load comment likes')

      const likeStatusData = await res.json()

      setCommentLikes((prev) => {
        const merged = { ...prev }
        Object.entries(likeStatusData).forEach(([commentId, status]) => {
          merged[commentId] = {
            likes: prev[commentId]?.likes || status.likes || 0,
            liked: status.liked || false
          }
        })
        return merged
      })
    } catch (err) {
      console.error('โหลดสถานะไลก์คอมเมนต์ไม่สำเร็จ:', err)
    }
  }

  const loadLikeStatus = async () => {
    if (!user) return
    try {
      const res = await fetch(`http://localhost:5000/api/discussion/${id}/like`, {
        headers: {
          'x-user-id': user.user_id,
          'x-role': user.role
        }
      })

      if (!res.ok) return

      const data = await res.json()

      setPost((prev) => ({
        ...prev,
        liked: data.liked,
        likes: Number.isFinite(data.likes) ? data.likes : prev.likes
      }))
    } catch {}
  }

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      await Promise.all([loadPost(), loadComments()])
    }

    loadData()
  }, [id, user])

  useEffect(() => {
    setCommentPage(1)
  }, [id])

  useEffect(() => {
    setCommentPage((prev) => Math.min(prev, totalCommentPages))
  }, [totalCommentPages])

  useEffect(() => {
    hasAutoScrolledToTargetRef.current = false
  }, [id, targetCommentId])

  useEffect(() => {
    if (!targetCommentId || !comments.length || hasAutoScrolledToTargetRef.current) return

    const rootIndex = findRootCommentIndex(comments, targetCommentId)
    if (rootIndex < 0) return

    const requiredPage = Math.floor(rootIndex / COMMENTS_PAGE_SIZE) + 1
    if (commentPage < requiredPage) {
      setCommentPage(requiredPage)
      return
    }

    const timer = setTimeout(() => {
      const targetNode = document.getElementById(`comment-${targetCommentId}`)
      if (targetNode) {
        hasAutoScrolledToTargetRef.current = true
        targetNode.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 120)

    return () => clearTimeout(timer)
  }, [targetCommentId, comments, commentPage])

  useEffect(() => {
    if (!id) return

    const intervalId = setInterval(() => {
      loadComments()
    }, 5000)

    return () => clearInterval(intervalId)
  }, [id, user])

  useEffect(() => {
    if (!id || !user) return
    loadLikeStatus()
  }, [id, user])

  const countedRef = useRef(false)

  useEffect(() => {
    if (!id || countedRef.current) return

    countedRef.current = true
    fetch(`http://localhost:5000/api/discussion/${id}/view`, {
      method: 'POST'
    })
  }, [id])

  const likingRef = useRef(false)

  const handleLike = async () => {
    if (!user) return showAlert('กรุณาเข้าสู่ระบบก่อนกดไลก์', 'warning')
    if (likingRef.current) return
    likingRef.current = true

    setPost((prev) => ({
      ...prev,
      liked: !prev.liked,
      likes: prev.liked ? prev.likes - 1 : prev.likes + 1
    }))

    try {
      const res = await fetch(`http://localhost:5000/api/discussion/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.user_id,
          'x-role': user.role
        }
      })
      const data = await res.json()

      setPost((prev) => ({
        ...prev,
        liked: data.liked,
        likes: Number.isFinite(data.likes) ? data.likes : prev.likes
      }))
    } catch {
      setPost((prev) => ({
        ...prev,
        liked: !prev.liked,
        likes: prev.liked ? prev.likes - 1 : prev.likes + 1
      }))
    }

    setTimeout(() => {
      likingRef.current = false
    }, 300)
  }

  const deletePost = async () => {
    showAlert('ต้องการลบกระทู้นี้?', 'confirm', 'ยืนยันการลบ', async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/discussion/${id}`, { method: 'DELETE' })
        if (res.ok) {
          showAlert('ลบกระทู้สำเร็จ', 'success')
          setTimeout(() => router.push(fallbackFromPath), 500)
        } else {
          showAlert('ลบกระทู้ไม่สำเร็จ', 'error')
        }
      } catch (err) {
        console.error(err)
        showAlert('เกิดข้อผิดพลาด', 'error')
      }
    })
  }

  if (!post) return <Loading fullScreen={true} />

  return (
    <div className="post-page-wrapper">
      <div className="container post-container">
        <div className="post-header d-flex align-items-center mb-4">
          <button className="back-button" onClick={goBackToForum}>
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

            {paginatedComments.map((comment, index) => (
              <div
                key={comment.id}
                ref={(node) => {
                  commentRefs.current[index] = node
                }}
              >
                <CommentItem
                  comment={comment}
                  level={0}
                  refreshComments={loadComments}
                  commentLikes={commentLikes}
                  setCommentLikes={setCommentLikes}
                  targetCommentId={targetCommentId}
                />
              </div>
            ))}

            {comments.length > COMMENTS_PAGE_SIZE && (
              <div className="comment-pagination">
                <div className="comment-pagination-info">
                  {`แสดงความเห็น 1-${visibleCommentsCount} จาก ${comments.length}`}
                </div>
                <button
                  className="comment-load-more-btn"
                  onClick={() => {
                    if (commentPage >= totalCommentPages) return
                    setCommentPage((p) => Math.min(totalCommentPages, p + 1))
                  }}
                  disabled={commentPage >= totalCommentPages}
                >
                  แสดงความคิดเห็นถัดไป
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

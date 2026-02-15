'use client'

import './post-detail.css'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import PostCard from './components/PostCard'
import CommentForm from './components/CommentForm'
import CommentItem from './components/CommentItem'

export default function PostDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [post, setPost] = useState({
    id,
    title: 'ฟหกฟกห',
    content: 'ฟหกกดหกดดดดดด',
    author: 'da',
    role: 'User',
    date: '4/2/2569',
    views: 5,
    likes: 0,
    liked: false,
    categories: ['ปักหมุด', 'มาแรง', 'อาหาร'],
  })

  const [comments, setComments] = useState([
    {
      id: 1,
      user: 'ตัวอย่าง',
      role: 'Admin',
      text: 'ชั้นที่ 1',
      time: '13 ชม.',
      replies: [
        {
          id: 11,
          user: 'นอนน้อย',
          role: 'Admin',
          text: 'ชั้นที่ 2',
          time: '1 ชม.',
          replies: [
            {
              id: 111,
              user: 'นอนมาก',
              role: 'User',
              text: 'ชั้นที่ 3',
              time: '30 นาที',
              replies: []
            }
          ]
        }
      ]
    }
  ])

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
          onLike={toggleLike}
        />

        <CommentForm
          onSubmit={(text) =>
            setComments([
              {
                id: Date.now(),
                user: 'คุณ',
                role: 'User',
                text,
                time: 'เมื่อสักครู่',
                replies: []
              },
              ...comments
            ])
          }
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
              />
            ))}


          </div>
        </div>

      </div>
    </div>
  )
}

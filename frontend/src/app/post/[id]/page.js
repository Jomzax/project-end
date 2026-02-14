'use client'

import './post-detail.css'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import {
  Heart,
  MessageCircle,
  Eye,
  Calendar,
  Share2,
  Bookmark,
  MoreHorizontal,
  ArrowLeft,
} from 'lucide-react'

export default function PostDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  // 🔹 mock data (ยังไม่ต่อ backend)
  const post = {
    id,
    title: 'ฟหกฟกห',
    content: 'ฟหกกดหกดดดดดด',
    author: 'da',
    role: 'User',
    date: '4/2/2569',
    views: 5,
    comments: 2,
    likes: 0,
    categories: ['ปักหมุด', 'มาแรง', 'อาหาร'],
  }

  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([
    {
      id: 1,
      user: 'ตัวอย่าง',
      role: 'Admin',
      text: 'หฟก',
      time: 'เมื่อสักครู่',
    },
    {
      id: 2,
      user: 'ผู้ใช้ทั่วไป',
      role: 'User',
      text: 'ความคิดเห็นเพิ่มเติม',
      time: '2 นาทีที่แล้ว',
    },
  ])

  const handleSubmit = () => {
    if (!commentText.trim()) return

    const newComment = {
      id: Date.now(),
      user: 'คุณ',
      role: 'User',
      text: commentText,
      time: 'เมื่อสักครู่',
    }

    setComments([newComment, ...comments])
    setCommentText('')
  }

  return (
    <div className="post-page-wrapper">
      <div className="container post-container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">

            <div className="post-content-wrapper">

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

              {/* POST CARD */}
              <div className="card shadow-sm mb-4">
                <div className="card-body">

                  <div className="mb-2">
                    {post.categories.map((cat, index) => (
                      <span key={index} className="badge bg-light text-dark me-2">
                        {cat}
                      </span>
                    ))}
                  </div>

                  <h4 className="fw-bold">{post.title}</h4>

                  {/* Author */}
                  <div className="d-flex align-items-center text-muted small mb-3">
                    <div className="avatar-circle me-2">
                      {post.author.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div>
                        {post.author}
                        <span className="badge bg-primary ms-2">
                          {post.role}
                        </span>
                      </div>
                      <div>
                        <Calendar size={14} className="me-1" />
                        {post.date}
                      </div>
                    </div>

                    <div className="ms-auto">
                      <MoreHorizontal />
                    </div>
                  </div>

                  <hr />

                  <p>{post.content}</p>

                  <hr />

                  <div className="d-flex gap-3 text-muted flex-wrap">
                    <span><Heart size={18} /> {post.likes}</span>
                    <span><MessageCircle size={18} /> {post.comments}</span>
                    <span><Eye size={18} /> {post.views}</span>

                    <div className="ms-auto d-flex gap-3">
                      <Bookmark />
                      <Share2 />
                    </div>
                  </div>

                </div>
              </div>

              {/* COMMENT FORM */}
              <div className="card shadow-sm mb-4">
                <div className="card-body">

                  <h6 className="fw-bold mb-3">แสดงความคิดเห็น</h6>

                  <textarea
                    className="form-control mb-3"
                    rows="3"
                    placeholder="พิมพ์ความคิดเห็นของคุณ..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />

                  <div className="text-end">
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmit}
                    >
                      ส่งความคิดเห็น
                    </button>
                  </div>

                </div>
              </div>

              {/* COMMENT LIST */}
              <div className="card shadow-sm">
                <div className="card-body">

                  <h6 className="fw-bold mb-3">
                    ความคิดเห็น ({comments.length})
                  </h6>

                  {comments.map((c) => (
                    <div key={c.id} className="border-bottom pb-3 mb-3">

                      <div className="d-flex align-items-center mb-2">
                        <div className="avatar-circle small-avatar me-2">
                          {c.user.charAt(0)}
                        </div>

                        <div>
                          <div className="fw-semibold">
                            {c.user}
                            <span className="badge bg-warning text-dark ms-2">
                              {c.role}
                            </span>
                          </div>
                          <small className="text-muted">{c.time}</small>
                        </div>
                      </div>

                      <div>{c.text}</div>

                    </div>
                  ))}

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )


}

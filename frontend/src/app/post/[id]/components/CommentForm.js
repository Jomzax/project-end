'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function CommentForm({ onSuccess, currentUser }) {
  const { id } = useParams()
  const [text, setText] = useState('')
  const [focus, setFocus] = useState(false)
  const [loading, setLoading] = useState(false)
  const MAX_COMMENT_LENGTH = 200


  const handleSubmit = async () => {

    if (!currentUser || !currentUser.user_id) {
      alert("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น")
      return
    }

    if (text.length > MAX_COMMENT_LENGTH) {
      alert("ข้อความยาวเกินกำหนด")
      return
    }

    if (!text.trim() || loading) return
    setLoading(true)

    try {
      const res = await fetch(`http://localhost:5000/api/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discussionId: Number(id),
          parentId: null,
          message: text,
          user: {
            id: currentUser.user_id,      // ⭐ สำคัญ (ชื่อ field ใน MySQL)
            username: currentUser.username,
            role: currentUser.role
          }
        })
      })

      if (!res.ok) throw new Error("create failed")

      setText('')
      setFocus(false)
      onSuccess?.()

    } catch (err) {
      console.error(err)
      alert("ส่งความคิดเห็นไม่สำเร็จ")
    }

    setLoading(false)
  }


  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h6 className="fw-bold mb-3">แสดงความคิดเห็น</h6>

        <div className="comment-form-wrapper">

          <div className="avatar-circle">
            {currentUser?.username?.charAt(0)?.toUpperCase()}
          </div>

          <div className="comment-input-area">
            <textarea
              className="form-control comment-textarea"
              rows={focus ? 3 : 1}
              placeholder="พิมพ์ความคิดเห็นของคุณ..."
              value={text}
              maxLength={MAX_COMMENT_LENGTH}
              onFocus={() => setFocus(true)}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="text-end small text-muted">
              {text.length}/{MAX_COMMENT_LENGTH}
            </div>

            {focus && (
              <div className="comment-button-wrapper d-flex gap-2">
                <button
                  className="btn btn-primary"
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? "กำลังส่ง..." : "ส่ง"}
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setFocus(false)
                    setText('')
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

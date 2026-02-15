'use client'

import { useState } from 'react'

export default function CommentForm({ onSubmit }) {
  const [text, setText] = useState('')
  const [focus, setFocus] = useState(false)

  const handleSubmit = () => {
    if (!text.trim()) return
    onSubmit(text)
    setText('')
    setFocus(false)
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h6 className="fw-bold mb-3">แสดงความคิดเห็น</h6>

        <div className="comment-form-wrapper">

          <div className="avatar-circle">
            ด
          </div>

          <div className="comment-input-area">
            <textarea
              className="form-control comment-textarea"
              rows={focus ? 3 : 1}
              placeholder="พิมพ์ความคิดเห็นของคุณ..."
              value={text}
              onFocus={() => setFocus(true)}
              onChange={(e) => setText(e.target.value)}
            />

            {focus && (
              <div className="comment-button-wrapper d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  ส่ง
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

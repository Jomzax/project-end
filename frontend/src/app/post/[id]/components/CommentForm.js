'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAlert } from '@/app/lib/alert-context'
import { getAvatarInitial, normalizeAvatarSrc, pickAvatar } from '@/app/lib/avatar'

export default function CommentForm({ onSuccess, currentUser }) {
  const { id } = useParams()
  const { showAlert } = useAlert()
  const [text, setText] = useState('')
  const [focus, setFocus] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const MAX_COMMENT_LENGTH = 200
  const avatarSrc = normalizeAvatarSrc(pickAvatar(currentUser))
  const avatarInitial = getAvatarInitial(currentUser?.username || currentUser?.email || '')

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [avatarSrc])

  const handleSubmit = async () => {
    if (!currentUser || !currentUser.user_id) {
      showAlert('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น', 'warning')
      return
    }

    if (text.length > MAX_COMMENT_LENGTH) {
      showAlert('ข้อความยาวเกินกำหนด', 'warning')
      return
    }

    if (!text.trim() || loading) return
    setLoading(true)

    try {
      const res = await fetch('http://localhost:5000/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discussionId: Number(id),
          parentId: null,
          message: text,
          user: {
            // สำคัญ: ใช้ field id สำหรับ backend
            id: currentUser.user_id,
            username: currentUser.username,
            role: currentUser.role
          }
        })
      })

      if (!res.ok) throw new Error('create failed')

      setText('')
      setFocus(false)
      onSuccess?.()
    } catch (err) {
      console.error(err)
      showAlert('ส่งความคิดเห็นไม่สำเร็จ', 'error')
    }

    setLoading(false)
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h6 className="fw-bold mb-3">แสดงความคิดเห็น</h6>

        <div className="comment-form-wrapper">
          <div className="avatar-circle">
            {avatarSrc && !avatarLoadFailed ? (
              <img
                src={avatarSrc}
                alt={currentUser?.username || 'avatar'}
                className="avatar-image"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              avatarInitial
            )}
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
                  {loading ? 'กำลังส่ง...' : 'ส่ง'}
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

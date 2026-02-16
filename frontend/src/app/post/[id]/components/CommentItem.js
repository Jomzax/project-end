'use client'

import { useState } from 'react'
import { ThumbsUp, Shield, Pencil, Trash2, User } from 'lucide-react'
import { useAuth } from '@/app/lib/auth-context'

const MAX_DEPTH = 3

export default function CommentItem({
  comment,
  level = 0,
  onDelete,
  onEdit,
  refreshComments
}) {

  const { user } = useAuth()

  const [showReplies, setShowReplies] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.message)

  // อนุญาตตอบเฉพาะก่อนถึงชั้น 3
  const canReply = level < MAX_DEPTH - 1

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return

    if (!user || !user.user_id) {
      alert("กรุณาเข้าสู่ระบบก่อนตอบกลับ")
      return
    }

    try {
      const res = await fetch("http://localhost:5000/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discussionId: comment.discussionId,
          parentId: comment.id,
          message: replyText,
          user: {
            id: user.user_id,
            username: user.username,
            role: user.role
          }
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "create reply failed")
      }

      setReplyText('')
      setShowReplyBox(false)
      refreshComments()

    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  return (
    <div className="comment-item">

      {/* HEADER */}
      <div className="comment-header">
        <div className="avatar-circle small-avatar">
          {comment.username.charAt(0)}
        </div>

        <div className="comment-meta">
          <div className="comment-name">
            {comment.username}

            {comment.role === 'admin'
              ? <span className="badge-admin"><Shield size={12} /> Admin</span>
              : <span className="badge-user"><User size={12} /> User</span>
            }

            <span className="comment-time">{comment.created_at}</span>
          </div>
        </div>

        <div className="comment-actions">
          <button className="comment-icon-btn" onClick={() => setIsEditing(true)}>
            <Pencil size={16} />
          </button>
          <button className="comment-icon-btn delete" onClick={() => onDelete(comment.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* TEXT */}
      <div className="comment-text">
        {isEditing ? (
          <>
            <textarea
              className="form-control"
              rows="3"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />

            <div className="edit-buttons">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onEdit(comment.id, editText)
                  setIsEditing(false)
                }}
              >
                บันทึก
              </button>

              <button
                className="btn btn-light btn-sm"
                onClick={() => setIsEditing(false)}
              >
                ยกเลิก
              </button>
            </div>
          </>
        ) : (
          comment.message
        )}
      </div>

      {/* FOOTER */}
      <div className="comment-footer">
        <span className="comment-like">
          <ThumbsUp size={14} /> 0
        </span>

        {canReply && (
          <span
            className="comment-reply"
            onClick={() => setShowReplyBox(v => !v)}
          >
            ตอบกลับ
          </span>
        )}

        {(comment.replies?.length ?? 0) > 0 && (
          <span
            className="comment-toggle"
            onClick={() => setShowReplies(v => !v)}
          >
            {showReplies
              ? 'ซ่อนการตอบกลับ'
              : `ดูการตอบกลับ (${comment.replies.length})`}
          </span>
        )}
      </div>

      {/* REPLY INPUT */}
      {showReplyBox && (
        <div className="reply-input-box">
          <textarea
            className="form-control reply-textarea"
            rows="3"
            placeholder="พิมพ์ข้อความตอบกลับ..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />

          <div className="reply-button-group">
            <button className="btn btn-primary btn-sm" onClick={handleReplySubmit}>
              ส่ง
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowReplyBox(false)}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* REPLIES */}
      {showReplies && (comment.replies?.length ?? 0) > 0 && (
        <div className="comment-reply-box">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              onDelete={onDelete}
              onEdit={onEdit}
              refreshComments={refreshComments}
            />
          ))}
        </div>
      )}

    </div>
  )
}

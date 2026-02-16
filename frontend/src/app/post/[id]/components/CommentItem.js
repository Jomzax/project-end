'use client'

import { useState } from 'react'
import { ThumbsUp, Shield, Pencil, Trash2, User } from 'lucide-react'
import { useAuth } from '@/app/lib/auth-context'
import { formatTimeAgo } from '@/app/lib/time-format'
const MAX_DEPTH = 3

export default function CommentItem({
  comment,
  level = 0,
  onDelete,
  onEdit,
  refreshComments
}) {

  const { user } = useAuth()
  const MAX_COMMENT_LENGTH = 200
  const isOwner = user && user.user_id === comment.userId
  const isAdmin = user?.role === 'admin'
  const canManage = isOwner || isAdmin
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

    if (replyText.length > MAX_COMMENT_LENGTH) {
      alert("ข้อความยาวเกินกำหนด")
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

  const handleEdit = async () => {
    if (!editText.trim()) return

    if (editText.length > MAX_COMMENT_LENGTH) {
      alert("ข้อความยาวเกินกำหนด")
      return
    }
    try {
      const res = await fetch(`http://localhost:5000/api/comment/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editText })
      })

      if (!res.ok) throw new Error("edit failed")

      setIsEditing(false)
      refreshComments()

    } catch (err) {
      console.error(err)
      alert("แก้ไขไม่สำเร็จ")
    }
  }

  const handleDelete = async () => {
    if (!confirm("ต้องการลบความคิดเห็น?")) return

    try {
      const res = await fetch(`http://localhost:5000/api/comment/${comment.id}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("delete failed")

      refreshComments()

    } catch (err) {
      console.error(err)
      alert("ลบไม่สำเร็จ")
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

            <span className="comment-time">
              {formatTimeAgo(comment.created_at)}
            </span>

            {comment.updated_at && comment.updated_at !== comment.created_at && (
              <span className="comment-edited">
                (แก้ไขแล้ว {formatTimeAgo(comment.updated_at)})
              </span>
            )}

          </div>
        </div>

        {canManage && (
          <div className="comment-actions">
            <button className="comment-icon-btn" onClick={() => setIsEditing(true)}>
              <Pencil size={16} />
            </button>
            <button className="comment-icon-btn delete" onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* TEXT */}
      <div className="comment-text">
        {isEditing ? (
          <div className="reply-input-box">

            <textarea
              className="form-control reply-textarea"
              rows="3"
              value={editText}
              maxLength={MAX_COMMENT_LENGTH}
              onChange={(e) => setEditText(e.target.value)}
            />

            <div className="text-end small text-muted">
              {editText.length}/{MAX_COMMENT_LENGTH}
            </div>

            <div className="reply-button-group">
              <button className="btn btn-primary btn-sm" onClick={handleEdit}>
                บันทึก
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditing(false)}
              >
                ยกเลิก
              </button>
            </div>

          </div>
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
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(e) => setReplyText(e.target.value)}
          />

          <div className="text-end small text-muted">
            {replyText.length}/{MAX_COMMENT_LENGTH}
          </div>

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

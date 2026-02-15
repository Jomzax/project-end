'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, Shield, Pencil, Trash2 } from 'lucide-react'

export default function CommentItem({ comment, level = 0, onReply, onDelete, onEdit, parentOpen = true }) {
  const [showReplies, setShowReplies] = useState(level === 0)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)

  const canReply = level < 2

  const handleSubmit = () => {
    if (!replyText.trim()) return

    const newReply = {
      id: Date.now(),
      user: 'คุณ',
      role: 'User',
      text: replyText,
      time: 'เมื่อสักครู่',
      replies: []
    }

    onReply(comment.id, newReply)

    setReplyText('')
    setShowReplyBox(false)
    setShowReplies(true)
  }

  return (
    <div className="comment-item">

      {/* HEADER */}
      <div className="comment-header">
        <div className="avatar-circle small-avatar">
          {comment.user.charAt(0)}
        </div>

        <div className="comment-meta">
          <div className="comment-name">
            {comment.user}

            {comment.role === 'Admin' && (
              <span className="admin-badge">
                <Shield size={12} /> Admin
              </span>
            )}

            <span className="comment-time">
              {comment.time}
            </span>
          </div>
        </div>

        <div className="comment-actions">
          <button
            className="comment-icon-btn"
            onClick={() => setIsEditing(true)}
          >
            <Pencil size={16} />
          </button>
          <button
            className="comment-icon-btn delete"
            onClick={() => onDelete(comment.id)}
          >
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
          comment.text
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
            onClick={() => setShowReplyBox(!showReplyBox)}
          >
            ตอบกลับ
          </span>
        )}

        {comment.replies.length > 0 && (
          <span
            className="comment-toggle"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies
              ? 'ซ่อนการตอบกลับ'
              : `ดูการตอบกลับ (${(comment.replies?.length || 0)})`}
          </span>
        )}
      </div>

      {/* 🔥 Reply Input */}
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
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
            >
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
      {showReplies && comment.replies.length > 0 && (
        <div className="comment-reply-box">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

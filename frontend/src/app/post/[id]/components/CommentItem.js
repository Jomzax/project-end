'use client'

import { useEffect, useMemo, useState } from 'react'
import { Flag, Heart, Shield, Pencil, Trash2, User, X } from 'lucide-react'
import { useAuth } from '@/app/lib/auth-context'
import { useAlert } from '@/app/lib/alert-context'
import { formatTimeAgo } from '@/app/lib/time-format'
import { getAvatarInitial, normalizeAvatarSrc, pickAvatar } from '@/app/lib/avatar'

const MAX_DEPTH = 3

export default function CommentItem({
  comment,
  level = 0,
  onDelete,
  onEdit,
  refreshComments,
  commentLikes,
  setCommentLikes,
  targetCommentId,
}) {
  const { user } = useAuth()
  const { showAlert } = useAlert()

  const MAX_COMMENT_LENGTH = 200
  const isOwner = user && user.user_id === comment.userId
  const isAdmin = user?.role === 'admin'
  const canManage = isOwner || isAdmin

  const [showReplies, setShowReplies] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.message)
  const [reportModal, setReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const currentCommentId = String(comment?._id || comment?.id || '')
  const isTargetComment = Boolean(targetCommentId) && String(targetCommentId) === currentCommentId

  const hasTargetInDescendants = useMemo(() => {
    if (!targetCommentId || !Array.isArray(comment?.replies) || comment.replies.length === 0) return false
    const target = String(targetCommentId)

    const walk = (list) => {
      return list.some((item) => {
        const itemId = String(item?._id || item?.id || '')
        if (itemId === target) return true
        if (!Array.isArray(item?.replies) || item.replies.length === 0) return false
        return walk(item.replies)
      })
    }

    return walk(comment.replies)
  }, [comment?.replies, targetCommentId])

  const canReply = level < MAX_DEPTH - 1
  const isCommentOwner = String(comment?.userId || '') === String(user?.user_id || '')
  const commentAvatarSrc = normalizeAvatarSrc(
    pickAvatar(
      comment,
      comment?.user,
      isCommentOwner ? user : null
    )
  )
  const commentInitial = getAvatarInitial(comment?.username || '')
  const reportReasons = [
    'สแปมหรือโฆษณา',
    'คำหยาบคายหรือคุกคาม',
    'เนื้อหาละเมิดกฎชุมชน',
    'ข้อมูลเท็จหรือทำให้เข้าใจผิด',
    'อื่นๆ',
  ]

  const handleLike = async () => {
    if (!user) return showAlert('กรุณาเข้าสู่ระบบ', 'warning')

    const id = comment._id || comment.id
    if (!id) return

    const current = commentLikes?.[id] || { liked: false, likes: 0 }

    setCommentLikes((prev) => ({
      ...prev,
      [id]: {
        liked: !current.liked,
        likes: current.liked ? current.likes - 1 : current.likes + 1,
      },
    }))

    try {
      const res = await fetch(`http://localhost:5000/api/comment/${id}/like`, {
        method: 'POST',
        headers: { 'x-user-id': user.user_id },
      })

      if (!res.ok) throw new Error()

      const data = await res.json()

      setCommentLikes((prev) => ({
        ...prev,
        [id]: data,
      }))
    } catch {
      refreshComments()
    }
  }

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [commentAvatarSrc])

  useEffect(() => {
    if (!targetCommentId || !currentCommentId) return
    if (String(targetCommentId) === currentCommentId) return
    if (hasTargetInDescendants) {
      setShowReplies(true)
    }
  }, [targetCommentId, currentCommentId, hasTargetInDescendants])

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return

    if (!user || !user.user_id) {
      showAlert('กรุณาเข้าสู่ระบบก่อนตอบกลับ', 'warning')
      return
    }

    if (replyText.length > MAX_COMMENT_LENGTH) {
      showAlert('ข้อความยาวเกินกำหนด', 'warning')
      return
    }

    try {
      const res = await fetch('http://localhost:5000/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discussionId: comment.discussionId,
          parentId: comment.id,
          message: replyText,
          user: {
            id: user.user_id,
            username: user.username,
            role: user.role,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'create reply failed')
      }

      setReplyText('')
      setShowReplyBox(false)
      refreshComments()
    } catch (err) {
      console.error(err)
      showAlert(err.message || 'ส่งความคิดเห็นไม่สำเร็จ', 'error')
    }
  }

  const handleEdit = async () => {
    if (!editText.trim()) return

    if (editText.length > MAX_COMMENT_LENGTH) {
      showAlert('ข้อความยาวเกินกำหนด', 'warning')
      return
    }

    try {
      const res = await fetch(`http://localhost:5000/api/comment/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editText }),
      })

      if (!res.ok) throw new Error('edit failed')

      setIsEditing(false)
      showAlert('แก้ไขความคิดเห็นสำเร็จ', 'success')
      refreshComments()
    } catch (err) {
      console.error(err)
      showAlert('แก้ไขไม่สำเร็จ', 'error')
    }
  }

  const handleDelete = async () => {
    showAlert('ต้องการลบความคิดเห็นนี้?', 'confirm', 'ยืนยันการลบ', async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/comment/${comment.id}`, {
          method: 'DELETE',
        })

        if (!res.ok) throw new Error('delete failed')

        showAlert('ลบความคิดเห็นสำเร็จ', 'success')
        refreshComments()
      } catch (err) {
        console.error(err)
        showAlert('ลบไม่สำเร็จ', 'error')
      }
    })
  }

  const closeReportModal = () => {
    setReportModal(false)
    setReportReason('')
    setReportDetail('')
  }

  const handleReportComment = () => {
    if (!user || !user.user_id) {
      showAlert('กรุณาเข้าสู่ระบบก่อนส่งรายงาน', 'warning')
      return
    }
    setReportModal(true)
  }

  const handleReportSubmit = async () => {
    if (!user || !user.user_id) {
      showAlert('กรุณาเข้าสู่ระบบก่อนส่งรายงาน', 'warning')
      return
    }

    if (!reportReason) {
      showAlert('กรุณาเลือกเหตุผลในการรายงาน', 'warning')
      return
    }

    if (!reportDetail.trim()) {
      showAlert('กรุณากรอกรายละเอียดเพิ่มเติม', 'warning')
      return
    }

    const commentId = comment._id || comment.id
    if (!commentId) {
      showAlert('ไม่พบข้อมูลความคิดเห็นสำหรับรายงาน', 'error')
      return
    }

    setIsSubmittingReport(true)
    try {
      const headers = { 'Content-Type': 'application/json' }
      headers['x-user-id'] = String(user.user_id)
      if (user.role) headers['x-role'] = String(user.role)

      const res = await fetch(`http://localhost:5000/api/comments/${commentId}/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          comment_id: commentId,
          user_id: user.user_id,
          reason: reportReason,
          description: reportDetail.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        showAlert(data?.message || 'ส่งรายงานไม่สำเร็จ', 'error')
        return
      }

      showAlert(data?.message || 'ส่งรายงานเรียบร้อยแล้ว', 'success')
      closeReportModal()
    } catch {
      showAlert('เกิดข้อผิดพลาดในการส่งรายงาน', 'error')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  return (
    <div
      id={currentCommentId ? `comment-${currentCommentId}` : undefined}
      className={`comment-item ${level === 0 ? 'comment-root' : 'comment-reply-item'} comment-level-${Math.min(level, 3)}${isTargetComment ? ' comment-target' : ''}${hasTargetInDescendants ? ' comment-target-path' : ''}`}
    >
      <div className="comment-header">
        <div className="avatar-circle small-avatar">
          {commentAvatarSrc && !avatarLoadFailed ? (
            <img
              src={commentAvatarSrc}
              alt={comment.username || 'avatar'}
              className="avatar-image"
              onError={() => setAvatarLoadFailed(true)}
            />
          ) : (
            commentInitial
          )}
        </div>

        <div className="comment-meta">
          <div className="comment-name">
            {comment.username}
            {isTargetComment && <span className="comment-target-badge">เป้าหมาย</span>}
            {level > 0 && <span className="reply-level-badge">ตอบกลับ</span>}

            {comment.role === 'admin' ? (
              <span className="badge-admin"><Shield size={12} /> Admin</span>
            ) : (
              <span className="badge-user"><User size={12} /> User</span>
            )}

            <span className="comment-time">{formatTimeAgo(comment.created_at)}</span>

            {comment.updated_at && comment.updated_at !== comment.created_at && (
              <span className="comment-edited">(แก้ไขแล้ว {formatTimeAgo(comment.updated_at)})</span>
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

            <div className="text-end small text-muted">{editText.length}/{MAX_COMMENT_LENGTH}</div>

            <div className="reply-button-group">
              <button className="btn btn-primary btn-sm" onClick={handleEdit}>บันทึก</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>ยกเลิก</button>
            </div>
          </div>
        ) : (
          comment.message
        )}
      </div>

      <div className="comment-footer">
        <div className="comment-like-container">
          {(() => {
            const realId = comment._id || comment.id
            const likeData = commentLikes?.[realId] || { liked: false, likes: 0 }

            return (
              <span
                className="comment-like"
                onClick={handleLike}
                style={{ color: likeData.liked ? '#e0245e' : '' }}
              >
                <Heart size={14} fill={likeData.liked ? '#e0245e' : 'none'} />
                {likeData.likes}
              </span>
            )
          })()}
        </div>

        {canReply && (
          <span className="comment-reply" onClick={() => setShowReplyBox((v) => !v)}>
            ตอบกลับ
          </span>
        )}

        <span className="comment-report" onClick={handleReportComment}>
          <Flag size={14} />
          รายงาน
        </span>

        {(comment.replies?.length ?? 0) > 0 && (
          <span className="comment-toggle" onClick={() => setShowReplies((v) => !v)}>
            {showReplies ? 'ซ่อนการตอบกลับ' : `ดูการตอบกลับ (${comment.replies.length})`}
          </span>
        )}
      </div>

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

          <div className="text-end small text-muted">{replyText.length}/{MAX_COMMENT_LENGTH}</div>

          <div className="reply-button-group">
            <button className="btn btn-primary btn-sm" onClick={handleReplySubmit}>ส่ง</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowReplyBox(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {showReplies && (comment.replies?.length ?? 0) > 0 && (
        <div className={`comment-reply-box ${level > 0 ? 'comment-reply-box-nested' : ''}`}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              onDelete={onDelete}
              onEdit={onEdit}
              refreshComments={refreshComments}
              commentLikes={commentLikes}
              setCommentLikes={setCommentLikes}
              targetCommentId={targetCommentId}
            />
          ))}
        </div>
      )}

      {reportModal && (
        <div className="report-modal-overlay" onClick={closeReportModal}>
          <div className="report-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="report-modal-close"
              onClick={closeReportModal}
              aria-label="close report modal"
            >
              <X size={18} />
            </button>

            <h5 className="report-modal-title">รายงานเนื้อหาไม่เหมาะสม</h5>
            <p className="report-modal-subtitle">กรุณาเลือกเหตุผลในการรายงานความคิดเห็นนี้</p>

            <div className="report-modal-field">
              <label className="report-modal-label">เหตุผล</label>
              <select
                className="report-modal-select"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">เลือกเหตุผล</option>
                {reportReasons.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div className="report-modal-field">
              <label className="report-modal-label">รายละเอียดเพิ่มเติม (บังคับ)</label>
              <textarea
                className="report-modal-textarea"
                rows={3}
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="อธิบายเพิ่มเติม..."
                required
              />
            </div>

            <div className="report-modal-actions">
              <button type="button" className="report-btn-cancel" onClick={closeReportModal}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="report-btn-submit"
                onClick={handleReportSubmit}
                disabled={isSubmittingReport}
              >
                {isSubmittingReport ? 'กำลังส่ง...' : 'ส่งรายงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

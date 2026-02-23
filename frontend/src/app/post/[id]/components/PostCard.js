'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import { useAlert } from '@/app/lib/alert-context'
import { formatTimeAgo } from '@/app/lib/time-format'
import { getAvatarInitial, normalizeAvatarSrc, pickAvatar } from '@/app/lib/avatar'
import {
  Heart,
  MessageCircle,
  Eye,
  User,
  Calendar,
  Pencil,
  Trash2,
  MoreHorizontal,
  Shield,
  Flag,
  X,
  Pin,
  Flame
} from 'lucide-react'

export default function PostCard({ post, commentsCount, onLike, onEdit, onDelete }) {
  const [openMenu, setOpenMenu] = useState(false)
  const [reportModal, setReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const { user } = useAuth()
  const { showAlert } = useAlert()

  const isOwner = user && user.user_id === post.user_id
  const isAdmin = user?.role === 'admin'
  const canManage = isOwner || isAdmin

  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const authorInitial = getAvatarInitial(post?.author || '')
  const authorAvatarSrc = normalizeAvatarSrc(
    pickAvatar(post, post?.user, post?.authorInfo)
  )

  const reportReasons = [
    'สแปมหรือโฆษณา',
    'คำหยาบคายหรือคุกคาม',
    'เนื้อหาละเมิดกฎชุมชน',
    'ข้อมูลเท็จหรือทำให้เข้าใจผิด',
    'อื่นๆ'
  ]

  const closeReportModal = () => {
    setReportModal(false)
    setReportReason('')
    setReportDetail('')
  }

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [authorAvatarSrc])

  const handleReportSubmit = async () => {
    if (!user) {
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

    if (!post?.id) {
      showAlert('ไม่พบข้อมูลโพสต์สำหรับรายงาน', 'error')
      return
    }

    setIsSubmittingReport(true)
    try {
      const res = await fetch(`http://localhost:5000/api/discussion/${post.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.user_id,
          'x-role': user.role
        },
        body: JSON.stringify({
          post_id: post.id,
          user_id: user.user_id,
          reason: reportReason,
          description: reportDetail.trim()
        })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showAlert(data.message || 'ส่งรายงานไม่สำเร็จ', 'error')
        return
      }

      showAlert(data.message || 'ส่งรายงานเรียบร้อยแล้ว', 'success')
      closeReportModal()
    } catch (err) {
      console.error(err)
      showAlert('เกิดข้อผิดพลาดในการส่งรายงาน', 'error')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  return (
    <>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="mb-2 post-tags">
            {Number(post.is_pinned) === 1 && (
              <span className="status-badge status-pin">
                <Pin size={12} />
                ปักหมุด
              </span>
            )}
            {Number(post.is_hot) === 1 && (
              <span className="status-badge status-hot">
                <Flame size={12} />
                มาแรง
              </span>
            )}
            {post.categories?.[0] && (
              <span className="category-badge">{post.categories[0]}</span>
            )}
          </div>

          <h4 className="fw-bold post-title-main">{post.title}</h4>

          <div className="d-flex align-items-center text-muted small mb-3 post-author-row">
            <div className="avatar-circle me-2">
              {authorAvatarSrc && !avatarLoadFailed ? (
                <img
                  src={authorAvatarSrc}
                  alt={post.author || 'avatar'}
                  className="avatar-image"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                authorInitial
              )}
            </div>

            <div className="post-meta post-meta-row">
              <span className="post-author">{post.author}</span>

              <div className="post-name">
                {post.role === 'admin' ? (
                  <span className="badge-admin"><Shield size={12} /> Admin</span>
                ) : (
                  <span className="badge-user"><User size={12} /> User</span>
                )}
              </div>

              <div className="post-date">
                <Calendar size={14} className="me-1" />
                {formatTimeAgo(post.date)}
              </div>
            </div>

            {canManage && (
              <div className="ms-auto position-relative">
                <MoreHorizontal
                  style={{ cursor: 'pointer' }}
                  onClick={() => setOpenMenu((prev) => !prev)}
                />

                {openMenu && (
                  <div className="post-menu">
                    <div
                      className="post-menu-item"
                      onClick={() => {
                        if (!canManage) return
                        setOpenMenu(false)
                        onEdit()
                      }}
                    >
                      <Pencil size={16} /> แก้ไขกระทู้
                    </div>

                    <div
                      className="post-menu-item delete"
                      onClick={() => {
                        if (!canManage) return
                        setOpenMenu(false)
                        onDelete()
                      }}
                    >
                      <Trash2 size={16} /> ลบกระทู้
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="post-divider" />

          <p className="text-content">{post.content}</p>

          <hr className="post-divider" />

          <div className="d-flex gap-3 text-muted flex-wrap post-stats-row">
            <button
              type="button"
              className="post-stat post-stat-btn"
              style={{ color: post.liked ? '#e0245e' : '' }}
              onClick={onLike}
              aria-label="like post"
            >
              <Heart
                size={18}
                fill={post.liked ? '#e0245e' : 'none'}
                stroke={post.liked ? '#e0245e' : 'currentColor'}
              /> {post.likes}
            </button>

            <span className="post-stat"><MessageCircle size={18} /> {commentsCount}</span>
            <span className="post-stat"><Eye size={18} /> {post.views}</span>
            <button
              type="button"
              className="report-flag report-flag-btn"
              onClick={() => setReportModal(true)}
              aria-label="report post"
            >
              <Flag size={18} />
              <span className="visually-hidden">รายงานเนื้อหาไม่เหมาะสม</span>
            </button>
          </div>
        </div>
      </div>

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
            <p className="report-modal-subtitle">กรุณาเลือกเหตุผลในการรายงานกระทู้นี้</p>

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
              <button
                type="button"
                className="report-btn-cancel"
                onClick={closeReportModal}
              >
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
    </>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Clock3, ExternalLink, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatTimeAgo } from '@/app/lib/time-format'
import { useAuth } from '@/app/lib/auth-context'
import { useAlert } from '@/app/lib/alert-context'
import '../styles/ReportsTab.css'

export default function CommentReportsTab({ sortBy }) {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState(null)
    const [rejectingId, setRejectingId] = useState(null)
    const { user: currentUser, loading: authLoading } = useAuth()
    const { showAlert } = useAlert()
    const router = useRouter()

    const fetchReports = useCallback(async () => {
        if (authLoading) return

        if (!currentUser) {
            setReports([])
            setLoading(false)
            return
        }

        if (currentUser.role !== 'admin') {
            setReports([])
            setLoading(false)
            showAlert('หน้านี้สำหรับผู้ดูแลระบบเท่านั้น', 'error')
            return
        }

        try {
            setLoading(true)

            const headers = {}
            headers['x-user-id'] = String(currentUser.user_id)
            if (currentUser.role) headers['x-role'] = String(currentUser.role)

            const response = await fetch('http://localhost:5000/api/admin/reports/comments?limit=50&page=1', { headers })
            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                const message = data?.message || data?.error || `โหลดรายงานไม่สำเร็จ (${response.status})`
                showAlert(message, 'error')
                setReports([])
                return
            }

            if (!data.success) {
                showAlert(data?.message || 'โหลดรายงานไม่สำเร็จ', 'error')
                setReports([])
                return
            }

            setReports(Array.isArray(data.data) ? data.data : [])
        } catch {
            showAlert('ไม่สามารถโหลดรายงานความคิดเห็นได้', 'error')
            setReports([])
        } finally {
            setLoading(false)
        }
    }, [authLoading, currentUser, showAlert])

    useEffect(() => {
        fetchReports()
    }, [fetchReports])

    const filteredReports = useMemo(() => {
        if (sortBy === 'all') return reports
        if (sortBy === 'waiting') return reports.filter((report) => report.status === 'pending')
        if (sortBy === 'approved') return reports.filter((report) => report.status === 'approved')
        if (sortBy === 'rejected') return reports.filter((report) => report.status === 'rejected')
        return reports
    }, [reports, sortBy])

    const rejectReport = useCallback(async (reportId) => {
        try {
            setRejectingId(reportId)

            const headers = { 'Content-Type': 'application/json' }
            headers['x-user-id'] = String(currentUser.user_id)
            if (currentUser.role) headers['x-role'] = String(currentUser.role)

            const response = await fetch(`http://localhost:5000/api/admin/reports/comments/${reportId}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status: 'rejected' }),
            })
            const data = await response.json().catch(() => ({}))

            if (!response.ok || !data.success) {
                showAlert(data?.message || data?.error || 'ไม่สามารถเปลี่ยนสถานะรายงานได้', 'error')
                return
            }

            setReports((prev) => prev.map((report) => (
                report.id === reportId ? { ...report, status: 'rejected' } : report
            )))
            showAlert('อัปเดตสถานะเป็นไม่ผิดกฎแล้ว', 'success')
        } catch {
            showAlert('ไม่สามารถเปลี่ยนสถานะรายงานได้', 'error')
        } finally {
            setRejectingId(null)
        }
    }, [currentUser, showAlert])

    const deleteComment = useCallback(async (reportId, commentId) => {
        try {
            setDeletingId(reportId)

            const headers = {}
            headers['x-user-id'] = String(currentUser.user_id)
            if (currentUser.role) headers['x-role'] = String(currentUser.role)

            const response = await fetch(`http://localhost:5000/api/comment/${commentId}`, {
                method: 'DELETE',
                headers,
            })
            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                showAlert(data?.message || data?.error || data?.error || 'ไม่สามารถลบความคิดเห็นได้', 'error')
                return
            }

            setReports((prev) => prev.filter((report) => report.comment_id !== commentId))
            showAlert('ลบความคิดเห็นเรียบร้อยแล้ว', 'success')
        } catch {
            showAlert('ไม่สามารถลบความคิดเห็นได้', 'error')
        } finally {
            setDeletingId(null)
        }
    }, [currentUser, showAlert])

    const handleReject = useCallback((reportId) => {
        if (!reportId) return
        if (!currentUser || currentUser.role !== 'admin') {
            showAlert('ไม่มีสิทธิ์เปลี่ยนสถานะรายงาน', 'error')
            return
        }

        showAlert(
            'ต้องการเลิกการรายงานนี้?',
            'confirm',
            'ยืนยันการเลิกการรายงาน',
            () => rejectReport(reportId)
        )
    }, [currentUser, rejectReport, showAlert])

    const handleDelete = useCallback((report) => {
        if (!report?.id || !report?.comment_id) return
        if (!currentUser || currentUser.role !== 'admin') {
            showAlert('ไม่มีสิทธิ์ลบความคิดเห็น', 'error')
            return
        }

        showAlert(
            'ต้องการลบความคิดเห็นนี้จากฐานข้อมูลจริง?',
            'confirm',
            'ยืนยันการลบความคิดเห็น',
            () => deleteComment(report.id, report.comment_id)
        )
    }, [currentUser, deleteComment, showAlert])

    if (authLoading || loading) return <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>

    if (filteredReports.length === 0) {
        return (
            <div className="empty-state">
                <AlertTriangle size={60} strokeWidth={1} />
                <p>ไม่มีรายงานความคิดเห็น</p>
            </div>
        )
    }

    return (
        <div className="reports-list">
            {filteredReports.map((report) => {
                const discussionId = report?.comment_data?.discussionId
                return (
                    <div key={report.id} className="report-card">
                        <div className="report-top">
                            <div className="report-meta">
                                <span className="status-pill">
                                    <AlertTriangle size={13} />
                                    {mapStatusLabel(report.status)}
                                </span>
                                <span className="time-meta">
                                    <Clock3 size={13} />
                                    {formatTimeAgo(report.created_at)}
                                </span>
                            </div>

                            <div className="report-actions">
                                <button
                                    type="button"
                                    className="icon-btn"
                                    aria-label="เปิดรายละเอียด"
                                    onClick={() => discussionId && router.push(`/post/${discussionId}`)}
                                    disabled={!discussionId}
                                >
                                    <ExternalLink size={15} />
                                </button>
                                <button
                                    type="button"
                                    className="icon-btn"
                                    aria-label="เลิกการรายงาน"
                                    onClick={() => handleReject(report.id)}
                                    disabled={report.status === 'rejected' || rejectingId === report.id}
                                >
                                    <X size={15} />
                                </button>
                                <button
                                    type="button"
                                    className="icon-btn danger"
                                    aria-label="ลบ"
                                    onClick={() => handleDelete(report)}
                                    disabled={deletingId === report.id}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>

                        <p className="report-line"><strong>คอมเมนต์:</strong> {report.comment_data?.message || `#${report.comment_id}`}</p>
                        <p className="report-line"><strong>เหตุผล:</strong> {report.reason || '-'}</p>
                        <p className="report-line muted">
                            <strong>รายงานโดย:</strong> {report.reporter_name || `ผู้ใช้ #${report.user_id}`}
                            {report.user_id === currentUser?.user_id ? ' (คุณ)' : ''}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}

function mapStatusLabel(status) {
    if (status === 'approved') return 'ลบเนื้อหาแล้ว'
    if (status === 'rejected') return 'ไม่ผิดกฎ'
    return 'รอตรวจสอบ'
}

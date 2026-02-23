'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flame, Notebook, Pin } from 'lucide-react'
import { formatTimeAgo } from '@/app/lib/time-format'
import { useAuth } from '@/app/lib/auth-context'
import { useAlert } from '@/app/lib/alert-context'

export default function DiscussionsTab() {
    const ITEMS_PER_PAGE = 20

    const [discussions, setDiscussions] = useState([])
    const [loading, setLoading] = useState(true)
    const [pinningId, setPinningId] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const { user: currentUser, loading: authLoading } = useAuth()
    const { showAlert } = useAlert()

    const fetchDiscussions = useCallback(async () => {
        if (authLoading) return

        if (!currentUser) {
            setDiscussions([])
            setLoading(false)
            return
        }

        if (currentUser.role !== 'admin') {
            setDiscussions([])
            setLoading(false)
            showAlert('This page is for admin users only', 'error')
            return
        }

        try {
            setLoading(true)

            const allRows = []
            let page = 1
            let hasNext = true

            while (hasNext && page <= 30) {
                const response = await fetch(`http://localhost:5000/api/discussion?page=${page}`)
                const data = await response.json().catch(() => ({}))

                if (!response.ok || !data.success) {
                    const message = data?.message || data?.error || 'Failed to load discussions'
                    showAlert(message, 'error')
                    setDiscussions([])
                    return
                }

                const rows = Array.isArray(data.data) ? data.data : []
                allRows.push(...rows)
                hasNext = Boolean(data.hasNext)
                page += 1
            }

            setDiscussions(allRows)
        } catch {
            showAlert('Unable to load discussions', 'error')
            setDiscussions([])
        } finally {
            setLoading(false)
        }
    }, [authLoading, currentUser, showAlert])

    useEffect(() => {
        fetchDiscussions()
    }, [fetchDiscussions])

    useEffect(() => {
        setCurrentPage(1)
    }, [discussions.length])

    const togglePin = useCallback(async (discussion) => {
        if (!discussion?.discussion_id) return

        try {
            setPinningId(discussion.discussion_id)

            const nextPinned = discussion.is_pinned ? 0 : 1
            const response = await fetch(`http://localhost:5000/api/discussion/${discussion.discussion_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_pinned: nextPinned }),
            })
            const data = await response.json().catch(() => ({}))

            if (!response.ok || !data.success) {
                showAlert(data?.message || data?.error || 'Unable to update pin status', 'error')
                return
            }

            setDiscussions((prev) => prev.map((row) => (
                row.discussion_id === discussion.discussion_id
                    ? { ...row, is_pinned: nextPinned }
                    : row
            )))

            showAlert(nextPinned ? 'Pinned discussion successfully' : 'Unpinned discussion successfully', 'success')
        } catch {
            showAlert('Unable to update pin status', 'error')
        } finally {
            setPinningId(null)
        }
    }, [showAlert])

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(discussions.length / ITEMS_PER_PAGE)),
        [discussions.length]
    )

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedDiscussions = discussions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    if (authLoading || loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
    if (discussions.length === 0) {
        return (
            <div className="empty-เช่น Top 10 เท่านั้น)state">
                <Notebook size={60} strokeWidth={1} />
                <p>No discussions found</p>
            </div>
        )
    }

    return (
        <>
            <div className="content-area">
                <section className="discussion-manager">
                    <div className="content-table discussion-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>หัวข้อ</th>
                                    <th>ผู้เขียน</th>
                                    <th className="text-center">ไลค์</th>
                                    <th className="text-center">ชม</th>
                                    <th className="text-center">ความคิดเห็น</th>
                                    <th className="text-center">ปักหมุด</th>
                                    <th className="text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedDiscussions.map((discussion) => (
                                    <tr key={discussion.discussion_id}>
                                        <td>
                                            <div className="discussion-title-cell">
                                                <div className="discussion-title">{discussion.title}</div>
                                                <div className="discussion-time">{formatTimeAgo(discussion.created_at)}</div>
                                            </div>
                                        </td>
                                        <td>{discussion.username || '-'}</td>
                                        <td className="text-center discussion-num">
                                            <span className="discussion-metric-pill">{discussion.like_count || 0}</span>
                                        </td>
                                        <td className="text-center discussion-num">
                                            <span className="discussion-metric-pill">{discussion.view_count || 0}</span>
                                        </td>
                                        <td className="text-center discussion-num">
                                            <span className="discussion-metric-pill">{discussion.comment_count || 0}</span>
                                        </td>
                                        <td className="text-center">
                                            <div className="discussion-status-list">
                                                <span className={`discussion-status ${discussion.is_pinned ? 'pinned' : ''}`}>
                                                    <Pin size={12} />
                                                </span>
                                                <span
                                                    className={`discussion-status ${Number(discussion.is_hot) === 1 ? 'hot' : ''}`}
                                                    title="สถานะมาแรง"
                                                >
                                                    <Flame size={12} />
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                type="button"
                                                className={`discussion-pin-btn ${discussion.is_pinned ? 'active' : ''}`}
                                                aria-label={discussion.is_pinned ? 'Unpin discussion' : 'Pin discussion'}
                                                onClick={() => togglePin(discussion)}
                                                disabled={pinningId === discussion.discussion_id}
                                            >
                                                <Pin size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {totalPages > 1 && (
                <div className="admin-pagination discussion-pagination">
                    <nav className="pagination-wrapper" aria-label="Discussion pagination">
                        <ul className="pagination">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                            </li>

                            <li className="page-item active">
                                <span className="page-link">{currentPage}</span>
                            </li>

                            <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </>
    )
}

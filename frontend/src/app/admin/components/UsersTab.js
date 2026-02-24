'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { Users, Edit2, Shield, ShieldOff, Ban, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/app/lib/auth-context'
import { useAlert } from '@/app/lib/alert-context'
import '../styles/UsersTab.css'

export default function UsersTab({ globalSearch: parentSearch }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState(parentSearch || '')
    const [debouncedSearch, setDebouncedSearch] = useState(parentSearch || '')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [editingUser, setEditingUser] = useState(null)
    const [saving, setSaving] = useState(false)
    const [banModal, setBanModal] = useState({ isOpen: false, userId: null, username: '', reason: '', expires_at: '' })
    const { user: currentUser } = useAuth()
    const { showAlert } = useAlert()

    // Fetch users from API and check ban status per user (search is server-side)
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true)
            let url = `http://localhost:5000/api/admin/users?page=${page}&limit=10`
            if (debouncedSearch.trim()) {
                url += `&search=${encodeURIComponent(debouncedSearch.trim())}`
            }
            const headers = {}
            if (currentUser) {
                headers['x-user-id'] = String(currentUser.user_id)
                if (currentUser.role) headers['x-role'] = String(currentUser.role)
            }

            const response = await fetch(url, { headers })
            if (!response.ok) throw new Error('Failed to fetch users')
            const data = await response.json()
            const fetched = data.data || []

            // For each user, ask backend if they're currently banned.
            const withBan = await Promise.all(fetched.map(async (u) => {
                try {
                    const res = await fetch(`http://localhost:5000/api/admin/users/${u.user_id || u.id}/ban`, { headers })
                    if (!res.ok) {
                        console.warn(`Ban check failed for user ${u.user_id || u.id}, status: ${res.status}`)
                        return { ...u, is_banned: false }
                    }
                    const banInfo = await res.json().catch(() => null)
                    console.log(`Ban check for user ${u.user_id || u.id}:`, banInfo)
                    return {
                        ...u,
                        is_banned: !!(banInfo && banInfo.banned),
                        ever_banned: !!(banInfo && banInfo.ever_banned),
                        last_ban_reason: banInfo?.last_reason || banInfo?.reason || null,
                        last_ban_expires_at: banInfo?.last_expires_at || banInfo?.expires_at || null
                    }
                } catch (err) {
                    console.error(`Ban check error for user ${u.user_id || u.id}:`, err)
                    return { ...u, is_banned: false }
                }
            }))

            setUsers(withBan)
            setTotalPages(data.pagination?.totalPages || 1)
        } catch (error) {
            console.error('Error fetching users:', error)
            showAlert('ไม่สามารถโหลดข้อมูลผู้ใช้', 'error')
            setUsers([])
        } finally {
            setLoading(false)
        }
    }, [page, debouncedSearch, showAlert, currentUser])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(t)
    }, [search])

    // sync when parent search prop changes and reset to page 1 when search changes
    useEffect(() => {
        if (typeof parentSearch !== 'undefined') {
            setSearch(parentSearch)
        }
    }, [parentSearch])

    // reset to first page when search term changes so results make sense
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    // Handle make admin
    const handleMakeAdmin = useCallback(async (userId) => {
        showAlert('คุณแน่ใจหรือว่าต้องการให้ user นี้เป็น Admin?', 'confirm', 'ยืนยัน', async () => {
            try {
                setSaving(true)
                const headers = { 'Content-Type': 'application/json' }
                if (currentUser) {
                    headers['x-user-id'] = String(currentUser.user_id)
                    if (currentUser.role) headers['x-role'] = String(currentUser.role)
                }
                const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/make-admin`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ by_user_id: currentUser?.user_id })
                })
                if (!res.ok) {
                    const errText = await res.text().catch(() => '')
                    console.error('Make admin failed', res.status, errText)
                    showAlert(`แต่งตั้งไม่สำเร็จ (status ${res.status})`, 'error')
                    return
                }
                await fetchUsers()
                setEditingUser(null)
                showAlert('แต่งตั้ง Admin เรียบร้อย', 'success')
            } catch (error) {
                console.error('Make admin error:', error)
                showAlert('เกิดข้อผิดพลาดขณะแต่งตั้ง', 'error')
            } finally {
                setSaving(false)
            }
        })
    }, [currentUser?.user_id, showAlert, fetchUsers])

    // Handle remove admin
    const handleRemoveAdmin = useCallback(async (userId, promotedBy) => {
        // Check if trying to remove self
        if (userId === currentUser?.user_id) {
            showAlert('ไม่สามารถยกเลิกสิทธิ admin ของตัวเอง', 'error')
            return
        }

        // Check if current user promoted this person (cannot revoke own promotion)
        if (promotedBy === currentUser?.user_id) {
            showAlert('ไม่สามารถยกเลิกสิทธิ admin ของคนที่คุณแต่งตั้ง', 'error')
            return
        }

        showAlert('คุณแน่ใจหรือว่าต้องการยกเลิกสิทธิ Admin ของ user นี้?', 'confirm', 'ยืนยัน', async () => {
            try {
                setSaving(true)
                const headers = { 'Content-Type': 'application/json' }
                if (currentUser) {
                    headers['x-user-id'] = String(currentUser.user_id)
                    if (currentUser.role) headers['x-role'] = String(currentUser.role)
                }
                const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/remove-admin`, {
                    method: 'PUT',
                    headers
                })
                if (!res.ok) {
                    const errText = await res.text().catch(() => '')
                    console.error('Remove admin failed', res.status, errText)
                    showAlert(`ยกเลิกไม่สำเร็จ (status ${res.status})`, 'error')
                    return
                }
                await fetchUsers()
                setEditingUser(null)
                showAlert('ยกเลิกสิทธิ Admin เรียบร้อย', 'success')
            } catch (error) {
                console.error('Remove admin error:', error)
                showAlert('เกิดข้อผิดพลาดขณะยกเลิก', 'error')
            } finally {
                setSaving(false)
            }
        })
    }, [currentUser?.user_id, showAlert, fetchUsers])

    // Open ban modal
    const openBanModal = useCallback((userId, username) => {
        setBanModal({ isOpen: true, userId, username, reason: '', expires_at: '' })
    }, [])

    const closeBanModal = useCallback(() => setBanModal({ isOpen: false, userId: null, username: '', reason: '', expires_at: '' }), [])

    const submitBan = useCallback(async () => {
        if (!banModal.reason || banModal.reason.trim().length < 3) {
            showAlert('โปรดระบุเหตุผลในการแบนอย่างน้อย 3 ตัวอักษร', 'error')
            return
        }
        try {
            setSaving(true)
            const headers = { 'Content-Type': 'application/json' }
            if (currentUser) {
                headers['x-user-id'] = String(currentUser.user_id)
                if (currentUser.role) headers['x-role'] = String(currentUser.role)
            }

            const res = await fetch(`http://localhost:5000/api/admin/users/${banModal.userId}/ban`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ reason: banModal.reason, expires_at: banModal.expires_at.trim() ? banModal.expires_at : null })
            })

            if (!res.ok) {
                const txt = await res.text().catch(() => '')
                console.error('Ban create failed', res.status, txt)
                showAlert(`แบนไม่สำเร็จ (status ${res.status})`, 'error')
                return
            }

            // Optimistically update local state so UI reflects ban immediately
            const bannedUserId = banModal.userId
            setUsers(prev => prev.map(u => {
                if (String(u.user_id) === String(bannedUserId) || String(u.id) === String(bannedUserId)) {
                    return { ...u, is_banned: true, last_ban_reason: banModal.reason }
                }
                return u
            }))
            closeBanModal()
            showAlert(`แบน ${banModal.username} เรียบร้อย`, 'success')
        } catch (err) {
            console.error('Ban create error', err)
            showAlert('เกิดข้อผิดพลาดขณะทำการแบน', 'error')
        } finally {
            setSaving(false)
        }
    }, [banModal, currentUser, fetchUsers, showAlert, closeBanModal])

    // Handle unban: directly delete the ban
    const handleUnban = useCallback(async (userId, username) => {
        showAlert(`คุณแน่ใจหรือว่าต้องการยกเลิกการแบน ${username}?`, 'confirm', 'ยืนยัน', async () => {
            try {
                setSaving(true)
                const headers = { 'Content-Type': 'application/json' }
                if (currentUser) {
                    headers['x-user-id'] = String(currentUser.user_id)
                    if (currentUser.role) headers['x-role'] = String(currentUser.role)
                }

                const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/ban`, {
                    method: 'DELETE',
                    headers
                })
                if (!res.ok) {
                    const txt = await res.text().catch(() => '')
                    console.error('Unban failed', res.status, txt)
                    showAlert(`ยกเลิกการแบนไม่สำเร็จ (status ${res.status})`, 'error')
                    return
                }

                // Optimistically update local state so UI reflects unban immediately
                const unbannedUserId = userId
                setUsers(prev => prev.map(u => {
                    if (String(u.user_id) === String(unbannedUserId) || String(u.id) === String(unbannedUserId)) {
                        return { ...u, is_banned: false }
                    }
                    return u
                }))
                showAlert(`ยกเลิกการแบน ${username} เรียบร้อย`, 'success')
            } catch (err) {
                console.error('Unban error', err)
                showAlert('เกิดข้อผิดพลาดขณะยกเลิกการแบน', 'error')
            } finally {
                setSaving(false)
            }
        })
    }, [currentUser, showAlert])

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>กำลังโหลด...</div>
    if (users.length === 0) {
        return (
            <div className="empty-state">
                <Users size={60} strokeWidth={1} />
                <p>ไม่มีผู้ใช้</p>
            </div>
        )
    }

    // Search is done on the server; no client-side filter needed
    return (
        <>
            <div className="content-area">

                <div className="users-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>ชื่อผู้ใช้</th>
                                <th>อีเมล</th>
                                <th>บทบาท</th>
                                <th>สมัครเมื่อ</th>
                                <th>การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.user_id || user.id} style={user.is_banned ? { borderLeft: '4px solid #d35400' } : {}}>
                                    <td data-label="ชื่อผู้ใช้">
                                        <div className="user-cell">
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <strong>{user.username}</strong>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="อีเมล">{user.email}</td>
                                    <td data-label="บทบาท">
                                        <div className="role-badge">
                                            {user.is_banned ? (
                                                <span className="badge-banned">แบน</span>
                                            ) : user.role === 'admin' ? (
                                                <span className="badge-admin">Admin</span>
                                            ) : (
                                                <span className="badge-user">User</span>
                                            )}
                                        </div>
                                    </td>
                                    <td data-label="สมัครเมื่อ">
                                        {user.created_at
                                            ? new Date(user.created_at).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })
                                            : '-'
                                        }
                                    </td>
                                    <td data-label="การจัดการ">
                                        <div className="actions-cell">
                                            {user.role !== 'admin' && (
                                                <button
                                                    className="btn-make-admin"
                                                    title="แต่งตั้งเป็น Admin"
                                                    onClick={() => handleMakeAdmin(user.user_id || user.id)}
                                                    disabled={saving}
                                                >
                                                    <Shield size={18} />
                                                </button>
                                            )}
                                            {user.role === 'admin' && (
                                                <button
                                                    className="btn-remove-admin"
                                                    title={
                                                        user.user_id === currentUser?.user_id
                                                            ? "ไม่สามารถยกเลิกสิทธิของตัวเอง"
                                                            : user.promoted_by === currentUser?.user_id
                                                                ? "ไม่สามารถยกเลิกสิทธิของคนที่คุณแต่งตั้ง"
                                                                : "ยกเลิกสิทธิ Admin"
                                                    }
                                                    onClick={() => handleRemoveAdmin(user.user_id || user.id, user.promoted_by)}
                                                    disabled={
                                                        saving ||
                                                        user.user_id === currentUser?.user_id ||
                                                        user.promoted_by === currentUser?.user_id
                                                    }
                                                >
                                                    <ShieldOff size={18} />
                                                </button>
                                            )}
                                            {user.user_id !== currentUser?.user_id && (
                                                user.is_banned ? (
                                                    <button
                                                        className="btn-unban-user"
                                                        title={`ยกเลิกการแบน ${user.username}`}
                                                        onClick={() => handleUnban(user.user_id || user.id, user.username)}
                                                        disabled={saving}
                                                    >
                                                        <CheckCircle2 size={16} style={{ marginRight: '4px' }} />
                                                        ยกเลิกแบน
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-ban-user"
                                                        title="แบนผู้ใช้"
                                                        onClick={() => openBanModal(user.user_id || user.id, user.username)}
                                                        disabled={saving}
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination outside content-area */}
            <div className="admin-pagination">
                <nav className="pagination-wrapper">
                    <ul className="pagination">
                        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => setPage(prev => prev - 1)}
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                        </li>

                        <li className="page-item active">
                            <span className="page-link">{page}</span>
                        </li>

                        <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => setPage(prev => prev + 1)}
                                disabled={page >= totalPages}
                            >
                                Next
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Ban Modal */}
            {banModal.isOpen && (
                <div className="ban-overlay">
                    <div className="ban-modal">
                        <h3>แบนผู้ใช้</h3>
                        <p className="sub">กรอกรายละเอียดการแบน "{banModal.username}"</p>
                        <label style={{ display: 'block', marginTop: 8 }}>เหตุผลในการแบน *</label>
                        <textarea value={banModal.reason} onChange={(e) => setBanModal(prev => ({ ...prev, reason: e.target.value }))} />
                        <div className="row">
                            <label>วันหมดอายุการแบน (ไม่ระบุ = ถาวร)</label>
                            <input type="date" value={banModal.expires_at} onChange={(e) => setBanModal(prev => ({ ...prev, expires_at: e.target.value }))} />
                        </div>
                        <div className="ban-actions">
                            <button className="ban-cancel" onClick={closeBanModal}>ยกเลิก</button>
                            <button className="ban-confirm" onClick={submitBan} disabled={saving}>แบนผู้ใช้</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}



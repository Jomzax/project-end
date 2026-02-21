'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldX, Ban } from 'lucide-react'
import { useAuth } from '@/app/lib/auth-context'
import { useAlert } from '@/app/lib/alert-context'
import '../styles/BansTab.css'

export default function BansTab() {
    const [bans, setBans] = useState([])
    const [loading, setLoading] = useState(true)
    const { user: currentUser } = useAuth()
    const { showAlert } = useAlert()

    const fetchBans = useCallback(async () => {
        try {
            setLoading(true)
            const headers = {}
            if (currentUser) {
                headers['x-user-id'] = String(currentUser.user_id)
                if (currentUser.username) headers['x-username'] = String(currentUser.username)
                if (currentUser.role) headers['x-role'] = String(currentUser.role)
            }
            const response = await fetch('http://localhost:5000/api/admin/bans', { headers })
            if (!response.ok) throw new Error('Failed to fetch bans')
            const data = await response.json()
            setBans(data.data || [])
        } catch (error) {
            showAlert('ไม่สามารถโหลดประวัติการแบน', 'error')
            setBans([])
        } finally {
            setLoading(false)
        }
    }, [currentUser, showAlert])

    useEffect(() => {
        fetchBans()
    }, [fetchBans])

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        const d = new Date(dateStr)
        return d.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatExpires = (expiresAt) => {
        if (!expiresAt) return 'ถาวร'
        return new Date(expiresAt).toLocaleDateString('th-TH')
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>กำลังโหลด...</div>

    if (bans.length === 0) {
        return (
            <div className="bans-tab">
                <div className="empty-state">
                    <ShieldX size={60} strokeWidth={1} />
                    <p>ไม่มีประวัติการแบน</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bans-tab">
            <div className="content-table bans-wrapper">
                <table className="bans-table">
                    <thead>
                        <tr>
                            <th>การดำเนินการ</th>
                            <th>ผู้ใช้ที่ถูกดำเนินการ</th>
                            <th>ดำเนินการโดย</th>
                            <th>เหตุผล</th>
                            <th>หมดอายุ</th>
                            <th>วันที่ถูกแบน</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bans.map(ban => (
                            <tr key={ban.id}>
                                <td className="actions">
                                    <button className="btn-ban bans-ban-btn" type="button">
                                        <Ban size={16} style={{ marginRight: '4px' }} />
                                        แบน
                                    </button>
                                </td>
                                <td>{ban.username || `#${ban.user_id}`}</td>
                                <td>{ban.banned_by_username || `#${ban.banned_by}`}</td>
                                <td>{ban.reason || '-'}</td>
                                <td>{formatExpires(ban.expires_at)}</td>
                                <td>{formatDate(ban.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

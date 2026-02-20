'use client'

import { useState, useEffect } from 'react'
import { ShieldX, RotateCcw, Trash2 } from 'lucide-react'

export default function BansTab() {
    const [bans, setBans] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // const fetchBans = async () => {
        //     try {
        //         setLoading(true)
        //         // const response = await fetch('http://localhost:5000/api/admin/bans')
        //         if (!response.ok) throw new Error('Failed to fetch bans')
        //         const data = await response.json()
        //         setBans(data)
        //     } catch (error) {
        //         console.error('Error fetching bans:', error)
        //         setBans([])
        //     } finally {
        //         setLoading(false)
        //     }
        // }

        // fetchBans()
    }, [])

    if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>
    if (bans.length === 0) {
        return (
            <div className="empty-state">
                <ShieldX size={60} strokeWidth={1} />
                <p>ไม่มีประวัติการแบน</p>
            </div>
        )
    }

    return (
        <div className="content-table">
            <table>
                <thead>
                    <tr>
                        <th>ผู้ใช้ที่ถูกแบน</th>
                        <th>เหตุผล</th>
                        <th>วันที่แบน</th>
                        <th>ยกเลิกแบนจนถึง</th>
                        <th>การจัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {bans.map(ban => (
                        <tr key={ban.id}>
                            <td>{ban.username}</td>
                            <td>{ban.reason}</td>
                            <td>{new Date(ban.banned_at).toLocaleDateString('th-TH')}</td>
                            <td>{ban.unbanned_at ? new Date(ban.unbanned_at).toLocaleDateString('th-TH') : '⏳ ถาวร'}</td>
                            <td className="actions">
                                <button className="btn-unban"><RotateCcw size={18} /></button>
                                <button className="btn-delete"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Notebook, Edit2, Trash2 } from 'lucide-react'

export default function DiscussionsTab() {
    const [discussions, setDiscussions] = useState([])
    const [loading, setLoading] = useState(true)

    // useEffect(() => {
    //     const fetchDiscussions = async () => {
    //         try {
    //             setLoading(true)
    //             // const response = await fetch('http://localhost:5000/api/admin/discussions')
    //             if (!response.ok) throw new Error('Failed to fetch discussions')
    //             const data = await response.json()
    //             setDiscussions(data)
    //         } catch (error) {
    //             console.error('Error fetching discussions:', error)
    //             setDiscussions([])
    //         } finally {
    //             setLoading(false)
    //         }
    //     }

    //     fetchDiscussions()
    // }, [])

    if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>
    if (discussions.length === 0) {
        return (
            <div className="empty-state">
                <Notebook size={60} strokeWidth={1} />
                <p>ไม่มีกระทู้</p>
            </div>
        )
    }

    return (
        <div className="content-table">
            <table>
                <thead>
                    <tr>
                        <th>เรื่อง</th>
                        <th>ผู้เขียน</th>
                        <th>หมวดหมู่</th>
                        <th>ความคิดเห็น</th>
                        <th>วันที่สร้าง</th>
                        <th>การจัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {discussions.map(discussion => (
                        <tr key={discussion.id}>
                            <td>{discussion.title}</td>
                            <td>{discussion.username}</td>
                            <td>{discussion.category}</td>
                            <td>{discussion.comment_count || 0}</td>
                            <td>{new Date(discussion.created_at).toLocaleDateString('th-TH')}</td>
                            <td className="actions">
                                <button className="btn-edit"><Edit2 size={18} /></button>
                                <button className="btn-delete"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

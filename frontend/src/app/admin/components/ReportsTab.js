'use client'

import { useState, useEffect } from 'react'
import { Flag, Trash2, Check } from 'lucide-react'

export default function ReportsTab({ sortBy }) {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)

    // useEffect(() => {
    //     const fetchReports = async () => {
    //         try {
    //             setLoading(true)
    //             const response = await fetch(`http://localhost:5000/api/admin/post-reports?status=${sortBy}`)
    //             if (!response.ok) throw new Error('Failed to fetch reports')
    //             const data = await response.json()
    //             setReports(data)
    //         } catch (error) {
    //             console.error('Error fetching reports:', error)
    //             setReports([])
    //         } finally {
    //             setLoading(false)
    //         }
    //     }

    //     fetchReports()
    // }, [sortBy])

    if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>
    if (reports.length === 0) {
        return (
            <div className="empty-state">
                <Flag size={60} strokeWidth={1} />
                <p>ไม่มีรายงานกระทู้</p>
            </div>
        )
    }

    return (
        <div className="content-table">
            <table>
                <thead>
                    <tr>
                        <th>เรื่อง</th>
                        <th>ผู้รายงาน</th>
                        <th>เหตุผล</th>
                        <th>วันที่</th>
                        <th>การจัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map(report => (
                        <tr key={report.id}>
                            <td>{report.discussion_title}</td>
                            <td>{report.reporter_name}</td>
                            <td>{report.reason}</td>
                            <td>{new Date(report.created_at).toLocaleDateString('th-TH')}</td>
                            <td className="actions">
                                <button className="btn-approve"><Check size={18} /></button>
                                <button className="btn-delete"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

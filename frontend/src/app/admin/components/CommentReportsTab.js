'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Trash2, Check } from 'lucide-react'

export default function CommentReportsTab({ sortBy }) {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // const fetchReports = async () => {
        //     try {
        //         setLoading(true)
        //         // const response = await fetch(`http://localhost:5000/api/admin/comment-reports?status=${sortBy}`)
        //         // if (!response.ok) throw new Error('Failed to fetch reports')
        //         const data = await response.json()
        //         setReports(data)
        //     } catch (error) {
        //         console.error('Error fetching comment reports:', error)
        //         setReports([])
        //     } finally {
        //         setLoading(false)
        //     }
        // }

        // fetchReports()
    }, [sortBy])

    if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>
    if (reports.length === 0) {
        return (
            <div className="empty-state">
                <MessageSquare size={60} strokeWidth={1} />
                <p>ไม่มีรายงานความคิดเห็น</p>
            </div>
        )
    }

    return (
        <div className="categories-table">

            {/* Header */}
            <div className="categories-header">
                <div>หมวดหมู่</div>
                <div>ไอคอน</div>
                <div>อังกฤษ</div>
                <div>สี</div>
                <div className="text-center">จัดการ</div>
            </div>

            {/* Rows */}
            {categories.map(category => {
                const IconComponent = getIconComponent(category.icon)

                return (
                    <div key={category.category_id} className="categories-row">
                        <div className="col-name">
                            {category.name}
                        </div>

                        <div className="col-icon">
                            {category.icon}
                        </div>

                        <div className="col-slug">
                            {category.slug}
                        </div>

                        <div className="col-color">
                            <span
                                className="color-preview"
                                style={{ backgroundColor: category.color }}
                            />
                            {category.color}
                        </div>

                        <div className="col-actions">
                            <button className="btn-edit">
                                <Edit2 size={18} />
                            </button>
                            <button className="btn-delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>

    )
}

'use client'

import { useState } from 'react'
import { ArrowLeft, Notebook, MessageSquare, Users, Eye, ThumbsUp, Flag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import './admin.css'

const getStatIconStyle = (idx) => {
  const colors = [
    { bg: '#e8f1f8', color: '#3b82f6' },
    { bg: '#e8f8f1', color: '#10b981' },
    { bg: '#f3e8f8', color: '#8b5cf6' },
    { bg: '#e8f5f8', color: '#06b6d4' },
    { bg: '#f8e8f3', color: '#ec4899' },
    { bg: '#f8ede8', color: '#f97316' },
  ]
  const c = colors[idx % colors.length]
  return {
    backgroundColor: c.bg,
    color: c.color,
  }
}

const adminPageStyle = {
  backgroundColor: '#f5f5f5',
  minHeight: '100vh',
  padding: '20px',
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('reports')
  const [sortBy, setSortBy] = useState('waiting')

  const stats = [
    { label: 'กระทู้', value: 2, icon: <Notebook size={28} /> },
    { label: 'ความคิดเห็น', value: 4, icon: <MessageSquare size={28} /> },
    { label: 'ผู้ใช้', value: 2, icon: <Users size={28} /> },
    { label: 'ยอดชม', value: 8, icon: <Eye size={28} /> },
    { label: 'ไลค์', value: 1, icon: <ThumbsUp size={28} /> },
    { label: 'รายงานผิด', value: 0, icon: <Flag size={28} /> },
  ]

  const tabs = [
    { id: 'reports', label: 'รายงานกระทู้', count: 0 },
    { id: 'comment-reports', label: 'รายงานความคิดเห็น', count: 0 },
    { id: 'discussions', label: 'กระทู้', count: 0 },
    { id: 'categories', label: 'หมวดหมู่', count: 0 },
    { id: 'users', label: 'ผู้ใช้', count: 0 },
    { id: 'bans', label: 'ประวัติการแบน', count: 0 },
  ]

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <button className="back-btn" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-title">
          <div className="logo">🛡️</div>
          <div>
            <h1>Admin Dashboard</h1>
            <p className="subtitle">จัดการระบบ</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon" style={getStatIconStyle(idx)}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            <span className="count">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Sort Dropdown */}
      <div className="content-header">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="waiting">รอดำเนินการ</option>
          <option value="approved">อนุมัติแล้ว</option>
          <option value="rejected">ปฏิเสธแล้ว</option>
        </select>
      </div>

      {/* Content Area - Empty State */}
      <div className="content-area">
        <div className="empty-state">
          <Flag size={60} strokeWidth={1} />
          <p>ไม่มีรายงานกระทู้</p>
        </div>
      </div>
    </div>
  )
}
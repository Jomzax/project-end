'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Notebook, MessageSquare, Users, Eye, ThumbsUp, Flag, Grid3x3, Ban } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ReportsTab from './components/ReportsTab'
import CommentReportsTab from './components/CommentReportsTab'
import DiscussionsTab from './components/DiscussionsTab'
import CategoriesTab from './components/CategoriesTab'
import UsersTab from './components/UsersTab'
import BansTab from './components/BansTab'
import Loading from '@/app/components/Loading'
import './admin.css'
import './styles/ReportsTab.css'
import './styles/CategoriesTab.css'
import './styles/UsersTab.css'
import './styles/BansTab.css'

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

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('reports')
  const [sortBy, setSortBy] = useState('waiting')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState([])
  const [tabs, setTabs] = useState([])
  const [globalSearch, setGlobalSearch] = useState('')
  const [openCreateCategory, setOpenCreateCategory] = useState(false)

  const refreshTabCounts = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/stats')
      const data = await res.json()
      if (!data?.success) return

      setTabs((prev) => prev.map((tab) => {
        if (tab.id === 'reports') return { ...tab, count: data.reports || 0 }
        if (tab.id === 'comment-reports') return { ...tab, count: data.commentReports || 0 }
        if (tab.id === 'discussions') return { ...tab, count: data.discussions || 0 }
        if (tab.id === 'categories') return { ...tab, count: data.categories || 0 }
        if (tab.id === 'users') return { ...tab, count: data.users || 0 }
        if (tab.id === 'bans') return { ...tab, count: data.bans || 0 }
        return tab
      }))
    } catch (error) {
      console.error('Error refreshing tab counts:', error)
    }
  }, [])

  const handleTabDataChange = useCallback((deltaMap = null) => {
    if (deltaMap && typeof deltaMap === 'object') {
      setTabs((prev) => prev.map((tab) => {
        const delta = Number(deltaMap[tab.id] || 0)
        if (!delta) return tab
        return { ...tab, count: Math.max(0, Number(tab.count || 0) + delta) }
      }))
    }

    setTimeout(() => {
      refreshTabCounts()
    }, 900)
  }, [refreshTabCounts])

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        const res = await fetch("http://localhost:5000/api/stats")
        const data = await res.json()

        if (!data.success) {
          throw new Error("API Error")
        }

        setStats([
          { label: 'กระทู้', value: data.discussions || 0, icon: <Notebook size={28} /> },
          { label: 'ความคิดเห็น', value: data.comments || 0, icon: <MessageSquare size={28} /> },
          { label: 'ผู้ใช้', value: data.users || 0, icon: <Users size={28} /> },
          { label: 'ยอดชม', value: data.views || 0, icon: <Eye size={28} /> },
          { label: 'ไลค์', value: data.likes || 0, icon: <ThumbsUp size={28} /> },
          { label: 'รายงานผิด', value: (data.reports || 0) + (data.commentReports || 0), icon: <Flag size={28} /> },
        ])

        setTabs([
          { id: 'reports', icon: <Flag size={18} />, label: 'รายงานกระทู้', count: data.reports || 0 },
          { id: 'comment-reports', icon: <MessageSquare size={18} />, label: 'รายงานความคิดเห็น', count: data.commentReports || 0 },
          { id: 'discussions', icon: <Notebook size={18} />, label: 'กระทู้', count: data.discussions || 0 },
          { id: 'categories', icon: <Grid3x3 size={18} />, label: 'หมวดหมู่', count: data.categories || 0 },
          { id: 'users', icon: <Users size={18} />, label: 'ผู้ใช้', count: data.users || 0 },
          { id: 'bans', icon: <Ban size={18} />, label: 'ประวัติการแบน', count: data.bans  || 0 },
        ])

      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshTabCounts()
    }, 5000)
    return () => clearInterval(intervalId)
  }, [refreshTabCounts])

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

      {/* Loading State */}
      {loading ? (
        <Loading />
      ) : (
        <>
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
                {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                <span>{tab.label}</span>
                <span className="count">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Toolbar between tabs and header: search + add button (only for categories tab) */}
          {activeTab === 'categories' && (
            <div className="toolbar-container">
              <div className="toolbar-search">
                <input
                  type="text"
                  placeholder="ค้นหาหมวดหมู่..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="toolbar-input"
                />
              </div>

              <div className="toolbar-actions">
                <button
                  className="btn-primary toolbar-add-btn"
                  onClick={() => setOpenCreateCategory(true)}
                >
                  + เพิ่มหมวดหมู่ใหม่
                </button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="toolbar-container">
              <div className="toolbar-search">
                <input
                  type="text"
                  placeholder="ค้นหาผู้ใช้งาน..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="toolbar-input"
                />
              </div>

              <div className="toolbar-actions">
                {/* reserved for user actions (e.g., invite user) */}
              </div>
            </div>
          )}

          {activeTab === 'discussions' && (
            <div className="toolbar-container">
              <div className="toolbar-search">
                <input
                  type="text"
                  placeholder="ค้นหากระทู้..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="toolbar-input"
                />
              </div>

              <div className="toolbar-actions">
                {/* reserved for discussion actions */}
              </div>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="content-header">
            {(activeTab === 'reports' || activeTab === 'comment-reports') && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="all">ทั้งหมด</option>
                <option value="waiting">รอดำเนินการ</option>
                <option value="approved">ลบเนื้อหาแล้ว</option>
                <option value="rejected">ไม่ผิดกฎ</option>
              </select>
            )}
          </div>

          {/* Tabs with internal content-area and external pagination */}
          {activeTab === 'discussions' ? (
            <DiscussionsTab globalSearch={globalSearch} />
          ) : activeTab === 'categories' ? (
            <CategoriesTab openCreate={openCreateCategory} setOpenCreate={setOpenCreateCategory} globalSearch={globalSearch} />
          ) : activeTab === 'users' ? (
            <UsersTab globalSearch={globalSearch} />
          ) : (
            <div className="content-area">
              {activeTab === 'reports' && <ReportsTab sortBy={sortBy} onDataChange={handleTabDataChange} />}
              {activeTab === 'comment-reports' && <CommentReportsTab sortBy={sortBy} onDataChange={handleTabDataChange} />}
              {activeTab === 'bans' && <BansTab />}
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import {
  Heart,
  MessageCircle,
  Eye,
  User,
  Calendar,
  Pencil,
  Trash2,
  MoreHorizontal,
  Shield
} from 'lucide-react'

export default function PostCard({ post, commentsCount, onLike, onEdit, onDelete }) {

  const [openMenu, setOpenMenu] = useState(false)
  const { user } = useAuth()
  const isOwner = user && user.user_id === post.user_id
  const isAdmin = user?.role === 'admin'
  const canManage = isOwner || isAdmin


  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">

        {/* CATEGORY */}
        {post.categories?.[0] && (
          <div className="mb-2">
            <span className="category-badge">
              {post.categories[0]}
            </span>
          </div>
        )}

        {/* TITLE */}
        <h4 className="fw-bold">{post.title}</h4>

        {/* AUTHOR */}
        <div className="d-flex align-items-center text-muted small mb-3">

          <div className="avatar-circle me-2">
            {post.author.charAt(0).toUpperCase()}
          </div>

          <div className="post-meta">
            {post.author}

            <div className="post-name">
              {post.role === 'admin'
                ? <span className="badge-admin"><Shield size={12} /> Admin</span>
                : <span className="badge-user"><User size={12} /> User</span>
              }
            </div>

            <div>
              <Calendar size={14} className="me-1" />
              {post.date}
            </div>
          </div>

          {/* MENU */}
          {canManage && (
            <div className="ms-auto position-relative">

              <MoreHorizontal
                style={{ cursor: 'pointer' }}
                onClick={() => setOpenMenu(prev => !prev)}
              />

              {canManage && (
                <div className="ms-auto position-relative">

                
                  {openMenu && (
                    <div className="post-menu">
                      <div
                        className="post-menu-item"
                        onClick={() => {
                          if (!canManage) return
                          setOpenMenu(false)
                          onEdit()
                        }}
                      >
                        <Pencil size={16} /> แก้ไขกระทู้
                      </div>

                      <div
                        className="post-menu-item delete"
                        onClick={() => {
                          if (!canManage) return
                          setOpenMenu(false)
                          onDelete()
                        }}
                      >
                        <Trash2 size={16} /> ลบกระทู้
                      </div>
                    </div>
                  )}

                </div>
              )}


            </div>
          )}

        </div>

        <hr />

        {/* CONTENT */}
        <p className="text-content">{post.content}</p>

        <hr />

        {/* STATS */}
        <div className="d-flex gap-3 text-muted flex-wrap">

          <span
            style={{ cursor: 'pointer', color: post.liked ? '#e0245e' : '' }}
            onClick={onLike}
          >
            <Heart
              size={18}
              fill={post.liked ? '#e0245e' : 'none'}
              stroke={post.liked ? '#e0245e' : 'currentColor'}
            /> {post.likes}
          </span>

          <span><MessageCircle size={18} /> {commentsCount}</span>
          <span><Eye size={18} /> {post.views}</span>

        </div>

      </div>
    </div>
  )
}

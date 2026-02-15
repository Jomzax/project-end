'use client'

import {
  Heart,
  MessageCircle,
  Eye,
  Calendar,
  Share2,
  Bookmark,
  MoreHorizontal,
} from 'lucide-react'

export default function PostCard({ post, commentsCount, onLike }) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">

        <div className="mb-2">
          {post.categories.map((cat, index) => (
            <span key={index} className="badge bg-light text-dark me-2">
              {cat}
            </span>
          ))}
        </div>

        <h4 className="fw-bold">{post.title}</h4>

        <div className="d-flex align-items-center text-muted small mb-3">
          <div className="avatar-circle me-2">
            {post.author.charAt(0).toUpperCase()}
          </div>

          <div>
            <div>
              {post.author}
              <span className="badge bg-primary ms-2">
                {post.role}
              </span>
            </div>
            <div>
              <Calendar size={14} className="me-1" />
              {post.date}
            </div>
          </div>

          <div className="ms-auto">
            <MoreHorizontal />
          </div>
        </div>

        <hr />

        <p>{post.content}</p>

        <hr />

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

          <div className="ms-auto d-flex gap-3">
            <Bookmark />
            <Share2 />
          </div>
        </div>

      </div>
    </div>
  )
}

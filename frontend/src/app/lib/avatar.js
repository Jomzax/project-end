const AVATAR_BUCKET_NAME = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'projectend4'

export const getAvatarInitial = (rawValue) => {
  const text = String(rawValue || '').trim()
  if (!text) return 'U'

  const chars = Array.from(text.normalize('NFC'))
  const thaiConsonant = chars.find((ch) => /[ก-ฮ]/u.test(ch))
  if (thaiConsonant) return thaiConsonant

  const latinOrDigit = chars.find((ch) => /[A-Za-z0-9]/.test(ch))
  if (latinOrDigit) return latinOrDigit.toUpperCase()

  const firstLetterOrNumber = chars.find((ch) => /[\p{L}\p{N}]/u.test(ch))
  return firstLetterOrNumber ? firstLetterOrNumber.toUpperCase() : 'U'
}

export const normalizeAvatarSrc = (rawValue) => {
  const value = String(rawValue || '').trim()
  if (!value) return ''
  if (value.startsWith('blob:')) return value
  if (value.startsWith('/api/upload/avatar?key=')) return value
  if (value.startsWith('avatars/')) {
    return `/api/upload/avatar?key=${encodeURIComponent(value)}`
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      const marker = `/${AVATAR_BUCKET_NAME}/`
      const markerIndex = parsed.pathname.indexOf(marker)
      if (markerIndex >= 0) {
        const key = decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length))
        if (key) return `/api/upload/avatar?key=${encodeURIComponent(key)}`
      }
    } catch {
      return value
    }
  }

  return value
}

export const pickAvatar = (...values) => {
  const avatarKeys = [
    'avatar_url',
    'avatarUrl',
    'avatar',
    'avatarPath',
    'avatar_path',
    'avatarKey',
    'avatar_key',
    'user_avatar',
    'userAvatar',
    'commenter_avatar',
    'commenterAvatar',
    'profile_image',
    'profileImage',
    'image',
    'image_url',
    'imageUrl',
    'author_avatar',
    'authorAvatar',
    'photo',
    'photo_url',
    'photoUrl'
  ]

  for (const value of values) {
    if (!value) continue

    if (typeof value === 'string') {
      const asText = value.trim()
      if (asText) return asText
      continue
    }

    if (typeof value === 'object') {
      for (const key of avatarKeys) {
        const candidate = value[key]
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim()
        }
      }
    }
  }

  return ''
}

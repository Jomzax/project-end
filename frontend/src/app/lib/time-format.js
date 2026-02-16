export function formatTimeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return "เมื่อสักครู่"

  const minutes = Math.floor(diff / 60)
  if (minutes < 60) return `${minutes} นาที`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ชม.`

  const days = Math.floor(hours / 24)
  if (days === 1) return "เมื่อวาน"
  if (days < 7) {
    return `เมื่อ${date.toLocaleDateString('th-TH', { weekday: 'long' })}`
  }

  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const authRequired = (req, res, next) => {

  const userId = req.headers["x-user-id"]
  const username = req.headers["x-username"]
  const role = req.headers["x-role"]

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  // จำลอง session
  req.user = {
    user_id: Number(userId),
    username,
    role
  }

  next()
}

export const adminRequired = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - admin only' })
  }

  next()
}

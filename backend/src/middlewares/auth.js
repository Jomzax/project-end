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

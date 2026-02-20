import pool from "../db/mysql.js";

export const checkBan = async (req, res, next) => {
  const userId = req.user.user_id;

  const [rows] = await pool.query(`
    SELECT id
    FROM user_bans
    WHERE user_id = ?
    AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `, [userId]);

  if (rows.length > 0) {
    return res.status(403).json({
      message: "คุณถูกแบน"
    });
  }

  next();
};

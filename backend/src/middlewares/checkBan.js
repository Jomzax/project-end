import pool from "../db/mysql.js";

export const checkBan = async (req, res, next) => {
  const userId = req.user?.user_id;
  if (!userId) return next();

  const [rows] = await pool.query(`
    SELECT reason, expires_at
    FROM user_bans
    WHERE user_id = ?
    AND (expires_at IS NULL OR expires_at >= CURDATE())
    ORDER BY created_at DESC
    LIMIT 1
  `, [userId]);

  if (rows.length > 0) {
    return res.status(403).json({
      error: "banned",
      message: "คุณถูกแบน",
      reason: rows[0].reason || "ไม่ได้ระบุเหตุผล",
      expires_at: rows[0].expires_at || null
    });
  }

  next();
};

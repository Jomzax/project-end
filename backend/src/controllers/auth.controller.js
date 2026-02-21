import pool from "../db/mysql.js";

// REGISTER
export const register = async (req, res) => {
  const { email, password, username } = req.body;

  try {
    const [result] = await pool.execute(
      "INSERT INTO users (email, password, username) VALUES (?, ?, ?)",
      [email, password, username]
    );

    res.status(201).json({
      message: "User created",
      user_id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password]
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user_id = rows[0].user_id;

  // ตรวจสอบว่าถูกแบนอยู่หรือไม่ (แบนที่ยังไม่หมดอายุ - expires_at เป็น date ใช้ CURDATE())
  const [banRows] = await pool.query(`
    SELECT reason, expires_at
    FROM user_bans
    WHERE user_id = ?
    AND (expires_at IS NULL OR expires_at >= CURDATE())
    ORDER BY created_at DESC
    LIMIT 1
  `, [user_id]);

  if (banRows.length > 0) {
    return res.status(403).json({
      error: "banned",
      message: "คุณถูกแบน",
      reason: banRows[0].reason || "ไม่ได้ระบุเหตุผล",
      expires_at: banRows[0].expires_at || null
    });
  }

  res.json({
    message: "Login success",
    user: {
      user_id: rows[0].user_id,
      email: rows[0].email,
      username: rows[0].username,
      role: rows[0].role,
      created_at: rows[0].created_at
    }
  });
};

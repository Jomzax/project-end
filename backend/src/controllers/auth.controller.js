import pool from "../db/mysql.js";
import { hashPassword, isHashedPassword, verifyPassword } from "../utils/password.js";

// REGISTER
export const register = async (req, res) => {
  const { email, password, username } = req.body;

  try {
    if (!email || !password || !username) {
      return res.status(400).json({ error: "กรุณากรอกอีเมล ชื่อผู้ใช้ และรหัสผ่านให้ครบ" });
    }

    const passwordHash = await hashPassword(password);

    const [result] = await pool.execute(
      "INSERT INTO users (email, password, username) VALUES (?, ?, ?)",
      [email, passwordHash, username]
    );

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      user_id: result.insertId
    });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY" || String(err?.message || "").includes("Duplicate entry")) {
      return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
    }
    res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });
  }

  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);

  if (rows.length === 0) {
    return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }

  const user = rows[0];
  const storedPassword = user.password;
  let isValidPassword = false;

  if (isHashedPassword(storedPassword)) {
    isValidPassword = await verifyPassword(password, storedPassword);
  } else {
    // Backward compatibility for old plain-text rows.
    isValidPassword = storedPassword === password;
    if (isValidPassword) {
      const upgradedHash = await hashPassword(password);
      await pool.execute("UPDATE users SET password = ? WHERE user_id = ?", [upgradedHash, user.user_id]);
    }
  }

  if (!isValidPassword) {
    return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }

  const user_id = user.user_id;

  // ตรวจสอบว่าถูกแบนอยู่หรือไม่ (แบนที่ยังไม่หมดอายุ - expires_at เป็น date ใช้ CURDATE())
  const [banRows] = await pool.query(
    `
    SELECT reason, expires_at
    FROM user_bans
    WHERE user_id = ?
    AND (expires_at IS NULL OR expires_at >= CURDATE())
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [user_id]
  );

  if (banRows.length > 0) {
    return res.status(403).json({
      error: "banned",
      message: "บัญชีของคุณถูกระงับการใช้งาน",
      reason: banRows[0].reason || "ไม่ระบุเหตุผล",
      expires_at: banRows[0].expires_at || null
    });
  }

  res.json({
    message: "เข้าสู่ระบบสำเร็จ",
    user: {
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    }
  });
};

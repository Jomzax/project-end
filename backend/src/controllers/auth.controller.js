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

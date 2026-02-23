import pool from "../db/mysql.js";
import { hashPassword } from "../utils/password.js";

export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 10   // จำกัดตายตัวไม่เกิน 10
        const offset = (page - 1) * limit

        const [rows] = await pool.query(`
            SELECT user_id, username, email, role, created_at
            FROM users
            ORDER BY user_id ASC
            LIMIT ? OFFSET ?
        `, [limit, offset])

        const [[{ total }]] = await pool.query(`
            SELECT COUNT(*) as total FROM users
        `)

        res.json({
            data: rows,
            pagination: {
                page,
                totalPages: Math.ceil(total / limit),
                totalUsers: total
            }
        })

    } catch (err) {
        console.error("Get users error:", err)
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" })
    }
}

export const getAdminUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const offset = (page - 1) * limit
        const searchRaw = (req.query.search || req.query.q || '').trim()
        const search = searchRaw ? String(searchRaw) : null

        const whereClause = search
            ? `WHERE (u.username LIKE CONCAT('%', ?, '%') OR u.email LIKE CONCAT('%', ?, '%'))`
            : ''
        const whereClauseSimple = search
            ? `WHERE (username LIKE CONCAT('%', ?, '%') OR email LIKE CONCAT('%', ?, '%'))`
            : ''
        const countWhere = search ? `WHERE (username LIKE CONCAT('%', ?, '%') OR email LIKE CONCAT('%', ?, '%'))` : ''
        const mainParams = search ? [search, search, limit, offset] : [limit, offset]
        const countParams = search ? [search, search] : []

        let rows = []
        try {
            const [result] = await pool.query(`
                SELECT u.user_id, u.username, u.email, u.role, u.created_at, u.promoted_by,
                       CASE WHEN ub.user_id IS NULL THEN 0 ELSE 1 END AS is_banned,
                       ub.reason AS ban_reason, ub.expires_at AS ban_expires_at
                FROM users u
                LEFT JOIN (
                    SELECT user_id, reason, expires_at
                    FROM user_bans
                    WHERE expires_at IS NULL OR expires_at >= CURDATE()
                    ORDER BY created_at DESC
                ) ub ON ub.user_id = u.user_id
                ${whereClause}
                ORDER BY u.user_id ASC
                LIMIT ? OFFSET ?
            `, mainParams)
            rows = result
        } catch (err) {
            const [result] = await pool.query(`
                SELECT user_id, username, email, role, created_at
                FROM users
                ${whereClauseSimple}
                ORDER BY user_id ASC
                LIMIT ? OFFSET ?
            `, mainParams)
            rows = result.map(row => ({ ...row, promoted_by: null, is_banned: 0, ban_reason: null, ban_expires_at: null }))
        }

        const [[{ total }]] = await pool.query(`
            SELECT COUNT(*) as total FROM users ${countWhere}
        `, countParams)

        res.json({
            data: rows,
            pagination: {
                page,
                totalPages: Math.ceil(total / limit),
                totalUsers: total
            }
        })

    } catch (err) {
        console.error("Get admin users error:", err)
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" })
    }
}

export const makeUserAdmin = async (req, res) => {
    try {
        const { id } = req.params
        const { by_user_id } = req.body || {}
        
        let result
        try {
            // Try to update with promoted_by if column exists
            const [updateResult] = await pool.query(`
                UPDATE users SET role = 'admin', promoted_by = ? WHERE user_id = ?
            `, [by_user_id || null, id])
            result = updateResult
        } catch (err) {
            // Fallback: update without promoted_by
            const [updateResult] = await pool.query(`
                UPDATE users SET role = 'admin' WHERE user_id = ?
            `, [id])
            result = updateResult
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้" })
        }

        res.json({ message: "แต่งตั้งเป็นแอดมินเรียบร้อย" })

    } catch (err) {
        console.error("Make admin error:", err)
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" })
    }
}

export const removeAdminStatus = async (req, res) => {
    try {
        const { id } = req.params
        
        let result
        try {
            // Try to update with promoted_by if column exists
            const [updateResult] = await pool.query(`
                UPDATE users SET role = 'user', promoted_by = NULL WHERE user_id = ?
            `, [id])
            result = updateResult
        } catch (err) {
            // Fallback: update without promoted_by
            const [updateResult] = await pool.query(`
                UPDATE users SET role = 'user' WHERE user_id = ?
            `, [id])
            result = updateResult
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้" })
        }

        res.json({ message: "ยกเลิกสิทธิ์แอดมินเรียบร้อย" })

    } catch (err) {
        console.error("Remove admin error:", err)
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" })
    }
}

export const getMyProfile = async (req, res) => {
    try {
        const userId = req.user?.user_id
        if (!userId) {
            return res.status(401).json({ error: "ไม่มีสิทธิ์เข้าถึง" })
        }

        const [rows] = await pool.query(`
            SELECT user_id, username, email, role, created_at
            FROM users
            WHERE user_id = ?
            LIMIT 1
        `, [userId])

        if (rows.length === 0) {
            return res.status(404).json({ error: "ไม่พบผู้ใช้" })
        }

        res.json({ user: rows[0] })
    } catch (err) {
        console.error("Get my profile error:", err)
        res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" })
    }
}

export const checkMyUsernameAvailability = async (req, res) => {
    try {
        const userId = req.user?.user_id
        if (!userId) {
            return res.status(401).json({ error: "ไม่มีสิทธิ์เข้าถึง" })
        }

        const usernameRaw = req.query?.username
        const username = typeof usernameRaw === "string" ? usernameRaw.trim() : ""
        if (!username) {
            return res.status(400).json({ error: "กรุณาระบุชื่อผู้ใช้" })
        }

        const [rows] = await pool.query(
            `
            SELECT user_id
            FROM users
            WHERE LOWER(username) = LOWER(?)
              AND user_id <> ?
            LIMIT 1
            `,
            [username, userId]
        )

        res.json({ available: rows.length === 0 })
    } catch (err) {
        console.error("Check username availability error:", err)
        res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" })
    }
}

export const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user?.user_id
        if (!userId) {
            return res.status(401).json({ error: "ไม่มีสิทธิ์เข้าถึง" })
        }

        const usernameRaw = req.body?.username
        const newPassword = req.body?.newPassword || ""
        const confirmPassword = req.body?.confirmPassword || ""
        const username = typeof usernameRaw === "string" ? usernameRaw.trim() : ""

        if (!username) {
            return res.status(400).json({ error: "กรุณากรอกชื่อผู้ใช้" })
        }

        let passwordHash = null
        if (newPassword || confirmPassword) {
            if (!newPassword || !confirmPassword) {
                return res.status(400).json({ error: "กรุณากรอกรหัสผ่านใหม่และยืนยันรหัสผ่านให้ครบ" })
            }
            if (newPassword !== confirmPassword) {
                return res.status(400).json({ error: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน" })
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" })
            }
            passwordHash = await hashPassword(newPassword)
        }

        if (passwordHash) {
            await pool.query(`
                UPDATE users
                SET username = ?, password = ?
                WHERE user_id = ?
            `, [username, passwordHash, userId])
        } else {
            await pool.query(`
                UPDATE users
                SET username = ?
                WHERE user_id = ?
            `, [username, userId])
        }

        const [rows] = await pool.query(`
            SELECT user_id, username, email, role, created_at
            FROM users
            WHERE user_id = ?
            LIMIT 1
        `, [userId])

        if (rows.length === 0) {
            return res.status(404).json({ error: "ไม่พบผู้ใช้" })
        }

        res.json({
            message: "อัปเดตโปรไฟล์สำเร็จ",
            user: rows[0]
        })
    } catch (err) {
        if (err?.code === "ER_DUP_ENTRY" || String(err?.message || "").includes("Duplicate entry")) {
            return res.status(409).json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" })
        }
        console.error("Update my profile error:", err)
        res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" })
    }
}


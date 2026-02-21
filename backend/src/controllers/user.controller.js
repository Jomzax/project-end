import pool from "../db/mysql.js";

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
        res.status(500).json({ message: "Server error" })
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
        res.status(500).json({ message: "Server error" })
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
            return res.status(404).json({ message: "User not found" })
        }

        res.json({ message: "User promoted to admin" })

    } catch (err) {
        console.error("Make admin error:", err)
        res.status(500).json({ message: "Server error" })
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
            return res.status(404).json({ message: "User not found" })
        }

        res.json({ message: "Admin status removed" })

    } catch (err) {
        console.error("Remove admin error:", err)
        res.status(500).json({ message: "Server error" })
    }
}


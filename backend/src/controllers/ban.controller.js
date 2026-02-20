import pool from "../db/mysql.js";

/* ================= BAN USER ================= */
export const banUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { reason, expires_at } = req.body;
        const banned_by = req.headers['x-user-id'];

        if (!user_id || !reason) {
            return res.status(400).json({ message: "กรุณาระบุ user_id และเหตุผล" });
        }

        if (!banned_by) {
            return res.status(400).json({ message: "ไม่สามารถระบุผู้แบนได้" });
        }

        const expireDate = expires_at ? expires_at.split("T")[0] : null;

        await pool.query(`
            INSERT INTO user_bans (user_id, reason, expires_at, banned_by)
            VALUES (?, ?, ?, ?)
        `, [user_id, reason, expireDate, banned_by]);

        res.json({ message: "แบนผู้ใช้เรียบร้อย" });

    } catch (err) {
        console.error("Ban error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


/* ================= UNBAN USER ================= */
export const unbanUser = async (req, res) => {
    try {
        const { user_id } = req.params;

        // Check if any ban record exists for this user
        const [rows] = await pool.query(`
            SELECT id FROM user_bans
            WHERE user_id = ?
            LIMIT 1
        `, [user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "ผู้ใช้ไม่ได้ถูกแบน" });
        }

        // Delete all ban records for this user
        await pool.query(`
            DELETE FROM user_bans
            WHERE user_id = ?
        `, [user_id]);

        res.json({ message: "ยกเลิกแบนเรียบร้อย" });

    } catch (err) {
        console.error("Unban error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


/* ================= CHECK BAN STATUS ================= */
export const checkUserBan = async (req, res) => {
    try {
        const { user_id } = req.params;

        const [activeRows] = await pool.query(`
            SELECT reason, expires_at
            FROM user_bans
            WHERE user_id = ?
            AND (expires_at IS NULL OR expires_at >= CURDATE())
            ORDER BY created_at DESC
            LIMIT 1
        `, [user_id]);

        const [[{ everCount }]] = await pool.query(`
            SELECT COUNT(*) as everCount
            FROM user_bans
            WHERE user_id = ?
        `, [user_id]);

        const ever_banned = everCount > 0;

        const [lastRows] = await pool.query(`
            SELECT reason, expires_at
            FROM user_bans
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [user_id]);

        const lastBan = lastRows.length > 0 ? lastRows[0] : null;

        if (activeRows.length === 0) {
            return res.json({
                banned: false,
                ever_banned,
                last_reason: lastBan?.reason || null,
                last_expires_at: lastBan?.expires_at || null
            });
        }

        res.json({
            banned: true,
            ever_banned,
            reason: activeRows[0].reason,
            expires_at: activeRows[0].expires_at,
            last_reason: lastBan?.reason || null,
            last_expires_at: lastBan?.expires_at || null
        });

    } catch (err) {
        console.error("Check ban error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

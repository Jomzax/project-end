import { json } from "stream/consumers";
import pool from "../db/mysql.js";

export const getCategoryDropdown = async (req, res) => {
    try {
        let page = parseInt(req.query.page)
        let limit = parseInt(req.query.limit)
        const searchRaw = (req.query.search || req.query.q || '').trim()
        const search = searchRaw ? String(searchRaw) : null

        if (isNaN(page) || page < 1) page = 1
        if (isNaN(limit) || limit < 1) limit = 10

        const offset = (page - 1) * limit

        const whereClause = search
            ? `WHERE (name LIKE CONCAT('%', ?, '%') OR slug LIKE CONCAT('%', ?, '%'))`
            : ''
        const listParams = search ? [search, search, limit, offset] : [limit, offset]
        const countParams = search ? [search, search] : []

        const [rows] = await pool.query(`
            SELECT category_id, name, slug, icon, color
            FROM categories
            ${whereClause}
            ORDER BY category_id ASC
            LIMIT ? OFFSET ?
        `, listParams)

        const [countRows] = await pool.query(`
            SELECT COUNT(*) as total FROM categories ${whereClause}
        `, countParams)

        const total = countRows[0].total

        res.json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error("CATEGORY ERROR:", error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


/* ================= UPDATE CATEGORY ================= */
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, icon, color } = req.body;

        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: "Name และ Slug ห้ามว่าง"
            });
        }

        // เช็ค slug และ name ซ้ำ (ไม่นับแถวของตัวเอง)
        const [slugExists] = await pool.query(
            "SELECT category_id FROM categories WHERE slug = ? AND category_id != ?",
            [slug, id]
        );
        const [nameExists] = await pool.query(
            "SELECT category_id FROM categories WHERE name = ? AND category_id != ?",
            [name, id]
        );
        const errors = [];
        if (slugExists.length > 0) errors.push(`คำอังกฤษ "${slug}" ถูกใช้ไปแล้ว`);
        if (nameExists.length > 0) errors.push(`ชื่อหมวดหมู่ "${name}" ถูกใช้ไปแล้ว`);
        if (errors.length > 0) {
            const message = errors.length === 2
                ? "ชื่อหมวดหมู่และคำอังกฤษ ถูกใช้ไปแล้ว"
                : errors.join(" และ ");
            return res.status(400).json({ success: false, message });
        }

        const [result] = await pool.query(
            `
            UPDATE categories
            SET name = ?, 
                slug = ?, 
                icon = ?, 
                color = ?
            WHERE category_id = ?
            `,
            [name, slug, icon, color, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบหมวดหมู่ที่ต้องการแก้ไข"
            });
        }

        res.json({
            success: true,
            message: "อัปเดตหมวดหมู่สำเร็จ"
        });

    } catch (error) {
        const msg = String(error.message || '')
        if (error.code === 'ER_DUP_ENTRY' || msg.includes('Duplicate entry')) {
            const match = msg.match(/Duplicate entry '(.+?)' for key|'([^']+)'\s+for key/)
            const val = match ? (match[1] || match[2] || '').trim() : ''
            const parts = []
            if (msg.includes('slug') && !msg.includes('idx_name_unique')) parts.push(`คำอังกฤษ" ${val} "ถูกใช้ไปแล้ว`)
            if (msg.includes('idx_name_unique')) parts.push(`ชื่อหมวดหมู่ "${val}" ถูกใช้ไปแล้ว`)
            if (parts.length > 0) {
                return res.status(400).json({ success: false, message: parts.join(" และ ") });
            }
        }
        res.status(500).json({ success: false, message: error.message });
    }
};


/* ================= CREATE CATEGORY ================= */
export const createCategory = async (req, res) => {
    try {
        const { name, slug, icon, color } = req.body;

        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: "Name และ Slug ห้ามว่าง"
            });
        }

        // เช็ค slug และ name ซ้ำ
        const [slugExists] = await pool.query(
            "SELECT category_id FROM categories WHERE slug = ?",
            [slug]
        );
        const [nameExists] = await pool.query(
            "SELECT category_id FROM categories WHERE name = ?",
            [name]
        );
        const errors = [];
        if (slugExists.length > 0) errors.push(`คำอังกฤษ"${slug}" ถูกใช้ไปแล้ว`);
        if (nameExists.length > 0) errors.push(`ชื่อหมวดหมู่ "${name}" ถูกใช้ไปแล้ว`);
        if (errors.length > 0) {
            const message = errors.length === 2
                ? "ชื่อหมวดหมู่และคำอังกฤษ ถูกใช้ไปแล้ว"
                : errors.join(" และ ");
            return res.status(400).json({ success: false, message });
        }

        const [result] = await pool.query(
            `
            INSERT INTO categories (name, slug, icon, color)
            VALUES (?, ?, ?, ?)
            `,
            [name, slug, icon, color]
        );

        res.status(201).json({
            success: true,
            message: "สร้างหมวดหมู่สำเร็จ",
            category_id: result.insertId
        });

    } catch (error) {
        const msg = String(error.message || '')
        if (error.code === 'ER_DUP_ENTRY' || msg.includes('Duplicate entry')) {
            const match = msg.match(/Duplicate entry '(.+?)' for key|'([^']+)'\s+for key/)
            const val = match ? (match[1] || match[2] || '').trim() : ''
            const parts = []
            if (msg.includes('slug') && !msg.includes('idx_name_unique')) parts.push(`คำอังกฤษ "${val}" ถูกใช้ไปแล้ว`)
            if (msg.includes('idx_name_unique')) parts.push(`ชื่อหมวดหมู่ "${val}" ถูกใช้ไปแล้ว`)
            if (parts.length > 0) {
                return res.status(400).json({ success: false, message: parts.join(" และ ") });
            }
        }
        res.status(500).json({ success: false, message: error.message });
    }
};


/* ================= DELETE CATEGORY ================= */
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            "DELETE FROM categories WHERE category_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบหมวดหมู่ที่ต้องการลบ"
            });
        }

        res.json({
            success: true,
            message: "ลบหมวดหมู่สำเร็จ"
        });

    } catch (error) {
        console.error(" DELETE CATEGORY ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

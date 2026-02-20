import { json } from "stream/consumers";    
import pool from "../db/mysql.js";

export const getCategoryDropdown = async (req, res) => {
    try {
        let page = parseInt(req.query.page)
        let limit = parseInt(req.query.limit)

        if (isNaN(page) || page < 1) page = 1
        if (isNaN(limit) || limit < 1) limit = 10

        const offset = (page - 1) * limit

        const [rows] = await pool.query(`
            SELECT category_id, name, slug, icon, color
            FROM categories
            ORDER BY category_id ASC
            LIMIT ${offset}, ${limit}
        `)

        const [countRows] = await pool.query(`
            SELECT COUNT(*) as total FROM categories
        `)

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
        console.error("🔥 CATEGORY ERROR:", error)
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
        console.error("🔥 UPDATE CATEGORY ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
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

        // เช็ค slug ซ้ำ
        const [exists] = await pool.query(
            "SELECT category_id FROM categories WHERE slug = ?",
            [slug]
        );

        if (exists.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Slug นี้ถูกใช้ไปแล้ว"
            });
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
        console.error("🔥 CREATE CATEGORY ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
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
        console.error("🔥 DELETE CATEGORY ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

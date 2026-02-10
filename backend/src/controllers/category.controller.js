import { json } from "stream/consumers";    
import pool from "../db/mysql.js";

export const getCategoryDropdown = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT category_id, name, slug, icon, color
            FROM categories
            ORDER BY category_id ASC
        `);

        res.json({
            success: true,
            data: rows,
        });
    } catch (error) {
        console.error("หมวดเกิดข้อผิดพลาด:", error);
        res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการเกิดข้อมูล"
        })
    }
}
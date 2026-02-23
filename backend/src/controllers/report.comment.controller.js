import pool from "../db/mysql.js";
import Comment from "../models/mongo/Comment.js"; // Mongo Model

/* ================= CREATE REPORT COMMENT ================= */
export const createReportComment = async (req, res) => {
    try {
        const { comment_id, user_id, reason, description } = req.body;

        if (!comment_id || !user_id || !reason) {
            return res.status(400).json({
                success: false,
                message: "comment_id, user_id และ reason จำเป็นต้องกรอก"
            });
        }

        // 🔎 เช็คว่า comment มีอยู่ใน Mongo จริงไหม
        const comment = await Comment.findById(comment_id);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบความคิดเห็นนี้"
            });
        }

        // 🔒 กัน report ซ้ำ
        const [existing] = await pool.query(
            `SELECT id FROM report_comment 
             WHERE comment_id = ? AND user_id = ?`,
            [comment_id, user_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: "คุณได้รายงานความคิดเห็นนี้ไปแล้ว"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO report_comment
            (comment_id, user_id, reason, description, status)
            VALUES (?, ?, ?, ?, 'pending')`,
            [comment_id, user_id, reason, description || null]
        );

        return res.status(201).json({
            success: true,
            message: "รายงานความคิดเห็นสำเร็จ",
            report_id: result.insertId
        });

    } catch (error) {
        console.error("CREATE REPORT COMMENT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์"
        });
    }
};

/* ================= GET ALL REPORT COMMENTS ================= */
export const getAllReportComments = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;

        if (page < 1) page = 1;
        if (limit > 50) limit = 20;

        const offset = (page - 1) * limit;

        const [reports] = await pool.query(
            `SELECT
                rc.id,
                rc.comment_id,
                rc.user_id,
                rc.reason,
                rc.description,
                rc.status,
                rc.created_at,
                u.username AS reporter_name
             FROM report_comment rc
             LEFT JOIN users u ON u.user_id = rc.user_id
             ORDER BY rc.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        // 🔥 ดึง comment จาก Mongo
        const commentIds = reports.map(r => r.comment_id);

        const comments = await Comment.find({
            _id: { $in: commentIds }
        });

        // รวมข้อมูล
        const merged = reports.map(report => {
            const comment = comments.find(
                c => c._id.toString() === report.comment_id
            );
            return {
                ...report,
                comment_data: comment || null
            };
        });

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM report_comment`
        );

        return res.json({
            success: true,
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
            data: merged
        });

    } catch (error) {
        console.error("GET REPORT COMMENT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์"
        });
    }
};

/* ================= DELETE REPORT COMMENT ================= */
export const deleteReportComment = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            `DELETE FROM report_comment WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบ report นี้"
            });
        }

        return res.json({
            success: true,
            message: "ลบ report สำเร็จ"
        });

    } catch (error) {
        console.error("DELETE REPORT COMMENT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์"
        });
    }
};

/* ================= UPDATE REPORT COMMENT STATUS ================= */
export const updateReportCommentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "invalid status"
            });
        }

        const [result] = await pool.query(
            `UPDATE report_comment SET status = ? WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "report not found"
            });
        }

        return res.json({
            success: true,
            message: "update report status success"
        });
    } catch (error) {
        console.error("UPDATE REPORT COMMENT STATUS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "server error"
        });
    }
};

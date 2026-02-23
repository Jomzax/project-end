import pool from "../db/mysql.js";

/* ================= CREATE REPORT ================= */
export const createReportPost = async (req, res) => {
  try {
    const postId = Number(req.params.post_id || req.body.post_id);
    const userId = Number(req.user?.user_id || req.body.user_id);
    const { reason, description } = req.body;
    const cleanDescription = String(description || "").trim();

    if (!postId || !userId || !reason || !cleanDescription) {
      return res.status(400).json({
        success: false,
        message: "post_id, user_id, reason and description are required"
      });
    }

    const [existing] = await pool.query(
      `SELECT id FROM report_post WHERE post_id = ? AND user_id = ?`,
      [postId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "คุณได้รายงานโพสต์นี้ไปแล้ว"
      });
    }

    const [result] = await pool.query(
      `INSERT INTO report_post 
      (post_id, user_id, reason, description, status)
      VALUES (?, ?, ?, ?, 'pending')`,
      [postId, userId, reason, cleanDescription]
    );

    return res.status(201).json({
      success: true,
      message: "สำเร็จในการรายงานโพสต์",
      report_id: result.insertId
    });
  } catch (error) {
    console.error("CREATE REPORT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/* ================= GET ALL REPORTS ================= */
export const getAllReportPosts = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (page < 1) page = 1;
    if (limit > 50) limit = 20;

    const offset = (page - 1) * limit;

    const [reports] = await pool.query(
      `SELECT
         rp.id,
         rp.post_id,
         rp.user_id,
         rp.reason,
         rp.description,
         rp.status,
         rp.created_at,
         d.title AS discussion_title,
         u.username AS reporter_name
       FROM report_post rp
       LEFT JOIN discussions d ON d.discussion_id = rp.post_id
       LEFT JOIN users u ON u.user_id = rp.user_id
       ORDER BY rp.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM report_post`
    );

    return res.json({
      success: true,
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      data: reports
    });
  } catch (error) {
    console.error("GET REPORT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/* ================= DELETE REPORT ================= */
export const deleteReportPost = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM report_post WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบรายงาน"
      });
    }

    return res.json({
      success: true,
      message: "ลบรายงานสำเร็จ"
    });
  } catch (error) {
    console.error("DELETE REPORT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
    });
  }
};

/* ================= UPDATE REPORT STATUS ================= */
export const updateReportPostStatus = async (req, res) => {
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
      `UPDATE report_post SET status = ? WHERE id = ?`,
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
    console.error("UPDATE REPORT STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "server error"
    });
  }
};

import db from "../db/mysql.js";
import DiscussionContent from "../models/mongo/DiscussionContent.js";

/* ---------- TITLE (เข้มงวด) ---------- */
const sanitizeTitle = (text = "") => {
  return text
    .replace(/\r?\n/g, " ")   // ห้ามขึ้นบรรทัด
    .replace(/\s{2,}/g, " ")  // ช่องว่างซ้ำ
    .trim()
    .slice(0, 200);
};


/* ================= SANITIZE TEXT ================= */
const sanitizeContent = (text = "") => {
  return text
    // windows newline -> unix
    .replace(/\r\n/g, "\n")

    // ลบ space ท้ายบรรทัด
    .replace(/[ \t]+$/gm, "")

    // ห้ามเว้นเกิน 2 บรรทัดติด
    .replace(/\n{3,}/g, "\n\n")

    // ลบ space ต้นข้อความ
    .replace(/^\s+/, "")

    // ลบ space ท้ายข้อความ
    .replace(/\s+$/, "");
};

const formatDateTime = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};


/* ================= CREATE DISCUSSION ================= */
export const createDiscussion = async (req, res) => {

  try {
    const { user_id, category_id, title, detail } = req.body;

    if (!user_id || !category_id || !title || !detail) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const cleanTitle = sanitizeTitle(title);
    const cleanDetail = sanitizeContent(detail);

    const slug = Date.now();

    // 1️⃣ Insert MySQL
    const [result] = await db.query(
      `INSERT INTO discussions 
       (user_id, category_id, title, slug, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [Number(user_id), Number(category_id), title, slug]
    );

    const discussionId = result.insertId;

    // 2️⃣ Insert Mongo
    const now = formatDateTime();

    await DiscussionContent.create({
      discussion_id: discussionId.toString(),
      author_id: Number(user_id),
      title: cleanTitle,
      detail: cleanDetail,
      created_at: now,
      updated_at: ""
    });

    res.status(201).json({
      success: true,
      discussion_id: discussionId
    });

  } catch (err) {
    console.error("CREATE DISCUSSION ERROR:", err);
    res.status(500).json({
      message: "Failed to create discussion",
      error: err.message
    });
  }
};

/* ================= GET ALL DISCUSSION  ================= */
export const getAllDiscussions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 10;
    const offset = (page - 1) * limit;
    const q = req.query.q?.trim();
    const category = req.query.category?.trim();
    const sort = req.query.sort || 'latest';
    const user_id = req.query.user_id;

    let conditions = [];
    let params = [];

    if (q) {
      conditions.push(`d.title LIKE ?`);
      params.push(`%${q}%`);
    }

    if (category) {
      conditions.push(`c.slug = ?`);   // ใช้ slug
      params.push(category);
    }

    // ⭐ กระทู้ของฉัน
    if (sort === 'user' && user_id) {
      conditions.push(`d.user_id = ?`);
      params.push(user_id);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    let orderClause = 'd.created_at DESC';

    if (sort === 'likes') {
      orderClause = 'd.like_count DESC';
    }

    if (sort === 'comments') {
      orderClause = 'd.comment_count DESC';
    }

    if (sort === 'views') {
      orderClause = 'd.view_count DESC';
    }
    // 🔥 ดึงมา 11 รายการ เพื่อเช็คว่ามีหน้าถัดไปไหม
    const [rows] = await db.query(`
      SELECT 
        d.discussion_id,
        d.title,
        d.created_at,
        d.like_count,
        d.comment_count,
        d.view_count,
        u.username,
        u.role,
        c.name AS category
      FROM discussions d
      JOIN users u ON d.user_id = u.user_id
      JOIN categories c ON d.category_id = c.category_id
      ${whereClause}
      ORDER BY ${orderClause}
      LIMIT ? OFFSET ?
    `, [...params, limit + 1, offset]);


    const hasNext = rows.length > limit;
    const trimmedRows = rows.slice(0, limit);

    // 🔥 ถ้าไม่เจอเลย และมีคำค้น → แนะนำคำใกล้เคียง
    let suggestion = null;

    if (trimmedRows.length === 0 && q) {
      const [suggestRows] = await db.query(`
        SELECT title
        FROM discussions
        WHERE title LIKE ?
        LIMIT 1
      `, [`%${q.charAt(0)}%`]);

      if (suggestRows.length > 0) {
        suggestion = suggestRows[0].title;
      }
    }

    const ids = trimmedRows.map(r => r.discussion_id.toString());
    let contentMap = {};

    if (ids.length > 0) {
      const contents = await DiscussionContent.find({
        discussion_id: { $in: ids }
      });

      contents.forEach(c => {
        contentMap[c.discussion_id] = c.detail;
      });
    }

    const data = trimmedRows.map(row => ({
      ...row,
      detail: contentMap[row.discussion_id.toString()] || ""
    }));

    res.json({
      success: true,
      data,
      hasNext,
      currentPage: page,
      suggestion
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


/* ================= GET FORUM STATS  ================= */
export const getForumStats = async (req, res) => {
  try {

    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM discussions) AS discussions
    `);

    res.json({
      success: true,
      users: stats.users,
      discussions: stats.discussions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ================= GET DISCUSSION ById ================= */
export const getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        d.discussion_id,
        d.user_id,
        d.title,
        d.created_at,
        d.view_count,
        d.like_count,
        d.comment_count,
        u.username,
        u.role,
        c.name AS category
      FROM discussions d
      JOIN users u ON u.user_id = d.user_id
      LEFT JOIN categories c ON c.category_id = d.category_id
      WHERE d.discussion_id = ?
      LIMIT 1
    `, [id]);

    if (!rows.length)
      return res.status(404).json({ message: "ไม่พบกระทู้" });

    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET DISCUSSION DETAIL (MongoDB) ================= */
export const getDiscussionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await DiscussionContent.findOne({
      discussion_id: id.toString()
    }).lean();

    if (!content)
      return res.status(404).json({ success: false, message: "ไม่พบเนื้อหา" });

    res.json({
      success: true,
      data: {
        detail: content.detail
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/* ================= UPDATE DISCUSSION CONTENT ================= */
export const updateDiscussionContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, detail, category_id } = req.body;


    if (!id) {
      return res.status(400).json({ message: "Missing id" });
    }

    const cleanTitle = sanitizeTitle(title);
    const cleanDetail = sanitizeContent(detail);

    // update mysql
    await db.query(
      `UPDATE discussions
       SET title = ?, category_id = ?, updated_at = NOW()
       WHERE discussion_id = ?`,
      [cleanTitle, Number(category_id), id]
    );

    await DiscussionContent.updateOne(
      { discussion_id: id.toString() },
      {
        $set: {
          title: cleanTitle,
          detail: cleanDetail,
          updated_at: formatDateTime()   // 🔥 ตรงนี้จะใส่เวลาเมื่อมีการแก้ไข
        }
      }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};


/* ================= DELETE DISCUSSION ================= */
export const deleteDiscussion = async (req, res) => {
  const { id } = req.params;

  const conn = await db.getConnection(); // ใช้ transaction

  try {
    await conn.beginTransaction();

    // 1) เช็คว่ามีจริงไหม
    const [rows] = await conn.query(
      `SELECT discussion_id FROM discussions WHERE discussion_id = ? LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "ไม่พบกระทู้" });
    }

    // 2) ลบ Mongo (detail)
    await DiscussionContent.deleteOne({
      discussion_id: id.toString()
    });

    // 3) ลบ MySQL (meta)
    await conn.query(
      `DELETE FROM discussions WHERE discussion_id = ?`,
      [id]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "ลบกระทู้สำเร็จ"
    });

  } catch (err) {
    await conn.rollback();
    console.error("DELETE DISCUSSION ERROR:", err);
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};


/* ================= INCREMENT VIEW ================= */
const viewCache = new Map()

export const incrementView = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const ip = req.ip

    const key = `${id}_${ip}`
    const now = Date.now()

    // 10 นาที กัน view และหลังบ้านกันด้วย
    if (viewCache.has(key) && now - viewCache.get(key) < 10 * 60 * 1000) {
      return res.json({ success: true, skipped: true })
    }

    viewCache.set(key, now)

    await db.query(`
      UPDATE discussions
      SET view_count = view_count + 1
      WHERE discussion_id = ?
    `, [id])

    res.json({ success: true })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "view update failed" })
  }
}
import db from "../db/mysql.js";
import DiscussionContent from "../models/mongo/DiscussionContent.js";

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
      title,
      detail,
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




/* ================= UPDATE DISCUSSION CONTENT ================= */
export const updateDiscussionContent = async (req, res) => {
  try {
    const { discussion_id, title, detail } = req.body;

    if (!discussion_id) {
      return res.status(400).json({ message: "Missing discussion_id" });
    }

    const now = formatDateTime();

    await DiscussionContent.updateOne(
      { discussion_id: discussion_id },
      {
        $set: {
          title,
          detail,
          updated_at: now   // 🔥 ตรงนี้จะใส่เวลาเมื่อมีการแก้ไข
        }
      }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

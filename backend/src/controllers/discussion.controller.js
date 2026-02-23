import db from "../db/mysql.js";
import DiscussionContent from "../models/mongo/DiscussionContent.js";
import Comment from "../models/mongo/Comment.js";
import { ensureHotEventTables } from "../services/hotness.service.js";

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
    await ensureHotEventTables();

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const hotLimit = Math.max(parseInt(req.query.hotLimit) || 5, 1);
    const limit = 20;
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
      // ในหน้าเลือกหมวด: ซ่อนกระทู้ปักหมุด
      conditions.push(`d.is_pinned = 0`);
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

    const hotScoreExpr = "(COALESCE(l24.likes_24h, 0) * 3 + COALESCE(c24.comments_24h, 0) * 4 + COALESCE(v24.views_24h, 0) * 0.08)";
    let sortClause = "d.created_at DESC";

    if (sort === 'likes') {
      sortClause = "d.like_count DESC, d.created_at DESC";
    }

    if (sort === 'comments') {
      sortClause = "d.comment_count DESC, d.created_at DESC";
    }

    if (sort === 'views') {
      sortClause = "d.view_count DESC, d.created_at DESC";
    }

    if (sort === 'user') {
      sortClause = "d.created_at DESC";
    }

    const orderClause = category
      ? `is_hot DESC, ${sortClause}`
      : `d.is_pinned DESC, is_hot DESC, ${sortClause}`;
    const whereClauseRank = whereClause
      .replace(/\bd\./g, "d2.")
      .replace(/\bc\./g, "c2.");
    // 🔥 ดึงมา 11 รายการ เพื่อเช็คว่ามีหน้าถัดไปไหม
    const [rows] = await db.query(`
      SELECT 
        d.discussion_id,
        d.title,
        d.created_at,
        d.like_count,
        d.comment_count,
        d.view_count,
        d.is_pinned,
        COALESCE(l24.likes_24h, 0) AS likes_24h,
        COALESCE(c24.comments_24h, 0) AS comments_24h,
        COALESCE(v24.views_24h, 0) AS views_24h,
        ${hotScoreExpr} AS hot_score,
        COALESCE(hot.hot_rank, 0) AS hot_rank,
        CASE
          WHEN hot.hot_rank IS NOT NULL AND hot.hot_rank <= ? THEN 1
          ELSE 0
        END AS is_hot,
        u.username,
        u.role,
        c.name AS category
      FROM discussions d
      JOIN users u ON d.user_id = u.user_id
      JOIN categories c ON d.category_id = c.category_id
      LEFT JOIN (
        SELECT
          ranked.discussion_id,
          ranked.hot_score,
          ranked.hot_rank
        FROM (
          SELECT
            d2.discussion_id,
            (COALESCE(lh.likes_24h, 0) * 3 + COALESCE(ch.comments_24h, 0) * 4 + COALESCE(vh.views_24h, 0) * 0.08) AS hot_score,
            ROW_NUMBER() OVER (
              ORDER BY
                (COALESCE(lh.likes_24h, 0) * 3 + COALESCE(ch.comments_24h, 0) * 4 + COALESCE(vh.views_24h, 0) * 0.08) DESC,
                d2.created_at DESC,
                d2.discussion_id DESC
            ) AS hot_rank
          FROM discussions d2
          JOIN categories c2 ON d2.category_id = c2.category_id
          LEFT JOIN (
            SELECT
              discussion_id,
              COUNT(DISTINCT user_id) AS likes_24h
            FROM discussion_like_events
            WHERE created_at >= (NOW() - INTERVAL 24 HOUR)
            GROUP BY discussion_id
          ) lh ON lh.discussion_id = d2.discussion_id
          LEFT JOIN (
            SELECT
              discussion_id,
              COUNT(*) AS comments_24h
            FROM discussion_comment_events
            WHERE created_at >= (NOW() - INTERVAL 24 HOUR)
            GROUP BY discussion_id
          ) ch ON ch.discussion_id = d2.discussion_id
          LEFT JOIN (
            SELECT
              discussion_id,
              COUNT(*) AS views_24h
            FROM discussion_view_events
            WHERE created_at >= (NOW() - INTERVAL 24 HOUR)
            GROUP BY discussion_id
          ) vh ON vh.discussion_id = d2.discussion_id
          ${whereClauseRank}
        ) ranked
        WHERE ranked.hot_score > 0
      ) hot ON hot.discussion_id = d.discussion_id
      LEFT JOIN (
        SELECT
          discussion_id,
          COUNT(DISTINCT user_id) AS likes_24h
        FROM discussion_like_events
        WHERE created_at >= (NOW() - INTERVAL 24 HOUR)
        GROUP BY discussion_id
      ) l24 ON l24.discussion_id = d.discussion_id
      LEFT JOIN (
        SELECT
          discussion_id,
          COUNT(*) AS comments_24h
        FROM discussion_comment_events
        WHERE created_at >= (NOW() - INTERVAL 24 HOUR)
        GROUP BY discussion_id
      ) c24 ON c24.discussion_id = d.discussion_id
      LEFT JOIN (
        SELECT
          discussion_id,
          COUNT(*) AS views_24h
        FROM discussion_view_events
        WHERE created_at >= (NOW() - INTERVAL 24 HOUR)
        GROUP BY discussion_id
      ) v24 ON v24.discussion_id = d.discussion_id
      ${whereClause}
      ORDER BY ${orderClause}
      LIMIT ? OFFSET ?
    `, [hotLimit, ...params, ...params, limit + 1, offset]);


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
    const numericIds = trimmedRows.map(r => Number(r.discussion_id)).filter(Number.isFinite);
    let contentMap = {};
    let rootCommentCountMap = {};

    if (ids.length > 0) {
      const contents = await DiscussionContent.find({
        discussion_id: { $in: ids }
      });

      contents.forEach(c => {
        contentMap[c.discussion_id] = c.detail;
      });

      const rootCounts = await Comment.aggregate([
        {
          $match: {
            discussionId: { $in: numericIds },
            parentId: null
          }
        },
        {
          $group: {
            _id: "$discussionId",
            count: { $sum: 1 }
          }
        }
      ]);

      rootCounts.forEach((item) => {
        rootCommentCountMap[item._id] = item.count;
      });
    }

    const data = trimmedRows.map(row => ({
      ...row,
      root_comment_count: rootCommentCountMap[Number(row.discussion_id)] ?? 0,
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
    await ensureHotEventTables();
    const { id } = req.params;
    const hotLimit = Math.max(parseInt(req.query.hotLimit) || 5, 1);

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
        d.is_pinned,
        CASE
          WHEN hot.hot_rank IS NOT NULL AND hot.hot_rank <= ? THEN 1
          ELSE 0
        END AS is_hot,
        u.role,
        c.name AS category
      FROM discussions d
      JOIN users u ON u.user_id = d.user_id
      LEFT JOIN categories c ON c.category_id = d.category_id
      LEFT JOIN (
        SELECT
          ranked.discussion_id,
          ranked.hot_rank
        FROM (
          SELECT
            d2.discussion_id,
            ROW_NUMBER() OVER (
              ORDER BY
                (COALESCE(lh.likes_24h, 0) * 3 + COALESCE(ch.comments_24h, 0) * 4 + COALESCE(vh.views_24h, 0) * 0.08) DESC,
                d2.created_at DESC,
                d2.discussion_id DESC
            ) AS hot_rank
          FROM discussions d2
          LEFT JOIN (
            SELECT
              discussion_id,
              COUNT(DISTINCT user_id) AS likes_24h
            FROM discussion_like_events
            WHERE created_at >= (NOW() - INTERVAL 24 HOUR)
            GROUP BY discussion_id
          ) lh ON lh.discussion_id = d2.discussion_id
          LEFT JOIN (
            SELECT
              discussion_id,
              COUNT(*) AS comments_24h
            FROM discussion_comment_events
            WHERE created_at >= (NOW() - INTERVAL 24 HOUR)
            GROUP BY discussion_id
          ) ch ON ch.discussion_id = d2.discussion_id
          LEFT JOIN (
            SELECT
              discussion_id,
              COUNT(*) AS views_24h
            FROM discussion_view_events
            WHERE created_at >= (NOW() - INTERVAL 24 HOUR)
            GROUP BY discussion_id
          ) vh ON vh.discussion_id = d2.discussion_id
        ) ranked
      ) hot ON hot.discussion_id = d.discussion_id
      WHERE d.discussion_id = ?
      LIMIT 1
    `, [hotLimit, id]);

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
    const { title, detail, category_id, is_pinned } = req.body;


    if (!id) {
      return res.status(400).json({ message: "Missing id" });
    }

    const isPinOnlyUpdate =
      typeof is_pinned !== "undefined" &&
      typeof title === "undefined" &&
      typeof detail === "undefined" &&
      typeof category_id === "undefined";

    if (isPinOnlyUpdate) {
      const [result] = await db.query(
        `UPDATE discussions
         SET is_pinned = ?, updated_at = NOW()
         WHERE discussion_id = ?`,
        [Number(Boolean(is_pinned)), id]
      );

      if (!result.affectedRows) {
        return res.status(404).json({ message: "ไม่พบกระทู้" });
      }

      return res.json({ success: true });
    }

    if (
      typeof title === "undefined" ||
      typeof detail === "undefined" ||
      typeof category_id === "undefined"
    ) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const cleanTitle = sanitizeTitle(title);
    const cleanDetail = sanitizeContent(detail);

    // update mysql
    if (typeof is_pinned !== "undefined") {
      await db.query(
        `UPDATE discussions
         SET title = ?, category_id = ?, is_pinned = ?, updated_at = NOW()
         WHERE discussion_id = ?`,
        [cleanTitle, Number(category_id), Number(Boolean(is_pinned)), id]
      );
    } else {
      await db.query(
        `UPDATE discussions
         SET title = ?, category_id = ?, updated_at = NOW()
         WHERE discussion_id = ?`,
        [cleanTitle, Number(category_id), id]
      );
    }

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
    await ensureHotEventTables();

    const id = Number(req.params.id)
    const ip = req.ip

    const key = `${id}_${ip}`
    const now = Date.now()

    // 10 ชม กัน view และหลังบ้านกันด้วย
    if (viewCache.has(key) && now - viewCache.get(key) < 10 * 60 * 60 * 1000) {
      return res.json({ success: true, skipped: true })
    }

    viewCache.set(key, now)

    await db.query(`
      UPDATE discussions
      SET view_count = view_count + 1
      WHERE discussion_id = ?
    `, [id])

    await db.query(
      `INSERT INTO discussion_view_events (discussion_id, viewer_key) VALUES (?, ?)`,
      [id, String(ip || "").slice(0, 120)]
    )

    res.json({ success: true })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "view update failed" })
  }
}

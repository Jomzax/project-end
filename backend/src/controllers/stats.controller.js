import db from "../db/mysql.js";

export const getForumStats = async (req, res) => {
  try {

    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM discussions) AS discussions,
        (SELECT IFNULL(SUM(comment_count),0) FROM discussions) AS comments,
        (SELECT IFNULL(SUM(like_count),0) FROM discussions) AS likes,
        (SELECT IFNULL(SUM(view_count),0) FROM discussions) AS views,
        (SELECT COUNT(*) FROM categories) AS categories,
        (SELECT COUNT(*) FROM user_bans) AS bans
    `);

    res.json({
      success: true,
      users: Number(stats.users),
      discussions: Number(stats.discussions),
      comments: Number(stats.comments),
      likes: Number(stats.likes),
      views: Number(stats.views),
      categories: Number(stats.categories),
      bans: Number(stats.bans)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
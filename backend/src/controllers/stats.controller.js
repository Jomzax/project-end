import db from "../db/mysql.js";

export const getForumStats = async (req, res) => {
  console.log("DB NAME:", process.env.DB_NAME);
  try {

    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM discussions) AS discussions,
        (SELECT IFNULL(SUM(comment_count),0) FROM discussions) AS comments,
        (SELECT IFNULL(SUM(like_count),0) FROM discussions) AS likes,
        (SELECT IFNULL(SUM(view_count),0) FROM discussions) AS views,
        (SELECT COUNT(*) FROM categories) AS categories
    `);

    res.json({
      success: true,
      users: Number(stats.users),
      discussions: Number(stats.discussions),
      comments: Number(stats.comments),
      likes: Number(stats.likes),
      views: Number(stats.views),
      categories: Number(stats.categories)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

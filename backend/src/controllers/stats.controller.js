import db from "../db/mysql.js";

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

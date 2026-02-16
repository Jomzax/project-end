import redis from "../db/redis.js";
import pool from "../db/mysql.js";

export const startLikeWorker = () => {

  setInterval(async () => {

    while (true) {

      const event = await redis.lPop("queue:like_events");
      if (!event) break;

      const { postId, userId, action } = JSON.parse(event);

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {

        if (action === "like") {

          const [exists] = await conn.query(
            "SELECT 1 FROM discussion_likes WHERE discussion_id=? AND user_id=?",
            [postId, userId]
          );

          if (!exists.length) {
            await conn.query(
              "INSERT INTO discussion_likes (discussion_id,user_id) VALUES (?,?)",
              [postId, userId]
            );

            await conn.query(
              "UPDATE discussions SET like_count = like_count + 1 WHERE discussion_id=?",
              [postId]
            );
          }
        }

        if (action === "unlike") {

          const [result] = await conn.query(
            "DELETE FROM discussion_likes WHERE discussion_id=? AND user_id=?",
            [postId, userId]
          );

          if (result.affectedRows) {
            await conn.query(
              "UPDATE discussions SET like_count = like_count - 1 WHERE discussion_id=?",
              [postId]
            );
          }
        }

        await conn.commit();

      } catch (err) {
        await conn.rollback();
        console.error("like worker error:", err);
      } finally {
        conn.release();
      }
    }

  }, 5000);
};

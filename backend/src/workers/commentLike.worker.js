import redis from "../db/redis.js";
import pool from "../db/mysql.js";

export const startCommentLikeWorker = () => {

  setInterval(async () => {

    while (true) {

      const event = await redis.lPop("queue:comment_like_events");
      if (!event) break;

      const { commentId, userId, action } = JSON.parse(event);

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {

        if (action === "like") {

          const [exists] = await conn.query(
            "SELECT 1 FROM comment_likes WHERE comment_id=? AND user_id=?",
            [commentId, userId]
          );

          if (!exists.length) {
            await conn.query(
              "INSERT INTO comment_likes (comment_id,user_id) VALUES (?,?)",
              [commentId, userId]
            );
          }
        }

        if (action === "unlike") {

          await conn.query(
            "DELETE FROM comment_likes WHERE comment_id=? AND user_id=?",
            [commentId, userId]
          );
        }

        await conn.commit();

      } catch (err) {
        await conn.rollback();
        console.error("comment like worker error:", err);
      } finally {
        conn.release();
      }

    }

  }, 1000); // comment ต้อง realtime กว่า post
};

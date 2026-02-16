import redis from "../db/redis.js";
import pool from "../db/mysql.js";

export const hydratePostLikeCache = async (postId) => {
    const likeKey = `post:likes:${postId}`;
    const userSet = `post:liked_users:${postId}`;

    // ดึง DB เสมอ (เบามาก เพราะเฉพาะเปิดโพสต์)
    const [rows] = await pool.query(
        `SELECT user_id FROM discussion_likes WHERE discussion_id = ?`,
        [postId]
    );

    const dbUsers = rows.map(r => r.user_id.toString());
    const dbCount = dbUsers.length;

    // อ่าน Redis
    const redisCount = Number(await redis.get(likeKey) || -1);

    // 🔥 ถ้าไม่ตรง → rebuild
    if (redisCount !== dbCount) {
        console.log("♻️ rebuild like cache for post", postId);

        await redis.del(userSet);
        await redis.del(likeKey);

        if (dbUsers.length) {
            await redis.sAdd(userSet, dbUsers);
        }

        await redis.set(likeKey, dbCount);
    }
};


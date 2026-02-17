import redis from "../db/redis.js";

/* ================= TOGGLE LIKE ================= */
export const toggleCommentLike = async (req, res) => {
    const commentId = req.params.commentId; // ⭐ ไม่แปลงเลข
    const userId = req.headers["x-user-id"];

    if (!userId) return res.status(401).json({ error: "login required" });
    if (!commentId) return res.status(400).json({ error: "invalid id" });

    const userSet = `comment:liked_users:${commentId}`;
    const likeKey = `comment:likes:${commentId}`;
    const queueKey = "queue:comment_like_events";

    const liked = await redis.sIsMember(userSet, userId);

    let newLiked;
    let likes;

    if (liked) {
        await redis.sRem(userSet, userId);
        likes = await redis.decr(likeKey);
        newLiked = false;

        await redis.rPush(queueKey, JSON.stringify({ commentId, userId, action: "unlike" }));

    } else {
        await redis.sAdd(userSet, userId);
        likes = await redis.incr(likeKey);
        newLiked = true;

        await redis.rPush(queueKey, JSON.stringify({ commentId, userId, action: "like" }));
    }

    res.json({ liked: newLiked, likes: Number(likes) || 0 });
};


/* ================= LOAD MANY LIKES (สำคัญ) ================= */
export const getCommentsLikeStatus = async (req, res) => {
    const ids = req.body.ids || [];
    const userId = req.headers["x-user-id"];

    if (!ids.length) return res.json({});

    const pipeline = redis.multi();

    ids.forEach(id => {
        pipeline.get(`comment:likes:${id}`);
        if (userId) pipeline.sIsMember(`comment:liked_users:${id}`, userId);
    });

    const result = await pipeline.exec(); // ⭐ result = [val,val,val]

    const data = {};
    let i = 0;

    ids.forEach(id => {
        const likesRaw = result[i++];
        const likedRaw = userId ? result[i++] : false;

        const likes = Number(likesRaw || 0);
        const liked = Boolean(likedRaw);

        data[id] = { likes, liked };
    });

    res.json(data);
};

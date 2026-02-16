// controllers/discussion.like.controller.js
import redis from "../db/redis.js";
import { hydratePostLikeCache } from "../services/like.cache.js";

export const toggleLike = async (req, res) => {
  const postId = Number(req.params.postId);
  const userId = req.headers["x-user-id"];

  if (!userId) return res.status(401).json({ error: "login required" });

  const userSet = `post:liked_users:${postId}`;
  const likeKey = `post:likes:${postId}`;
  const queueKey = "queue:like_events";

  const liked = await redis.sIsMember(userSet, userId);

  let newLiked;
  let likes;

  if (liked) {
    await redis.sRem(userSet, userId);
    likes = await redis.decr(likeKey);
    newLiked = false;

    // 👉 บันทึก event
    await redis.rPush(queueKey, JSON.stringify({
      postId,
      userId,
      action: "unlike"
    }));

  } else {
    await redis.sAdd(userSet, userId);
    likes = await redis.incr(likeKey);
    newLiked = true;

    await redis.rPush(queueKey, JSON.stringify({
      postId,
      userId,
      action: "like"
    }));
  }

  return res.json({
    liked: newLiked,
    likes: Number(likes) || 0
  });
};




/* ================= GET LIKE STATUS ================= */
export const getLikeStatus = async (req, res) => {
  const postId = Number(req.params.postId);
  const userId = Number(req.user.user_id);

  const likeKey = `post:likes:${postId}`;
  const userSet = `post:liked_users:${postId}`;

  try {
    // ⭐ hydrate ถ้า Redis ว่าง
    await hydratePostLikeCache(postId);

    const liked = await redis.sIsMember(userSet, userId.toString());
    const likes = Number(await redis.get(likeKey) || 0);

    res.json({ liked, likes });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "like status failed" });
  }
};

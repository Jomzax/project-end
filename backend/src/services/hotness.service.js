import db from "../db/mysql.js";

let ensurePromise = null;
let cleanupTimer = null;

const HOT_EVENT_TABLES = [
  "discussion_like_events",
  "discussion_comment_events",
  "discussion_view_events"
];

export const ensureHotEventTables = async () => {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS discussion_like_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        discussion_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_discussion_created (discussion_id, created_at),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS discussion_comment_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        discussion_id BIGINT UNSIGNED NOT NULL,
        comment_id VARCHAR(64) NOT NULL,
        user_id BIGINT UNSIGNED NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_comment_id (comment_id),
        KEY idx_discussion_created (discussion_id, created_at),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS discussion_view_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        discussion_id BIGINT UNSIGNED NOT NULL,
        viewer_key VARCHAR(128) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_discussion_created (discussion_id, created_at),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  })();

  return ensurePromise;
};

export const purgeOldHotEvents = async (retentionDays = 2) => {
  const safeRetentionDays = Number.isFinite(retentionDays) && retentionDays > 0
    ? Math.floor(retentionDays)
    : 2;

  await ensureHotEventTables();

  for (const tableName of HOT_EVENT_TABLES) {
    await db.query(
      `DELETE FROM ${tableName} WHERE created_at < (NOW() - INTERVAL ? DAY)`,
      [safeRetentionDays]
    );
  }
};

export const startHotEventCleanupJob = (options = {}) => {
  if (cleanupTimer) return cleanupTimer;

  const retentionDays = Number.parseInt(
    process.env.HOT_EVENT_RETENTION_DAYS || options.retentionDays || "2",
    10
  );
  const intervalMinutes = Number.parseInt(
    process.env.HOT_EVENT_CLEANUP_INTERVAL_MINUTES || options.intervalMinutes || "60",
    10
  );
  const safeIntervalMinutes = Number.isFinite(intervalMinutes) && intervalMinutes > 0
    ? intervalMinutes
    : 60;

  const runCleanup = async () => {
    try {
      await purgeOldHotEvents(retentionDays);
    } catch (err) {
      console.error("hot event cleanup error:", err);
    }
  };

  runCleanup();
  cleanupTimer = setInterval(runCleanup, safeIntervalMinutes * 60 * 1000);
  return cleanupTimer;
};

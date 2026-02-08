import "dotenv/config";
import express from "express";
import cors from "cors";

import connectMongo from "./db/mongo.js";
import pool from "./db/mysql.js";
import authRoutes from "./routes/auth.routes.js";
import discussionContentTestRoutes from "./routes/discussionContent.test.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 ตรงนี้คือหัวใจ
app.use("/api/auth", authRoutes);
app.use("/api/test", discussionContentTestRoutes);


// เริ่มเซิร์ฟเวอร์
const startServer = async () => {
  try {
    await connectMongo();
    await pool.query("SELECT 1");

    console.log("✅ All databases connected");

    app.listen(5000, () => {
      console.log("🚀 Backend running on port 5000");
    });
  } catch (err) {
    console.error("❌ Server startup failed", err);
    process.exit(1);
  }
};

startServer();

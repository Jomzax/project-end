import "dotenv/config";
import express from "express";
import cors from "cors";

import connectMongo from "./db/mongo.js";
import pool from "./db/mysql.js";
import routes from "./routes/index.js";
const app = express();

app.use(cors());
app.use(express.json());


// 🔥 ตรงนี้ rotes คือหัวใจ
app.use("/api", routes);

// // 🔍 ดู routes ทั้งหมด 
// if (process.env.NODE_ENV !== "production") {
//   app.get("/api/_routes", (req, res) => {
//     res.json(listEndpoints(routes));
//   });
// }


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

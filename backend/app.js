import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase, getDb } from "./config/mongodb.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// Import configurations and route definitions
import "./config/firebaseAdmin.js"; // Side-effect import to initialize Firebase Admin SDK
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import genreRoutes from "./routes/genreRoutes.js";
import watchHistoryRoutes from "./routes/watchHistoryRoutes.js";
import tmdbRoutes from "./routes/tmdbRoutes.js";
import tvShowRoutes from "./routes/tvShowRoutes.js";

dotenv.config();

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware settings
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Database Connection Middleware for Serverless Environment
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("Database connection middleware error:", error.message);
    // Do not crash the application, allow the request to proceed.
    // If a route relies on getDb(), it will throw getDb()'s error and return 500,
    // which is the correct and expected behavior.
  }
  next();
});

// Enable CORS for VITE frontend app client requests (local dev + deployed Vercel)
const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://streaming-app-ten-opal.vercel.app",
  "https://streaming-app-p8u7.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        (origin.startsWith("https://streaming-app") && origin.endsWith(".vercel.app"))
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true
  })
);

// Root and API default status endpoints
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Streaming App Backend API is running."
  });
});

app.get("/api", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Streaming App Backend API is running."
  });
});

// 1. Health check (GET /api/health) - Verifies running server and MongoDB connection
app.get("/api/health", async (req, res) => {
  let dbStatus = "Disconnected";
  try {
    const db = getDb();
    await db.command({ ping: 1 });
    dbStatus = "Connected";
  } catch (error) {
    console.error("Database connection failure in health check:", error.message);
  }

  const isConnected = dbStatus === "Connected";
  return res.status(isConnected ? 200 : 500).json({
    success: isConnected,
    message: isConnected ? "Backend is running" : "Database connection failed. Please ensure MongoDB is active.",
    database: dbStatus
  });
});

// 2. Authentication routes (retains Phase 1 email verification OTP)
app.use("/api/auth", authRoutes);

// Payment & subscription routes
app.use("/api/payment", paymentRoutes);

// 3. User synchronization and profile management routes (Phase 2)
app.use("/api/users", userRoutes);

// 4. Movie catalog routes
app.use("/api/movies", movieRoutes);

// 5. Genre catalog routes
app.use("/api/genres", genreRoutes);

// 6. Watch history routes
app.use("/api/watch-history", watchHistoryRoutes);

// 7. TMDB catalog routes
app.use("/api/tmdb", tmdbRoutes);

// 8. TV Show catalog routes
app.use("/api/tvshows", tvShowRoutes);

export default app;

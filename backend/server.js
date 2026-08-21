import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./config/db.js";

// Import configurations and route definitions
import "./config/firebaseAdmin.js"; // Side-effect import to initialize Firebase Admin SDK
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import genreRoutes from "./routes/genreRoutes.js";
import watchHistoryRoutes from "./routes/watchHistoryRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware settings
app.use(express.json());

// Enable CORS for VITE frontend app client requests
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);

// 1. Health check (GET /api/health) - Verifies running server and PostgreSQL connection
app.get("/api/health", async (req, res) => {
  let dbStatus = "Disconnected";
  try {
    // Run a fast raw test query to verify PostgreSQL connection availability
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "Connected";
  } catch (error) {
    console.error("Database connection failure in health check:", error.message);
  }

  const isConnected = dbStatus === "Connected";
  return res.status(isConnected ? 200 : 500).json({
    success: isConnected,
    message: isConnected ? "Backend is running" : "Database connection failed. Please ensure PostgreSQL is active.",
    database: dbStatus
  });
});

// 2. Authentication routes (retains Phase 1 email verification OTP)
app.use("/api/auth", authRoutes);

// 3. User synchronization and profile management routes (Phase 2)
app.use("/api/users", userRoutes);

// 4. Movie catalog routes
app.use("/api/movies", movieRoutes);

// 5. Genre catalog routes
app.use("/api/genres", genreRoutes);

// 6. Watch history routes
app.use("/api/watch-history", watchHistoryRoutes);

// Start server listening
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

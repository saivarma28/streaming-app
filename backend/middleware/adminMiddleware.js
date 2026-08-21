import { prisma } from "../config/db.js";

/**
 * Middleware to verify that the user has the "admin" role in PostgreSQL.
 * Must be registered AFTER authMiddleware (which establishes req.user).
 */
export async function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.firebaseUid) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Missing authenticated user context."
    });
  }

  try {
    // Look up the user record in PostgreSQL to confirm their role
    let user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.firebaseUid }
    });

    if (!user) {
      // Auto-create/sync the user if they exist in Firebase Auth but missing from PostgreSQL
      const userCount = await prisma.user.count();
      const isAdmin = userCount === 0 || req.user.email === "saivarma9333@gmail.com";

      user = await prisma.user.create({
        data: {
          firebaseUid: req.user.firebaseUid,
          email: req.user.email,
          name: req.user.name || "User",
          photoURL: req.user.photoURL,
          isEmailVerified: req.user.emailVerified,
          role: isAdmin ? "admin" : "user"
        }
      });
      console.log(`Admin Middleware Auto-sync: Created new PostgreSQL user (${user.role}) for uid ${user.firebaseUid}`);
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Admin authorization required."
      });
    }

    // Attach local database user record to the request context
    req.dbUser = user;
    next();
  } catch (error) {
    console.error("Admin Middleware Authorization Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during admin authorization verification."
    });
  }
}

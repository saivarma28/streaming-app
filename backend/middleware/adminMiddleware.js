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
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.firebaseUid }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found in local database."
      });
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

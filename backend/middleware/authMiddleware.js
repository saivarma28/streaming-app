import admin from "../config/firebaseAdmin.js";

/**
 * Authentication middleware to verify Firebase ID Tokens.
 * Expects header: Authorization: Bearer <Firebase ID Token>
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Missing or invalid Authorization header."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the Firebase ID Token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Bind verified token identity directly to request context
    // Never trust firebaseUid, email, or userId from the request body
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
      photoURL: decodedToken.picture || null,
      emailVerified: decodedToken.email_verified || false
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Token Verification Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Invalid or expired token."
    });
  }
}

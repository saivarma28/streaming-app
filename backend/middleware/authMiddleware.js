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
    let decodedToken;
    // Check if firebase admin has been initialized
    if (admin && admin.apps && admin.apps.length > 0) {
      // Verify the Firebase ID Token using Firebase Admin SDK
      decodedToken = await admin.auth().verifyIdToken(token);
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Firebase Admin SDK is not initialized. Token verification failed in production.");
      }
      console.warn("WARNING: Firebase Admin SDK not initialized. Decoding token payload without verification (development bypass).");
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT token format");
      }
      const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
      const payload = JSON.parse(payloadJson);
      decodedToken = {
        uid: payload.user_id || payload.sub,
        email: payload.email,
        name: payload.name || null,
        picture: payload.picture || null,
        email_verified: payload.email_verified || false
      };
    }

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

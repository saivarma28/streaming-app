import { getDb, getNextSequenceValue } from "../config/mongodb.js";

/**
 * Middleware to verify that the user has the "admin" role in MongoDB.
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
    const db = getDb();
    const userCollection = db.collection("users");

    // Look up the user record in MongoDB to confirm their role
    let user = await userCollection.findOne({
      firebaseUid: req.user.firebaseUid
    });

    if (!user) {
      // Check if user already exists by email first (avoid unique constraint violation)
      user = await userCollection.findOne({ email: req.user.email });

      if (user) {
        // If found by email, update their firebaseUid and sync details
        const shouldBeAdmin = req.user.email === "saivarma9333@gmail.com";
        await userCollection.updateOne(
          { email: req.user.email },
          {
            $set: {
              firebaseUid: req.user.firebaseUid,
              name: req.user.name || user.name,
              photoURL: req.user.photoURL || user.photoURL,
              isEmailVerified: req.user.emailVerified || user.isEmailVerified,
              role: shouldBeAdmin ? "admin" : user.role,
              updatedAt: new Date()
            }
          }
        );
        user = await userCollection.findOne({ email: req.user.email });
        console.log(`Admin Middleware Auto-sync: Associated existing MongoDB user by email (${user.email}) to new uid ${user.firebaseUid}`);
      } else {
        // Auto-create/sync the user if they exist in Firebase Auth but missing from MongoDB
        const userCount = await userCollection.countDocuments();
        const isAdmin = userCount === 0 || req.user.email === "saivarma9333@gmail.com";
        const newId = await getNextSequenceValue("users");

        const newUserDoc = {
          id: newId,
          firebaseUid: req.user.firebaseUid,
          email: req.user.email,
          name: req.user.name || "User",
          photoURL: req.user.photoURL,
          isEmailVerified: req.user.emailVerified,
          isPhoneVerified: false,
          phoneNumber: null,
          role: isAdmin ? "admin" : "user",
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await userCollection.insertOne(newUserDoc);
        user = newUserDoc;
        console.log(`Admin Middleware Auto-sync: Created new MongoDB user (${user.role}) for uid ${user.firebaseUid}`);
      }
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

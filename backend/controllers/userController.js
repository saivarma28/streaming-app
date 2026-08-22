import { getDb, getNextSequenceValue } from "../config/mongodb.js";

/**
 * Syncs the authenticated Firebase user with the local MongoDB database.
 * If user does not exist, creates them. If they do exist, updates dynamic profile details.
 * 
 * POST /api/users/sync
 */
export async function syncUser(req, res) {
  // Identity details come strictly from the verified middleware context (never from body!)
  const { firebaseUid, email, name, photoURL, emailVerified } = req.user;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Sync aborted: email address not found in verified token."
    });
  }

  try {
    const db = getDb();
    const userCollection = db.collection("users");

    // 1. Look up existing user profile in MongoDB
    let user = await userCollection.findOne({ firebaseUid });

    if (!user) {
      // Check if user already exists by email first (avoid unique constraint violation)
      user = await userCollection.findOne({ email });

      if (user) {
        // If found by email, update their firebaseUid and sync details
        const shouldBeAdmin = email === "saivarma9333@gmail.com";
        await userCollection.updateOne(
          { email },
          {
            $set: {
              firebaseUid,
              name: name || user.name,
              photoURL: photoURL || user.photoURL,
              isEmailVerified: emailVerified || user.isEmailVerified,
              role: shouldBeAdmin ? "admin" : user.role,
              updatedAt: new Date()
            }
          }
        );
        user = await userCollection.findOne({ email });
        console.log(`Database sync: Associated existing MongoDB user by email (${user.email}) to new uid ${firebaseUid}`);
      } else {
        // Promote to admin if they are the first user in database or their email matches
        const userCount = await userCollection.countDocuments();
        const isAdmin = userCount === 0 || email === "saivarma9333@gmail.com";
        const newId = await getNextSequenceValue("users");

        // 2. Create a new user record
        const newUserDoc = {
          id: newId,
          firebaseUid,
          email,
          name: name || "User",
          photoURL,
          isEmailVerified: emailVerified,
          isPhoneVerified: false,
          phoneNumber: null,
          role: isAdmin ? "admin" : "user",
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await userCollection.insertOne(newUserDoc);
        user = newUserDoc;
        console.log(`Database sync: Created new MongoDB user (${user.role}) for uid ${firebaseUid}`);
      }
    } else {
      // Update existing user details, and ensure saivarma9333@gmail.com gets upgraded to admin
      const shouldBeAdmin = email === "saivarma9333@gmail.com";
      await userCollection.updateOne(
        { firebaseUid },
        {
          $set: {
            name: name || user.name,
            photoURL: photoURL || user.photoURL,
            isEmailVerified: emailVerified || user.isEmailVerified,
            role: shouldBeAdmin ? "admin" : user.role,
            updatedAt: new Date()
          }
        }
      );
      user = await userCollection.findOne({ firebaseUid });
      console.log(`Database sync: Updated existing MongoDB user (${user.role}) for uid ${firebaseUid}`);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      }
    });
  } catch (error) {
    console.error("syncUser Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during database user profile synchronization."
    });
  }
}

/**
 * Gets the current authenticated user's profile details from MongoDB.
 * 
 * GET /api/users/me
 */
export async function getMe(req, res) {
  const { firebaseUid } = req.user;

  try {
    const db = getDb();
    const user = await db.collection("users").findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found in local database."
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      }
    });
  } catch (error) {
    console.error("getMe Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching user profile."
    });
  }
}

/**
 * Updates the current authenticated user's profile details.
 * Only permits updating safe fields: name, photoURL, phoneNumber, role.
 * 
 * PUT /api/users/me
 */
export async function updateMe(req, res) {
  const { firebaseUid } = req.user;
  const { name, photoURL, phoneNumber } = req.body;

  try {
    const db = getDb();
    const userCollection = db.collection("users");

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (photoURL !== undefined) updateFields.photoURL = photoURL;
    if (phoneNumber !== undefined) {
      updateFields.phoneNumber = phoneNumber;
      updateFields.isPhoneVerified = true;
    }
    updateFields.updatedAt = new Date();

    await userCollection.updateOne(
      { firebaseUid },
      { $set: updateFields }
    );

    const updatedUser = await userCollection.findOne({ firebaseUid });

    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        firebaseUid: updatedUser.firebaseUid,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        photoURL: updatedUser.photoURL,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified,
        isPhoneVerified: updatedUser.isPhoneVerified
      }
    });
  } catch (error) {
    console.error("updateMe Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update user profile."
    });
  }
}

/**
 * Retrieves all user profiles. (Admin only)
 * GET /api/users
 */
export async function getAllUsers(req, res) {
  try {
    const db = getDb();
    const users = await db.collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error("getAllUsers Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving user list."
    });
  }
}


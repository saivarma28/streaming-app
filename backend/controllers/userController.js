import { getDb, getNextSequenceValue } from "../config/mongodb.js";
import admin from "../config/firebaseAdmin.js";

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
        isPhoneVerified: user.isPhoneVerified,
        isPremium: user.isPremium || false,
        premiumExpiryDate: user.premiumExpiryDate || null,
        subscriptionStatus: user.subscriptionStatus || null,
        subscriptionExpiryDate: user.subscriptionExpiryDate || null,
        isDisabled: user.isDisabled || false
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

    console.log("getMe Controller - Querying for UID:", firebaseUid, "Result Found:", !!user);

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
        isPhoneVerified: user.isPhoneVerified,
        isPremium: user.isPremium || false,
        premiumExpiryDate: user.premiumExpiryDate || null,
        subscriptionStatus: user.subscriptionStatus || null,
        subscriptionExpiryDate: user.subscriptionExpiryDate || null,
        isDisabled: user.isDisabled || false
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
        isPhoneVerified: updatedUser.isPhoneVerified,
        isPremium: updatedUser.isPremium || false,
        premiumExpiryDate: updatedUser.premiumExpiryDate || null,
        subscriptionStatus: updatedUser.subscriptionStatus || null,
        subscriptionExpiryDate: updatedUser.subscriptionExpiryDate || null,
        isDisabled: updatedUser.isDisabled || false
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

// Helper to log administrative actions to MongoDB
async function logAdminAction(db, req, action, targetUserEmail) {
  try {
    const adminEmail = req.user?.email || "Unknown Admin";
    const adminName = req.dbUser?.name || req.user?.name || "Admin";
    const logDoc = {
      adminEmail,
      adminName,
      action,
      targetUser: targetUserEmail,
      timestamp: new Date()
    };
    await db.collection("audit_logs").insertOne(logDoc);
  } catch (err) {
    console.error("Failed to write admin audit log:", err.message);
  }
}

/**
 * Creates a new user in Firebase Auth and MongoDB. (Admin only)
 * POST /api/users/admin-create
 */
export async function adminCreateUser(req, res) {
  const { name, email, password, role, isPremium, premiumExpiryDate, isDisabled } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required."
    });
  }

  try {
    const db = getDb();
    const userCollection = db.collection("users");

    // Prevent duplicate email accounts
    const existingUser = await userCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email address already exists in the system."
      });
    }

    // Create user securely in Firebase
    const firebaseUser = await admin.auth().createUser({
      email: email.toLowerCase(),
      password,
      displayName: name,
      emailVerified: true,
      disabled: isDisabled === true
    });

    const newId = await getNextSequenceValue("users");
    const expiryDate = premiumExpiryDate ? new Date(premiumExpiryDate) : null;

    const newUserDoc = {
      id: newId,
      firebaseUid: firebaseUser.uid,
      email: email.toLowerCase(),
      name,
      photoURL: null,
      isEmailVerified: true,
      isPhoneVerified: false,
      phoneNumber: null,
      role: role || "user",
      isPremium: isPremium === true,
      premiumExpiryDate: expiryDate,
      subscriptionStatus: isPremium === true ? "active" : null,
      subscriptionExpiryDate: expiryDate,
      isDisabled: isDisabled === true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await userCollection.insertOne(newUserDoc);

    // Audit log
    await logAdminAction(db, req, `Created user ${name}`, email.toLowerCase());

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newId,
        firebaseUid: firebaseUser.uid,
        name,
        email: email.toLowerCase(),
        role: role || "user",
        isPremium: isPremium === true,
        premiumExpiryDate: expiryDate,
        isDisabled: isDisabled === true,
        createdAt: newUserDoc.createdAt
      }
    });
  } catch (error) {
    console.error("adminCreateUser Error:", error.message);
    let errorMsg = "An error occurred while creating the user.";
    if (error.code === "auth/email-already-exists") {
      errorMsg = "A user with this email address already exists in Firebase Auth.";
    } else if (error.code === "auth/invalid-password") {
      errorMsg = "Password must be at least 6 characters.";
    }
    return res.status(500).json({
      success: false,
      message: errorMsg
    });
  }
}

/**
 * Updates a user's role, status, premium, or expiry in Firebase & MongoDB. (Admin only)
 * PUT /api/users/:firebaseUid/admin-update
 */
export async function adminUpdateUser(req, res) {
  const { firebaseUid } = req.params;
  const { name, role, isPremium, premiumExpiryDate, isDisabled } = req.body;

  try {
    const db = getDb();
    const userCollection = db.collection("users");

    const user = await userCollection.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found in local database."
      });
    }

    const firebaseUpdates = {};
    if (name !== undefined) firebaseUpdates.displayName = name;
    if (isDisabled !== undefined) firebaseUpdates.disabled = isDisabled === true;

    if (Object.keys(firebaseUpdates).length > 0) {
      await admin.auth().updateUser(firebaseUid, firebaseUpdates);
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (role !== undefined) updateFields.role = role;
    if (isPremium !== undefined) {
      updateFields.isPremium = isPremium === true;
      updateFields.subscriptionStatus = isPremium === true ? "active" : null;
    }
    if (premiumExpiryDate !== undefined) {
      const expiry = premiumExpiryDate ? new Date(premiumExpiryDate) : null;
      updateFields.premiumExpiryDate = expiry;
      updateFields.subscriptionExpiryDate = expiry;
    }
    if (isDisabled !== undefined) {
      updateFields.isDisabled = isDisabled === true;
    }
    updateFields.updatedAt = new Date();

    await userCollection.updateOne({ firebaseUid }, { $set: updateFields });

    const changes = [];
    if (name !== undefined && name !== user.name) changes.push(`renamed to ${name}`);
    if (role !== undefined && role !== user.role) changes.push(`changed role to ${role}`);
    if (isPremium !== undefined && isPremium !== user.isPremium) changes.push(`changed status to ${isPremium ? "Premium" : "Normal"}`);
    if (isDisabled !== undefined && isDisabled !== user.isDisabled) changes.push(isDisabled ? "disabled account" : "enabled account");

    const actionText = changes.length > 0 ? `Updated properties: ${changes.join(", ")}` : `Updated profile of ${user.name}`;
    await logAdminAction(db, req, actionText, user.email);

    return res.status(200).json({
      success: true,
      message: "User updated successfully."
    });
  } catch (error) {
    console.error("adminUpdateUser Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the user."
    });
  }
}

/**
 * Resets a user's password securely. (Admin only)
 * POST /api/users/:firebaseUid/reset-password
 */
export async function adminResetPassword(req, res) {
  const { firebaseUid } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters."
    });
  }

  try {
    const db = getDb();
    const userCollection = db.collection("users");

    const user = await userCollection.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in local database."
      });
    }

    await admin.auth().updateUser(firebaseUid, {
      password: newPassword
    });

    await logAdminAction(db, req, "Reset password", user.email);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully."
    });
  } catch (error) {
    console.error("adminResetPassword Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password in Firebase Auth."
    });
  }
}

/**
 * Deletes a user account from Firebase and MongoDB. (Admin only)
 * DELETE /api/users/:firebaseUid
 */
export async function adminDeleteUser(req, res) {
  const { firebaseUid } = req.params;

  try {
    const db = getDb();
    const userCollection = db.collection("users");

    const user = await userCollection.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in local database."
      });
    }

    await admin.auth().deleteUser(firebaseUid);
    await userCollection.deleteOne({ firebaseUid });

    await logAdminAction(db, req, `Deleted user ${user.name}`, user.email);

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully."
    });
  } catch (error) {
    console.error("adminDeleteUser Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user."
    });
  }
}

/**
 * Retrieves the historical admin action audit logs. (Admin only)
 * GET /api/users/audit-logs
 */
export async function getAuditLogs(req, res) {
  try {
    const db = getDb();
    const logs = await db.collection("audit_logs")
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    return res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error("getAuditLogs Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching admin audit logs."
    });
  }
}


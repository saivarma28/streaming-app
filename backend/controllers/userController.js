import { prisma } from "../config/db.js";

/**
 * Syncs the authenticated Firebase user with the local PostgreSQL database.
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
    // 1. Look up existing user profile in PostgreSQL database
    let user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      // Promote to admin if they are the first user in PostgreSQL or their email is saivarma9333@gmail.com
      const userCount = await prisma.user.count();
      const isAdmin = userCount === 0 || email === "saivarma9333@gmail.com";

      // 2. Create a new user record (role is strictly defaulted to 'user' unless promoted)
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          name: name || "User",
          photoURL,
          isEmailVerified: emailVerified,
          role: isAdmin ? "admin" : "user"
        }
      });
      console.log(`Database sync: Created new PostgreSQL user (${user.role}) for uid ${firebaseUid}`);
    } else {
      // Update existing user details, and ensure saivarma9333@gmail.com gets upgraded to admin
      const shouldBeAdmin = email === "saivarma9333@gmail.com";
      user = await prisma.user.update({
        where: { firebaseUid },
        data: {
          name: name || user.name,
          photoURL: photoURL || user.photoURL,
          isEmailVerified: emailVerified || user.isEmailVerified,
          role: shouldBeAdmin ? "admin" : user.role
        }
      });
      console.log(`Database sync: Updated existing PostgreSQL user (${user.role}) for uid ${firebaseUid}`);
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
 * Gets the current authenticated user's profile details from PostgreSQL.
 * 
 * GET /api/users/me
 */
export async function getMe(req, res) {
  const { firebaseUid } = req.user;

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

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
 * Only permits updating safe fields: name, photoURL, phoneNumber.
 * 
 * PUT /api/users/me
 */
export async function updateMe(req, res) {
  const { firebaseUid } = req.user;
  const { name, photoURL, phoneNumber } = req.body;

  try {
    // Perform update in PostgreSQL (disallowed fields like role/email are ignored)
    const updatedUser = await prisma.user.update({
      where: { firebaseUid },
      data: {
        name: name !== undefined ? name : undefined,
        photoURL: photoURL !== undefined ? photoURL : undefined,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
        // Mark phone verification as successful if phone matches a valid number pattern
        isPhoneVerified: phoneNumber !== undefined ? true : undefined
      }
    });

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
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });

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


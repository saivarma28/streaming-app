import admin from "../config/firebaseAdmin.js";
import { UserModel } from "../models/User.js";
import { AuditLogModel } from "../models/AuditLog.js";

/**
 * Service managing user synchronization, profiles, and administration
 */
export class UserService {
  /**
   * Synchronizes an authenticated Firebase user with MongoDB.
   */
  static async syncUser(authUser) {
    const { firebaseUid, email, name, photoURL, emailVerified } = authUser;

    let user = await UserModel.findByFirebaseUid(firebaseUid);

    if (!user) {
      // Check if user already exists by email
      user = await UserModel.findByEmail(email);

      if (user) {
        const shouldBeAdmin = email === "saivarma9333@gmail.com";
        user = await UserModel.updateByEmail(email, {
          firebaseUid,
          name: name || user.name,
          photoURL: photoURL || user.photoURL,
          isEmailVerified: emailVerified || user.isEmailVerified,
          role: shouldBeAdmin ? "admin" : user.role
        });
      } else {
        const userCount = await UserModel.count();
        const isAdmin = userCount === 0 || email === "saivarma9333@gmail.com";

        user = await UserModel.create({
          firebaseUid,
          email,
          name: name || "User",
          photoURL,
          isEmailVerified: emailVerified,
          isPhoneVerified: false,
          phoneNumber: null,
          role: isAdmin ? "admin" : "user"
        });
      }
    } else {
      const shouldBeAdmin = email === "saivarma9333@gmail.com";
      user = await UserModel.updateByFirebaseUid(firebaseUid, {
        name: name || user.name,
        photoURL: photoURL || user.photoURL,
        isEmailVerified: emailVerified || user.isEmailVerified,
        role: shouldBeAdmin ? "admin" : user.role
      });
    }

    return user;
  }

  static async getProfileByFirebaseUid(firebaseUid) {
    return UserModel.findByFirebaseUid(firebaseUid);
  }

  static async updateProfile(firebaseUid, { name, photoURL, phoneNumber }) {
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (photoURL !== undefined) updateFields.photoURL = photoURL;
    if (phoneNumber !== undefined) {
      updateFields.phoneNumber = phoneNumber;
      updateFields.isPhoneVerified = true;
    }
    return UserModel.updateByFirebaseUid(firebaseUid, updateFields);
  }

  static async getAllUsers() {
    return UserModel.findAll();
  }

  static async adminCreateUser(adminUser, { name, email, password, role, isPremium, premiumExpiryDate, isDisabled }) {
    const normalizedEmail = email.toLowerCase();
    const existing = await UserModel.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error("A user with this email address already exists in the system.");
    }

    // Create user in Firebase Auth
    const firebaseUser = await admin.auth().createUser({
      email: normalizedEmail,
      password,
      displayName: name,
      emailVerified: true,
      disabled: isDisabled === true
    });

    const expiryDate = premiumExpiryDate ? new Date(premiumExpiryDate) : null;
    const isPrem = isPremium === true;

    const user = await UserModel.create({
      firebaseUid: firebaseUser.uid,
      email: normalizedEmail,
      name,
      photoURL: null,
      isEmailVerified: true,
      isPhoneVerified: false,
      phoneNumber: null,
      role: role || "user",
      isPremium: isPrem,
      premiumExpiryDate: expiryDate,
      subscriptionStatus: isPrem ? "active" : null,
      subscriptionExpiryDate: expiryDate,
      isDisabled: isDisabled === true
    });

    await AuditLogModel.logAction(adminUser.email, adminUser.name, `Created user ${name}`, normalizedEmail);
    return user;
  }

  static async adminUpdateUser(adminUser, firebaseUid, { name, role, isPremium, premiumExpiryDate, isDisabled }) {
    const user = await UserModel.findByFirebaseUid(firebaseUid);
    if (!user) {
      throw new Error("User profile not found in local database.");
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

    const updatedUser = await UserModel.updateByFirebaseUid(firebaseUid, updateFields);

    const changes = [];
    if (name !== undefined && name !== user.name) changes.push(`renamed to ${name}`);
    if (role !== undefined && role !== user.role) changes.push(`changed role to ${role}`);
    if (isPremium !== undefined && isPremium !== user.isPremium) changes.push(`changed status to ${isPremium ? "Premium" : "Normal"}`);
    if (isDisabled !== undefined && isDisabled !== user.isDisabled) changes.push(isDisabled ? "disabled account" : "enabled account");

    const actionText = changes.length > 0 ? `Updated properties: ${changes.join(", ")}` : `Updated profile of ${user.name}`;
    await AuditLogModel.logAction(adminUser.email, adminUser.name, actionText, user.email);

    return updatedUser;
  }

  static async adminResetPassword(adminUser, firebaseUid, newPassword) {
    const user = await UserModel.findByFirebaseUid(firebaseUid);
    if (!user) {
      throw new Error("User not found in local database.");
    }

    await admin.auth().updateUser(firebaseUid, { password: newPassword });
    await AuditLogModel.logAction(adminUser.email, adminUser.name, "Reset password", user.email);
    return true;
  }

  static async adminDeleteUser(adminUser, firebaseUid) {
    const user = await UserModel.findByFirebaseUid(firebaseUid);
    if (!user) {
      throw new Error("User not found in local database.");
    }

    await admin.auth().deleteUser(firebaseUid);
    await UserModel.deleteByFirebaseUid(firebaseUid);
    await AuditLogModel.logAction(adminUser.email, adminUser.name, `Deleted user ${user.name}`, user.email);
    return true;
  }
}

import { getDb } from "../config/mongodb.js";

/**
 * AuditLog Model / Data Access Object for MongoDB 'audit_logs' collection
 */
export class AuditLogModel {
  static getCollection() {
    return getDb().collection("audit_logs");
  }

  static async logAction(adminEmail, adminName, action, targetUser) {
    try {
      const doc = {
        adminEmail: adminEmail || "Unknown Admin",
        adminName: adminName || "Admin",
        action,
        targetUser: targetUser || null,
        timestamp: new Date()
      };
      await this.getCollection().insertOne(doc);
      return doc;
    } catch (err) {
      console.error("Failed to write admin audit log:", err.message);
      return null;
    }
  }

  static async getRecentLogs(limit = 100) {
    return this.getCollection()
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }
}

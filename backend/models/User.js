import { getDb, getNextSequenceValue } from "../config/mongodb.js";

/**
 * User Model / Data Access Object for MongoDB 'users' collection
 */
export class UserModel {
  static getCollection() {
    return getDb().collection("users");
  }

  static async findByFirebaseUid(firebaseUid) {
    return this.getCollection().findOne({ firebaseUid });
  }

  static async findByEmail(email) {
    return this.getCollection().findOne({ email: email.toLowerCase() });
  }

  static async findById(id) {
    return this.getCollection().findOne({ id: parseInt(id) });
  }

  static async findByPhoneNumber(phoneNumber) {
    return this.getCollection().findOne({ phoneNumber });
  }

  static async count() {
    return this.getCollection().countDocuments();
  }

  static async findAll() {
    return this.getCollection().find({}).sort({ createdAt: -1 }).toArray();
  }

  static async create(userData) {
    const newId = await getNextSequenceValue("users");
    const doc = {
      id: newId,
      firebaseUid: userData.firebaseUid,
      email: userData.email.toLowerCase(),
      name: userData.name || "User",
      photoURL: userData.photoURL || null,
      isEmailVerified: userData.isEmailVerified || false,
      isPhoneVerified: userData.isPhoneVerified || false,
      phoneNumber: userData.phoneNumber || null,
      role: userData.role || "user",
      isPremium: userData.isPremium || false,
      premiumStartDate: userData.premiumStartDate || null,
      premiumExpiryDate: userData.premiumExpiryDate || null,
      subscriptionStatus: userData.subscriptionStatus || null,
      subscriptionStartDate: userData.subscriptionStartDate || null,
      subscriptionExpiryDate: userData.subscriptionExpiryDate || null,
      isDisabled: userData.isDisabled || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.getCollection().insertOne(doc);
    return doc;
  }

  static async updateByFirebaseUid(firebaseUid, updateFields) {
    const fields = { ...updateFields, updatedAt: new Date() };
    await this.getCollection().updateOne({ firebaseUid }, { $set: fields });
    return this.findByFirebaseUid(firebaseUid);
  }

  static async updateByEmail(email, updateFields) {
    const fields = { ...updateFields, updatedAt: new Date() };
    await this.getCollection().updateOne({ email: email.toLowerCase() }, { $set: fields });
    return this.findByEmail(email);
  }

  static async deleteByFirebaseUid(firebaseUid) {
    return this.getCollection().deleteOne({ firebaseUid });
  }
}

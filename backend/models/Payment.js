import { getDb } from "../config/mongodb.js";

/**
 * Payment Model / Data Access Object for MongoDB 'payments' collection
 */
export class PaymentModel {
  static getCollection() {
    return getDb().collection("payments");
  }

  static async findByPaymentId(paymentId) {
    return this.getCollection().findOne({ paymentId });
  }

  static async create(paymentData) {
    const doc = {
      userId: paymentData.userId,
      firebaseUid: paymentData.firebaseUid,
      paymentId: paymentData.paymentId,
      orderId: paymentData.orderId,
      amount: paymentData.amount || 9900,
      currency: paymentData.currency || "INR",
      status: paymentData.status || "success",
      createdAt: new Date()
    };
    await this.getCollection().insertOne(doc);
    return doc;
  }
}

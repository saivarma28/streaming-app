import crypto from "crypto";
import razorpay from "./razorpayService.js";
import { UserModel } from "../models/User.js";
import { PaymentModel } from "../models/Payment.js";
import { sendPaymentReceiptEmail } from "./emailService.js";

/**
 * Service managing Razorpay orders, HMAC signature verification, and premium upgrades
 */
export class PaymentService {
  /**
   * Creates a Razorpay payment order for Premium membership (₹99).
   */
  static async createOrder(firebaseUid, plan) {
    if (!razorpay) {
      throw new Error("Razorpay payment integration is not configured on this server.");
    }

    if (plan !== "premium") {
      const err = new Error("Invalid plan. Only 'premium' is supported.");
      err.status = 400;
      throw err;
    }

    const user = await UserModel.findByFirebaseUid(firebaseUid);
    if (!user) {
      const err = new Error("User profile not found in local database.");
      err.status = 404;
      throw err;
    }

    const now = new Date();
    const expiry = user.premiumExpiryDate || user.subscriptionExpiryDate;
    if (user.isPremium && expiry && new Date(expiry) > now) {
      const err = new Error("You already have an active Premium subscription.");
      err.status = 400;
      throw err;
    }

    const amount = 9900; // ₹99 in paise
    const currency = "INR";
    const receipt = `rcpt_${Date.now()}_${firebaseUid.substring(0, 10)}`;

    const options = {
      amount,
      currency,
      receipt,
      notes: {
        firebaseUid,
        plan: "premium"
      }
    };

    const order = await razorpay.orders.create(options);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      }
    };
  }

  /**
   * Verifies Razorpay payment signature using HMAC SHA-256 and activates Premium status.
   */
  static async verifyPayment(firebaseUid, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay) {
      throw new Error("Razorpay payment integration is not configured on this server.");
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      const err = new Error("Missing Razorpay verification parameters in request.");
      err.status = 400;
      throw err;
    }

    // 1. Verify HMAC SHA-256 signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      const err = new Error("Payment signature verification failed. Untrusted source.");
      err.status = 400;
      throw err;
    }

    // 2. Prevent duplicate payment processing
    const existingPayment = await PaymentModel.findByPaymentId(razorpay_payment_id);
    if (existingPayment) {
      const err = new Error("This payment has already been processed and verified.");
      err.status = 400;
      throw err;
    }

    // 3. Find user and upgrade to Premium (30 days)
    const user = await UserModel.findByFirebaseUid(firebaseUid);
    if (!user) {
      const err = new Error("User not found. Cannot activate Premium subscription.");
      err.status = 404;
      throw err;
    }

    const premiumStartDate = new Date();
    const premiumExpiryDate = new Date();
    premiumExpiryDate.setDate(premiumExpiryDate.getDate() + 30); // 30-day validity

    await UserModel.updateByFirebaseUid(firebaseUid, {
      isPremium: true,
      premiumStartDate,
      premiumExpiryDate,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      subscriptionStatus: "active",
      subscriptionStartDate: premiumStartDate,
      subscriptionExpiryDate: premiumExpiryDate,
      lastPaymentId: razorpay_payment_id,
      lastOrderId: razorpay_order_id
    });

    // 4. Save transaction log
    await PaymentModel.create({
      userId: user.id,
      firebaseUid,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: 9900,
      currency: "INR",
      status: "success"
    });

    // 5. Send confirmation receipt email
    try {
      const paymentDateFormatted = premiumStartDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
      const expiryDateFormatted = premiumExpiryDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      await sendPaymentReceiptEmail(user.email, user.name || "Subscriber", {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        paymentDate: paymentDateFormatted,
        expiryDate: expiryDateFormatted
      });
    } catch (emailError) {
      console.error("WARNING: Failed to send payment receipt email:", emailError.message);
    }

    return { success: true, message: "Payment verified successfully. Premium membership activated!" };
  }

  /**
   * Retrieves subscription status with self-healing expiry check.
   */
  static async getSubscriptionStatus(firebaseUid) {
    const user = await UserModel.findByFirebaseUid(firebaseUid);
    if (!user) {
      const err = new Error("User profile not found.");
      err.status = 404;
      throw err;
    }

    const now = new Date();
    let isPremium = user.isPremium || false;
    let subscriptionStatus = user.subscriptionStatus || "none";
    let premiumExpiryDate = user.premiumExpiryDate || user.subscriptionExpiryDate || null;

    // Self-healing check if subscription expired
    if (isPremium && premiumExpiryDate && new Date(premiumExpiryDate) < now) {
      await UserModel.updateByFirebaseUid(firebaseUid, {
        isPremium: false,
        subscriptionStatus: "expired"
      });
      isPremium = false;
      subscriptionStatus = "expired";
    }

    return {
      isPremium,
      subscriptionStatus,
      premiumExpiryDate,
      subscriptionExpiryDate: premiumExpiryDate
    };
  }
}

import razorpay from "../services/razorpayService.js";
import { getDb } from "../config/mongodb.js";
import crypto from "crypto";

/**
 * Creates a new Razorpay order for the premium subscription (₹99 = 9900 paise).
 * POST /api/payment/create-order
 */
export async function createOrder(req, res) {
  const { firebaseUid } = req.user;
  const { plan } = req.body;

  if (plan !== "premium") {
    return res.status(400).json({
      success: false,
      message: "Invalid plan. Only 'premium' is supported."
    });
  }

  try {
    const db = getDb();
    const user = await db.collection("users").findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found in local database."
      });
    }

    // Optional: Check if user already has an active, unexpired subscription
    const now = new Date();
    const expiry = user.premiumExpiryDate || user.subscriptionExpiryDate;
    if (user.isPremium && expiry && new Date(expiry) > now) {
      return res.status(400).json({
        success: false,
        message: "You already have an active Premium subscription."
      });
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

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (error) {
    console.error("createOrder Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay payment order: " + error.message
    });
  }
}

/**
 * Verifies Razorpay payment signature and activates Premium status in MongoDB.
 * POST /api/payment/verify
 */
export async function verifyPayment(req, res) {
  const { firebaseUid } = req.user;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: "Missing Razorpay verification parameters in request."
    });
  }

  try {
    // 1. Verify the signature server-side using HMAC SHA256 and KEY_SECRET
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed. Untrusted source."
      });
    }

    const db = getDb();
    const userCollection = db.collection("users");
    const paymentCollection = db.collection("payments");

    // 2. Prevent duplicate payment processing
    const existingPayment = await paymentCollection.findOne({ paymentId: razorpay_payment_id });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "This payment has already been processed and verified."
      });
    }

    // 3. Find user and grant Premium status
    const user = await userCollection.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Cannot activate Premium subscription."
      });
    }

    const premiumStartDate = new Date();
    const premiumExpiryDate = new Date();
    premiumExpiryDate.setDate(premiumExpiryDate.getDate() + 30); // 30 Days Expiration

    // Update User Document
    await userCollection.updateOne(
      { firebaseUid },
      {
        $set: {
          isPremium: true,
          premiumStartDate,
          premiumExpiryDate,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          // Support both naming schemes for backward compatibility
          subscriptionStatus: "active",
          subscriptionStartDate: premiumStartDate,
          subscriptionExpiryDate: premiumExpiryDate,
          lastPaymentId: razorpay_payment_id,
          lastOrderId: razorpay_order_id,
          updatedAt: new Date()
        }
      }
    );

    // Save transaction info in payment log collection
    await paymentCollection.insertOne({
      userId: user.id,
      firebaseUid,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: 9900,
      currency: "INR",
      status: "success",
      createdAt: new Date()
    });

    console.log(`Payment success: Upgraded user ${firebaseUid} to Premium. Payment ID: ${razorpay_payment_id}`);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Premium membership activated!"
    });
  } catch (error) {
    console.error("verifyPayment Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during payment verification."
    });
  }
}

/**
 * Gets the current authenticated user's Premium subscription status.
 * GET /api/payment/status
 */
export async function getSubscriptionStatus(req, res) {
  const { firebaseUid } = req.user;

  try {
    const db = getDb();
    const user = await db.collection("users").findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found."
      });
    }

    const now = new Date();
    let isPremium = user.isPremium || false;
    let subscriptionStatus = user.subscriptionStatus || "none";
    let premiumExpiryDate = user.premiumExpiryDate || user.subscriptionExpiryDate || null;

    // Dynamic verification: Self-healing check if subscription expired
    if (isPremium && premiumExpiryDate && new Date(premiumExpiryDate) < now) {
      await db.collection("users").updateOne(
        { firebaseUid },
        {
          $set: {
            isPremium: false,
            subscriptionStatus: "expired",
            updatedAt: new Date()
          }
        }
      );
      isPremium = false;
      subscriptionStatus = "expired";
      console.log(`Subscription self-healed: Marked user ${firebaseUid} as expired.`);
    }

    return res.status(200).json({
      success: true,
      isPremium,
      subscriptionStatus,
      premiumExpiryDate,
      subscriptionExpiryDate: premiumExpiryDate
    });
  } catch (error) {
    console.error("getSubscriptionStatus Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve subscription status."
    });
  }
}

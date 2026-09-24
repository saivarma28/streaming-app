import { PaymentService } from "../services/paymentService.js";

/**
 * Controller for Razorpay subscription orders and payment verification
 */

/**
 * Creates a new Razorpay order for the premium subscription (₹99).
 * POST /api/payment/create-order
 */
export async function createOrder(req, res) {
  const { firebaseUid } = req.user;
  const { plan } = req.body;

  try {
    const orderData = await PaymentService.createOrder(firebaseUid, plan);
    return res.status(200).json({ success: true, ...orderData });
  } catch (error) {
    console.error("createOrder Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to create Razorpay payment order."
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

  try {
    const result = await PaymentService.verifyPayment(firebaseUid, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("verifyPayment Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "An error occurred during payment verification."
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
    const statusData = await PaymentService.getSubscriptionStatus(firebaseUid);
    return res.status(200).json({ success: true, ...statusData });
  } catch (error) {
    console.error("getSubscriptionStatus Controller Error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve subscription status."
    });
  }
}

import { cachedFetch as fetch, BACKEND_URL } from "./apiClient";

/**
 * Creates a Razorpay order in backend.
 * POST /api/payment/create-order
 * 
 * @param {string} token 
 * @returns {Promise<{success: boolean, orderId: string, amount: number, currency: string, keyId: string, order: object}>}
 */
export async function createPaymentOrder(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ plan: "premium" })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create payment order.");
    return data;
  } catch (error) {
    console.error("createPaymentOrder API Error:", error.message);
    throw error;
  }
}

/**
 * Verifies Razorpay payment signature in backend.
 * POST /api/payment/verify
 * 
 * @param {string} token 
 * @param {object} paymentData - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyPayment(token, paymentData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/verify`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Payment signature verification failed.");
    return data;
  } catch (error) {
    console.error("verifyPayment API Error:", error.message);
    throw error;
  }
}

/**
 * Retrieves the current subscription status of the authenticated user.
 * GET /api/payment/status
 * 
 * @param {string} token 
 * @returns {Promise<{success: boolean, isPremium: boolean, subscriptionStatus: string, premiumExpiryDate: string}>}
 */
export async function getSubscriptionStatus(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/status`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch subscription status.");
    return data;
  } catch (error) {
    console.error("getSubscriptionStatus API Error:", error.message);
    throw error;
  }
}

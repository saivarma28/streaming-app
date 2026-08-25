import dotenv from "dotenv";
dotenv.config();

import Razorpay from "razorpay";

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("Razorpay SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Razorpay SDK:", error.message);
  }
} else {
  console.warn(
    "WARNING: Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables."
  );
}

export default razorpay;
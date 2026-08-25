import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createPaymentOrder, verifyPayment } from "../services/apiService";
import { FiCheck, FiLoader, FiAlertCircle, FiAward, FiTv, FiZap, FiLock, FiStar, FiArrowLeft } from "react-icons/fi";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    // Avoid appending script duplicate times
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Premium() {
  const { currentUser, dbUser, fetchDbProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const expiry = dbUser?.premiumExpiryDate || dbUser?.subscriptionExpiryDate;
  const isPremiumUser = dbUser && dbUser.isPremium === true && expiry && new Date(expiry) > new Date();

  const handleSubscribe = async () => {
    setError("");
    setLoading(true);

    try {
      if (!currentUser) {
        throw new Error("You must be logged in to subscribe to Premium.");
      }

      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay Payment overlay. Check connection.");
      }

      const token = await currentUser.getIdToken();

      // 2. Call backend to create Razorpay Order
      const orderRes = await createPaymentOrder(token);
      if (!orderRes.success) {
        throw new Error(orderRes.message || "Failed to create subscription order.");
      }

      // 3. Configure and trigger Razorpay Checkout
      const options = {
        key: orderRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "StreamApp Premium",
        description: "1-Month Premium Membership Plan",
        image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", // Generic logo icon
        order_id: orderRes.orderId,
        prefill: {
          name: currentUser.displayName || "",
          email: currentUser.email ? currentUser.email.replace("@", "+checkout@") : "",
          contact: ""
        },
        theme: {
          color: "#e50914" // StreamApp branding Red
        },
        handler: async function (response) {
          setLoading(true);
          try {
            // Send parameters to backend verification endpoint
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };

            const verificationRes = await verifyPayment(token, verifyPayload);
            if (verificationRes.success) {
              // Refresh state
              await fetchDbProfile(currentUser);
              setSuccess(true);
            } else {
              throw new Error(verificationRes.message || "Payment signature mismatch.");
            }
          } catch (verifyError) {
            console.error("Signature verification error:", verifyError);
            setError(verifyError.message || "Verification failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            console.log("Razorpay Checkout dismissed.");
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();

    } catch (err) {
      console.error("Subscription Initiation Failure:", err);
      setError(err.message || "An unexpected error occurred during subscription.");
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] px-4 text-center">
        <div className="max-w-md w-full bg-[#12131a] border border-[#ffb703]/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Decorative Sparkles */}
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#ffb703]/5 blur-2xl"></div>
          
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#ffb703] to-[#ff8500] text-white mx-auto mb-6 shadow-[0_4px_20px_rgba(255,183,3,0.3)]">
            <FiStar className="h-8 w-8 fill-current" />
          </div>

          <h2 className="text-3xl font-black uppercase text-white mb-2 tracking-wide">Welcome to Premium</h2>
          <p className="text-sm text-gray-400 font-light mb-6">
            Your payment was successfully verified! You now have unrestricted access to all 4K UHD movies, TV series, and exclusive content.
          </p>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-8 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-semibold uppercase">Status:</span>
              <span className="text-emerald-400 font-bold uppercase">Active</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-semibold uppercase">Renewal Date:</span>
              <span className="text-white font-bold">{formatDate(dbUser?.premiumExpiryDate || dbUser?.subscriptionExpiryDate)}</span>
            </div>
          </div>

          <Link
            to="/"
            className="block text-center w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm shadow-[0_4px_15px_rgba(229,9,20,0.35)] transition-all"
          >
            Start Watching Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] py-28 text-white relative overflow-hidden flex items-center justify-center">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-[#e50914]/5 blur-[120px]"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-[#ffb703]/5 blur-[120px]"></div>

      <div className="max-w-4xl w-full mx-auto px-4 z-10 text-center space-y-10">
        
        {/* Page Title */}
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#ffb703]/10 text-[#ffb703] border border-[#ffb703]/20 uppercase tracking-widest mb-3">
            StreamApp VIP Access
          </span>
          <h1 className="text-4xl sm:text-5xl font-black uppercase text-white tracking-wide">
            Choose Unlimited Cinematic Luxury
          </h1>
          <p className="text-gray-400 text-sm font-light mt-2 max-w-lg mx-auto">
            Upgrade your profile to active Premium status and unlock our complete library of high-definition catalog titles.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-left">
            <FiAlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pricing Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
          
          {/* Free Tier Card */}
          <div className="bg-[#12131a]/60 border border-white/5 rounded-3xl p-8 flex flex-col justify-between text-left opacity-60">
            <div>
              <h3 className="text-lg font-bold text-gray-400 uppercase tracking-wider mb-2">Free Plan</h3>
              <p className="text-xs text-gray-500 font-light mb-6">Standard low-fidelity user registration.</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-black text-white">₹0</span>
                <span className="text-gray-500 text-xs font-medium ml-1">/ Month</span>
              </div>

              <ul className="space-y-4 text-xs font-medium text-gray-400">
                <li className="flex items-center gap-2">
                  <FiCheck className="text-gray-500 h-4 w-4" />
                  <span>Access to free movies and TV shows</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="text-gray-500 h-4 w-4" />
                  <span>Standard definition (SD) streaming</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="text-gray-500 h-4 w-4" />
                  <span>Includes advertisement intervals</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              className="w-full mt-8 py-3 rounded-xl bg-white/5 border border-white/5 text-gray-500 font-bold text-sm cursor-not-allowed"
            >
              Current Active Plan
            </button>
          </div>

          {/* Premium Card */}
          <div className="bg-[#12131a] border border-[#ffb703]/30 rounded-3xl p-8 flex flex-col justify-between text-left relative shadow-[0_10px_35px_rgba(255,183,3,0.15)] overflow-hidden">
            {/* Ribbon */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-[#ffb703] to-[#ff8500] text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
              Best VIP Experience
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-[#ffb703] uppercase tracking-wider mb-2">Premium Member</h3>
              <p className="text-xs text-gray-400 font-light mb-6">Complete unlimited access ticket.</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-black text-white">₹99</span>
                <span className="text-gray-400 text-xs font-medium ml-1">/ 30 Days</span>
              </div>

              <ul className="space-y-4 text-xs font-medium text-gray-200">
                <li className="flex items-center gap-2.5">
                  <FiCheck className="text-[#ffb703] h-4 w-4 shrink-0" />
                  <span>Unlock all Premium marked titles</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FiCheck className="text-[#ffb703] h-4 w-4 shrink-0" />
                  <span>Ultra High Definition (4K UHD) output</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FiCheck className="text-[#ffb703] h-4 w-4 shrink-0" />
                  <span>Completely Ad-Free cinematic streaming</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FiCheck className="text-[#ffb703] h-4 w-4 shrink-0" />
                  <span>Watch on mobile, tablet, TV, and PC</span>
                </li>
              </ul>
            </div>

            {isPremiumUser ? (
              <div className="mt-8 space-y-3">
                <div className="w-full py-3 rounded-xl bg-gradient-to-tr from-[#ffb703] to-[#ff8500] text-black font-black text-center text-xs uppercase tracking-wider">
                  Premium Active
                </div>
                <p className="text-[10px] text-center text-gray-400 font-light">
                  Active until {formatDate(dbUser?.premiumExpiryDate || dbUser?.subscriptionExpiryDate)}
                </p>
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full mt-8 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm shadow-[0_4px_15px_rgba(229,9,20,0.35)] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FiLoader className="h-4.5 w-4.5 animate-spin" />
                    <span>Processing payment...</span>
                  </>
                ) : (
                  <span>Get Premium</span>
                )}
              </button>
            )}
          </div>
          
        </div>

        {/* Benefits Grid */}
        <div className="max-w-3xl mx-auto pt-10 border-t border-white/5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Why upgrade to Premium?</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 rounded-2xl text-left border border-white/5 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-[#e50914]/10 text-[#e50914] flex items-center justify-center">
                <FiTv className="h-4.5 w-4.5" />
              </div>
              <h5 className="text-sm font-bold text-white uppercase">4K Ultra HD</h5>
              <p className="text-[11px] text-gray-400 font-light leading-relaxed">Crisp high bitrate video stream profiles directly from R2 source storage pipelines.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl text-left border border-white/5 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-[#e50914]/10 text-[#e50914] flex items-center justify-center">
                <FiZap className="h-4.5 w-4.5" />
              </div>
              <h5 className="text-sm font-bold text-white uppercase">No Advertisements</h5>
              <p className="text-[11px] text-gray-400 font-light leading-relaxed">Zero banners, overlays, or commercial intervals. Unrestricted focus on playback.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl text-left border border-white/5 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-[#e50914]/10 text-[#e50914] flex items-center justify-center">
                <FiLock className="h-4.5 w-4.5" />
              </div>
              <h5 className="text-sm font-bold text-white uppercase">Exclusive Content</h5>
              <p className="text-[11px] text-gray-400 font-light leading-relaxed">Instantly unlock movies and episodes marked under premium subscription flags.</p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white uppercase font-bold tracking-wider transition-colors"
          >
            <FiArrowLeft className="h-3.5 w-3.5" /> Return to Catalog Home
          </Link>
        </div>

      </div>
    </div>
  );
}

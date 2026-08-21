import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiPhone, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";
import { syncUser } from "../services/apiService";

export default function Login() {
  const [step, setStep] = useState(1); // 1 = Details input, 2 = Phone OTP verification

  // Input states
  const [identifier, setIdentifier] = useState(""); // Unified input for email or phone
  const [password, setPassword] = useState("");

  // OTP state (Phone only)
  const [otpCode, setOtpCode] = useState("");

  // UI States
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // References
  const confirmationResultRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  const { login, googleLogin, signInWithPhone } = useAuth();
  const navigate = useNavigate();

  // Dynamic helper: Detect if the input is an email (contains letters or @) or phone (digits only)
  const isEmail = /[a-zA-Z]/.test(identifier) || identifier.includes("@");

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  const getFriendlyErrorMessage = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-disabled":
        return "This user account has been disabled.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      case "auth/operation-not-allowed":
        return "This sign-in method is currently disabled. Please enable it in the Firebase Console.";
      case "auth/invalid-phone-number":
        return "The phone number entered is invalid. Please format it with a country code (e.g., +919876543210).";
      case "auth/too-many-requests":
        return "Access to this account has been temporarily disabled due to many failed attempts. Please try again later.";
      case "auth/code-expired":
        return "The OTP code has expired. Please request a new one.";
      case "auth/invalid-verification-code":
        return "Incorrect OTP. Please check the code and try again.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection and try again.";
      default:
        return "An error occurred during sign-in. Please try again.";
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!identifier) return setError("Email or Mobile number is required.");

    if (isEmail) {
      // Email Login
      if (!password) {
        return setError("Password is required.");
      }
      try {
        setLoading(true);
        const userCredential = await login(identifier, password);
        const token = await userCredential.user.getIdToken();
        await syncUser(token);
        navigate("/");
      } catch (err) {
        console.error(err);
        setError(getFriendlyErrorMessage(err.code));
      } finally {
        setLoading(false);
      }
    } else {
      // Phone Login (OTP SMS dispatch)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(identifier)) {
        return setError("Phone number must include country code (e.g. +919876543210).");
      }

      try {
        setLoading(true);

        // Setup invisible reCAPTCHA verifier
        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
            callback: () => {}
          });
        }

        const confirmationResult = await signInWithPhone(identifier, recaptchaVerifierRef.current);
        confirmationResultRef.current = confirmationResult;

        setMessage("SMS OTP code sent successfully to your mobile number!");
        setStep(2);
      } catch (err) {
        console.error(err);
        setError(getFriendlyErrorMessage(err.code));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!otpCode || otpCode.length < 6) {
      return setError("Please enter a valid 6-digit OTP code.");
    }

    try {
      setLoading(true);

      if (!confirmationResultRef.current) {
        return setError("Session expired. Please request the OTP again.");
      }
      const userCredential = await confirmationResultRef.current.confirm(otpCode);
      const token = await userCredential.user.getIdToken();
      await syncUser(token);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setGoogleLoading(true);
      const userCredential = await googleLogin();
      const token = await userCredential.user.getIdToken();
      await syncUser(token);
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(getFriendlyErrorMessage(err.code));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 py-28 relative">
      {/* Glow effect background */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none"></div>

      {/* Invisible reCAPTCHA container for SMS */}
      <div id="recaptcha-container"></div>

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/5 bg-[#12131a]/85 p-8 backdrop-blur-xl shadow-2xl">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#e50914] to-red-600 font-black italic text-lg text-white">
              S
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              STREAM<span className="text-[#e50914]">APP</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider">
            {step === 1 ? "Welcome Back" : "OTP Verification"}
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 font-light">
            {step === 1
              ? "Login to continue streaming your favorites"
              : `Enter the code sent to your mobile number`}
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <FiAlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Success Callout */}
        {message && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <FiCheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{message}</span>
          </div>
        )}

        {/* STEP 1: Details input */}
        {step === 1 && (
          <>
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email or Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                    {isEmail ? <FiMail className="h-4.5 w-4.5" /> : <FiPhone className="h-4.5 w-4.5" />}
                  </span>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    placeholder="Email or Mobile Number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 focus:ring-1 focus:ring-red-500/40 outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Conditionally show Password input if dynamic input is detected as Email */}
              {isEmail && identifier.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                      <FiLock className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="password"
                      required
                      disabled={loading}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 focus:ring-1 focus:ring-red-500/40 outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : isEmail ? (
                  "Login"
                ) : (
                  "Submit"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center justify-center gap-3">
              <div className="h-[1px] flex-1 bg-white/5"></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Or continue with</span>
              <div className="h-[1px] flex-1 bg-white/5"></div>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <FcGoogle className="h-5 w-5" />
                  Continue with Google
                </>
              )}
            </button>

            {/* Helper Navigation Links */}
            <div className="mt-6 space-y-2 text-center text-sm">
              <p className="text-gray-400 font-light">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-red-500 hover:text-red-400 transition-colors"
                >
                  Register
                </Link>
              </p>
              <p>
                <Link
                  to="/forgot-password"
                  className="font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Forgot Password?
                </Link>
              </p>
            </div>
          </>
        )}

        {/* STEP 2: Phone OTP verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
                Enter 6-Digit SMS OTP
              </label>
              <input
                type="text"
                maxLength={6}
                required
                disabled={loading}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full tracking-[1rem] text-center rounded-xl border border-white/5 bg-white/5 py-4 text-xl text-white placeholder-gray-600 transition-all duration-300 focus:border-red-500/40 focus:bg-white/10 outline-none disabled:opacity-50"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError("");
                  setMessage("");
                  setOtpCode("");
                }}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all cursor-pointer text-center text-sm"
              >
                Change Number
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all shadow-[0_4px_15px_rgba(229,9,20,0.35)] disabled:opacity-50 cursor-pointer text-center text-sm"
              >
                {loading ? (
                  <div className="h-5 w-5 mx-auto animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  "Verify & Login"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Public route guard.
 * Redirects authenticated users away from authentication pages (like /login or /register) to home (/).
 * Renders a diagnostic timeout display if Firebase fails to resolve in a timely manner.
 */
export default function PublicRoute({ children }) {
  const { currentUser, loading, authTimeout } = useAuth();

  if (authTimeout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0e12] px-6 text-center text-white">
        <div className="max-w-md p-8 bg-[#12131a] rounded-2xl border border-white/5 shadow-2xl">
          <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20 text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold mb-3 uppercase tracking-wider">Auth Connection Timeout</h2>
          <p className="text-sm text-gray-400 font-light mb-6 leading-relaxed">
            Firebase Authentication is taking longer than usual to initialize. This usually indicates that the Firebase configuration values in your <code className="bg-white/5 px-1.5 py-0.5 rounded text-red-400">.env</code> file are incorrect or not resolving.
          </p>
          <div className="text-xs text-left bg-black/30 p-4 rounded-xl border border-white/5 font-mono text-gray-500 space-y-1 mb-6">
            <p>Project ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID || "Not Found in ENV"}</p>
            <p>API Key Status: {import.meta.env.VITE_FIREBASE_API_KEY ? "Loaded from ENV" : "Not Found in ENV"}</p>
          </div>
          <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-xl bg-[#e50914] hover:bg-red-700 text-white font-semibold text-sm transition-colors cursor-pointer">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0e12]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}

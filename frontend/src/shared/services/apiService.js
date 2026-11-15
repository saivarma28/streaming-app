/**
 * Central API Service Barrel
 * 
 * Re-exports all domain-specific services to ensure 100% backward compatibility
 * with existing components while maintaining a clean, modular service architecture.
 */

export * from "./apiClient";
export * from "../../features/auth/services/authService";
export * from "./userService";
export * from "../../features/movies/services/movieService";
export * from "../../features/tv/services/tvShowService";
export * from "./genreService";
export * from "./watchHistoryService";
export * from "../../features/payment/services/paymentService";
export * from "./tmdbService";
export * from "../../features/admin/services/adminService";
export * from "./r2UploadService";

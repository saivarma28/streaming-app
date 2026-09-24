/**
 * Central API Service Barrel
 * 
 * Re-exports all domain-specific services to ensure 100% backward compatibility
 * with existing components while maintaining a clean, modular service architecture.
 */

export * from "./apiClient";
export * from "./authService";
export * from "./userService";
export * from "./movieService";
export * from "./tvShowService";
export * from "./genreService";
export * from "./watchHistoryService";
export * from "./paymentService";
export * from "./tmdbService";
export * from "./adminService";
export * from "./r2UploadService";

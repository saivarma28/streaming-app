# Frontend Architecture & Source Guide

This frontend is organized following a **feature-based architecture**, grouping code by business domain (auth, movies, tv, admin, payment, profile, home) while keeping reusable infrastructure and utilities in `shared`.

---

## Directory Structure

```text
public/
└── images/                  # All static images & icons (single image repository)
    ├── hero_banner.png      # Default hero banner & media fallback graphic
    ├── favicon.svg          # StreamApp browser tab favicon
    ├── icons.svg            # SVG sprite
    ├── apple-touch-icon.png # iOS home screen icon
    ├── icon-192x192.png     # PWA standard icon
    ├── icon-512x512.png     # PWA splash icon
    └── icon-512x512-maskable.png # Android adaptive icon
src/
├── main.jsx                 # Entry point: renders React root into DOM
├── app/                     # App-level orchestration
│   ├── App.jsx              # Root shell: providers, global navigation, PWA banners
│   └── routes/
│       └── AppRoutes.jsx    # Central route table and route guard definitions
├── config/                  # External service configurations
│   └── firebase.js          # Firebase SDK client initialization & auth instance
├── features/                # Domain-driven feature modules
│   ├── admin/               # Administrative panel & catalog/user management
│   │   ├── components/      # Admin panels (movies, shows, seasons, episodes, users, TMDB)
│   │   ├── pages/           # AdminDashboard.jsx
│   │   └── services/        # adminService.js (admin user CRUD, audit logs)
│   ├── auth/                # Authentication & identity management
│   │   ├── components/      # Route guards (ProtectedRoute, PublicRoute)
│   │   ├── context/         # AuthContext.jsx (global session, roles, Firebase listeners)
│   │   ├── pages/           # Login, Register, OTP/Phone verify, Password reset
│   │   └── services/        # authService.js (email OTP, phone verification)
│   ├── home/                # Discovery & featured content
│   │   └── pages/           # Home.jsx (hero banner, featured rows, TMDB search)
│   ├── movies/              # Movie catalog & playback
│   │   ├── components/      # VideoPlayer.jsx (HLS/video player controls)
│   │   ├── pages/           # Movies.jsx, MovieDetails.jsx, VideoPlayerPage.jsx
│   │   └── services/        # movieService.js (movie catalog, presigned URLs, CRUD)
│   ├── payment/             # Subscriptions & monetization
│   │   ├── pages/           # Premium.jsx (Razorpay checkout & tier status)
│   │   └── services/        # paymentService.js (order creation, signature verify)
│   ├── profile/             # User account settings
│   │   └── pages/           # Profile.jsx (profile summary, status, sign out)
│   └── tv/                  # TV shows, seasons, and episodes
│       ├── pages/           # TvShows.jsx (TV catalog)
│       └── services/        # tvShowService.js (shows, seasons, episodes)
└── shared/                  # Cross-cutting code shared across multiple features
    ├── components/
    │   ├── common/          # Global widgets (OfflineBanner, PWAUpdater)
    │   ├── navigation/      # Global navigation (Navbar, BottomNavigation)
    │   └── ui/              # Reusable UI controls (OptimizedImage)
    ├── constants/           # Shared static constants (tmdbGenres.js)
    ├── hooks/               # Custom reusable React hooks (usePWAInstall.js)
    ├── services/            # Base HTTP client & cross-domain services
    │   ├── apiClient.js     # Cached fetch wrapper with TTL cache & base URL
    │   ├── apiService.js    # Central service aggregator barrel
    │   ├── genreService.js  # Genre lookup & management
    │   ├── r2UploadService.js # Cloudflare R2 direct S3 upload helper with progress
    │   ├── tmdbService.js   # TMDB proxy integration (trending, top-rated, search)
    │   ├── userService.js   # User profile retrieval & MongoDB sync
    │   └── watchHistoryService.js # User watch progress tracking
    ├── styles/              # Global styling (index.css with Tailwind CSS)
    └── utils/               # Helper utilities (videoHelpers.js)
```

---

## Application Flow: From `main.jsx` to Page & Services

```
index.html
   └── src/main.jsx
         ├── Imports src/shared/styles/index.css (Tailwind CSS)
         └── Mounts <App /> (src/app/App.jsx)
               │
               ├── Wraps with <BrowserRouter> & <AuthProvider> (features/auth/context/AuthContext.jsx)
               │     └── Subscribes to Firebase auth state (config/firebase.js)
               │     └── Syncs user session & role with MongoDB (shared/services/userService.js)
               │
               ├── Renders Global UI:
               │     ├── <Navbar /> (shared/components/navigation/Navbar.jsx)
               │     ├── <PWAUpdater /> & <OfflineBanner /> (shared/components/common/)
               │     └── <BottomNavigation /> (shared/components/navigation/)
               │
               └── Delegates routing to <AppRoutes /> (src/app/routes/AppRoutes.jsx)
                     │
                     ├── Checks Route Protection:
                     │     ├── <ProtectedRoute> (features/auth/components/ProtectedRoute.jsx)
                     │     └── <PublicRoute> (features/auth/components/PublicRoute.jsx)
                     │
                     └── Loads Feature Page (e.g., MovieDetails at /movie/:id)
                           │
                           ├── Consumes auth & profile from useAuth()
                           ├── Calls domain service (e.g., getMovieById() via movieService.js)
                           │     └── Executes cachedFetch via apiClient.js
                           │     └── Calls backend REST API (/api/movies/:id)
                           └── Renders UI with shared components (e.g., OptimizedImage, VideoPlayer)
```

### Flow Walkthrough Example (Opening a Movie Details Page)

1. **Bootstrapping (`src/main.jsx`)**: Vite loads `main.jsx`, mounts React into `#root`, and injects global styles from `src/shared/styles/index.css`.
2. **Global Context & Providers (`src/app/App.jsx`)**: `AuthProvider` establishes the session lifecycle via `src/config/firebase.js` and fetches user role metadata from MongoDB via `syncUser`/`getUserMe` in `src/shared/services/userService.js`.
3. **Route Resolution (`src/app/routes/AppRoutes.jsx`)**: The router matches `/movie/:id` wrapped in `<ProtectedRoute>`. If the user is unauthenticated, it redirects to `/login`; otherwise, it renders `src/features/movies/pages/MovieDetails.jsx`.
4. **Data Fetching via Services (`src/features/movies/services/movieService.js`)**: The page invokes `getMovieById(token, id)`, which calls `cachedFetch` from `src/shared/services/apiClient.js` against the backend `/api/movies/:id`.
5. **Presentation & Components**: Media cards render poster graphics through `<OptimizedImage />` (`src/shared/components/ui/OptimizedImage.jsx`), stream URLs are formatted by `src/shared/utils/videoHelpers.js`, and clicking "Watch" routes to `<VideoPlayerPage />` featuring `<VideoPlayer />` (`src/features/movies/components/VideoPlayer.jsx`).

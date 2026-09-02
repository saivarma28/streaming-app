# StreamApp - Project Cleanup & Optimization Plan

**Project**: StreamApp (Full-Stack Streaming Platform)  
**Date**: September 2, 2026  
**Status**: Ready for Execution

---

## A. Current Folder Structure

```
c:\hotstar clone\ (or c:\streaming-app\)
├── frontend\
│   ├── public\
│   │   ├── favicon.svg
│   │   ├── icons.svg
│   │   ├── logo.svg
│   │   └── icons\ (apple-touch-icon.png, icon-192x192.png, icon-512x512-maskable.png, icon-512x512.png)
│   ├── src\
│   │   ├── assets\ (hero_banner.png)
│   │   ├── components\
│   │   │   ├── admin\ (AdminDashboardHome, AdminEpisodes, AdminGenres, AdminMovieForm, AdminMovies, AdminSeasons, AdminSidebar, AdminTmdb, AdminTvShowForm, AdminTvShows, AdminUsers)
│   │   │   ├── common\ (OfflineBanner, ProtectedRoute, PublicRoute, PWAUpdater)
│   │   │   ├── movie\ (VideoPlayer)
│   │   │   ├── navigation\ (BottomNavigation, Navbar)
│   │   │   └── ui\ (InstallAppButton, OptimizedImage)
│   │   ├── context\ (AuthContext.jsx)
│   │   ├── hooks\ (usePWAInstall.js)
│   │   ├── pages\
│   │   │   ├── admin\ (AdminDashboard)
│   │   │   ├── auth\ (ForgotPasswordEmail, ForgotPasswordPhone, ForgotPasswordPhoneReset, ForgotPasswordPhoneVerify, ForgotPasswordSelector, Login, PhoneVerification, Register, ResetPassword, VerifyEmailOtp)
│   │   │   ├── movies\ (MovieDetails, Movies, VideoPlayerPage)
│   │   │   ├── payment\ (Premium)
│   │   │   ├── profile\ (Profile)
│   │   │   ├── tv\ (TvShows)
│   │   │   └── Home.jsx
│   │   ├── routes\ (AppRoutes.jsx)
│   │   ├── services\ (apiService.js)
│   │   ├── App.jsx
│   │   ├── firebase.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vercel.json
│   └── vite.config.js
│
├── backend\
│   ├── api\ (index.js serverless handler)
│   ├── config\ (firebaseAdmin.js, mongodb.js)
│   ├── controllers\ (authController, genreController, movieController, paymentController, tmdbController, tvShowController, userController, watchHistoryController)
│   ├── middleware\ (adminMiddleware, authMiddleware)
│   ├── routes\ (authRoutes, genreRoutes, movieRoutes, paymentRoutes, tmdbRoutes, tvShowRoutes, userRoutes, watchHistoryRoutes)
│   ├── services\ (cloudflareR2, emailService, googleCloudStorage, googleTranscoder, razorpayService, tmdbService)
│   ├── uploads\ (movies, tvshows local fallback directories)
│   ├── utils\ (otpStore.js)
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── app.js
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── vercel.json
│
├── .gitignore
└── README.md
```

---

## B. Proposed Folder Structure

The project structure is structured into a clean monorepo:
- **`frontend/`**: Contains only client-side React 19 application files, configuration, and dependencies.
- **`backend/`**: Contains only server-side Node.js / Express API files, configuration, and dependencies.
- **Root**: Contains project-level `.gitignore` and `README.md`.

---

## C. Duplicate Files Found & Status

1. **`src/pages/auth/EmailVerification.jsx`**: Duplicate / obsolete file from an earlier iteration. (Purged; active custom OTP flow is handled by `VerifyEmailOtp.jsx`).
2. **`src/pages/auth/ForgotPassword.jsx`**: Duplicate / obsolete single-page reset component. (Purged; active flow is handled modularly by `ForgotPasswordSelector.jsx`, `ForgotPasswordEmail.jsx`, `ForgotPasswordPhone.jsx`, `ForgotPasswordPhoneVerify.jsx`, `ForgotPasswordPhoneReset.jsx`).
3. **`scripts/generate-icons.js`**: One-time script for generating PWA icons. (Purged; generated icons already exist in `public/icons/`).
4. **`backend/scratch/` (7 files)**: Temporary test scripts (`scratch_*.js`). (Purged).
5. **`backend/.agents/`, `.claude/`, `.windsurf/`, `skills-lock.json`**: Leftover IDE/agent metadata files. (Purged).

---

## D. Duplicate & Unused Code Found

1. **`frontend/src/pages/Home.jsx`**:
   - Unused imports: `Link`, `FiPlus`.
   - Unused state variables: `error`, `tmdbPopularMovies`, `tmdbTopRated`, `tmdbPopularTv`, `tmdbError`.
   - Unused API calls: `getTmdbPopularMovies`, `getTmdbTopRatedMovies`, `getTmdbPopularTv` (Home displays trending hero + catalog + debounced search; other sections are on dedicated Movies/TV pages).
2. **`frontend/src/components/admin/AdminTmdb.jsx`**:
   - Unused imports: `useEffect`, `FiLoader`.
   - Unused variable: `navigate`.
3. **`frontend/src/pages/movies/MovieDetails.jsx`**:
   - Unnecessary escape characters in regex string (`\&` and `\?`).
4. **`frontend/src/pages/movies/Movies.jsx`**:
   - Unused state: `error` (set but never rendered; loading spinner and empty state handled cleanly).

---

## E. Unused Files Found

No additional unused files exist in the project after the initial audit and cleanup. All active components, controllers, routes, and services are directly mapped and used.

---

## F. Files That Can Safely Be Cleaned

- [x] Clean unused imports and state variables in [Home.jsx](file:///c:/hotstar%20clone/frontend/src/pages/Home.jsx)
- [x] Clean unused imports and unused navigate hook in [AdminTmdb.jsx](file:///c:/hotstar%20clone/frontend/src/components/admin/AdminTmdb.jsx)
- [x] Fix unnecessary regex escapes in [MovieDetails.jsx](file:///c:/hotstar%20clone/frontend/src/pages/movies/MovieDetails.jsx)

---

## G. Files That Should NOT Be Removed

1. **Backend Services:**
   - `backend/services/googleCloudStorage.js` & `googleTranscoder.js`: Used by `movieController.js` for optional Google Cloud HLS transcoding fallback.
   - `backend/services/cloudflareR2.js`: Used for primary video storage and presigned URL generation.
   - `backend/services/razorpayService.js`: Used for subscription order creation and signature verification.
   - `backend/services/emailService.js`: Used for Nodemailer email OTP dispatch.
   - `backend/services/tmdbService.js`: Used for TMDB API proxy endpoints.
2. **Auth & Security:**
   - `backend/middleware/authMiddleware.js` & `adminMiddleware.js`: Required for protecting routes and verifying Firebase JWT tokens.
   - All 10 active frontend auth pages.
3. **Deployment Configurations:**
   - `frontend/vercel.json` (SPA routing rewrites) & `backend/vercel.json` (Serverless API routing).
   - `frontend/vite.config.js` (PWA and Tailwind integration).

---

## H. Import & Reference Changes Required

Only dead import removals within the cleaned files (`Home.jsx`, `AdminTmdb.jsx`). No cross-file import paths need restructuring because components remain organized in their standard relative directory locations.

---

## I. Risks & Mitigations

- **Risk**: Potential broken imports after dead code cleanup.
  - **Mitigation**: Run `npm run build` in `frontend/` and `node --check server.js` in `backend/` immediately following any code edits.
- **Risk**: Accidental exposure of secrets.
  - **Mitigation**: All `.env` files are ignored by `.gitignore` and no credentials will ever be committed or logged.
- **Risk**: Changing user-facing behavior.
  - **Mitigation**: Zero modifications to UI components, styles, route paths, API contracts, or business logic.

---

## J. Outer Folder Renaming Instructions (For User)

The parent folder `c:\hotstar clone\` is currently the active workspace root in the IDE. To rename it to `c:\streaming-app\` safely on Windows:
1. Close the IDE / editor window.
2. Open Windows File Explorer or PowerShell.
3. Rename the directory `c:\hotstar clone` to `c:\streaming-app`.
4. Reopen the folder `c:\streaming-app` in your IDE.
*Note: Because all paths in the code and Git configuration are relative, renaming the parent directory will not affect Git, Vercel, npm, or any application behavior.*

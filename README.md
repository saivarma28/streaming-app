# 🎬 StreamApp — Production Full-Stack OTT Streaming Platform

StreamApp is a full-stack, cloud-native OTT video streaming platform built with **React (Vite)**, **Node.js (Express)**, **MongoDB Atlas**, **Firebase Authentication**, **Cloudflare R2 Storage**, and **Razorpay Payments**.

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [System Architecture](#-system-architecture)
5. [Frontend Structure](#-frontend-structure)
6. [Backend Structure](#-backend-structure)
7. [Authentication Flow](#-authentication-flow)
8. [Media Storage & Cloudflare R2 Flow](#-media-storage--cloudflare-r2-flow)
9. [Payment & Subscription Flow](#-payment--subscription-flow)
10. [Admin Dashboard Flow](#-admin-dashboard-flow)
11. [Database Schema & Collections](#-database-schema--collections)
12. [Environment Variables](#-environment-variables)
13. [Local Development Setup](#-local-development-setup)
14. [Deployment Architecture](#-deployment-architecture)

---

## 🌟 Project Overview

StreamApp provides an on-demand video streaming experience modeled after modern streaming platforms like Disney+ Hotstar and Netflix. It features adaptive HLS video streaming, automated email OTP verification, phone number login with Firebase reCAPTCHA, Razorpay payment processing for premium content access, TMDB catalog browsing, and an administrative control panel for content publishing and user management.

---

## 🚀 Key Features

- **🔐 Dual Authentication & Security:**
  - Email OTP verification via Nodemailer with SHA-256 secure hashing and rate-limiting.
  - Phone number SMS authentication using Firebase reCAPTCHA.
  - Google One-Tap / OAuth sign-in.
  - JWT Bearer Token verification on Express protected routes.
  - Role-Based Access Control (`user` and `admin`).

- **🎥 Media & Streaming:**
  - HLS.js custom responsive player with adaptive streaming, playback rate, quality selector, and keyboard shortcuts.
  - Direct video uploads to **Cloudflare R2** via pre-signed S3 URLs with live upload progress tracking.
  - Watch progress persistence & "Continue Watching" row.
  - TV Shows support with Multi-Season and Episode hierarchy.

- **💳 Monetization & Subscriptions:**
  - Razorpay order creation and server-side HMAC SHA-256 signature verification.
  - Automatic 30-day Premium activation and self-healing expiry checks.
  - Automated HTML email payment receipts.

- **🛡️ Admin Management:**
  - Full CRUD operations for Movies, TV Shows, Seasons, and Episodes.
  - Direct Cloudflare R2 video upload pipeline with pre-signed PUT URLs.
  - User role promotion, manual account creation, password reset, and account disablement.
  - Security audit logging for administrative actions.

- **📱 Progressive Web App (PWA):**
  - Offline banner detection, service worker caching, and custom app installation prompts.

---

## 🛠 Technology Stack

### Frontend
- **Framework:** React.js 19 + Vite
- **Routing:** React Router DOM (v6)
- **Styling:** Tailwind CSS + Vanilla CSS tokens
- **Icons:** React Icons (`Fi`, `Hi`, etc.)
- **Video Playback:** HLS.js
- **Auth Client:** Firebase Web SDK (v11)
- **PWA:** Vite PWA Plugin + Workbox

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js (v4)
- **Database:** MongoDB Atlas (Native `mongodb` driver v7 with auto-increment counter sequences)
- **Auth Admin:** Firebase Admin SDK (`firebase-admin` v14)
- **Cloud Storage:** AWS SDK for JavaScript (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- **Payments:** Razorpay Node.js SDK
- **Email:** Nodemailer (SMTP)
- **External Catalog:** The Movie Database (TMDB) API

---

## 🏛 System Architecture

### High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                CLIENT LAYER                                   |
|   React (Vite) + Tailwind CSS + Context API + React Router + HLS Player       |
+---------------------------------------+---------------------------------------+
                                        |
                         HTTPS REST API | Bearer JWT Token
                                        v
+-------------------------------------------------------------------------------+
|                            EXPRESS.JS BACKEND                                 |
|                                                                               |
|   Routes              Middleware          Controllers         Services        |
|   +---------------+   +---------------+   +---------------+   +---------------+
|   | authRoutes    |-->| authMiddleware|-->| authController|-->| authService   |
|   | movieRoutes   |   | adminMiddle   |   | movieControl  |   | movieService  |
|   | tvShowRoutes  |   +---------------+   | tvShowControl |   | tvShowService |
|   | paymentRoutes |                       | paymentControl|   | paymentService|
|   | userRoutes    |                       | userController|   | userService   |
|   +---------------+                       +---------------+   +---------------+
|                                                                       |
|                                                                       v
|                                                                 Models (DAO)  |
|                                                               +---------------+
|                                                               | MovieModel    |
|                                                               | TvShowModel   |
|                                                               | UserModel     |
|                                                               | PaymentModel  |
+---------------------------------------------------------------+---------------+
         |                                |                            |
         v                                v                            v
+------------------+            +-------------------+        +-------------------+
|  MongoDB Atlas   |            |   Cloudflare R2   |        |  Firebase Admin   |
| (Metadata & Data)|            |  (Video Streams)  |        | (Identity Verify) |
+------------------+            +-------------------+        +-------------------+
```

---

## 📂 Frontend Structure

```
frontend/src/
├── assets/                  # Brand assets & fallback banners
├── components/
│   ├── admin/               # Admin panel views (Movies, TV, Users, Genres, Audit Logs)
│   ├── common/              # ProtectedRoute, PublicRoute, PWA updater, Offline banner
│   ├── movie/               # VideoPlayer (HLS.js implementation)
│   ├── navigation/          # Navbar & Mobile BottomNavigation
│   └── ui/                  # Reusable UI controls (OptimizedImage, InstallAppButton)
├── constants/
│   └── tmdbGenres.js        # TMDB genre dictionaries
├── context/
│   └── AuthContext.jsx      # Firebase auth listener & MongoDB profile state
├── hooks/
│   └── usePWAInstall.js     # Browser PWA install prompt handler
├── pages/
│   ├── Home.jsx             # Hero carousel, continue watching, catalog rows
│   ├── admin/AdminDashboard # Admin layout container
│   ├── auth/                # Login, Register, Email OTP, Phone OTP, Forgot Password
│   ├── movies/              # MovieDetails, Movies list, VideoPlayerPage
│   ├── payment/Premium.jsx  # Subscription pricing and Razorpay checkout
│   ├── profile/Profile.jsx  # User account settings
│   └── tv/TvShows.jsx       # TV show catalog
├── routes/
│   └── AppRoutes.jsx        # Routing table with authentication guards
├── services/                # Modular API layer
│   ├── apiClient.js         # Base cached fetch wrapper
│   ├── authService.js       # OTP dispatch & phone check
│   ├── userService.js       # Profile sync & updates
│   ├── movieService.js      # Movie CRUD & presigned URLs
│   ├── tvShowService.js     # TV shows, seasons & episodes
│   ├── genreService.js      # Genre catalog APIs
│   ├── watchHistoryService.js # Playback progress tracking
│   ├── paymentService.js    # Razorpay order & verification
│   ├── tmdbService.js       # TMDB integration proxy
│   ├── adminService.js      # User management & audit logs
│   ├── r2UploadService.js   # Direct XHR upload with progress
│   └── apiService.js        # Re-export barrel for backward compatibility
├── utils/
│   └── videoHelpers.js      # YouTube ID parser & duration formatters
├── App.jsx                  # Application root
├── firebase.js              # Firebase Client SDK initialization
└── main.jsx                 # Vite entry point
```

---

## 📂 Backend Structure

```
backend/
├── config/
│   ├── firebaseAdmin.js     # Firebase Admin SDK credentials & initialization
│   └── mongodb.js           # MongoClient connection pool & auto-increment sequence helper
├── controllers/             # Lean HTTP controllers (Req/Res parsing & status codes)
│   ├── authController.js
│   ├── genreController.js
│   ├── movieController.js
│   ├── paymentController.js
│   ├── tmdbController.js
│   ├── tvShowController.js
│   ├── userController.js
│   └── watchHistoryController.js
├── middleware/
│   ├── authMiddleware.js    # Decodes & verifies Firebase JWT Bearer tokens
│   └── adminMiddleware.js   # Verifies "admin" role in MongoDB + auto-sync
├── models/                  # Data Access Layer (MongoDB queries & mutations)
│   ├── AuditLog.js
│   ├── Genre.js
│   ├── Movie.js
│   ├── Payment.js
│   ├── TvShow.js
│   ├── User.js
│   └── WatchHistory.js
├── routes/                  # Express Router definitions
│   ├── authRoutes.js
│   ├── genreRoutes.js
│   ├── movieRoutes.js
│   ├── paymentRoutes.js
│   ├── tmdbRoutes.js
│   ├── tvShowRoutes.js
│   ├── userRoutes.js
│   └── watchHistoryRoutes.js
├── services/                # Business logic & Third-party integrations
│   ├── authService.js
│   ├── cloudflareR2.js      # S3 Client for Cloudflare R2
│   ├── emailService.js      # Nodemailer SMTP transporter & templates
│   ├── genreService.js
│   ├── googleCloudStorage.js
│   ├── googleTranscoder.js
│   ├── movieService.js
│   ├── paymentService.js
│   ├── razorpayService.js   # Razorpay SDK initialization
│   ├── tmdbService.js       # TMDB fetch client
│   ├── tvShowService.js
│   ├── userService.js
│   └── watchHistoryService.js
├── utils/
│   ├── mediaUrlHelper.js    # Unifies R2 public URL rewriting
│   └── otpStore.js          # In-memory rate-limited OTP cache
├── app.js                   # Express application setup & CORS configuration
├── server.js                # Database connection & HTTP server listener
└── vercel.json              # Serverless deployment configuration
```

---

## 🔐 Authentication Flow

```
1. REGISTRATION:
   User submits Email & Password
             ↓
   Backend generates 6-digit OTP -> Hashes with SHA-256 -> Saves in Memory
             ↓
   Nodemailer sends OTP email
             ↓
   User enters OTP -> Backend verifies hash timing-safely
             ↓
   Firebase Auth creates User Account -> Returns Firebase ID Token

2. USER SYNCHRONIZATION:
   Frontend receives Firebase ID Token
             ↓
   Calls POST /api/users/sync with Bearer <Token>
             ↓
   authMiddleware verifies JWT with Firebase Admin SDK
             ↓
   userService searches MongoDB:
     - Found: updates display name, photo, verification status
     - Missing: creates MongoDB user record with auto-increment ID
             ↓
   First user created automatically receives "admin" role

3. LOGIN & PROTECTED API CALLS:
   User logs in (Email/Password, Phone OTP, or Google)
             ↓
   Frontend attaches Authorization: Bearer <ID_TOKEN>
             ↓
   authMiddleware sets req.user = { firebaseUid, email, name }
             ↓
   adminMiddleware (if admin route) verifies role === "admin" in MongoDB
             ↓
   Controller processes request
```

---

## 📦 Media Storage & Cloudflare R2 Flow

```
ADMIN VIDEO UPLOAD:
1. Admin selects video file in Admin Dashboard
             ↓
2. Frontend calls POST /api/movies/presigned-url
             ↓
3. Backend uses @aws-sdk/s3-request-presigner + S3Client (R2 Endpoint)
   Generates a PUT pre-signed URL (valid for 1 hour)
             ↓
4. Frontend uploads file DIRECTLY to Cloudflare R2 via XMLHttpRequest
   (Tracks live upload percentage 0% -> 100% without buffering on backend server)
             ↓
5. On upload complete, Frontend sends metadata + public R2 URL to POST /api/movies
             ↓
6. Backend saves movie document in MongoDB with transcodingStatus: "READY"
             ↓
7. End-user clicks "Watch" -> VideoPlayer streams HLS/MP4 directly from Cloudflare R2
```

---

## 💳 Payment & Subscription Flow

```
1. User clicks "Go Premium" (₹99 / Month)
             ↓
2. Frontend calls POST /api/payment/create-order
             ↓
3. Backend initializes Razorpay Order for 9900 paise (INR) -> Returns order_id
             ↓
4. Frontend launches Razorpay Checkout Modal
             ↓
5. User completes payment via UPI / Card / NetBanking
             ↓
6. Razorpay returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }
             ↓
7. Frontend calls POST /api/payment/verify
             ↓
8. Backend computes HMAC SHA-256:
   crypto.createHmac("sha256", RAZORPAY_KEY_SECRET)
         .update(order_id + "|" + payment_id)
         .digest("hex")
             ↓
9. Signature matches?
   - Upgrades user in MongoDB: isPremium: true, premiumExpiryDate: (Now + 30 Days)
   - Records transaction in `payments` collection
   - Sends HTML Payment Receipt Email via Nodemailer
```

---

## 🛡️ Admin Dashboard Flow

- **Dashboard Home:** Quick system statistics, active users count, total movies, TV shows, and recent watch activities.
- **Movie Management:** Table listing with filtering, publish/unpublish toggles, direct R2 video uploads, genre tagging.
- **TV Show Management:** Show creation, Season hierarchy builder, Episode uploader with individual streaming URLs.
- **User Management:** View all registered accounts, create accounts manually, change roles (`user` ↔ `admin`), grant/revoke Premium access, disable accounts, reset passwords.
- **Audit Logs:** Immutable audit log tracking every administrative action (timestamp, admin email, action description, target user).

---

## 🗄️ Database Schema & Collections

MongoDB Atlas Database: `streaming_app`

| Collection | Key Fields | Purpose |
| :--- | :--- | :--- |
| `users` | `id`, `firebaseUid`, `email`, `name`, `role`, `isPremium`, `premiumExpiryDate`, `isDisabled` | User accounts and subscription status |
| `movies` | `id`, `title`, `description`, `thumbnailUrl`, `videoUrl`, `hlsUrl`, `duration`, `releaseYear`, `genreIds`, `isPremium`, `isPublished`, `transcodingStatus` | Movie metadata and video streaming URLs |
| `tvshows` | `id`, `title`, `description`, `thumbnailUrl`, `releaseYear`, `genreIds`, `totalSeasons`, `isPremium`, `isPublished` | TV series metadata |
| `episodes` | `id`, `tvShowId`, `seasonNumber`, `episodeNumber`, `title`, `videoUrl`, `hlsUrl`, `duration`, `isPublished` | TV show episodes |
| `genres` | `id`, `name`, `createdAt` | Content category tags |
| `watch_histories` | `id`, `userId`, `movieId`, `progress`, `completed`, `lastWatchedAt` | User watch progress and continue watching list |
| `payments` | `userId`, `firebaseUid`, `paymentId`, `orderId`, `amount`, `currency`, `status`, `createdAt` | Transaction audit logs |
| `audit_logs` | `adminEmail`, `adminName`, `action`, `targetUser`, `timestamp` | Administrative audit trail |
| `counters` | `_id`, `sequence_value` | Auto-increment sequence generator for numeric IDs |

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# Nodemailer SMTP settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM="StreamApp <noreply@streamingapp.com>"

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/
MONGODB_DB_NAME=streaming_app

# Firebase Admin SDK
FIREBASE_PROJECT_ID=streaming-app-xxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@streaming-app-xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudflare R2 Storage
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=streaming-app
R2_PUBLIC_URL_PREFIX=https://pub-xxx.r2.dev

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# TMDB API
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_token
TMDB_API_KEY=your_tmdb_api_key
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000

# Firebase Client SDK
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=streaming-app-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=streaming-app-xxx
VITE_FIREBASE_STORAGE_BUCKET=streaming-app-xxx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxx
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: v18 or higher
- **MongoDB Atlas** database cluster
- **Firebase Project** with Email/Password and Phone Authentication enabled

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/saivarma28/streaming-app.git
cd streaming-app

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Files

- Copy `backend/.env.example` to `backend/.env` and fill in your credentials.
- Copy `frontend/.env.example` to `frontend/.env` and fill in your credentials.

### 3. Run Locally

In two separate terminals:

```bash
# Terminal 1: Start Backend (Port 5000)
cd backend
npm run dev

# Terminal 2: Start Frontend (Port 5173)
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🚀 Deployment Architecture

- **Frontend:** Hosted on **Vercel** with Vite SPA routing rules configured in `vercel.json`.
- **Backend:** Express API deployed as a Node.js server or serverless functions on **Vercel** (`backend/api/index.js`).
- **Database:** Hosted on **MongoDB Atlas** (Replica Set).
- **Media CDN:** Stored in **Cloudflare R2** with zero egress fees and fast global edge caching.

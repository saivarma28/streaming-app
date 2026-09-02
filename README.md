# Streaming App (Hotstar Clone)

Full-stack OTT streaming web application with video streaming, Firebase authentication (email OTP & phone verification), Razorpay subscription payments, and comprehensive Admin Dashboard.

---

## Project Structure

```
hotstar-clone/
├── frontend/             # React 19 + Vite + Tailwind CSS + PWA
│   ├── public/           # Static assets, SVG icons, PWA manifests
│   ├── src/              # React components, pages, routes, hooks, context
│   ├── .env              # Frontend environment variables
│   ├── package.json      # Frontend dependencies & scripts
│   └── vite.config.js    # Vite & PWA configuration
│
├── backend/              # Node.js + Express + MongoDB + Firebase Admin
│   ├── api/              # Serverless entry point
│   ├── config/           # MongoDB and Firebase Admin initialization
│   ├── controllers/      # Route controllers (Auth, Movies, TV, Payment, Users, etc.)
│   ├── middleware/       # JWT Auth and Admin verification middleware
│   ├── routes/           # Express REST API route definitions
│   ├── services/         # Cloudflare R2, TMDB proxy, Razorpay, Nodemailer
│   ├── uploads/          # Local media fallback storage
│   ├── utils/            # OTP in-memory store and helper utilities
│   ├── .env              # Backend environment variables
│   ├── app.js            # Express application setup
│   ├── server.js         # Server entry point
│   └── package.json      # Backend dependencies & scripts
│
├── .gitignore            # Root git ignore rules
└── README.md             # Project documentation
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```
The backend server will start on `http://localhost:5000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The frontend Vite server will start on `http://localhost:5173`.

---

## Key Features

- **Authentication**: Email OTP verification, phone number login/verification, password reset workflows.
- **Content Catalog**: Movies, TV Shows, TMDB integration proxy, custom categories and genres.
- **Video Player**: HLS.js streaming support with responsive player controls and watch history tracking.
- **Monetization**: Razorpay test integration for subscription plans.
- **Admin Dashboard**: Content management, video presigned URL generation (Cloudflare R2), user management, audit logs.
- **PWA Ready**: Offline support, service worker caching, and install prompts.

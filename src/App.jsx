import React from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import AppRoutes from './routes/AppRoutes'
import PWAUpdater from './components/PWAUpdater'
import OfflineBanner from './components/OfflineBanner'
import BottomNavigation from './components/BottomNavigation'

function AppContent() {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  
  const showBottomNav = currentUser && !pathname.startsWith('/watch') && !pathname.startsWith('/admin');

  return (
    <div className={`relative min-h-screen bg-[#0d0e12] text-gray-100 antialiased overflow-x-hidden selection:bg-red-600 selection:text-white ${showBottomNav ? 'pb-mobile-bottom-nav' : ''}`}>
      <Navbar />
      <main className="pt-0">
        <AppRoutes />
      </main>
      <PWAUpdater />
      <OfflineBanner />
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

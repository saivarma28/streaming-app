import React from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '../features/auth/context/AuthContext'
import Navbar from '../shared/components/navigation/Navbar'
import AppRoutes from './routes/AppRoutes'
import PWAUpdater from '../shared/components/common/PWAUpdater'
import OfflineBanner from '../shared/components/common/OfflineBanner'
import BottomNavigation from '../shared/components/navigation/BottomNavigation'

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

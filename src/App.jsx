import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="relative min-h-screen bg-[#0d0e12] text-gray-100 antialiased overflow-x-hidden selection:bg-red-600 selection:text-white">
          <Navbar />
          <main className="pt-0">
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

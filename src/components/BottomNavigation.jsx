import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiTv, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function BottomNavigation() {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();

  // Hide bottom navigation if the user is not authenticated,
  // or if they are on the watch page or admin dashboard.
  if (!currentUser || pathname.startsWith('/watch') || pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: FiHome,
    },
    {
      name: 'TV Shows',
      path: '/tv-shows',
      icon: FiTv,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: FiUser,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#090a0f]/95 backdrop-blur-md border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.6)] z-50 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Exact match for Home (/), startswith match for other sub-routes
          const isActive = item.path === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${
                isActive 
                  ? 'text-[#e50914] scale-105' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

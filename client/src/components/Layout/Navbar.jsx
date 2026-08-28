import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Menu, X, User, LayoutDashboard, Radio, LogOut, ChevronDown, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../ui/LoginModal';

export default function Navbar() {
  const { user, isAdmin, isVolunteer, isCitizen, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const navLinks = [
    { name: 'Live Map', path: '/map' },
    { name: 'Alerts', path: '/alerts' },
    { name: 'Report Incident', path: '/report' },
    { name: 'Resources', path: '/resources' },
    { name: 'Dashboards', path: '/dashboard' },
  ];

  return (
    <>
      <div className="h-1 bg-red-600 w-full fixed top-0 z-[51]" />
      <nav className="fixed top-1 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <NavLink to="/" className="flex items-center gap-2.5 group">
                <div className="bg-red-600/20 p-2 rounded-xl group-hover:bg-red-600/30 transition border border-red-500/30">
                  <Shield className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tight text-white">ResQNet</span>
                  <span className="text-[9px] text-gray-400 font-mono tracking-widest -mt-1 uppercase">Emergency Operations</span>
                </div>
              </NavLink>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-red-600/20 text-red-400 border border-red-500/30 shadow'
                        : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}

              {user && (
                <NavLink
                  to="/my-reports"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-dark-800 text-white border border-gray-700'
                        : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                    }`
                  }
                >
                  My Reports
                </NavLink>
              )}
            </div>

            {/* Right Action Area: User Profile or Sign In */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <div className="flex items-center gap-3 bg-dark-800/90 border border-gray-700/80 rounded-2xl py-1.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-red-600/20 rounded-lg flex items-center justify-center text-red-400 font-bold text-xs border border-red-500/30">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.name || user.username}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${
                        user.role === 'admin' ? 'text-red-400' : user.role === 'volunteer' ? 'text-orange-400' : 'text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-dark-700 rounded-lg transition"
                    title="Sign Out"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl transition shadow-lg shadow-red-600/30 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Login / Sign Up</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              {user && (
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  user.role === 'admin' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {user.role}
                </span>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-dark-800 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-dark-900 border-b border-gray-800 px-4 pt-2 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-xl text-sm font-bold ${
                    isActive ? 'bg-red-600/20 text-red-400' : 'text-gray-300 hover:bg-dark-800'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            {user && (
              <NavLink
                to="/my-reports"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-bold text-gray-300 hover:bg-dark-800"
              >
                My Reports
              </NavLink>
            )}

            <div className="pt-3 border-t border-gray-800">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-white font-bold block">{user.name || user.username}</span>
                    <span className="text-gray-400 uppercase text-[10px]">{user.role}</span>
                  </div>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl text-xs font-bold transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setIsLoginOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold text-center"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}

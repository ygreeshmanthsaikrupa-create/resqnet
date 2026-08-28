import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Lock, Shield, BadgeCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { login, signup, sessionExpired, clearSessionExpired } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('citizen');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionExpired) {
      setError('Your previous session has expired. Please sign in again.');
    }
  }, [sessionExpired]);

  if (!isOpen) return null;

  const handleClose = () => {
    setError('');
    if (clearSessionExpired) clearSessionExpired();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(username, password, name, role);
      } else {
        await login(username, password);
      }
      handleClose();
    } catch (err) {
      setError(err.message || (isSignup ? 'Signup failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (demoRole) => {
    setError('');
    setLoading(true);
    try {
      await login(demoRole, `${demoRole}123`);
      handleClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setUsername('');
    setPassword('');
    setName('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-800 rounded-2xl shadow-2xl border border-gray-700/80 w-full max-w-md overflow-hidden relative"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-dark-700 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="w-11 h-11 bg-red-600/20 rounded-xl flex items-center justify-center text-red-500 border border-red-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">ResQNet Access</h2>
              <p className="text-xs text-gray-400">{isSignup ? 'Create responder / citizen profile' : 'Sign in to your emergency portal'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}
            
            {isSignup && (
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Full Name</label>
                <div className="relative">
                  <BadgeCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-dark-900 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    placeholder="e.g. Ananya Sharma"
                    required={isSignup}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-dark-900 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-900 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="Enter password (min 6 characters)"
                  required
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Select Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-dark-900 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-semibold"
                >
                  <option value="citizen">👤 Citizen (Emergency reporting & alerts)</option>
                  <option value="volunteer">🤝 Volunteer / Relief Worker (Ground triage & shelters)</option>
                </select>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-red-600/30 disabled:opacity-50 text-sm mt-2"
            >
              {loading ? 'Processing...' : isSignup ? 'Create Account & Sign In' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button 
              onClick={toggleMode} 
              type="button" 
              className="text-xs text-red-400 hover:text-red-300 font-semibold transition"
            >
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

          {!isSignup && (
            <div className="mt-6 pt-5 border-t border-gray-700/60">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 text-center">
                1-Click Demo Accounts
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => demoLogin('citizen')}
                  type="button"
                  className="py-2 bg-dark-900 hover:bg-dark-700 border border-gray-700 rounded-xl text-xs font-bold text-blue-400 hover:text-white transition text-center"
                >
                  Citizen
                </button>
                <button
                  onClick={() => demoLogin('volunteer')}
                  type="button"
                  className="py-2 bg-dark-900 hover:bg-dark-700 border border-gray-700 rounded-xl text-xs font-bold text-orange-400 hover:text-white transition text-center"
                >
                  Volunteer
                </button>
                <button
                  onClick={() => demoLogin('admin')}
                  type="button"
                  className="py-2 bg-dark-900 hover:bg-dark-700 border border-gray-700 rounded-xl text-xs font-bold text-red-400 hover:text-white transition text-center"
                >
                  Admin
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

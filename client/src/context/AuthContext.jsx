import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, login as apiLogin, signup as apiSignup } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('resqnet_token'));
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('resqnet_token');
      if (storedToken) {
        try {
          const response = await api.get('/auth/me');
          // UNWRAPPING FIX: Extract user object from { user: {...} } response
          const resolvedUser = response.user || response;
          setUser(resolvedUser);
          setSessionExpired(false);
        } catch (error) {
          console.warn("Session verification failed:", error.message);
          setToken(null);
          setUser(null);
          localStorage.removeItem('resqnet_token');
          if (error.message && error.message.toLowerCase().includes('expired')) {
            setSessionExpired(true);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    setSessionExpired(false);
    const data = await apiLogin(username, password);
    const resolvedUser = data.user || data;
    localStorage.setItem('resqnet_token', data.token);
    setToken(data.token);
    setUser(resolvedUser);
    return data;
  };

  const signup = async (username, password, name, role) => {
    setSessionExpired(false);
    const data = await apiSignup(username, password, name, role);
    const resolvedUser = data.user || data;
    localStorage.setItem('resqnet_token', data.token);
    setToken(data.token);
    setUser(resolvedUser);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('resqnet_token');
  };

  const isAdmin = user?.role === 'admin';
  const isVolunteer = user?.role === 'volunteer';
  const isCitizen = user?.role === 'citizen';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      signup,
      logout,
      isAdmin,
      isVolunteer,
      isCitizen,
      sessionExpired,
      clearSessionExpired: () => setSessionExpired(false)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

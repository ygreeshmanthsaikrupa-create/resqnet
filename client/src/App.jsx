import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { OfflineProvider } from './context/OfflineContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import EmergencyDisclaimer from './components/ui/EmergencyDisclaimer';
import SimulationBar from './components/SimulationBar';
import LiveAlertToast from './components/ui/LiveAlertToast';
import OfflineBanner from './components/ui/OfflineBanner';

import Landing from './pages/Landing';
import MapView from './pages/MapView';
import AlertCenter from './pages/AlertCenter';
import ReportIncident from './pages/ReportIncident';
import MyReports from './pages/MyReports';
import Resources from './pages/Resources';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  
  return children;
};

function AppContent() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-gray-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <OfflineBanner />
      {!isMapPage && <EmergencyDisclaimer />}
      <LiveAlertToast />
      <Navbar />
      
      <main className={`flex-1 flex flex-col relative ${isMapPage ? 'pt-16 h-[calc(100vh)] overflow-hidden' : 'pt-16'}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/alerts" element={<AlertCenter />} />
          <Route path="/report" element={<ReportIncident />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/my-reports" element={
            <ProtectedRoute>
              <MyReports />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {!isMapPage && <Footer />}
      <SimulationBar />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <OfflineProvider>
            <AppContent />
          </OfflineProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

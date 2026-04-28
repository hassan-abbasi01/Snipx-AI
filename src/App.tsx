import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Editor from './components/VideoEditor';
// Lazy-load large pages to split bundles and improve initial load
const Features = lazy(() => import('./pages/Features'));
import Technologies from './pages/Technologies';
import Profile from './pages/Profile';
const Admin = lazy(() => import('./pages/Admin'));
import Help from './pages/Help';
import AdminTickets from './pages/AdminTickets';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './components/AuthCallback';
import LiveChat from './components/LiveChat';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import VoiceControlButton from './components/VoiceControlButton';
import { useAuth } from './contexts/AuthContext';

// New Admin Portal Imports
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminVideos = lazy(() => import('./pages/AdminVideos'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminSupport = lazy(() => import('./pages/AdminSupport'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
    // Move main layout logic into a wrapper inside Router
    function MainLayout() {
      const location = useLocation();
      return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
          <Toaster position="top-right" />
          <LiveChat />
          <KeyboardShortcuts />
          <VoiceControlButton />
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/editor" />} />
            <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/editor" />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* New Admin Portal Routes - No Navbar */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/videos" element={<AdminVideos />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/support" element={<AdminSupport />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            
            <Route
              path="*"
              element={
                <>
                  <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                  <main className={`flex-grow${location.pathname === '/' ? '' : ' pt-20 md:pt-24'}`}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/technologies" element={<Technologies />} />
                      <Route path="/editor" element={<Editor />} />
                      <Route path="/Features" element={<Features />} />
                      <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
                      <Route path="/admin" element={isAuthenticated ? <Admin /> : <Navigate to="/login" />} />
                      <Route path="/admin/tickets" element={isAuthenticated ? <AdminTickets /> : <Navigate to="/login" />} />
                      <Route path="/help" element={<Help />} />
                    </Routes>
                  </main>
                </>
              }
            />
          </Routes>
          </Suspense>
        </div>
      );
    }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
        <MainLayout />
    </Router>
  );
}

export default App;
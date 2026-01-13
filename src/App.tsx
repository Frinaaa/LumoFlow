import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- SCREENS ---
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import AboutUsScreen from './screens/AboutUsScreen';
import SettingsScreen from './screens/SettingsScreen'; // Import the new screen
import authService from './services/authService';
import TerminalScreen from './screens/TerminalScreen';
import './styles/App.css';

function AppLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initFlow = async () => {
      // ⚠️ FORCE LOGOUT: Clear session so Login Screen ALWAYS appears after Splash
      await authService.logout(); 
      setIsAuthenticated(false);
    };
    initFlow();
  }, []);

  // 1. Splash Screen First
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // 2. Main Routing
  return (
    <Routes>
      <Route path="/signup" element={<SignUpScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/about" element={<AboutUsScreen />} />

      {/* LOGIN ROUTE */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <LoginScreen setIsAuthenticated={setIsAuthenticated} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* DASHBOARD ROUTE (Protected) */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <DashboardScreen />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
        {/* 2. ADD THIS ROUTE */}
<Route
  path="/settings"
  element={
    isAuthenticated ? (
      <SettingsScreen />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
      {/* ROOT REDIRECT */}
      {/* Redirects to Login because we forced logout above */}
      <Route 
        path="/" 
        element={<Navigate to="/login" replace />} 
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/terminal" element={isAuthenticated ? <TerminalScreen /> : <Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import authService from './services/authService';
import './styles/App.css';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import SignUpScreen from './screens/SignUpScreen';
import AboutUsScreen from './screens/AboutUsScreen';
// --- Dashboard Component ---
function AppContent() {
  return (
    <div className="app-container">
      <h1 className="main-text">LumoFlow Dashboard</h1>
      <button
        className="login-btn"
        style={{ width: '200px', marginTop: '20px' }}
        onClick={() => {
          authService.logout().then(() => window.location.reload());
        }}
      >
        Logout
      </button>
    </div>
  );
}

// --- Main Layout Logic ---
function AppLayout() {
  // 1. STATE: Start by showing the Splash Screen
  const [showSplash, setShowSplash] = useState(true);
  
  // 2. STATE: Track authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await authService.getToken();
      if (token) {
        setIsAuthenticated(true);
      }
      // CRITICAL: We do NOT set showSplash(false) here.
      // We wait for the user to click the button in SplashScreen.tsx
    };
    checkAuth();
  }, []);

  // 3. LOGIC: If showSplash is true, render ONLY the splash screen.
  // We pass a function "onComplete" that sets showSplash to false.
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // 4. LOGIC: Once Splash is gone, show the Router
  return (
    <Routes>
       <Route path="/signup" element={<SignUpScreen />} />
   
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <LoginScreen setIsAuthenticated={setIsAuthenticated} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <AppContent />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/about" element={<AboutUsScreen />} />
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
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import authService from './services/authService';
import './App.css';

function AppContent() {
  return (
    <div className="app-container">
      <h1 className="main-text">LumoFlow Dashboard</h1>
      <p className="subtitle">Main app content goes here</p>
    </div>
  );
}

function App() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = await authService.getToken();
      setIsAuthenticated(!!token);
      setIsReady(true);
    };
    
    checkAuth();
  }, []);

  if (!isReady) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen setIsAuthenticated={setIsAuthenticated} />} />
        <Route 
          path="/app" 
          element={isAuthenticated ? <AppContent /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/app" /> : <Navigate to="/splash" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;

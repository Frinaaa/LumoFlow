import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import authService from './services/authService';
import './styles/App.css';

function AppContent() {
  return (
    <div className="app-container">
      <h1 className="main-text">LumoFlow Dashboard</h1>
      <p className="subtitle">Welcome to the main application.</p>
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

// Create an inner component to handle the logic. 
// This allows us to use Router context if needed, and ensures SplashScreen is inside Router.
function AppLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      const token = await authService.getToken();
      if (token) {
        setIsAuthenticated(true);
      }

      // NOTE: We increased this to 3.5s to match the SplashScreen animation time (approx 3s).
      // If you want the "Enter" button in SplashScreen to control this, 
      // you would need to pass a prop to SplashScreen instead of using setTimeout.
      setTimeout(() => setIsReady(true), 3500);
    };

    initApp();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <Routes>
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
    </Routes>
  );
}

function App() {
  return (
    // Router must be at the very top level
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// --- SCREENS ---
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import AboutUsScreen from './screens/AboutUsScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthCallback from './pages/AuthCallback';
import authService from './services/authService';
import TerminalScreen from './screens/EditorScreen';
import CustomTitlebar from './components/CustomTitlebar';
import { EditorProvider, useEditor } from './context/EditorContext';
import './styles/App.css';
import GameSelectorScreen from './screens/GameSelectorScreen';
import LogicPuzzleScreen from './screens/PuzzleGameScreen'; 
import DebugRaceScreen from './screens/DebugRaceScreen';
import PredictGameScreen from './screens/PredictGameScreen';
import BugHuntScreen from './screens/BugHuntScreen';

function AppLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const editorState = useEditor();
  const location = useLocation();

  useEffect(() => {
    console.log('📍 Current route:', location.pathname);
    console.log('🔐 isAuthenticated:', isAuthenticated);
    console.log('⏳ isLoading:', isLoading);
  }, [location.pathname, isAuthenticated, isLoading]);

  useEffect(() => {
    const initFlow = async () => {
      // 🟢 CHECK FOR EXISTING SESSION instead of forcing logout
      const token = localStorage.getItem('authToken');
      const userInfo = localStorage.getItem('user_info');
      
      if (token && userInfo) {
        try {
          // Verify token is still valid by fetching profile
          const user = JSON.parse(userInfo);
          const res = await authService.getProfile();
          if (res.success) {
            setIsAuthenticated(true);
          } else {
            // Token expired, clear session
            await authService.logout();
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error("Session check failed:", err);
          await authService.logout();
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    initFlow();
  }, []);

  // 1. Splash Screen First
  if (showSplash) {
    return (
      <>
        <CustomTitlebar />
        <SplashScreen onComplete={() => setShowSplash(false)} />
      </>
    );
  }

  // 2. Loading session check
  if (isLoading) {
    return (
      <>
        <CustomTitlebar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, background: '#0a0e27' }}>
          <div style={{ color: '#00f2ff', fontSize: '18px' }}>Restoring session...</div>
        </div>
      </>
    );
  }

  // 3. Main Routing
  return (
    <>
      <CustomTitlebar />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Routes>
          {/* Auth Callbacks */}
          <Route path="/auth/google/callback" element={<AuthCallback />} />
          <Route path="/auth/github/callback" element={<AuthCallback />} />

          {/* Public Routes */}
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route path="/about" element={<AboutUsScreen />} />

          {/* Login Route */}
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

          {/* Protected Routes */}
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

          <Route
            path="/editor"
            element={
              isAuthenticated ? (
                <TerminalScreen />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/terminal"
            element={
              isAuthenticated ? (
                <Navigate to="/editor" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        <Route
            path="/games"
            element={
              isAuthenticated ? (
                <GameSelectorScreen />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route 
  path="/games/debug" 
  element={isAuthenticated ? <DebugRaceScreen /> : <Navigate to="/login" replace />} 
/>
<Route path="/games/bughunt" element={isAuthenticated ? <BugHuntScreen /> : <Navigate to="/login" replace />} />
<Route 
  path="/games/predict" 
  element={isAuthenticated ? <PredictGameScreen /> : <Navigate to="/login" replace />} 
/>
<Route
  path="/games/puzzle"
  element={isAuthenticated ? <LogicPuzzleScreen /> : <Navigate to="/login" replace />}
/>
          {/* Root Redirect */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />

          {/* Catch-all - must be last */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <EditorProvider>
        <AppLayout />
      </EditorProvider>
    </Router>
  );
}

export default App;
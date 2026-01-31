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
import { EditorLayout } from './editor';
import { EditorProvider } from './context/EditorContext';
import './styles/App.css';
import GameSelectorScreen from './screens/GameSelectorScreen';
import LogicPuzzleScreen from './screens/PuzzleGameScreen';
import DebugRaceScreen from './screens/DebugRaceScreen';
import PredictGameScreen from './screens/PredictGameScreen';
import BugHuntScreen from './screens/BugHuntScreen';
import ErrorMatchScreen from './screens/ErrorMatchScreen';
import SimpleTitlebar from './components/SimpleTitlebar';

function AppLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const initFlow = async () => {
      const token = localStorage.getItem('authToken');
      const userInfo = localStorage.getItem('user_info');

      if (token && userInfo) {
        try {
          const res = await authService.getProfile();
          if (res.success && res.user) {
            setIsAuthenticated(true);
          } else if (userInfo) {
            // If getProfile fails but we have cached user data, still authenticate
            console.log('⚠️ Using cached authentication');
            setIsAuthenticated(true);
          } else {
            await authService.logout();
            setIsAuthenticated(false);
          }
        } catch (err) {
          // If error but we have cached data, still authenticate
          if (userInfo) {
            console.log('⚠️ Error during init, using cached authentication');
            setIsAuthenticated(true);
          } else {
            await authService.logout();
            setIsAuthenticated(false);
          }
        }
      }
      setIsLoading(false);
    };
    initFlow();
  }, []);

  // 1. Splash Screen
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // 2. Loading session
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#050508' }}>
        <div style={{ color: '#00f2ff', fontSize: '18px', fontFamily: 'Orbitron' }}>INITIALIZING...</div>
      </div>
    );
  }

  // 3. Main Routing 
  const isEditor = location.pathname.startsWith('/editor');

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#050508' }}>
      {!isEditor && <SimpleTitlebar />}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        paddingTop: !isEditor ? '35px' : '0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Routes>
          <Route path="/auth/google/callback" element={<AuthCallback />} />
          <Route path="/auth/github/callback" element={<AuthCallback />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route path="/about" element={<AboutUsScreen />} />

          <Route
            path="/login"
            element={!isAuthenticated ? <LoginScreen setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={isAuthenticated ? <DashboardScreen /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/settings"
            element={isAuthenticated ? <SettingsScreen /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/editor"
            element={isAuthenticated ? (
              <EditorProvider>
                <EditorLayout />
              </EditorProvider>
            ) : (
              <Navigate to="/login" replace />
            )}
          />

          <Route
            path="/games"
            element={isAuthenticated ? <GameSelectorScreen /> : <Navigate to="/login" replace />}
          />

          <Route path="/games/debug" element={isAuthenticated ? <DebugRaceScreen /> : <Navigate to="/login" replace />} />
          <Route path="/games/error" element={isAuthenticated ? <ErrorMatchScreen /> : <Navigate to="/login" replace />} />
          <Route path="/games/bughunt" element={isAuthenticated ? <BugHuntScreen /> : <Navigate to="/login" replace />} />
          <Route path="/games/predict" element={isAuthenticated ? <PredictGameScreen /> : <Navigate to="/login" replace />} />
          <Route path="/games/puzzle" element={isAuthenticated ? <LogicPuzzleScreen /> : <Navigate to="/login" replace />} />

          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
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
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Initializing authentication...');

  useEffect(() => {
    const processAuth = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus(`Authentication failed: ${error}`);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code) {
        setStatus('No authentication code received.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const isGoogle = window.location.hash.includes('google') || window.location.pathname.includes('google');
        setStatus(`Connecting with ${isGoogle ? 'Google' : 'GitHub'}...`);

        // Exchange code for token
        const res = await (isGoogle ? authService.googleOAuth(code) : authService.githubOAuth(code));

        if (res.success) {
          setStatus('Successfully authenticated! Redirecting...');
          // Redirect to editor to continue work
          setTimeout(() => navigate('/editor'), 1000);
        } else {
          setStatus(`Login failed: ${res.msg}`);
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err: any) {
        console.error('AuthCallback error:', err);
        setStatus(`Error: ${err.message || 'Unknown error occurred'}`);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processAuth();
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#0c0c0f',
      color: '#fff',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '3px solid rgba(0, 242, 255, 0.1)',
        borderTopColor: '#00f2ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '24px'
      }} />
      <div style={{ fontSize: '16px', color: '#ccc' }}>{status}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AuthCallback;

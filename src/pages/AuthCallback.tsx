import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (code) {
      // Determine which provider based on current URL
      const provider = window.location.pathname.includes('google') ? 'google' : 'github';
      
      // Send code to Electron main process via IPC
      window.api.sendAuthCode?.(provider, code);

      // Close this window after a short delay
      setTimeout(() => {
        window.close();
      }, 500);
    } else if (error) {
      // Send error to Electron main process
      const provider = window.location.pathname.includes('google') ? 'google' : 'github';
      window.api.sendAuthError?.(provider, error);
      
      setTimeout(() => {
        window.close();
      }, 500);
    }
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#0a0e27',
      color: '#00f2ff',
      fontSize: '18px'
    }}>
      <div>Authenticating... Please wait</div>
    </div>
  );
};

export default AuthCallback;

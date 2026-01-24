import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/App.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(<App />);
} catch (error) {
  console.error("Application crashed:", error);
  // Fallback UI if app crashes immediately
  root.render(
    <div style={{ color: 'red', padding: '20px' }}>
      <h1>Application Crashed</h1>
      <pre>{JSON.stringify(error, null, 2)}</pre>
    </div>
  );
}
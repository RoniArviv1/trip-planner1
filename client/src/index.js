import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

// Create the root for the app inside the element with id="root"
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* BrowserRouter provides client-side routing */}
    <BrowserRouter>
      {/* AuthProvider supplies the authenticated user context to the entire app */}
      <AuthProvider>
        {/* Main App component */}
        <App />
        <Toaster
          position="top-right" 
          toastOptions={{
            duration: 4000, // default toast duration
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

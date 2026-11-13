import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { apiFetch } from './api/client';
import Login from './pages/Login';
import InvestorDashboard from './pages/InvestorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProjectDetail from './pages/ProjectDetail';
import ShowcaseExplore from './components/ShowcaseExplore';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-redhill-ivory">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-redhill-red"></div>
  </div>
);

function getStoredToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('redhill_auth_token') : null;
  } catch {
    return null;
  }
}

function clearStoredToken(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('redhill_auth_token');
    }
  } catch {
    // ignore storage errors in private browsing
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(getStoredToken()));

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (active) setLoading(false);
    }, 6000);

    apiFetch('/api/me')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active) return;
        if (data && data.id && data.role) {
          setUser(data);
        } else {
          clearStoredToken();
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed', err);
    }
    clearStoredToken();
    setUser(null);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to={user.role === 'investor' ? '/dashboard' : '/admin'} /> : <Login onLogin={setUser} />} 
        />

        <Route 
          path="/login" 
          element={user ? <Navigate to={user.role === 'investor' ? '/dashboard' : '/admin'} /> : <Login onLogin={setUser} />} 
        />
        
        <Route 
          path="/dashboard" 
          element={user?.role === 'investor' ? <InvestorDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/project/:id" 
          element={user ? <ProjectDetail user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/explore" 
          element={user ? <ShowcaseExplore user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/admin" 
          element={user && user.role !== 'investor' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

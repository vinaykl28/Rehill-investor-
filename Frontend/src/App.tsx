import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { apiFetch } from './api/client';
import Login from './pages/Login';

// Route-level code splitting for enhanced performance and fast initial page load
const InvestorDashboard = lazy(() => import('./pages/InvestorDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ShowcaseExplore = lazy(() => import('./components/ShowcaseExplore'));

const LoadingScreen = ({ wakingUp = false }: { wakingUp?: boolean }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-rh-ivory px-6 text-center">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rh-botanical" />
    {wakingUp && (
      <p className="text-xs uppercase tracking-[0.2em] text-rh-botanical/70 font-medium">
        Connecting to Redhill Portal…
      </p>
    )}
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
  const [wakingUp, setWakingUp] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const wakeTimer = window.setTimeout(() => {
      if (active) setWakingUp(true);
    }, 3000);
    const timeout = window.setTimeout(() => {
      if (active) setLoading(false);
    }, 25000);

    apiFetch('/api/me', { timeoutMs: 25000 })
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
        window.clearTimeout(wakeTimer);
        window.clearTimeout(timeout);
      });

    const onUnauthorized = () => {
      clearStoredToken();
      setUser(null);
    };
    window.addEventListener('redhill:unauthorized', onUnauthorized);

    return () => {
      active = false;
      window.clearTimeout(wakeTimer);
      window.clearTimeout(timeout);
      window.removeEventListener('redhill:unauthorized', onUnauthorized);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/logout', { method: 'POST' });
    } catch {
      // Proceed with local sign-out even if network is offline
    }
    clearStoredToken();
    setUser(null);
  };

  if (loading) {
    return <LoadingScreen wakingUp={wakingUp} />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to={user.role === 'investor' ? (user.has_investments === false ? '/explore' : '/dashboard') : '/admin'} replace />
              ) : (
                <Login onLogin={setUser} />
              )
            } 
          />

          <Route 
            path="/login" 
            element={
              user ? (
                <Navigate to={user.role === 'investor' ? (user.has_investments === false ? '/explore' : '/dashboard') : '/admin'} replace />
              ) : (
                <Login onLogin={setUser} />
              )
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              !user ? (
                <Navigate to="/login" replace />
              ) : user.role !== 'investor' ? (
                <Navigate to="/admin" replace />
              ) : user.has_investments === false ? (
                <Navigate to="/explore" replace />
              ) : (
                <InvestorDashboard user={user} onLogout={handleLogout} />
              )
            } 
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
      </Suspense>
    </BrowserRouter>
  );
}

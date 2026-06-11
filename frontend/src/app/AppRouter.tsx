import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { checkApiHealth } from '../core/network/api';
import { useAuthStore } from '../core/store/authStore';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { LoginPage } from '../features/auth/LoginPage';
import { PlayerDashboard } from '../features/player/PlayerDashboard';
import { PlayPage } from '../features/wheel/PlayPage';

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'player' | 'admin';
}) {
  const currentRole = useAuthStore((s) => s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return <p style={{ color: '#fff', textAlign: 'center', padding: '2rem' }}>Loading…</p>;
  }

  if (currentRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function HomeRedirect() {
  const role = useAuthStore((s) => s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return <p style={{ color: '#fff', textAlign: 'center', padding: '2rem' }}>Loading…</p>;
  }

  if (role === 'player') return <Navigate to="/play" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

export function AppRouter() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [apiDown, setApiDown] = useState(false);

  useEffect(() => {
    hydrate();
    void checkApiHealth().then((ok) => setApiDown(!ok));
  }, [hydrate]);

  if (apiDown) {
    return (
      <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '2rem' }}>
        API not reachable — run: docker compose up -d && npm run dev
      </p>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/play"
          element={
            <ProtectedRoute role="player">
              <PlayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="player">
              <PlayerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

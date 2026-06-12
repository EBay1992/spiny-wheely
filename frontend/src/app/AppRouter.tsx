import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { checkApiHealth } from "../core/network/api";
import { useAuthStore } from "../core/store/authStore";
import { AdminDashboard } from "../features/admin/AdminDashboard";
import { ErrorFallbackPage } from "../features/errors/ErrorFallbackPage";
import { NotFoundPage } from "../features/errors/NotFoundPage";
import { ServiceUnavailablePage } from "../features/errors/ServiceUnavailablePage";
import { UnauthorizedPage } from "../features/errors/UnauthorizedPage";
import { LoginPage } from "../features/auth/LoginPage";
import { PlayerDashboard } from "../features/player/PlayerDashboard";
import { PlayPage } from "../features/wheel/PlayPage";
import { AppLoadingScreen } from "../shared/components/AppLoadingScreen";

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "player" | "admin";
}) {
  const currentRole = useAuthStore((s) => s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const location = useLocation();

  if (!isHydrated) {
    return <AppLoadingScreen />;
  }

  if (!currentRole) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (currentRole !== role) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ requiredRole: role, from: location.pathname }}
      />
    );
  }

  return children;
}

function HomeRedirect() {
  const role = useAuthStore((s) => s.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return <AppLoadingScreen />;
  }

  if (role === "player") return <Navigate to="/play" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function AppRouter() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [apiDown, setApiDown] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      hydrate();
    } catch (error) {
      setBootstrapError(
        error instanceof Error ? error : new Error("Failed to restore session"),
      );
    }

    void checkApiHealth()
      .then((ok) => setApiDown(!ok))
      .catch(() => setApiDown(true));
  }, [hydrate]);

  if (bootstrapError) {
    return (
      <ErrorFallbackPage
        error={bootstrapError}
        onRetry={() => {
          setBootstrapError(null);
          window.location.reload();
        }}
      />
    );
  }

  if (apiDown) {
    return <ServiceUnavailablePage />;
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

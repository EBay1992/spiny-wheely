import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../core/store/authStore";
import {
  Button,
  DashboardMain,
  DashboardShell,
  NavBar,
  NavLink,
  NavLinks,
} from "./DashboardStyles";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "player" | "admin";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const location = useLocation();
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);

  return (
    <DashboardShell>
      <NavBar>
        <NavLinks>
          {role === "player" ? (
            <>
              <NavLink
                as={Link}
                to="/play"
                $active={location.pathname === "/play"}
              >
                Play
              </NavLink>
              <NavLink
                as={Link}
                to="/dashboard"
                $active={location.pathname === "/dashboard"}
              >
                My Dashboard
              </NavLink>
            </>
          ) : (
            <NavLink
              as={Link}
              to="/admin"
              $active={location.pathname === "/admin"}
            >
              Operator Console
            </NavLink>
          )}
        </NavLinks>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{email}</span>
          <Button
            $variant="ghost"
            type="button"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            Sign out
          </Button>
        </div>
      </NavBar>
      <DashboardMain>{children}</DashboardMain>
    </DashboardShell>
  );
}

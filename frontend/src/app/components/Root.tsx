import { Outlet, Navigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export function Root() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center"
        style={{ background: "var(--t-app-bg)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(201,168,76,0.6)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: "var(--t-app-bg)" }}
    >
      {/* Background decoration */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "var(--t-decoration)" }}
      />

      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

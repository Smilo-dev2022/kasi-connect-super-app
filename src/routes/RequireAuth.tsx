import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";

export const RequireAuth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
};

export const PublicOnly = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (user) return <Navigate to={(location.state as any)?.from?.pathname || "/app"} replace />;
  return <Outlet />;
};

export default RequireAuth;


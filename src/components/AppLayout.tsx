import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navigation from "./Navigation";
import { useEffect } from "react";
import { getStoredAuthToken } from "@/lib/devAuth";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const token = getStoredAuthToken();
    const jwtOnly = ((import.meta as any)?.env?.VITE_JWT_ONLY as string | undefined) === "true";
    if (jwtOnly && !token && !location.pathname.startsWith("/admin")) {
      navigate("/app/security");
    }
  }, [location, navigate]);
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <Navigation />
    </div>
  );
};

export default AppLayout;
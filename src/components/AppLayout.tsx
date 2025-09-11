import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <Navigation />
    </div>
  );
};

export default AppLayout;
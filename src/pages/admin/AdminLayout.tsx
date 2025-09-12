import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, ShieldCheck } from "lucide-react";

const AdminLayout = () => {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:block border-r bg-card">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold">Admin</h1>
          <p className="text-sm text-muted-foreground">Control panel</p>
        </div>
        <nav className="p-2 space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "hover:bg-accent"
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/wards"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "hover:bg-accent"
              }`
            }
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Ward verification</span>
          </NavLink>
        </nav>
      </aside>
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;


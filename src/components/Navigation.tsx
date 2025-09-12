import { NavLink } from "react-router-dom";
import { Home, MessageCircle, Wallet, Users, Calendar, Store, ShieldCheck } from "lucide-react";

const Navigation = () => {
  const navItems = [
    { icon: Home, label: "Home", path: "/app" },
    { icon: MessageCircle, label: "Chats", path: "/app/chats" },
    { icon: Wallet, label: "Wallet", path: "/app/wallet" },
    { icon: Users, label: "Rooms", path: "/app/rooms" },
    { icon: Calendar, label: "Events", path: "/app/events" },
    { icon: Store, label: "Business", path: "/app/business" },
    { icon: ShieldCheck, label: "Admin", path: "/app/admin" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-accent"
              }`
            }
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
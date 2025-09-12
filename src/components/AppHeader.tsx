import { Bell, Search, Menu, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  title: string;
  showNotifications?: boolean;
  showSearch?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

const AppHeader = ({ title, showNotifications = true, showSearch = false, showBack = false, onBack }: AppHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (onBack ? onBack() : navigate(-1))}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {showSearch && (
          <Button variant="ghost" size="icon">
            <Search className="w-5 h-5" />
          </Button>
        )}
        
        {showNotifications && (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary">
              3
            </Badge>
          </Button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
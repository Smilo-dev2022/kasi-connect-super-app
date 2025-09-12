import { Bell, Search, Menu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface AppHeaderProps {
  title: string;
  showNotifications?: boolean;
  showSearch?: boolean;
}

const AppHeader = ({ title, showNotifications = true, showSearch = false }: AppHeaderProps) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language?.startsWith("zu") ? "en" : "zu";
    i18n.changeLanguage(next);
  };

  return (
    <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {(import.meta as any).env?.VITE_BETA === '1' && (
          <Badge variant="outline" className="ml-2">Beta</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showSearch && (
          <Button variant="ghost" size="icon">
            <Search className="w-5 h-5" />
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-1">
          <Globe className="w-4 h-4" />
          {i18n.language?.startsWith("zu") ? "Zulu" : "English"}
        </Button>
        
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
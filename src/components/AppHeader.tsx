import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AppHeaderProps {
  title: string;
  showNotifications?: boolean;
  showSearch?: boolean;
}

const AppHeader = ({ title, showNotifications = true, showSearch = false }: AppHeaderProps) => {
  const { i18n, t } = useTranslation("common");
  const currentLang = i18n.language?.split('-')[0] || 'en';

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    try {
      window.localStorage.setItem('i18nextLng', value);
    } catch {
      // Ignore storage write failures (e.g., private mode)
    }
  };

  return (
    <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Select value={currentLang} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder={t("selectors.language")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="zu">Zulu</SelectItem>
          </SelectContent>
        </Select>
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
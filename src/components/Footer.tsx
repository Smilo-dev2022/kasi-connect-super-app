import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Phone, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation("common");
  return (
    <footer className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        {/* Newsletter Section */}
        <Card className="p-8 mb-12 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              {t("footer.stayConnected")}
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              {t("footer.newsletterDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder={t("footer.emailPlaceholder")}
                className="flex-1 px-4 py-3 rounded-lg border-0 bg-white/90 text-foreground placeholder:text-muted-foreground"
              />
              <Button variant="hero" className="px-6 py-3">
                {t("actions.notifyMe")}
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h3 className="text-3xl font-bold text-white mb-4">{t("appName")}</h3>
            <p className="text-white/80 mb-6 leading-relaxed">
              {t("footer.brandDesc")}
            </p>
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="w-4 h-4" />
              <span>{t("footer.proudlySA")}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">{t("footer.platform")}</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#" className="hover:text-white transition-colors">{t("footer.links.communityChat")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("footer.links.stokvelManagement")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("footer.links.localBusiness")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("footer.links.safetyAlerts")}</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Get In Touch</h4>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>hello@kasilink.co.za</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+27 11 123 4567</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/70 text-sm">
              {t("footer.copyright")}
              <Heart className="w-4 h-4 inline text-red-400" />
            </p>
            <div className="flex gap-6 text-sm text-white/70">
              <a href="#" className="hover:text-white transition-colors">{t("footer.privacy")}</a>
              <a href="#" className="hover:text-white transition-colors">{t("footer.terms")}</a>
              <a href="#" className="hover:text-white transition-colors">{t("footer.guidelines")}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
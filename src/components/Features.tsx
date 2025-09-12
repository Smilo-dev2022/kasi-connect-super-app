import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, CreditCard, Shield, ShoppingBag, Calendar, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: MessageSquare,
      title: t("features.list.chatTitle"),
      description: t("features.list.chatDesc"),
      color: "primary"
    },
    {
      icon: CreditCard,
      title: t("features.list.stokvelTitle"),
      description: t("features.list.stokvelDesc"),
      color: "community"
    },
    {
      icon: ShoppingBag,
      title: t("features.list.businessTitle"),
      description: t("features.list.businessDesc"),
      color: "secondary"
    },
    {
      icon: Shield,
      title: t("features.list.safetyTitle"),
      description: t("features.list.safetyDesc"),
      color: "primary"
    },
    {
      icon: Calendar,
      title: t("features.list.eventsTitle"),
      description: t("features.list.eventsDesc"),
      color: "community"
    },
    {
      icon: TrendingUp,
      title: t("features.list.financeTitle"),
      description: t("features.list.financeDesc"),
      color: "secondary"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'community':
        return 'text-community bg-community/10 border-community/20';
      case 'secondary':
        return 'text-secondary bg-secondary/10 border-secondary/20';
      default:
        return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-background to-accent/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t("features.heading")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("features.subheading")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card/80 backdrop-blur-sm">
              <div className={`w-16 h-16 rounded-2xl ${getColorClasses(feature.color)} flex items-center justify-center mb-6 border-2`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-primary/10 via-community/10 to-secondary/10 rounded-3xl p-12 border-2 border-primary/20">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              {t("features.ctaHeading")}
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("features.ctaCopy")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                {t("features.getEarlyAccess")}
              </Button>
              <Button variant="community" size="lg" className="text-lg px-8 py-6">
                {t("features.startCommunity")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
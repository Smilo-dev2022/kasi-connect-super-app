import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Coins, Users } from "lucide-react";
import heroImage from "@/assets/hero-community.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-secondary/80" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tight">
              KasiLink
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-white/80 to-white/40 mx-auto rounded-full" />
          </div>

          {/* Main Tagline */}
          <h2 className="text-2xl md:text-4xl text-white/95 font-semibold mb-6 leading-tight">
            The Township Super-App for 
            <span className="block text-yellow-200">Chat • Money • Community</span>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            A safe, verified space where people can talk, pay, save, and grow together. 
            From stokvel payments to community safety alerts, KasiLink brings township life into one powerful app.
          </p>

          {/* Feature Cards Row */}
          <div className="grid md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
            <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Chat</h3>
              <p className="text-sm text-muted-foreground">Connect with your community safely</p>
            </Card>
            <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <Coins className="w-8 h-8 text-community mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Money</h3>
              <p className="text-sm text-muted-foreground">Stokvels, savings & payments</p>
            </Card>
            <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <Users className="w-8 h-8 text-secondary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Community</h3>
              <p className="text-sm text-muted-foreground">Safety alerts & local business</p>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6" onClick={() => window.location.href = '/signup'}>
              Join the Community
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-white/20 border-white/40 text-white hover:bg-white/30" onClick={() => window.location.href = '/login'}>
              I already have an account
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/10 to-transparent rounded-full -mb-16 -ml-16" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-yellow-200/20 to-transparent rounded-full -mt-24 -mr-24" />
    </section>
  );
};

export default Hero;
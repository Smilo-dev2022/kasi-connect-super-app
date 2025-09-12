import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Terms of Service" />
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-2">Agreement</h2>
          <p className="text-sm text-muted-foreground">
            By using KasiLink, you agree to our acceptable use, community standards, and local laws.
          </p>
        </Card>

        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Key Terms</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Do not misuse or harm others. No harassment or unlawful content.</li>
            <li>We may suspend accounts for abuse or legal compliance.</li>
            <li>Some features may be in beta and subject to change.</li>
            <li>Liability is limited to the extent permitted by law.</li>
          </ul>
        </Card>

        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Contact</h3>
          <p className="text-sm text-muted-foreground">legal@kasilink.co.za</p>
        </Card>
      </div>
    </div>
  );
};

export default Terms;


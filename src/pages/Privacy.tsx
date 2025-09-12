import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Privacy Policy" />
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-2">Overview</h2>
          <p className="text-sm text-muted-foreground">
            We respect your privacy and process personal information in accordance with POPIA and GDPR.
            We collect only what is necessary to provide the KasiLink services, and we do not sell your data.
          </p>
        </Card>

        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Key Points</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>End-to-end encryption for personal and group chats where enabled.</li>
            <li>Minimal metadata retained for delivery and abuse prevention.</li>
            <li>Clear consent for analytics and optional features.</li>
            <li>Access, correction, and deletion rights under POPIA/GDPR.</li>
          </ul>
        </Card>

        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Contact</h3>
          <p className="text-sm text-muted-foreground">
            For privacy requests, email dpo@kasilink.co.za. We respond within statutory timeframes.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;


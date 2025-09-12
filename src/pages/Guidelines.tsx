import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";

const Guidelines = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Community Guidelines" />
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-2">Safety & Respect</h2>
          <p className="text-sm text-muted-foreground">
            KasiLink is for everyone. Treat others with respect. Report harmful content.
          </p>
        </Card>

        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">What’s Not Allowed</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Hate speech, threats, harassment, or incitement to violence.</li>
            <li>Fraud, scams, or illegal financial activity.</li>
            <li>Sharing private information without consent.</li>
          </ul>
        </Card>

        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Reporting</h3>
          <p className="text-sm text-muted-foreground">
            Use in-app reporting tools or email safety@kasilink.co.za for urgent issues.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Guidelines;


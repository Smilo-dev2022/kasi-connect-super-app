import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Privacy Policy" />
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h1 className="text-2xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-4">
            We respect your privacy. This policy explains what data we process and why.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li>We collect only what is necessary to provide the service.</li>
            <li>End-to-end encryption is planned; today we relay ciphertext messages.</li>
            <li>Analytics and logs are minimized and retained for limited periods.</li>
            <li>You can request deletion of your account and related data.</li>
            <li>Contact: privacy@yourcompany.example</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}


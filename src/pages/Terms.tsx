import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Terms of Service" />
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h1 className="text-2xl font-bold mb-3">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-4">
            By using iKasiLink, you agree to these terms.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li>Use the app lawfully and respect others.</li>
            <li>Do not share harmful, illegal, or abusive content.</li>
            <li>We may update terms and will indicate changes on this page.</li>
            <li>Disputes governed by South African law.</li>
            <li>Contact: legal@yourcompany.example</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}


import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { hasConsented, readConsent, writeConsent } from "@/lib/utils";

const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    writeConsent({ analytics: true, marketing: true, functional: true });
    setVisible(false);
  };

  const save = () => {
    writeConsent({ analytics, marketing, functional: true });
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <Card className="p-4 bg-white border-border shadow-xl max-w-3xl mx-auto">
        <div className="flex flex-col gap-3">
          <div>
            <h4 className="font-semibold text-foreground">Your privacy on KasiLink</h4>
            <p className="text-sm text-muted-foreground">
              We use necessary cookies to run the app, and optional analytics/marketing only with your consent.
              Read our <a className="underline" href="/privacy">Privacy Policy</a>.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="analytics" checked={analytics} onCheckedChange={(v) => setAnalytics(Boolean(v))} />
              <label htmlFor="analytics" className="text-sm">Analytics</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="marketing" checked={marketing} onCheckedChange={(v) => setMarketing(Boolean(v))} />
              <label htmlFor="marketing" className="text-sm">Marketing</label>
            </div>
            <div className="flex items-center gap-2 opacity-70">
              <Checkbox id="functional" checked readOnly />
              <label htmlFor="functional" className="text-sm">Functional (required)</label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={save}>Save</Button>
            <Button variant="default" onClick={acceptAll}>Accept All</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConsentBanner;


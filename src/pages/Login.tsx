import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const onSend = () => {
    if (!phone.trim()) return;
    setStep("otp");
  };
  const onVerify = () => {
    if (!otp.trim()) return;
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-card/80 backdrop-blur-sm">
        <h1 className="text-xl font-semibold mb-2">Login</h1>
        {step === "phone" ? (
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">Phone number</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +27 82 123 4567" />
            <Button className="w-full" onClick={onSend} disabled={!phone.trim()}>Continue</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">One-time passcode</label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
            <Button className="w-full" onClick={onVerify} disabled={!otp.trim()}>Verify</Button>
          </div>
        )}
        <div className="mt-4 text-xs text-muted-foreground">By continuing you agree to our <a className="underline" href="/terms">Terms</a> and <a className="underline" href="/privacy">Privacy Policy</a>.</div>
      </Card>
    </div>
  );
}


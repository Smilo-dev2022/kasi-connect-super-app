import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

const Signup = () => {
  const { startSignup, verifyOtp, resendOtp } = useAuth();
  const [step, setStep] = React.useState<"details" | "otp">("details");
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const navigate = useNavigate();

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await startSignup(phone, name);
      toast.success(`OTP sent to ${res.maskedDestination}`);
      setStep("otp");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await verifyOtp(otp);
      toast.success("Account created");
      navigate("/app", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Invalid OTP");
    } finally {
      setSending(false);
    }
  };

  const onResend = async () => {
    try {
      const res = await resendOtp();
      toast.success(`OTP resent to ${res.maskedDestination}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground">We'll verify your phone with an OTP</p>
        </div>

        {step === "details" && (
          <form onSubmit={onSend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +27 62 123 4567" required />
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              Send OTP
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={onVerify} className="space-y-4">
            <div className="space-y-2">
              <Label>Enter OTP</Label>
              <InputOTP maxLength={6} value={otp} onChange={(val) => setOtp(val)}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("details")}>Back</Button>
              <Button type="submit" className="flex-1" disabled={sending || otp.length !== 6}>Verify</Button>
            </div>
            <Button type="button" variant="ghost" onClick={onResend} disabled={sending}>
              Resend code
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Signup;


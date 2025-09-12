import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/authClient";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const startSignup = async () => {
    setError(null);
    setLoading(true);
    try {
      const resp = await authClient.signup({ email: email || undefined, phone: phone || undefined, name: name || undefined });
      setUserId(resp.userId);
      setDevCode(resp.devCode || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      await authClient.verifyOtp({ userId, code, purpose: "signup" });
      navigate("/app");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-accent/30">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h1 className="text-xl font-bold">Create account</h1>
        {!userId ? (
          <div className="space-y-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button disabled={loading} onClick={startSignup} className="w-full">Continue</Button>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
        ) : (
          <div className="space-y-3">
            <Input placeholder="Enter 6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
            {devCode && <div className="text-xs text-muted-foreground">Dev code: {devCode}</div>}
            <Button disabled={loading} onClick={verify} className="w-full">Verify</Button>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Signup;


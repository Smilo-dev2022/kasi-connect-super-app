import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/authClient";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [purpose, setPurpose] = useState<"login" | "signup">("login");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const startLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const resp = await authClient.login({ email: email || undefined, phone: phone || undefined });
      setUserId(resp.userId);
      setPurpose("login");
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
      await authClient.verifyOtp({ userId, code, purpose });
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
        <h1 className="text-xl font-bold">Login</h1>
        {!userId ? (
          <div className="space-y-3">
            <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button disabled={loading} onClick={startLogin} className="w-full">Continue</Button>
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

export default Login;


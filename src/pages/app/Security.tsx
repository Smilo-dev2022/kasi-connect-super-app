import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, FileDown, Trash2 } from "lucide-react";

type ConsentSettings = {
  processingConsent: boolean;
  analyticsConsent: boolean;
  marketingConsent: boolean;
};

const defaultConsent: ConsentSettings = {
  processingConsent: true,
  analyticsConsent: false,
  marketingConsent: false
};

const STORAGE_KEYS = {
  consent: "kaslink.consent",
  e2eeDraft: "kaslink.e2ee.draft"
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 150000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(bytes: Uint8Array): string {
  if (typeof window === "undefined") return "";
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const Security = () => {
  const { toast } = useToast();

  const [consent, setConsent] = useState<ConsentSettings>(defaultConsent);
  const [savingConsent, setSavingConsent] = useState(false);

  const [passphrase, setPassphrase] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [saltB64, setSaltB64] = useState("");
  const [ivB64, setIvB64] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.consent);
      if (saved) setConsent(JSON.parse(saved));
      const draft = localStorage.getItem(STORAGE_KEYS.e2eeDraft);
      if (draft) {
        const { pass, text } = JSON.parse(draft);
        if (typeof pass === "string") setPassphrase(pass);
        if (typeof text === "string") setPlaintext(text);
      }
    } catch (error) {
      // Silently ignore localStorage errors
      console.debug('Failed to parse E2EE draft from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.e2eeDraft,
        JSON.stringify({ pass: passphrase, text: plaintext })
      );
    } catch (error) {
      // Silently ignore localStorage errors
      console.debug('Failed to save E2EE draft to localStorage:', error);
    }
  }, [passphrase, plaintext]);

  const canUseWebCrypto = useMemo(() => typeof window !== "undefined" && !!window.crypto?.subtle, []);

  const handleSaveConsent = async () => {
    setSavingConsent(true);
    try {
      localStorage.setItem(STORAGE_KEYS.consent, JSON.stringify(consent));
      toast({ title: "Preferences saved", description: "Your privacy settings were updated." });
    } catch (e) {
      toast({ title: "Could not save settings", description: String(e), variant: "destructive" });
    } finally {
      setSavingConsent(false);
    }
  };

  const handleExportData = () => {
    try {
      const blob = new Blob([
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            consent,
            notes: "Demo export. Replace with your actual user data when backend is connected."
          },
          null,
          2
        )
      ], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kaslink-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Export failed", description: String(e), variant: "destructive" });
    }
  };

  const handleDeleteData = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.consent);
      localStorage.removeItem(STORAGE_KEYS.e2eeDraft);
      setConsent(defaultConsent);
      setPassphrase("");
      setPlaintext("");
      setCiphertext("");
      setSaltB64("");
      setIvB64("");
      toast({ title: "Local data deleted", description: "Sample data has been removed from this device." });
    } catch (e) {
      toast({ title: "Deletion failed", description: String(e), variant: "destructive" });
    }
  };

  const handleEncrypt = async () => {
    if (!canUseWebCrypto) {
      toast({ title: "WebCrypto not supported", description: "Your browser does not support SubtleCrypto.", variant: "destructive" });
      return;
    }
    if (!passphrase) {
      toast({ title: "Passphrase required", description: "Enter a passphrase to derive an encryption key.", variant: "destructive" });
      return;
    }
    if (!plaintext) {
      toast({ title: "Nothing to encrypt", description: "Write some text to encrypt." });
      return;
    }
    setIsEncrypting(true);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKeyFromPassphrase(passphrase, salt);
      const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(plaintext));
      const cipher = new Uint8Array(cipherBuf);
      setCiphertext(toBase64(cipher));
      setSaltB64(toBase64(salt));
      setIvB64(toBase64(iv));
      toast({ title: "Encrypted", description: "Your message is now end-to-end encrypted (demo)." });
    } catch (e) {
      toast({ title: "Encryption failed", description: String(e), variant: "destructive" });
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecrypt = async () => {
    if (!canUseWebCrypto) return;
    if (!passphrase || !ciphertext || !saltB64 || !ivB64) {
      toast({ title: "Missing data", description: "Provide passphrase, salt, IV and ciphertext." });
      return;
    }
    setIsDecrypting(true);
    try {
      const key = await deriveKeyFromPassphrase(passphrase, fromBase64(saltB64));
      const plainBuf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(ivB64) },
        key,
        fromBase64(ciphertext)
      );
      setPlaintext(textDecoder.decode(plainBuf));
      toast({ title: "Decrypted", description: "Message successfully decrypted." });
    } catch (e) {
      toast({ title: "Decryption failed", description: "Check your passphrase, salt or IV.", variant: "destructive" });
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Security & Compliance" />

      <div className="p-4 space-y-6">
        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl border-2 border-primary/20 bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-1">Your privacy is our priority</h2>
              <p className="text-sm text-muted-foreground mb-2">
                This demo shows how end-to-end encryption works on-device, and how you manage consent
                under POPIA and GDPR. No text you enter here leaves your device.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">POPIA-ready</Badge>
                <Badge variant="outline">GDPR-friendly</Badge>
                <Badge variant="outline">E2EE demo</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">End-to-End Encryption (demo)</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Passphrase</label>
              <Input
                type="password"
                placeholder="Enter a passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Salt (base64)</label>
                <Input placeholder="Generated on encrypt" value={saltB64} onChange={(e) => setSaltB64(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">IV (base64)</label>
                <Input placeholder="Generated on encrypt" value={ivB64} onChange={(e) => setIvB64(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm text-muted-foreground mb-2">Plaintext</label>
            <Textarea rows={4} placeholder="Write a message to encrypt" value={plaintext} onChange={(e) => setPlaintext(e.target.value)} />
          </div>
          <div className="mt-4">
            <label className="block text-sm text-muted-foreground mb-2">Ciphertext (base64)</label>
            <Textarea rows={4} placeholder="Encrypted output will appear here" value={ciphertext} onChange={(e) => setCiphertext(e.target.value)} />
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button onClick={handleEncrypt} disabled={isEncrypting} className="sm:w-auto w-full">
              {isEncrypting ? "Encrypting..." : "Encrypt"}
            </Button>
            <Button variant="outline" onClick={handleDecrypt} disabled={isDecrypting} className="sm:w-auto w-full">
              {isDecrypting ? "Decrypting..." : "Decrypt"}
            </Button>
          </div>
          {!canUseWebCrypto && (
            <p className="text-xs text-destructive mt-3">Your browser does not support WebCrypto SubtleCrypto; E2EE demo is disabled.</p>
          )}
        </Card>

        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Consent & Data Controls</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox id="processing" checked={!!consent.processingConsent} onCheckedChange={(v) => setConsent((c) => ({ ...c, processingConsent: Boolean(v) }))} />
              <div>
                <label htmlFor="processing" className="font-medium text-foreground">Consent to processing</label>
                <p className="text-sm text-muted-foreground">Required to provide the service. POPIA s11/GDPR Art. 6(1)(b).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="analytics" checked={!!consent.analyticsConsent} onCheckedChange={(v) => setConsent((c) => ({ ...c, analyticsConsent: Boolean(v) }))} />
              <div>
                <label htmlFor="analytics" className="font-medium text-foreground">Analytics</label>
                <p className="text-sm text-muted-foreground">Optional performance metrics. Disabled by default.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="marketing" checked={!!consent.marketingConsent} onCheckedChange={(v) => setConsent((c) => ({ ...c, marketingConsent: Boolean(v) }))} />
              <div>
                <label htmlFor="marketing" className="font-medium text-foreground">Marketing</label>
                <p className="text-sm text-muted-foreground">Optional community offers and updates. Opt-in only.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={handleSaveConsent} disabled={savingConsent}>Save preferences</Button>
              <Button variant="outline" onClick={handleExportData}>
                <FileDown className="w-4 h-4 mr-2" /> Export my data
              </Button>
              <Button variant="destructive" onClick={handleDeleteData}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete local demo data
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-foreground mb-2">Compliance Notes</h3>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>E2EE ensures only intended recipients can read messages. Keys are derived on-device.</li>
            <li>POPIA: process minimal personal information, purpose-bound, with security safeguards.</li>
            <li>GDPR: lawfulness, transparency, data minimization, storage limitation, integrity, and confidentiality.</li>
            <li>Data subject rights: access, rectification, erasure, portability, objection. Use controls above.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Security;


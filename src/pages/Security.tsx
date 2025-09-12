import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateKeyPair, exportKeyPair, importPrivateKey, importPublicKey, deriveSharedSecret, deriveAesKey, encryptMessage, decryptMessage, ExportedKeyPair } from "@/lib/crypto";

const Security = () => {
  const [keys, setKeys] = useState<ExportedKeyPair | null>(null);
  const [algo, setAlgo] = useState<"X25519" | "P-256" | null>(null);
  const [testCipher, setTestCipher] = useState<string | null>(null);
  const [testPlain, setTestPlain] = useState<string | null>(null);

  const generate = async () => {
    const { keyPair, algo } = await generateKeyPair();
    const exported = await exportKeyPair(keyPair, algo);
    setKeys(exported);
    setAlgo(algo);
    try { localStorage.setItem("kasilink.e2ee.keys", JSON.stringify(exported)); } catch {}
  };

  const load = () => {
    try {
      const raw = localStorage.getItem("kasilink.e2ee.keys");
      if (!raw) return;
      const parsed = JSON.parse(raw) as ExportedKeyPair;
      setKeys(parsed);
      setAlgo(parsed.algorithm as any);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const testEncrypt = async () => {
    if (!keys || !algo) return;
    // Self-encrypt test: derive with own public/private
    const priv = await importPrivateKey(keys.privateKey, algo);
    const pub = await importPublicKey(keys.publicKey, algo);
    const secret = await deriveSharedSecret(priv, pub, algo);
    const aes = await deriveAesKey(secret);
    const sample = "Hello, E2EE!";
    const { iv, ciphertext } = await encryptMessage(aes, sample);
    setTestCipher(`${iv}:${ciphertext}`);
    const decrypted = await decryptMessage(aes, iv, ciphertext);
    setTestPlain(decrypted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Security & Encryption" />
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-2">End-to-End Encryption</h2>
          <p className="text-sm text-muted-foreground">
            Chats can be protected with end-to-end encryption. Keys are generated and stored on your device.
            We never see your private keys.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={generate}>Generate Keys</Button>
            <Button variant="outline" onClick={load}>Load From Device</Button>
            <Button variant="ghost" onClick={testEncrypt} disabled={!keys}>Self Test</Button>
          </div>
        </Card>

        {keys && (
          <Card className="p-6 bg-card/80 backdrop-blur-sm">
            <h3 className="font-semibold mb-2">Your Public Key</h3>
            <p className="text-xs break-all text-muted-foreground">Alg: {algo}</p>
            <p className="text-xs break-all text-muted-foreground">{keys.publicKey}</p>
          </Card>
        )}

        {testCipher && (
          <Card className="p-6 bg-card/80 backdrop-blur-sm">
            <h3 className="font-semibold mb-2">Self Test</h3>
            <p className="text-xs break-all text-muted-foreground">Cipher: {testCipher}</p>
            <p className="text-xs break-all text-muted-foreground">Decrypted: {testPlain}</p>
          </Card>
        )}

        <Card className="p-6 bg-card/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Compliance (POPIA & GDPR)</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Data minimisation and purpose limitation.</li>
            <li>On-device keys; no private keys on servers.</li>
            <li>Consent management for optional analytics/marketing.</li>
            <li>Right to access, correction, deletion; contact dpo@kasilink.co.za.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Security;


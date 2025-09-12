import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import * as fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const enableHttps = process.env.DEV_SSL === "1" || process.env.HTTPS === "true";
  const defaultKey = path.resolve(process.cwd(), "certs/localhost-key.pem");
  const defaultCert = path.resolve(process.cwd(), "certs/localhost.pem");
  const keyPath = process.env.DEV_SSL_KEY || defaultKey;
  const certPath = process.env.DEV_SSL_CERT || defaultCert;

  const server: Record<string, unknown> = {
    host: "::",
    port: 8080,
  };

  if (enableHttps && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    Object.assign(server, {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    });
  }

  return {
    server,
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

import dotenv from "dotenv";
import fs from "fs";

// Load environment from .env.linear (override to ensure latest value is used)
dotenv.config({ path: ".env.linear", override: true });

const sanitize = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  // strip surrounding single or double quotes if present
  const unquoted = trimmed.replace(/^['"]|['"]$/g, "");
  // strip an accidental Bearer prefix if present
  return unquoted.replace(/^Bearer\s+/i, "");
};

const resolveLinearKey = () => {
  const candidates = [
    "LINEAR_API_KEY",
    "LINEAR_PERSONAL_API_KEY",
    "LINEAR_TOKEN",
    "LINEAR_API_TOKEN",
    "LINEAR_KEY",
    "LINEAR",
    "VITE_LINEAR_API_KEY",
  ];

  for (const name of candidates) {
    const value = sanitize(process.env[name]);
    if (value && value.trim().length > 0) {
      return { key: value.trim(), name };
    }
  }

  // Fallback: scan all env vars for names containing LINEAR and values looking like Linear tokens (lin_...)
  for (const [name, value] of Object.entries(process.env)) {
    if (!name.toUpperCase().includes("LINEAR")) continue;
    if (!value) continue;
    const trimmed = String(sanitize(value)).trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith("lin_") || trimmed.startsWith("lin_api_")) {
      return { key: trimmed, name };
    }
  }

  // Last resort: if any LINEAR* has a value, use the first non-empty
  for (const [name, value] of Object.entries(process.env)) {
    if (!name.toUpperCase().includes("LINEAR")) continue;
    if (value && String(sanitize(value)).trim().length > 0) {
      return { key: String(sanitize(value)).trim(), name };
    }
  }

  // Ultimate fallback: accept any env var whose value looks like a Linear key
  for (const [name, value] of Object.entries(process.env)) {
    if (!value) continue;
    const trimmed = String(sanitize(value)).trim();
    if (trimmed.startsWith("lin_") || trimmed.startsWith("lin_api_")) {
      return { key: trimmed, name };
    }
  }

  return { key: null, name: null };
};

// Extra fallback: if dotenv did not populate, parse file manually
try {
  const { key } = resolveLinearKey();
  if (!key && fs.existsSync(".env.linear")) {
    const raw = fs.readFileSync(".env.linear", "utf8");
    const line = raw.split(/\n|\r\n?/).find((l) => /^\s*LINEAR_API_KEY\s*=/.test(l));
    if (line) {
      let value = line.replace(/^\s*LINEAR_API_KEY\s*=\s*/, "");
      // strip inline comments and trailing whitespace
      value = value.replace(/\s+#.*$/, "").replace(/[\r\n]+$/, "");
      // strip surrounding quotes
      value = value.replace(/^['"]|['"]$/g, "");
      if (value && value.trim()) {
        process.env.LINEAR_API_KEY = value.trim();
      }
    }
    // If still not set, attempt to find a token-like value anywhere in the file
    if (!process.env.LINEAR_API_KEY) {
      const tokenMatch = raw.match(/\b(lin_api_[A-Za-z0-9]+|lin_[A-Za-z0-9]+)\b/);
      if (tokenMatch && tokenMatch[0]) {
        process.env.LINEAR_API_KEY = tokenMatch[0];
      }
    }
  }
} catch {}

const { key: apiKey, name: keyName } = resolveLinearKey();

if (!apiKey) {
  console.error(
    "Linear API key not found. Set LINEAR_API_KEY in .env.linear or export it in your environment."
  );
  process.exit(1);
}

const endpoint = "https://api.linear.app/graphql";

const query = {
  query: "query Viewer { viewer { id name email } }",
  variables: {},
};

async function callLinear(authHeaderValue) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "kasi-connect-linear-check/1.0 (+https://linear.app)",
      Authorization: authHeaderValue,
    },
    body: JSON.stringify(query),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { ok: false, status: response.status, statusText: response.statusText, data: null, raw: text };
  }
  return { ok: response.ok && !data.errors, status: response.status, statusText: response.statusText, data };
}

async function main() {
  try {
    // Linear expects the API key directly in the Authorization header (no Bearer prefix)
    const maskedLen = apiKey ? apiKey.length : 0;
    const prefix = apiKey?.startsWith("lin_api_") || apiKey?.startsWith("lin_") ? "lin_*" : "unknown";
    console.log(`Using key ${keyName} (length=${maskedLen}, prefix=${prefix})`);

    let result = await callLinear(apiKey);

    if (!result.ok) {
      console.error("Failed to connect to Linear.\nStatus:", result.status, result.statusText);
      if (result.data && result.data.errors) {
        console.error("Errors:", JSON.stringify(result.data.errors, null, 2));
      } else if (result.data) {
        console.error("Response:", JSON.stringify(result.data, null, 2));
      } else {
        console.error("Response was not JSON or contained no data.");
      }
      console.error(`Tried Authorization header using variable: ${keyName}.`);
      process.exit(1);
    }

    const viewer = result.data?.data?.viewer;
    if (!viewer) {
      console.error("No viewer returned. Response:", JSON.stringify(result.data, null, 2));
      process.exit(1);
    }

    console.log("Connected to Linear as:", `${viewer.name} <${viewer.email}> (id: ${viewer.id})`);
    process.exit(0);
  } catch (error) {
    console.error("Error calling Linear API:", error);
    process.exit(1);
  }
}

await main();


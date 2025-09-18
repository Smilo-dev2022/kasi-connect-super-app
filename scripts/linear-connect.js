import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.linear", override: true });

const endpoint = "https://api.linear.app/graphql";

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
    const value = process.env[name];
    if (value && value.trim().length > 0) {
      return { key: value.trim(), name };
    }
  }
  for (const [name, value] of Object.entries(process.env)) {
    if (!name.toUpperCase().includes("LINEAR")) continue;
    if (!value) continue;
    const trimmed = String(value).trim();
    if (trimmed.startsWith("lin_") || trimmed.startsWith("lin_api_")) {
      return { key: trimmed, name };
    }
  }
  for (const [name, value] of Object.entries(process.env)) {
    if (!name.toUpperCase().includes("LINEAR")) continue;
    if (value && String(value).trim().length > 0) {
      return { key: String(value).trim(), name };
    }
  }
  for (const [name, value] of Object.entries(process.env)) {
    if (!value) continue;
    const trimmed = String(value).trim();
    if (trimmed.startsWith("lin_") || trimmed.startsWith("lin_api_")) {
      return { key: trimmed, name };
    }
  }
  return { key: null, name: null };
};

// Extra fallback: manual parse
try {
  const { key } = resolveLinearKey();
  if (!key && fs.existsSync(".env.linear")) {
    const raw = fs.readFileSync(".env.linear", "utf8");
    const line = raw.split(/\n|\r\n?/).find((l) => /^\s*LINEAR_API_KEY\s*=/.test(l));
    if (line) {
      let value = line.replace(/^\s*LINEAR_API_KEY\s*=\s*/, "");
      value = value.replace(/\s+#.*$/, "").replace(/[\r\n]+$/, "");
      value = value.replace(/^['"]|['"]$/g, "");
      if (value && value.trim()) {
        process.env.LINEAR_API_KEY = value.trim();
      }
    }
    if (!process.env.LINEAR_API_KEY) {
      const tokenMatch = raw.match(/\b(lin_api_[A-Za-z0-9]+|lin_[A-Za-z0-9]+)\b/);
      if (tokenMatch && tokenMatch[0]) {
        process.env.LINEAR_API_KEY = tokenMatch[0];
      }
    }
  }
} catch {}

function parseTeamKeyFromUrl(raw) {
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    // Expecting: /<org-slug>/team/<TEAMKEY>/...
    const teamIndex = parts.findIndex((p) => p === "team");
    if (teamIndex !== -1 && parts.length > teamIndex + 1) {
      return parts[teamIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

async function callLinear(authHeaderValue, body) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeaderValue,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { ok: false, status: response.status, statusText: response.statusText, data: null };
  }
  return { ok: response.ok && !data.errors, status: response.status, statusText: response.statusText, data };
}

async function main() {
  const { key: apiKey } = resolveLinearKey();
  if (!apiKey) {
    console.error("Linear API key not found in environment. Ensure .env.linear contains it.");
    process.exit(1);
  }

  const rawUrl = process.argv[2] || process.env.LINEAR_TEAM_URL;
  if (!rawUrl) {
    console.error("Provide a Linear team URL as an argument or set LINEAR_TEAM_URL.");
    process.exit(1);
  }

  const teamKey = parseTeamKeyFromUrl(rawUrl);
  if (!teamKey) {
    console.error("Could not parse team key from URL:", rawUrl);
    process.exit(1);
  }

  const query = {
    query:
      "query Teams($filter: TeamFilter) { teams(filter: $filter, first: 1) { nodes { id name key } } }",
    variables: { filter: { key: { eq: teamKey } } },
  };

  let result = await callLinear(apiKey, query);
  if (!result.ok && (result.status === 401 || result.status === 403)) {
    result = await callLinear(`Bearer ${apiKey}`, query);
  }

  if (!result.ok) {
    console.error("Failed to fetch team. Status:", result.status, result.statusText);
    if (result.data) console.error(JSON.stringify(result.data, null, 2));
    process.exit(1);
  }

  const team = result.data?.data?.teams?.nodes?.[0];
  if (!team) {
    console.error("No team found for key:", teamKey);
    process.exit(1);
  }

  console.log(`Team: ${team.name} (${team.key}) id=${team.id}`);
}

await main();


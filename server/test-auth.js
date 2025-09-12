import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function runCurl(args) {
  const result = spawnSync("curl", args, { encoding: "utf8" });
  if (result.error) throw result.error;
  return { stdout: result.stdout.trim(), stderr: result.stderr.trim(), status: result.status };
}

function main() {
  const tmp = mkdtempSync(join(tmpdir(), "auth-test-"));
  const cookie = join(tmp, "cookie.txt");

  // 1) Signup to get OTP
  const signupBody = JSON.stringify({ email: "dev3@example.com", name: "Dev3" });
  const signup = runCurl(["-s", "-c", cookie, "-H", "Content-Type: application/json", "-d", signupBody, "http://localhost:3001/api/auth/signup"]);
  const signupJson = JSON.parse(signup.stdout);
  const { userId, devCode } = signupJson;
  if (!userId || !devCode) {
    console.error("Signup failed:", signup.stdout);
    process.exit(1);
  }
  console.log("signup ok", { userId, devCode });

  // 2) Verify OTP
  const verifyBody = JSON.stringify({ userId, code: String(devCode), purpose: "signup" });
  const verify = runCurl(["-s", "-c", cookie, "-b", cookie, "-H", "Content-Type: application/json", "-d", verifyBody, "http://localhost:3001/api/auth/otp/verify"]);
  console.log("verify:", verify.stdout);

  // 3) Check session
  const session = runCurl(["-s", "-b", cookie, "http://localhost:3001/api/auth/session"]);
  console.log("session:", session.stdout);
}

main();


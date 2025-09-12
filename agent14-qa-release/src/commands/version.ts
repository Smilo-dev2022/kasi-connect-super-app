import type { Argv } from "yargs";
import fs from "fs";
import path from "path";
import semver from "semver";

const VERSION_FILE = path.resolve(process.cwd(), "VERSION");

function readVersionFromFile(): string | null {
	if (!fs.existsSync(VERSION_FILE)) return null;
	const raw = fs.readFileSync(VERSION_FILE, "utf8").trim();
	return raw || null;
}

function writeVersionToFile(version: string, dryRun: boolean) {
	if (dryRun) return;
	fs.writeFileSync(VERSION_FILE, version + "\n", "utf8");
}

export function registerVersion(argv: Argv) {
	argv.command(
		"version [bump]",
		"Read or bump the repository version stored in VERSION",
		(y) =>
			y
				.positional("bump", {
					describe: "semver bump type or explicit version",
					type: "string",
					choices: ["major", "minor", "patch"] as const,
				})
				.option("dry-run", { type: "boolean", default: false })
				.option("set", { type: "string", describe: "set an explicit version" }),
		(args) => {
			const dryRun = Boolean(args["dry-run"]);
			const current = readVersionFromFile() ?? "0.0.0";
			let next = current;

			if (args.set) {
				if (!semver.valid(args.set)) throw new Error(`Invalid version: ${args.set}`);
				next = args.set;
			} else if (args.bump) {
				if (["major", "minor", "patch"].includes(String(args.bump))) {
					next = semver.inc(current, args.bump as semver.ReleaseType)!;
				} else if (semver.valid(String(args.bump))) {
					next = String(args.bump);
				} else {
					throw new Error("Provide bump as major|minor|patch or --set x.y.z");
				}
			}

			if (next !== current) {
				writeVersionToFile(next, dryRun);
				console.log(`Version: ${current} -> ${dryRun ? "(dry) " : ""}${next}`);
			} else {
				console.log(`Version: ${current}`);
			}
		}
	);
}
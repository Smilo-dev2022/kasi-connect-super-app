import type { Argv } from "yargs";
import fs from "fs";
import path from "path";

function ensureDir(p: string, dryRun: boolean) {
	if (dryRun) return;
	fs.mkdirSync(p, { recursive: true });
}

export function registerQa(argv: Argv) {
	argv.command(
		"qa <version>",
		"Generate QA checklist in docs/qa",
		(y) => y.positional("version", { type: "string", demandOption: true }).option("dry-run", { type: "boolean", default: false }),
		(args) => {
			const version = String(args.version);
			const dryRun = Boolean(args["dry-run"]);
			const filePath = path.resolve(process.cwd(), `docs/qa/v${version}.md`);
			ensureDir(path.dirname(filePath), dryRun);
			const content = `# QA Checklist v${version}\n\n## Pre-release\n- [ ] Features behind flags validated\n- [ ] Data migrations tested\n- [ ] Rollback plan reviewed\n\n## Regression\n- [ ] Critical flows (auth, purchase)\n- [ ] Monitoring and alerts configured\n\n## Post-release\n- [ ] Tag created\n- [ ] Release notes published\n`;
			if (!dryRun) fs.writeFileSync(filePath, content, "utf8");
			console.log(`Wrote ${dryRun ? "(dry) " : ""}${filePath}`);
		}
	);
}
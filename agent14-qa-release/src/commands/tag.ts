import type { Argv } from "yargs";
import { simpleGit } from "simple-git";

export function registerTag(argv: Argv) {
	argv.command(
		"tag <version>",
		"Create a git tag vX.Y.Z (no push)",
		(y) => y.positional("version", { type: "string", demandOption: true }).option("dry-run", { type: "boolean", default: false }),
		async (args) => {
			const version = String(args.version);
			const dryRun = Boolean(args["dry-run"]);
			const git = simpleGit();
			const tagName = `v${version}`;
			if (dryRun) {
				console.log(`[dry] git tag ${tagName}`);
				return;
			}
			const existing = await git.tags();
			if (existing.all.includes(tagName)) {
				console.log(`Tag ${tagName} already exists`);
				return;
			}
			await git.addTag(tagName);
			console.log(`Created tag ${tagName}`);
		}
	);
}
import type { Argv } from "yargs";
import fs from "fs";
import path from "path";
import { simpleGit } from "simple-git";

function ensureDir(p: string, dryRun: boolean) {
	if (dryRun) return;
	fs.mkdirSync(p, { recursive: true });
}

export function registerReleaseNotes(argv: Argv) {
	argv.command(
		"release-notes <version>",
		"Generate release notes skeleton in docs/releases",
		(y) =>
			y
				.positional("version", { type: "string", demandOption: true })
				.option("dry-run", { type: "boolean", default: false })
				.option("since-latest-tag", { type: "boolean", default: false }),
		async (args) => {
			const version = String(args.version);
			const dryRun = Boolean(args["dry-run"]);
			const includeCommits = Boolean(args["since-latest-tag"]);
			const filePath = path.resolve(process.cwd(), `docs/releases/v${version}.md`);
			ensureDir(path.dirname(filePath), dryRun);

			let changesSection = "- TODO\n";
			if (includeCommits) {
				try {
					const git = simpleGit();
					const tags = await git.tags();
					const latest = tags.latest;
					const range = latest ? `${latest}..HEAD` : undefined;
					const log = await git.log(range ? { from: latest!, to: "HEAD" } : {});
					changesSection = log.all
						.map((l) => `- ${l.message}`)
						.join("\n");
					if (!changesSection) changesSection = "- No commits since last tag";
				} catch (e) {
					changesSection = "- TODO";
				}
			}

			const content = `# Release v${version}\n\n## Highlights\n- TODO\n\n## Changes\n${changesSection}\n\n## Migration Notes\n- TODO\n`;
			if (!dryRun) fs.writeFileSync(filePath, content, "utf8");
			console.log(`Wrote ${dryRun ? "(dry) " : ""}${filePath}`);
		}
	);
}
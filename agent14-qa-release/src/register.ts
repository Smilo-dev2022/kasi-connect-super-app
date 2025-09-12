import type { Argv } from "yargs";
import { registerVersion } from "./commands/version.js";
import { registerReleaseNotes } from "./commands/release-notes.js";
import { registerQa } from "./commands/qa.js";
import { registerTag } from "./commands/tag.js";

export function registerCommands(argv: Argv) {
  registerVersion(argv);
  registerReleaseNotes(argv);
  registerQa(argv);
  registerTag(argv);
}
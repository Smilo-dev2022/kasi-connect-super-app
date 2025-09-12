import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { registerCommands } from "./register.js";

async function main() {
  const argv = yargs(hideBin(process.argv)).version(false);
  registerCommands(argv);
  await argv.demandCommand(1).strict().help().parseAsync();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
import { readFileSync } from "node:fs";
import { parseWit } from "./parser.js";
import { diffWit } from "./diff.js";

function main() {
  const [beforePath, afterPath] = process.argv.slice(2);
  if (!beforePath || !afterPath) {
    console.error("Usage: wit-breaking <before.wit> <after.wit>");
    console.error("\nCompares the interface/function signatures of two WIT documents and reports");
    console.error("breaking changes. Produce the .wit files with `wasm-tools component wit` if");
    console.error("you're starting from compiled .wasm component binaries.");
    process.exit(2);
  }

  const before = parseWit(readFileSync(beforePath, "utf8"));
  const after = parseWit(readFileSync(afterPath, "utf8"));
  const result = diffWit(before, after);

  for (const change of result.changes) {
    const location = change.function ? `${change.interface}.${change.function}` : change.interface;
    console.log(`${change.severity === "breaking" ? "BREAKING" : "safe    "}  ${location}: ${change.description}`);
  }

  if (result.changes.length === 0) {
    console.log("No interface changes detected.");
  }

  console.log(`\n${result.changes.filter((c) => c.severity === "breaking").length} breaking, ${result.changes.filter((c) => c.severity === "safe").length} safe.`);
  process.exit(result.breaking ? 1 : 0);
}

main();

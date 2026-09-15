/**
 * A component's public WIT interface evolves between two releases, with one
 * safe addition and two real breaking changes mixed in. Run with:
 *   npx tsx examples/demo.ts
 */
import { parseWit, diffWit } from "../src/index.js";

const v1 = `
  interface key-value {
    get: func(key: string) -> option<string>;
    set: func(key: string, value: string);
    delete: func(key: string);
  }
`;

const v2 = `
  interface key-value {
    get: func(key: string) -> option<string>;
    set: func(key: string, value: string, ttl-seconds: u32);
    list-keys: func() -> list<string>;
  }
`;

const result = diffWit(parseWit(v1), parseWit(v2));

for (const change of result.changes) {
  const location = change.function ? `${change.interface}.${change.function}` : change.interface;
  console.log(`${change.severity === "breaking" ? "BREAKING" : "safe    "}  ${location}: ${change.description}`);
}

console.log(`\nOverall: ${result.breaking ? "BREAKING release" : "backward compatible"}`);

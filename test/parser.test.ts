import { describe, expect, it } from "vitest";
import { parseWit } from "../src/parser.js";

describe("parseWit", () => {
  it("parses a simple interface with one function, from the WIT spec's own example", () => {
    const wit = `
      interface host {
          log: func(msg: string);
      }
    `;
    const parsed = parseWit(wit);
    expect(parsed.interfaces).toHaveLength(1);
    expect(parsed.interfaces[0]!.name).toBe("host");
    expect(parsed.interfaces[0]!.functions).toEqual([{ name: "log", params: "msg: string", result: null }]);
  });

  it("parses multiple functions with and without return types, from the WIT spec's own examples", () => {
    const wit = `
      interface arith {
        a1: func() -> u32;
        a3: func(y: u64, z: f32);
      }
    `;
    const parsed = parseWit(wit);
    expect(parsed.interfaces[0]!.functions).toEqual([
      { name: "a1", params: "", result: "u32" },
      { name: "a3", params: "y: u64, z: f32", result: null },
    ]);
  });

  it("handles multiple top-level interfaces", () => {
    const wit = `
      interface foo {
        f: func();
      }
      interface bar {
        b: func() -> string;
      }
    `;
    const parsed = parseWit(wit);
    expect(parsed.interfaces.map((i) => i.name)).toEqual(["foo", "bar"]);
  });

  it("does not get confused by nested braces from record/variant type definitions", () => {
    const wit = `
      interface types {
        record point {
          x: u32,
          y: u32,
        }
        move: func(p: point) -> bool;
      }
      interface next {
        n: func() -> u32;
      }
    `;
    const parsed = parseWit(wit);
    expect(parsed.interfaces.map((i) => i.name)).toEqual(["types", "next"]);
    expect(parsed.interfaces[0]!.functions).toEqual([{ name: "move", params: "p: point", result: "bool" }]);
    expect(parsed.interfaces[1]!.functions).toEqual([{ name: "n", params: "", result: "u32" }]);
  });

  it("ignores // line comments", () => {
    const wit = `
      // this is the main interface
      interface host {
        // logs a message
        log: func(msg: string); // trailing comment
      }
    `;
    const parsed = parseWit(wit);
    expect(parsed.interfaces[0]!.functions).toEqual([{ name: "log", params: "msg: string", result: null }]);
  });

  it("normalizes whitespace in param and result types so formatting-only changes don't register as diffs", () => {
    const wit = `
      interface host {
        log:   func(  msg  :   string  ,  level: u32  )   ->    bool  ;
      }
    `;
    const parsed = parseWit(wit);
    expect(parsed.interfaces[0]!.functions).toEqual([{ name: "log", params: "msg: string, level: u32", result: "bool" }]);
  });

  it("parses list<> and option<> generic types in signatures without breaking", () => {
    const wit = `
      interface data {
        get-all: func() -> list<string>;
        find: func(id: u32) -> option<string>;
      }
    `;
    const parsed = parseWit(wit);
    expect(parsed.interfaces[0]!.functions).toEqual([
      { name: "get-all", params: "", result: "list<string>" },
      { name: "find", params: "id: u32", result: "option<string>" },
    ]);
  });
});

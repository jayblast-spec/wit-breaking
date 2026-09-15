import { describe, expect, it } from "vitest";
import { parseWit } from "../src/parser.js";
import { diffWit } from "../src/diff.js";

function diff(beforeSrc: string, afterSrc: string) {
  return diffWit(parseWit(beforeSrc), parseWit(afterSrc));
}

describe("diffWit", () => {
  it("reports no changes for identical interfaces", () => {
    const wit = `interface host { log: func(msg: string); }`;
    const result = diff(wit, wit);
    expect(result.changes).toEqual([]);
    expect(result.breaking).toBe(false);
  });

  it("flags a removed function as breaking", () => {
    const before = `interface host { log: func(msg: string); warn: func(msg: string); }`;
    const after = `interface host { log: func(msg: string); }`;
    const result = diff(before, after);
    expect(result.breaking).toBe(true);
    expect(result.changes).toContainEqual(
      expect.objectContaining({ severity: "breaking", function: "warn", description: expect.stringContaining("removed") })
    );
  });

  it("flags an added function as safe", () => {
    const before = `interface host { log: func(msg: string); }`;
    const after = `interface host { log: func(msg: string); warn: func(msg: string); }`;
    const result = diff(before, after);
    expect(result.breaking).toBe(false);
    expect(result.changes).toEqual([
      expect.objectContaining({ severity: "safe", function: "warn", description: expect.stringContaining("added") }),
    ]);
  });

  it("flags a changed parameter list as breaking", () => {
    const before = `interface host { log: func(msg: string); }`;
    const after = `interface host { log: func(msg: string, level: u32); }`;
    const result = diff(before, after);
    expect(result.breaking).toBe(true);
    expect(result.changes[0]).toMatchObject({ severity: "breaking", function: "log" });
  });

  it("flags a changed return type as breaking", () => {
    const before = `interface host { get: func() -> string; }`;
    const after = `interface host { get: func() -> u32; }`;
    const result = diff(before, after);
    expect(result.breaking).toBe(true);
    expect(result.changes[0]!.description).toContain("return type changed");
  });

  it("flags an added return type (previously none) as breaking", () => {
    const before = `interface host { run: func(); }`;
    const after = `interface host { run: func() -> bool; }`;
    const result = diff(before, after);
    expect(result.breaking).toBe(true);
  });

  it("flags a removed interface as breaking, taking all its functions with it", () => {
    const before = `interface old { a: func(); } interface keep { b: func(); }`;
    const after = `interface keep { b: func(); }`;
    const result = diff(before, after);
    expect(result.breaking).toBe(true);
    expect(result.changes).toEqual([expect.objectContaining({ severity: "breaking", interface: "old" })]);
  });

  it("flags an added interface as safe", () => {
    const before = `interface keep { b: func(); }`;
    const after = `interface keep { b: func(); } interface fresh { c: func(); }`;
    const result = diff(before, after);
    expect(result.breaking).toBe(false);
    expect(result.changes).toEqual([expect.objectContaining({ severity: "safe", interface: "fresh" })]);
  });

  it("does not flag whitespace-only formatting differences as changes", () => {
    const before = `interface host { log: func(msg: string); }`;
    const after = `interface host {\n  log: func( msg : string ) ;\n}`;
    const result = diff(before, after);
    expect(result.changes).toEqual([]);
  });
});

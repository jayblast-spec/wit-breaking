# wit-breaking

**Detects breaking changes between two versions of a WebAssembly Component Model WIT interface — the equivalent of `buf breaking` (protobuf) or `oasdiff` (OpenAPI), for WIT.**

## The gap this fills

The WebAssembly Component Model uses [WIT](https://github.com/WebAssembly/component-model/blob/main/design/mvp/WIT.md) (Wasm Interface Type) as its IDL — the contract that lets components written in Rust, Go, JS, Python, and others compose without matching runtimes. As of 2026, the component-model *standards* layer is maturing fast, but "debugging, tracing, profiling, and SRE workflows still lag behind the standards layer" — and specifically, there was no dedicated tool for the most basic contract-safety question every IDL ecosystem eventually needs answered: **did this change break anyone importing my interface?** protobuf has `buf breaking`, OpenAPI has `oasdiff`; WIT had neither.

## What it does

Give it two WIT documents — typically the interface of a component before and after a change (produced with `wasm-tools component wit my-component.wasm > interface.wit`, part of the standard [Bytecode Alliance](https://github.com/bytecodealliance/wasm-tools) toolchain) — and it reports, per interface and per function:

- **Removed interface or function** → breaking
- **Changed parameter list or return type** → breaking
- **Added interface or function** → safe (additive)

```bash
npx wit-breaking before.wit after.wit
```

```
BREAKING  key-value.set: function "set" parameters changed: "(key: string, value: string)" -> "(key: string, value: string, ttl-seconds: u32)"
BREAKING  key-value.delete: function "delete" was removed
safe      key-value.list-keys: function "list-keys" was added

2 breaking, 1 safe.
```

Exit code `1` if anything breaking is found, `0` otherwise — drop it into CI right after you generate the `.wit` for your build artifact.

## Design

**Operates on WIT text, not `.wasm` binaries — deliberately.** Extracting a component's WIT already has a canonical, official tool (`wasm-tools component wit`); duplicating that inside this package would mean depending on the Bytecode Alliance's JS bindings toolchain, whose dependency tree currently pulls in a critical-severity transitive vulnerability (a Zip Slip issue in an archive-extraction dependency, used only at that toolchain's own install/build time). Taking WIT text as input keeps `wit-breaking` a small, dependency-free, Unix-philosophy tool: pipe the *output* of the official extractor into it.

**Signature-level diffing, not full semantic type diffing.** v1 detects that a parameter or return type's text changed and flags it — it does not attempt to understand *what* changed inside a complex type (e.g. which field moved inside a `record`). That still catches the overwhelming majority of real breaking changes (added/removed/reordered/retyped parameters, changed return types, removed functions and interfaces) without requiring a full WIT type-system implementation.

## Install

```bash
npm install --save-dev wit-breaking
```

## Library usage

```ts
import { parseWit, diffWit } from "wit-breaking";

const result = diffWit(parseWit(beforeSource), parseWit(afterSource));
if (result.breaking) {
  for (const change of result.changes.filter((c) => c.severity === "breaking")) {
    console.error(change.description);
  }
  process.exit(1);
}
```

Run the annotated demo:

```bash
npx tsx examples/demo.ts
```

## Non-goals (v1)

- **`world` import/export diffing** — interfaces are the primary contract surface; worlds are a natural v1.1 extension, not silently half-supported here.
- **Full type-system-aware diffing** (e.g. recognizing that widening a `variant` is safe while narrowing it isn't) — v1 is conservative: any textual change to a type is flagged breaking, which never misses a real break at the cost of occasionally over-flagging a genuinely safe widening.
- **Package version / semver policy enforcement** — out of scope; this tool tells you *what* changed, not what your versioning policy should do about it.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## License

MIT

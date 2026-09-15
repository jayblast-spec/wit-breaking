import type { ParsedWit } from "./parser.js";

export type Severity = "breaking" | "safe";

export interface Change {
  severity: Severity;
  interface: string;
  function?: string;
  description: string;
}

export interface DiffResult {
  changes: Change[];
  breaking: boolean;
}

export function diffWit(before: ParsedWit, after: ParsedWit): DiffResult {
  const changes: Change[] = [];
  const beforeByName = new Map(before.interfaces.map((i) => [i.name, i]));
  const afterByName = new Map(after.interfaces.map((i) => [i.name, i]));

  for (const [name, iface] of beforeByName) {
    if (!afterByName.has(name)) {
      changes.push({
        severity: "breaking",
        interface: name,
        description: `interface "${name}" was removed (${iface.functions.length} function(s) with it)`,
      });
      continue;
    }
    changes.push(...diffInterfaceFunctions(name, iface.functions, afterByName.get(name)!.functions));
  }

  for (const name of afterByName.keys()) {
    if (!beforeByName.has(name)) {
      changes.push({ severity: "safe", interface: name, description: `interface "${name}" was added` });
    }
  }

  return { changes, breaking: changes.some((c) => c.severity === "breaking") };
}

function diffInterfaceFunctions(
  interfaceName: string,
  before: ParsedWit["interfaces"][number]["functions"],
  after: ParsedWit["interfaces"][number]["functions"]
): Change[] {
  const changes: Change[] = [];
  const beforeByName = new Map(before.map((f) => [f.name, f]));
  const afterByName = new Map(after.map((f) => [f.name, f]));

  for (const [name, fn] of beforeByName) {
    const afterFn = afterByName.get(name);
    if (!afterFn) {
      changes.push({
        severity: "breaking",
        interface: interfaceName,
        function: name,
        description: `function "${name}" was removed`,
      });
      continue;
    }
    if (afterFn.params !== fn.params) {
      changes.push({
        severity: "breaking",
        interface: interfaceName,
        function: name,
        description: `function "${name}" parameters changed: "(${fn.params})" -> "(${afterFn.params})"`,
      });
    }
    if (afterFn.result !== fn.result) {
      changes.push({
        severity: "breaking",
        interface: interfaceName,
        function: name,
        description: `function "${name}" return type changed: "${fn.result ?? "(none)"}" -> "${afterFn.result ?? "(none)"}"`,
      });
    }
  }

  for (const name of afterByName.keys()) {
    if (!beforeByName.has(name)) {
      changes.push({ severity: "safe", interface: interfaceName, function: name, description: `function "${name}" was added` });
    }
  }

  return changes;
}

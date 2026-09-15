export interface FuncSignature {
  name: string;
  params: string;
  result: string | null;
}

export interface ParsedInterface {
  name: string;
  functions: FuncSignature[];
}

export interface ParsedWit {
  interfaces: ParsedInterface[];
}

function stripComments(source: string): string {
  return source
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("//");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
}

/** Finds the index just past the `{` matching the `{` at `openIndex`, tracking nested braces. */
function findMatchingBrace(text: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`unterminated block starting at offset ${openIndex}`);
}

function findMatchingParen(text: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`unterminated parameter list starting at offset ${openIndex}`);
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s*([:,])\s*/g, "$1 ")
    .trim();
}

/**
 * Extracts function signatures from a top-level `interface NAME { ... }`
 * body. Function param/result types are kept as normalized-whitespace text
 * rather than fully parsed -- v1 detects that a signature changed, not the
 * semantic structure of the change within a complex type.
 */
function parseInterfaceBody(body: string): FuncSignature[] {
  const functions: FuncSignature[] = [];
  const funcStart = /([a-zA-Z][\w-]*)\s*:\s*(?:async\s+)?func\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = funcStart.exec(body))) {
    const name = match[1]!;
    const openParen = match.index + match[0].length - 1;
    const closeParen = findMatchingParen(body, openParen);
    const params = normalizeWhitespace(body.slice(openParen + 1, closeParen));

    const rest = body.slice(closeParen + 1);
    const terminator = rest.indexOf(";");
    const tail = terminator === -1 ? rest : rest.slice(0, terminator);
    const arrowMatch = tail.match(/->\s*(.+)/s);
    const result = arrowMatch ? normalizeWhitespace(arrowMatch[1]!) : null;

    functions.push({ name, params, result });
    funcStart.lastIndex = closeParen;
  }

  return functions;
}

/** Parses the top-level named `interface` blocks of a WIT document (ignores worlds, packages, use-statements). */
export function parseWit(source: string): ParsedWit {
  const text = stripComments(source);
  const interfaces: ParsedInterface[] = [];
  const interfaceStart = /(?:^|[\s;}])interface\s+([a-zA-Z][\w-]*)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = interfaceStart.exec(text))) {
    const name = match[1]!;
    const openBrace = match.index + match[0].length - 1;
    const closeBrace = findMatchingBrace(text, openBrace);
    const body = text.slice(openBrace + 1, closeBrace);

    interfaces.push({ name, functions: parseInterfaceBody(body) });
    interfaceStart.lastIndex = closeBrace;
  }

  return { interfaces };
}

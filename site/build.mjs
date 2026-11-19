import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assetPrefix, basePath } from "./config.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");

const html = await readFile(join(root, "index.html"), "utf8");
const rendered = html
  .replaceAll("__BASE_PATH__", basePath)
  .replaceAll("__ASSET_PREFIX__", assetPrefix);

if (rendered.includes("__BASE_PATH__") || rendered.includes("__ASSET_PREFIX__")) {
  throw new Error("site build left unreplaced basePath or assetPrefix placeholders");
}

await mkdir(dist, { recursive: true });
await writeFile(join(dist, "index.html"), rendered);
await copyFile(join(root, "styles.css"), join(dist, "styles.css"));

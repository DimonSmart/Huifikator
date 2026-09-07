import { build } from "esbuild";
import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const manifest = JSON.parse(await readFile("extension/manifest.json", "utf8"));
manifest.version = packageJson.version;

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await Promise.all([
  build({ entryPoints: ["src/content/index.ts"], bundle: true, outfile: "dist/content.js", format: "iife", target: "chrome120" }),
  build({ entryPoints: ["src/popup/popup.ts"], bundle: true, outfile: "dist/popup.js", format: "iife", target: "chrome120" }),
  writeFile("dist/manifest.json", `${JSON.stringify(manifest, null, 2)}\n`),
  cp("extension/popup.html", "dist/popup.html"),
  cp("extension/popup.css", "dist/popup.css"),
]);

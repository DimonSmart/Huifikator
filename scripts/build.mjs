import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await Promise.all([
  build({ entryPoints: ["src/content/index.ts"], bundle: true, outfile: "dist/content.js", format: "iife", target: "chrome120" }),
  build({ entryPoints: ["src/popup/popup.ts"], bundle: true, outfile: "dist/popup.js", format: "iife", target: "chrome120" }),
  cp("extension/manifest.json", "dist/manifest.json"),
  cp("extension/popup.html", "dist/popup.html"),
  cp("extension/popup.css", "dist/popup.css"),
]);

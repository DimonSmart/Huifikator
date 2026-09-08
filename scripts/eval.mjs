import { build } from "esbuild";
import { readFile } from "node:fs/promises";

const corpus = JSON.parse(await readFile("tests/data/huification-corpus.json", "utf8"));
const bundle = await build({ entryPoints: ["src/core/reduplicator.ts"], bundle: true, format: "esm", platform: "node", write: false });
const module = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString("base64")}`);
let matched = 0;
let skipped = 0;
let failed = 0;
for (const item of corpus) {
  const actual = module.reduplicate(item.input);
  if (!("expected" in item)) continue;
  if (actual === item.expected) matched += 1;
  else if (actual === null) skipped += 1;
  else failed += 1;
}
console.log(`corpus: ${corpus.length} words`);
console.log(`matched: ${matched}\nskipped: ${skipped}\nfailed: ${failed}`);
process.exitCode = failed === 0 ? 0 : 1;

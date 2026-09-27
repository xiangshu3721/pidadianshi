import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const nextBin = path.join("node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: { ...process.env, STATIC_EXPORT: "1" },
});

const code = result.status ?? 1;
if (code !== 0) {
  process.exit(code);
}

const outDir = path.join(process.cwd(), "out");
if (!existsSync(path.join(outDir, "index.html"))) {
  console.error("Static export did not produce out/index.html");
  process.exit(1);
}

// GitHub Pages branch deploys run Jekyll, which drops `_next`. Actions deploys
// skip Jekyll, but the marker keeps either path safe.
writeFileSync(path.join(outDir, ".nojekyll"), "");
console.log("Static export ready: out/");

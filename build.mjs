import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const dir = path.dirname(fileURLToPath(import.meta.url));

await rm(path.resolve(dir, "dist"), { recursive: true, force: true });

await build({
  entryPoints: [path.resolve(dir, "src/index.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outdir: path.resolve(dir, "dist"),
  outExtension: { ".js": ".mjs" },
  external: ["*.node", "pg-native"],
  sourcemap: "linked",
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  banner: {
    js: `import { createRequire as __cr } from 'node:module';
import __path from 'node:path';
import __url from 'node:url';
globalThis.require = __cr(import.meta.url);
globalThis.__filename = __url.fileURLToPath(import.meta.url);
globalThis.__dirname = __path.dirname(globalThis.__filename);`,
  },
  logLevel: "info",
});

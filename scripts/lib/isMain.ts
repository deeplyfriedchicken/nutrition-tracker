import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * True when this module was invoked directly (`tsx scripts/foo.ts`), false
 * when only imported (e.g. by a test). Compares real paths rather than raw
 * strings because argv[1] and import.meta.url can disagree across a symlink
 * (e.g. macOS's /tmp -> /private/tmp), which would otherwise make a script
 * silently skip its own entry point.
 */
export function isMainModule(moduleUrl: string): boolean {
  const argvPath = process.argv[1];
  if (!argvPath) return false;
  try {
    return realpathSync(argvPath) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

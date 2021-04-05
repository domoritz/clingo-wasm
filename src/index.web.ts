export { ClingoResult } from "./run";
import type { RunFunction, ClingoResult } from './run';
import { init } from "./run";

const clingoModule = require("./clingo.wasm").default;

const runPromise = init({
  locateFile(path) {
    if (path.endsWith(".wasm")) {
      return clingoModule;
    }
    return path;
  },
})

let _run: RunFunction;

/**
 * @param program The logic program you wish to run.
 * @param models The number of models you wish returned. Defaults to 1.
 * @param options You pass in a string enumerating command line options for Clingo.
 *
 * These are described in detail in the Potassco guide: https://github.com/potassco/guide/releases/
 */
export async function run(...args: Parameters<RunFunction>): Promise<ClingoResult> {
  if (!_run) {
    _run = await runPromise;
  }
  return _run(...args)
}

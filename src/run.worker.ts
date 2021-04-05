import type { RunFunction, ClingoResult } from "./run";
import { init } from "./run";

const clingoModule = require("./clingo.wasm").default;

const runPromise = init({
  locateFile(path) {
    if (path.endsWith(".wasm")) {
      return clingoModule;
    }
    return path;
  },
});

let _run: RunFunction;

async function run(...args: Parameters<RunFunction>): Promise<ClingoResult> {
  if (!_run) {
    _run = await runPromise;
  }
  return _run(...args);
}

addEventListener("message", async (event) => {
  const args: Parameters<RunFunction> = event.data;
  const results = await run(...args);
  postMessage(results, undefined);
});

export default null as any;

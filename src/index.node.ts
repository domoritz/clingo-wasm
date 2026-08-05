import { init, Runner, ClingoResult, ClingoError, RunFunction } from "./run";
import { supportsThreads } from "./threads";

let runPromise: Promise<RunFunction> | undefined;

export async function run(
  ...args: Parameters<RunFunction>
): Promise<ReturnType<RunFunction>> {
  // initialize lazily so that importing the package does not load the wasm
  // module (and, with threads, spawn the worker pool)
  runPromise ??= init();
  return (await runPromise)(...args);
}

export {
  Runner,
  ClingoResult,
  ClingoError,
  RunFunction,
  init,
  supportsThreads,
};

export default run;

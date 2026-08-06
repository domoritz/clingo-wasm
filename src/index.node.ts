import {
  init,
  Runner,
  ClingoResult,
  ClingoError,
  RunFunction,
  Witness,
  OnModel,
} from "./run";
import { makeStream } from "./stream";
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

/**
 * Runs like `run` but returns an async generator that yields each model and
 * returns the final result. Since solving blocks in Node, the models are all
 * yielded right after solving finishes; pass an onModel callback to `run` to
 * observe them while solving.
 */
export const stream = makeStream(run);

export {
  Runner,
  ClingoResult,
  ClingoError,
  RunFunction,
  Witness,
  OnModel,
  init,
  supportsThreads,
};

export default run;

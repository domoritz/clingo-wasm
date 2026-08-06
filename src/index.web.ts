export type { ClingoResult, ClingoError, Witness, OnModel } from "./run";
export { supportsThreads } from "./threads";

import type { RunFunction } from "./run";
import type { Messages, Replies } from "./protocol";
import { makeStream } from "./stream";
import Worker from "./run.worker";

let worker = new Worker();

/**
 * @param program The logic program you wish to run.
 * @param models The number of models you wish returned. Defaults to 1.
 * @param options You pass in a string enumerating command line options for Clingo.
 * @param onModel Called with each model as clingo finds it.
 *
 * These are described in detail in the Potassco guide: https://github.com/potassco/guide/releases/
 */
export async function run(
  ...args: Parameters<RunFunction>
): Promise<ReturnType<RunFunction>> {
  const [program, models, options, onModel] = args;
  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent) => {
      const reply: Replies = event.data;
      if (reply.type === "model") {
        onModel?.(reply.model);
      } else {
        resolve(reply.result!);
      }
    };
    const message: Messages = {
      type: "run",
      args: [program, models, options],
      stream: !!onModel,
    };
    worker.postMessage(message);
  });
}

/**
 * Runs like `run` but returns an async generator that yields each model as
 * clingo finds it and returns the final result.
 */
export const stream = makeStream(run);

export async function init(wasmUrl?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent) => {
      resolve(event.data.result);
    };
    const message: Messages = { type: "init", wasmUrl };
    worker.postMessage(message);
  });
}

export async function restart(wasmUrl?: string): Promise<void> {
  worker.terminate();
  worker = new Worker();
  await init(wasmUrl);
}

export default run;

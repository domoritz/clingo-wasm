export type { ClingoResult } from "./run";

import type { RunFunction } from "./run";
import Worker, { Messages } from "./run.worker";

let worker = new Worker();

/**
 * @param program The logic program you wish to run.
 * @param models The number of models you wish returned. Defaults to 1.
 * @param options You pass in a string enumerating command line options for Clingo.
 *
 * These are described in detail in the Potassco guide: https://github.com/potassco/guide/releases/
 */
export async function run(
  ...args: Parameters<RunFunction>
): Promise<ReturnType<RunFunction>> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const { data: result } = event;
      resolve(result);
    };
    const message: Messages = { type: "run", args };
    worker.postMessage(message);
  });
}

export async function init(wasmUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      resolve(event.data);
    };
    const message: Messages = { type: "init", wasmUrl };
    worker.postMessage(message);
  });
}

export async function restart(wasmUrl: string): Promise<void> {
  worker.terminate();
  worker = new Worker();
  await init(wasmUrl);
}

export default run;

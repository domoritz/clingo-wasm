export type { ClingoResult } from "./run";

import type { RunFunction, ClingoResult } from "./run";
import Worker from "./run.worker";

const worker = new Worker();

/**
 * @param program The logic program you wish to run.
 * @param models The number of models you wish returned. Defaults to 1.
 * @param options You pass in a string enumerating command line options for Clingo.
 *
 * These are described in detail in the Potassco guide: https://github.com/potassco/guide/releases/
 */
export async function run(
  ...args: Parameters<RunFunction>
): Promise<ClingoResult> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      resolve(event.data);
    };
    worker.postMessage(args);
  });
}

export default run;

import { Worker } from "worker_threads";

export type { ClingoResult, ClingoError, OnModel } from "./run.js";
export type { Witness } from "./witnesses.js";
export { Runner } from "./run.js";
export { supportsThreads } from "./threads.js";

import { supportsThreads } from "./threads.js";
import { createClient } from "./client.js";

export const { run, init, restart, stream } = createClient(() => {
  const worker = new Worker(new URL("./run.worker.node.js", import.meta.url));
  return {
    postMessage: (message) => worker.postMessage(message),
    onReply: (handler) => worker.on("message", handler),
    onError: (handler) => worker.on("error", handler),
    terminate: () => worker.terminate(),
    ref: () => worker.ref(),
    unref: () => worker.unref(),
  };
});

export default { run, init, restart, stream, supportsThreads };

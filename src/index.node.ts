import { Worker } from "worker_threads";

export type { ClingoResult, ClingoError, Witness, OnModel } from "./run.js";
export { Runner, supportsThreads } from "./run.js";

import { createClient } from "./client.js";

const client = createClient(() => {
  const worker = new Worker(new URL("./run.worker.node.js", import.meta.url));
  return {
    postMessage: (message) => worker.postMessage(message),
    onReply: (handler) => {
      worker.on("message", handler);
      return () => worker.off("message", handler);
    },
    onError: (handler) => worker.on("error", handler),
    terminate: () => worker.terminate(),
    ref: () => worker.ref(),
    unref: () => worker.unref(),
  };
});

export const { run, init, restart, stream } = client;

export default run;

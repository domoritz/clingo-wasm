export type { ClingoResult, ClingoError, Witness, OnModel } from "./run.js";
export { Runner, supportsThreads } from "./run.js";

import { createClient } from "./client.js";

function spawnWorker(): Worker {
  const url = new URL("./run.worker.js", import.meta.url);
  if (url.origin === location.origin) {
    return new Worker(url, { type: "module" });
  }
  // Workers must be same-origin, so when the package is loaded from another
  // origin (e.g. a CDN), spawn the worker from a same-origin blob that
  // imports the real worker module. Messages arriving while the module loads
  // are buffered and replayed, since they would otherwise be dropped.
  const trampoline = `
    const queued = [];
    self.onmessage = (event) => queued.push(event);
    try {
      await import(${JSON.stringify(url.href)});
    } catch (error) {
      self.onmessage = () =>
        self.postMessage({
          type: "result",
          result: { Result: "ERROR", Error: String(error) },
        });
    }
    queued.forEach((event) => self.onmessage(event));
  `;
  const blob = new Blob([trampoline], { type: "text/javascript" });
  return new Worker(URL.createObjectURL(blob), { type: "module" });
}

const client = createClient(() => {
  const worker = spawnWorker();
  return {
    postMessage: (message) => worker.postMessage(message),
    onReply: (handler) => {
      const listener = (event: MessageEvent) => handler(event.data);
      worker.addEventListener("message", listener);
      return () => worker.removeEventListener("message", listener);
    },
    onError: (handler) => worker.addEventListener("error", handler),
    terminate: () => worker.terminate(),
  };
});

export const { run, init, restart, stream } = client;

export default run;

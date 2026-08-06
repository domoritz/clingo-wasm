export type { ClingoResult, ClingoError, OnModel } from "./run.js";
export type { Witness } from "./witnesses.js";
export { supportsThreads } from "./threads.js";

import { supportsThreads } from "./threads.js";
import { createClient } from "./client.js";

function spawnWorker(): Worker {
  if (new URL(import.meta.url).origin === location.origin) {
    // keep this call a literal: bundlers only detect workers statically
    return new Worker(new URL("./run.worker.js", import.meta.url), {
      type: "module",
    });
  }
  // Workers must be same-origin, so when the package is loaded from another
  // origin (e.g. a CDN), spawn the worker from a same-origin blob that
  // imports the real worker module. Messages arriving while the module loads
  // are buffered and replayed, since they would otherwise be dropped.
  const url = new URL("./run.worker.js", import.meta.url);
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

export const { run, init, restart, stream } = createClient(() => {
  const worker = spawnWorker();
  return {
    postMessage: (message) => worker.postMessage(message),
    onReply: (handler) => (worker.onmessage = (event) => handler(event.data)),
    onError: (handler) =>
      worker.addEventListener("error", (event) =>
        handler(event.message || event)
      ),
    terminate: () => worker.terminate(),
  };
});

export default { run, init, restart, stream, supportsThreads };

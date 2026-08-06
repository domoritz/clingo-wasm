import {
  isMainThread,
  parentPort,
  workerData,
  Worker,
} from "worker_threads";

import {
  init,
  Runner,
  ClingoResult,
  ClingoError,
  RunFunction,
  Witness,
  OnModel,
} from "./run";
import type { Messages, Replies } from "./protocol";
import { makeStream } from "./stream";
import { supportsThreads } from "./threads";

const WORKER_SENTINEL = "clingo-wasm-worker";

// When this file is spawned as a worker thread, serve solve requests instead
// of exporting the API. Running in a worker keeps the main thread responsive
// and makes the solve interruptible with restart().
if (!isMainThread && workerData === WORKER_SENTINEL && parentPort) {
  const port = parentPort;
  let runPromise: Promise<RunFunction> | undefined;

  port.on("message", async (message: Messages) => {
    if (message.type !== "run") {
      return;
    }
    runPromise ??= init();
    const runFn = await runPromise;
    const [program, models, options] = message.args;
    const onModel = message.stream
      ? (model: Witness) => port.postMessage({ type: "model", model })
      : undefined;
    const result = runFn(program, models, options, onModel);
    port.postMessage({ type: "result", result });
  });
}

// The worker is spawned from this file itself, which only works for the
// compiled bundle. When running from TypeScript sources (e.g. in jest), fall
// back to solving in-process, without restart() support.
const canUseWorker = /\.[cm]?js$/.test(__filename);

let worker: Worker | undefined;
let resolveActiveRun: ((result: ClingoError) => void) | undefined;
let queue: Promise<unknown> = Promise.resolve();
let inProcessRun: Promise<RunFunction> | undefined;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(__filename, { workerData: WORKER_SENTINEL });
    worker.on("error", (error) => {
      resolveActiveRun?.({ Result: "ERROR", Error: String(error) });
      resolveActiveRun = undefined;
      worker = undefined;
    });
  }
  return worker;
}

function runInWorker(
  ...args: Parameters<RunFunction>
): Promise<ReturnType<RunFunction>> {
  const [program, models, options, onModel] = args;
  const w = getWorker();
  // keep the process alive while solving, but not while idle
  w.ref();
  return new Promise<ReturnType<RunFunction>>((resolve) => {
    resolveActiveRun = resolve;
    const handler = (reply: Replies) => {
      if (reply.type === "model") {
        onModel?.(reply.model);
      } else {
        w.off("message", handler);
        resolveActiveRun = undefined;
        resolve(reply.result!);
      }
    };
    w.on("message", handler);
    const message: Messages = {
      type: "run",
      args: [program, models, options],
      stream: !!onModel,
    };
    w.postMessage(message);
  }).finally(() => worker?.unref());
}

export async function run(
  ...args: Parameters<RunFunction>
): Promise<ReturnType<RunFunction>> {
  if (!canUseWorker) {
    // initialize lazily so that importing the package does not load the wasm
    // module (and, with threads, spawn the worker pool)
    inProcessRun ??= init();
    return (await inProcessRun)(...args);
  }
  // solve one program at a time; queued runs start when the previous finishes
  const result = queue.then(() => runInWorker(...args));
  queue = result.catch(() => {});
  return result;
}

/**
 * Terminates the worker, aborting a running solve. The pending run resolves
 * with an error result, and the next run starts a fresh worker.
 */
export async function restart(): Promise<void> {
  if (worker) {
    const terminated = worker.terminate();
    worker = undefined;
    resolveActiveRun?.({ Result: "ERROR", Error: "Aborted by restart()." });
    resolveActiveRun = undefined;
    await terminated;
  }
  inProcessRun = undefined;
}

/**
 * Runs like `run` but returns an async generator that yields each model as
 * clingo finds it and returns the final result.
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

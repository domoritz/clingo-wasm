import type { ClingoError, OnModel, RunFunction } from "./run.js";
import type { Messages, Replies } from "./protocol.js";
import { makeStream } from "./stream.js";

/** Platform-independent view of a worker that runs clingo. */
export interface ClingoWorker {
  postMessage(message: Messages): void;
  /** Subscribes to replies; returns the unsubscribe function. */
  onReply(handler: (reply: Replies) => void): () => void;
  onError(handler: (error: unknown) => void): void;
  terminate(): void | Promise<unknown>;
  /** Node only: hold or release the event loop. */
  ref?(): void;
  unref?(): void;
}

/**
 * The client API around a clingo worker, shared by the browser and Node entry
 * points: runs one program at a time, streams models to the caller, and can
 * abort a running solve by terminating the worker.
 */
export function createClient(spawn: () => ClingoWorker) {
  let worker: ClingoWorker | undefined;
  let resolveActive: ((result: ClingoError) => void) | undefined;
  let queue: Promise<unknown> = Promise.resolve();

  function getWorker(): ClingoWorker {
    if (!worker) {
      worker = spawn();
      worker.onError((error) => {
        resolveActive?.({ Result: "ERROR", Error: String(error) });
        resolveActive = undefined;
        worker = undefined;
      });
    }
    return worker;
  }

  /** Sends one request and resolves with its result reply. */
  function request(
    message: Messages,
    onModel?: OnModel
  ): Promise<ReturnType<RunFunction>> {
    const w = getWorker();
    // keep the process alive while solving, but not while idle
    w.ref?.();
    return new Promise<ReturnType<RunFunction>>((resolve) => {
      resolveActive = resolve;
      const unsubscribe = w.onReply((reply) => {
        if (reply.type === "model") {
          onModel?.(reply.model);
        } else {
          unsubscribe();
          resolveActive = undefined;
          resolve(reply.result!);
        }
      });
      w.postMessage(message);
    }).finally(() => worker?.unref?.());
  }

  /** Serializes requests so only one is outstanding at a time. */
  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = queue.then(task);
    queue = result.catch(() => {});
    return result;
  }

  async function run(
    ...args: Parameters<RunFunction>
  ): Promise<ReturnType<RunFunction>> {
    const [program, models, options, onModel] = args;
    return enqueue(() =>
      request(
        { type: "run", args: [program, models, options], stream: !!onModel },
        onModel
      )
    );
  }

  /** Initializes clingo up front, optionally with a custom wasm url. */
  async function init(wasmUrl?: string): Promise<void> {
    await enqueue(() => request({ type: "init", wasmUrl }));
  }

  /**
   * Terminates the worker, aborting a running solve: the pending run resolves
   * with an error result and the next run starts a fresh worker.
   */
  async function restart(wasmUrl?: string): Promise<void> {
    if (worker) {
      const terminated = worker.terminate();
      worker = undefined;
      resolveActive?.({ Result: "ERROR", Error: "Aborted by restart()." });
      resolveActive = undefined;
      await terminated;
    }
    if (wasmUrl !== undefined) {
      await init(wasmUrl);
    }
  }

  return { run, init, restart, stream: makeStream(run) };
}

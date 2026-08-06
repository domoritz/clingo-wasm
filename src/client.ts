import type { ClingoError, OnModel, RunFunction } from "./run.js";
import type { Messages, Replies } from "./protocol.js";
import { makeStream } from "./stream.js";

/** Platform-independent view of a worker that runs clingo. */
export interface ClingoWorker {
  postMessage(message: Messages): void;
  onReply(handler: (reply: Replies) => void): void;
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
  /** The one outstanding request, if any (requests are serialized). */
  let active:
    | {
        resolve: (result: ReturnType<RunFunction> | null) => void;
        onModel?: OnModel;
      }
    | undefined;
  let queue: Promise<unknown> = Promise.resolve();

  function fail(error: unknown) {
    active?.resolve({ Result: "ERROR", Error: String(error) } as ClingoError);
    active = undefined;
  }

  function getWorker(): ClingoWorker {
    if (!worker) {
      const w = (worker = spawn());
      // ignore stray messages from a worker that restart() replaced
      w.onReply((reply) => {
        if (worker !== w) {
          return;
        }
        if (reply.type === "model") {
          active?.onModel?.(reply.model);
        } else {
          active?.resolve(reply.result);
          active = undefined;
        }
      });
      w.onError((error) => {
        if (worker !== w) {
          return;
        }
        worker = undefined;
        fail(error);
        w.terminate();
      });
    }
    return worker;
  }

  /** Sends one request and resolves with its result reply. */
  function request(
    message: Messages,
    onModel?: OnModel
  ): Promise<ReturnType<RunFunction> | null> {
    return new Promise<ReturnType<RunFunction> | null>((resolve) => {
      active = { resolve, onModel };
      try {
        const w = getWorker();
        // keep the process alive while solving, but not while idle
        w.ref?.();
        w.postMessage(message);
      } catch (e) {
        // e.g. spawning the worker failed
        fail(e);
      }
    }).finally(() => worker?.unref?.());
  }

  /** Serializes requests so only one is outstanding at a time. */
  function enqueue(
    message: Messages,
    onModel?: OnModel
  ): Promise<ReturnType<RunFunction> | null> {
    const result = queue.then(() => request(message, onModel));
    queue = result.catch(() => {});
    return result;
  }

  async function run(
    ...args: Parameters<RunFunction>
  ): Promise<ReturnType<RunFunction>> {
    const [program, models, options, onModel] = args;
    // run replies always carry a result
    return (await enqueue(
      { type: "run", args: [program, models, options], stream: !!onModel },
      onModel
    ))!;
  }

  /** Initializes clingo up front, optionally with a custom wasm url. */
  async function init(wasmUrl?: string): Promise<void> {
    const result = await enqueue({ type: "init", wasmUrl });
    if (result?.Result === "ERROR") {
      throw new Error(result.Error);
    }
  }

  /**
   * Terminates the worker, aborting a running solve: the pending run resolves
   * with an error result, queued runs continue on a fresh worker, and a given
   * wasm url applies to the runs submitted after this call.
   */
  async function restart(wasmUrl?: string): Promise<void> {
    if (worker) {
      const terminated = worker.terminate();
      worker = undefined;
      fail("Aborted by restart().");
      await terminated;
    }
    if (wasmUrl !== undefined) {
      await init(wasmUrl);
    }
  }

  return { run, init, restart, stream: makeStream(run) };
}

import { init } from "./run.js";
import type { RunFunction, Witness } from "./run.js";
import type { Messages, Replies } from "./protocol.js";

/**
 * The message handling shared by the web worker and the Node worker thread:
 * initializes clingo on demand and serves solve requests, posting each model
 * while solving when streaming is requested.
 */
export function serve(
  post: (reply: Replies) => void
): (message: Messages) => Promise<void> {
  let runPromise: Promise<RunFunction> | undefined;

  const initRun = (wasmUrl?: string) =>
    init(
      wasmUrl
        ? {
            // a custom wasm url points at a single .wasm file, so it can only
            // serve the single-threaded build
            singleThreaded: true,
            locateFile: (path) => (path.endsWith(".wasm") ? wasmUrl : path),
          }
        : {}
    );

  return async (message) => {
    try {
      if (message.type === "init") {
        runPromise = initRun(message.wasmUrl);
        await runPromise;
        post({ type: "result", result: null });
      } else {
        runPromise ??= initRun();
        const run = await runPromise;
        const [program, models, options] = message.args;
        const onModel = message.stream
          ? (model: Witness) => post({ type: "model", model })
          : undefined;
        post({ type: "result", result: run(program, models, options, onModel) });
      }
    } catch (e) {
      // e.g. the wasm module failed to load
      runPromise = undefined;
      post({ type: "result", result: { Result: "ERROR", Error: String(e) } });
    }
  };
}

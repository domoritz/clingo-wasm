import type { RunFunction } from "./run";
import { init } from "./run";

const clingoWasm = require("./clingo.wasm").default;
const clingoMtWasm = require("./clingo-mt.wasm").default;
// URL of the standalone threaded module, so its pthread workers can be spawned
// from a real URL (this worker itself is an inline blob without one). Asset
// modules export the URL directly, file-loader modules export it as default.
const clingoMtJsModule = require("./clingo-mt.js?url");
const clingoMtJs = clingoMtJsModule.default ?? clingoMtJsModule;

export type Messages =
  | { type: "init"; wasmUrl?: string }
  | { type: "run"; args: Parameters<RunFunction> };

let run: RunFunction;

async function initRun(wasmUrl?: string) {
  run = await init({
    // A custom wasm url points at a single .wasm file, so it can only serve
    // one build; stick to the single-threaded one for it.
    singleThreaded: !!wasmUrl,
    mainScriptUrlOrBlob: `${location.origin}/${clingoMtJs}`,
    locateFile(path) {
      if (wasmUrl) {
        return wasmUrl;
      }
      if (path.endsWith(".wasm")) {
        // work around inlined worker setting base url to be blob://
        const asset = path.includes("-mt") ? clingoMtWasm : clingoWasm;
        return `${location.origin}/${asset}`;
      }
      return path;
    },
  });
}

addEventListener("message", async (event) => {
  const message: Messages = event.data;

  console.info("Message", message);

  if (message.type === "run") {
    if (!run) {
      await initRun();
    }
    const results = run(...message.args);
    postMessage(results, undefined);
  } else if (message.type === "init") {
    await initRun(message.wasmUrl);
    postMessage(null, undefined);
  }
});

export default null as any;

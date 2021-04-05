import type { RunFunction } from "./run";
import { init } from "./run";

const clingoModule = require("./clingo.wasm").default;

export type Messages =
  | { type: "init"; wasmUrl?: string }
  | { type: "run"; args: Parameters<RunFunction> };

let run: RunFunction;

async function initRun(wasmUrl?: string) {
  run = await init({
    locateFile(path) {
      if (wasmUrl) {
        return wasmUrl;
      }
      if (path.endsWith(".wasm")) {
        // work around inlined worker setting base url to be blob://
        return `${location.origin}/${clingoModule}`;
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

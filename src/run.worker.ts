import type { RunFunction } from "./run";
import { init } from "./run";
import type { Witness } from "./witnesses";
import type { Messages, Replies } from "./protocol";

const clingoWasm = require("./clingo.wasm");
const clingoMtWasm = require("./clingo-mt.wasm");
// URL of the standalone threaded module, so its pthread workers can be spawned
// from a real URL (this worker itself is an inline blob without one).
const clingoMtJs = require("./clingo-mt.js?url");

let run: RunFunction;

function reply(message: Replies) {
  postMessage(message, undefined);
}

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
    const [program, models, options] = message.args;
    const onModel = message.stream
      ? (model: Witness) => reply({ type: "model", model })
      : undefined;
    const result = run(program, models, options, onModel);
    reply({ type: "result", result });
  } else if (message.type === "init") {
    await initRun(message.wasmUrl);
    reply({ type: "result", result: null });
  }
});

export default null as any;

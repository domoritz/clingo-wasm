import { parentPort } from "worker_threads";

import { serve } from "./worker.js";

const port = parentPort!;
const handle = serve((reply) => port.postMessage(reply));

port.on("message", handle);

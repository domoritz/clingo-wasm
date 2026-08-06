import { serve } from "./worker.js";
import type { Replies } from "./protocol.js";

const post = postMessage as (reply: Replies) => void;
const handle = serve(post);

onmessage = (event) => handle(event.data);

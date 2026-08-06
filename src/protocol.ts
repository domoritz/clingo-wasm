import type { RunFunction } from "./run.js";
import type { Witness } from "./witnesses.js";

/** Messages sent to a clingo worker (web worker or Node worker thread). */
export type Messages =
  | { type: "init"; wasmUrl?: string }
  | {
      type: "run";
      args: [program: string, models?: number, options?: string[]];
      stream?: boolean;
    };

/** Replies sent back from a clingo worker. */
export type Replies =
  | { type: "model"; model: Witness }
  | { type: "result"; result: ReturnType<RunFunction> | null };

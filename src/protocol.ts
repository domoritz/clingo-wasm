import type { RunFunction } from "./run";
import type { Witness } from "./witnesses";

/** Messages sent to a clingo worker (web worker or Node worker thread). */
export type RunArgs = [program: string, models?: number, options?: string[]];

export type Messages =
  | { type: "init"; wasmUrl?: string }
  | { type: "run"; args: RunArgs; stream?: boolean };

/** Replies sent back from a clingo worker. */
export type Replies =
  | { type: "model"; model: Witness }
  | { type: "result"; result: ReturnType<RunFunction> | null };

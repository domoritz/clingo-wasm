/// <reference types="emscripten" />

import { Module } from "./clingo.js";
import { Module as ModuleMt } from "./clingo-mt.js";

/**
 * Whether the environment can run the build with thread support: shared wasm
 * memory needs SharedArrayBuffer (in browsers only available on cross-origin
 * isolated pages) and the thread pool is sized from
 * navigator.hardwareConcurrency (available in workers, and in Node >= 21).
 */
export function supportsThreads(): boolean {
  return (
    typeof SharedArrayBuffer !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.hardwareConcurrency
  );
}

export interface ClingoResult {
  Solver?: string;
  Calls: number;

  Call: {
    Witnesses: {
      Value: string[];
      Costs?: number[];
      Consequences?: any;
    }[];
  }[];

  Models: {
    More: "yes" | "no";
    Number: number;
    Brave?: "yes" | "no";
    Consequences?: any;
  };

  Result: "SATISFIABLE" | "UNSATISFIABLE" | "UNKNOWN" | "OPTIMUM FOUND";

  Time: {
    CPU: number;
    Model: number;
    Solve: number;
    Total: number;
    Unsat: number;
  };

  Warnings: string[];
}

export interface ClingoError {
  Result: "ERROR";
  Error: string;
}

interface ClingoModule extends EmscriptenModule {
  ccall: typeof ccall;
}

export type ClingoParams = Partial<EmscriptenModule> & {
  /** URL (or Blob) of the standalone clingo-mt.js, used by the threaded build
   * to spawn its pthread web workers when the module itself was bundled. */
  mainScriptUrlOrBlob?: string | Blob;
  /** Force the single-threaded build even when threads are supported. */
  singleThreaded?: boolean;
};

export class Runner {
  private results: string[] = [];
  private errors: string[] = [];
  private clingo!: ClingoModule;

  constructor(private extraParams: ClingoParams = {}) {}

  async init() {
    console.info("Initialize Clingo");

    // only initialize once
    if (!this.clingo) {
      const { singleThreaded, ...rest } = this.extraParams;
      const params: ClingoParams = {
        print: (line) => this.results.push(line),
        printErr: (line) => this.errors.push(line),
        ...rest,
      };

      const factory =
        supportsThreads() && !singleThreaded
          ? ModuleMt || require("./clingo-mt")
          : Module || require("./clingo");
      this.clingo = await factory(params);
    }
  }

  // Exit codes that indicate a failed run, as defined by clasp
  // (clasp/cli/clasp_app.h): out of memory (33), internal error (65), and
  // syntax or command line error (128). With native wasm exceptions, errors
  // are caught inside the wasm module and reported through the exit status
  // instead of an exception propagating to JavaScript.
  private static ERROR_STATUS = new Set([33, 65, 128]);

  run(program: string, models: number = 1, options: string[] = []) {
    this.results = [];
    this.errors = [];

    try {
      const status = this.clingo.ccall(
        "run",
        "number",
        ["string", "string"],
        [program, `--outf=2 ${options.join(" ")} ${models}`]
      );

      if (Runner.ERROR_STATUS.has(status)) {
        throw new Error(`clingo run failed with status ${status}`);
      }

      const parsedResults = JSON.parse(this.results.join(""));
      delete parsedResults.Input;

      parsedResults.Warnings = this.errors.join("\n").split("\n\n");

      return parsedResults as ClingoResult;
    } catch (e) {
      return {
        Result: "ERROR",
        Error: this.errors.join("\n"),
      } as ClingoError;
    }
  }
}

export type RunFunction = typeof Runner.prototype.run;

export async function init(
  extraParams: ClingoParams = {}
): Promise<RunFunction> {
  const runner = new Runner(extraParams);

  await runner.init();

  return runner.run.bind(runner);
}

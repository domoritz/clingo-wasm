import type { ClingoModule, ModuleParams } from "./clingo.js";
import { supportsThreads } from "./threads.js";
import { Witness, WitnessParser } from "./witnesses.js";

/** Called with each model as clingo finds it, while solving is running. */
export type OnModel = (model: Witness) => void;

export interface ClingoResult {
  Solver?: string;
  Calls: number;

  Call: {
    Witnesses: Witness[];
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

export type ClingoParams = ModuleParams & {
  /** Force the single-threaded build even when threads are supported. */
  singleThreaded?: boolean;
};

export class Runner {
  private results: string[] = [];
  private errors: string[] = [];
  private parser?: WitnessParser;
  private clingo!: ClingoModule;

  constructor(private extraParams: ClingoParams = {}) {}

  async init() {
    // only initialize once
    if (!this.clingo) {
      const { singleThreaded, ...rest } = this.extraParams;
      const params: ClingoParams = {
        print: (line) => {
          this.results.push(line);
          try {
            this.parser?.feed(line);
          } catch (e) {
            // a parser problem must only degrade streaming, never the run
            this.parser = undefined;
            console.warn("stopped streaming models:", e);
          }
        },
        printErr: (line) => this.errors.push(line),
        ...rest,
      };

      // load lazily so that only the module for this environment is fetched
      const { default: factory } =
        supportsThreads() && !singleThreaded
          ? await import("./clingo-mt.js")
          : await import("./clingo.js");
      this.clingo = await factory(params);
    }
  }

  // Exit codes that indicate a failed run, as defined by clasp
  // (clasp/cli/clasp_app.h): out of memory (33), internal error (65), and
  // syntax or command line error (128). With native wasm exceptions, errors
  // are caught inside the wasm module and reported through the exit status
  // instead of an exception propagating to JavaScript.
  private static ERROR_STATUS = new Set([33, 65, 128]);

  run(
    program: string,
    models: number = 1,
    options: string[] = [],
    onModel?: OnModel
  ) {
    this.results = [];
    this.errors = [];
    this.parser = onModel && new WitnessParser(onModel);

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
        Error: this.errors.join("\n") || String(e),
      } as ClingoError;
    }
  }
}

export type RunFunction = typeof Runner.prototype.run;

/** The shape of the promise-based run functions exported by the entry points. */
export type AsyncRunFunction = (
  ...args: Parameters<RunFunction>
) => Promise<ReturnType<RunFunction>>;

export async function init(extraParams: ClingoParams = {}): Promise<RunFunction> {
  const runner = new Runner(extraParams);

  await runner.init();

  return runner.run.bind(runner);
}

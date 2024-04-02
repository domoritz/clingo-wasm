import Module from "./clingo.js";

/// <reference types="emscripten" />

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

export class Runner {
  private results: string[] = [];
  private errors: string[] = [];
  private clingo: ClingoModule;

  constructor(private extraParams: Partial<EmscriptenModule> = {}) {}

  async init() {
    console.info("Initialize Clingo");

    // only initialize once
    if (!this.clingo) {
      const params: Partial<EmscriptenModule> = {
        print: (line) => this.results.push(line),
        printErr: (line) => this.errors.push(line),
        ...this.extraParams,
      };

      if (Module) {
        this.clingo = await Module(params);
      } else {
        // for Node
        this.clingo = await require("./clingo")(params);
      }
    }
  }

  run(program: string, models: number = 1, options: string[] = []) {
    this.results = [];
    this.errors = [];

    try {
      this.clingo.ccall(
        "run",
        "number",
        ["string", "string"],
        [program, `--outf=2 ${options.join(" ")} ${models}`]
      );
    } catch (e) {
      return {
        Result: "ERROR",
        Error: this.errors.join("\n"),
      } as ClingoError;
    }

    const parsedResults = JSON.parse(this.results.join(""));
    delete parsedResults.Input;

    parsedResults.Warnings = this.errors.join("\n").split("\n\n");

    return parsedResults as ClingoResult;
  }
}

export type RunFunction = typeof Runner.prototype.run;

export async function init(
  extraParams: Partial<EmscriptenModule> = {}
): Promise<RunFunction> {
  const runner = new Runner(extraParams);

  await runner.init();

  return runner.run.bind(runner);
}

import {Module} from "./clingo.js";

/// <reference types="emscripten" />

export interface ClingoResult {
  Solver: string;
  Calls: number;
  Call: { Witnesses: { Value: string[] }[] }[];
  Models: { More: "yes" | "no"; Number: number };
  Result: "SATISFIABLE" | "UNSATISFIABLE";
  Time: {
    CPU: number;
    Model: number;
    Solve: number;
    Total: number;
    Unsat: number;
  };
}

interface ClingoModule extends EmscriptenModule {
  ccall: typeof ccall;
}

export class Runner {
  private results: string[] = []
  private clingo: ClingoModule

  constructor(private extraParams: Partial<EmscriptenModule> = {}) {}

  async init() {
    console.info("Initialize Clingo")

    // only initialize once
    if (!this.clingo) {
      const params: Partial<EmscriptenModule> = {
        print: (line) => this.results.push(line),
        printErr: console.error,
        ...this.extraParams
      };

      this.clingo = await Module(params)
    }
  }

  run(program: string, models: number = 1, options: string[] = []) {
    console.time("Run")
    this.results = []

    this.clingo.ccall(
      "run",
      "number",
      ["string", "string"],
      [program, `--outf=2 ${options.join(" ")} ${models}`]
    );

    console.timeEnd("Run")

    const parsedResults = JSON.parse(this.results.join(""));
    delete parsedResults.Input;

    return parsedResults as ClingoResult;
  }
}

export type RunFunction = typeof Runner.prototype.run;

export async function init(extraParams: Partial<EmscriptenModule> = {}): Promise<RunFunction> {
  const runner = new Runner(extraParams)

  await runner.init()

  return runner.run.bind(runner);
}

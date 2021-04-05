import { init, Runner, ClingoResult, RunFunction } from "./run";

let _run: RunFunction;

const runPromise = init()

async function run(...args: Parameters<RunFunction>): Promise<ClingoResult> {
  if (!_run) {
    _run = await runPromise;
  }
  return _run(...args)
}

export {
    Runner,
    ClingoResult,
    RunFunction,
    init
};

export default run;

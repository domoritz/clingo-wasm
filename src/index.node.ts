import { init, Runner, ClingoResult, ClingoError, RunFunction } from "./run";

let _run: RunFunction;

const runPromise = init();

export async function run(
  ...args: Parameters<RunFunction>
): Promise<ReturnType<RunFunction>> {
  if (!_run) {
    _run = await runPromise;
  }
  return _run(...args);
}

export { Runner, ClingoResult, ClingoError, RunFunction, init };

export default run;

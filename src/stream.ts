import type { ClingoError, ClingoResult, RunFunction } from "./run";
import type { Witness } from "./witnesses";

/**
 * Wraps a run function into an async generator that yields each model as it
 * is found and returns the final result. In Node, solving blocks the event
 * loop, so all models are yielded right after solving finishes; in the
 * browser, solving runs in a worker and models arrive while it solves.
 */
export function makeStream(run: (...args: Parameters<RunFunction>) => Promise<ClingoResult | ClingoError>) {
  return async function* stream(
    program: string,
    models: number = 1,
    options: string[] = []
  ): AsyncGenerator<Witness, ClingoResult | ClingoError> {
    const queue: Witness[] = [];
    let notify: (() => void) | undefined;
    let final: ClingoResult | ClingoError | undefined;

    const done = run(program, models, options, (model) => {
      queue.push(model);
      notify?.();
    }).then((result) => {
      final = result;
      notify?.();
      return result;
    });

    while (true) {
      while (queue.length) {
        yield queue.shift()!;
      }
      if (final !== undefined) {
        break;
      }
      await new Promise<void>((resolve) => (notify = resolve));
      notify = undefined;
    }

    return done;
  };
}

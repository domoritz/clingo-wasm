import type { AsyncRunFunction, ClingoError, ClingoResult } from "./run";
import type { Witness } from "./witnesses";

/**
 * Wraps a run function into an async generator that yields each model as it
 * is found and returns the final result. Models arrive while solving when the
 * run function solves in a worker (the browser bundle and the compiled Node
 * package); with in-process solving they are all yielded right after solving
 * finishes.
 */
export function makeStream(run: AsyncRunFunction) {
  return async function* stream(
    program: string,
    models: number = 1,
    options: string[] = []
  ): AsyncGenerator<Witness, ClingoResult | ClingoError> {
    const queue: Witness[] = [];
    let wake = () => {};
    let final: ClingoResult | ClingoError | undefined;

    run(program, models, options, (model) => {
      queue.push(model);
      wake();
    }).then((result) => {
      final = result;
      wake();
    });

    while (final === undefined || queue.length > 0) {
      if (queue.length > 0) {
        yield queue.shift()!;
      } else {
        await new Promise<void>((resolve) => (wake = resolve));
      }
    }

    return final;
  };
}

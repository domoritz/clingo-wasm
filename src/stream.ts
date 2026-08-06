import type { AsyncRunFunction, ClingoError, ClingoResult } from "./run.js";
import type { Witness } from "./witnesses.js";

/**
 * Wraps a run function into an async generator that yields each model as it
 * is found and returns the final result.
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

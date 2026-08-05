import type { AsyncRunFunction, ClingoError, ClingoResult } from "./run";
import type { Witness } from "./witnesses";

/**
 * Wraps a run function into an async generator that yields each model as it
 * is found and returns the final result. In Node, solving blocks the event
 * loop, so all models are yielded right after solving finishes; in the
 * browser, solving runs in a worker and models arrive while it solves.
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

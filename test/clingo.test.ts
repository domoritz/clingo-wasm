import { existsSync } from "fs";
import { describe, it, expect } from "vitest";

import type { ClingoResult, ClingoError, Witness } from "../src/run.js";
import { WitnessParser } from "../src/witnesses.js";

// The worker-based API spawns its worker from the compiled package, so the
// tests run against it. CI builds before testing; locally, run
// `npm run build` first.
const entry = new URL("../dist/index.node.js", import.meta.url);
if (!existsSync(entry)) {
  throw new Error("dist/index.node.js is missing; run `npm run build` first.");
}
const { run, stream, restart } = await import(entry.href);

describe("run", () => {
  it("should work", async () => {
    const { Call, ...result } = (await run(
      "a. b. c :- a, b.",
      0
    )) as ClingoResult;
    expect(result).toMatchObject({
      Result: "SATISFIABLE",
      Time: expect.any(Object),
      Models: {
        Number: 1,
        More: "no",
      },
      Calls: 1,
    });
    expect(Call[0].Witnesses[0]).toEqual({
      Time: expect.any(Number),
      Value: ["b", "a", "c"],
    });
  });

  it("should support optimizations", async () => {
    const { Call, ...result } = (await run(
      "{ a(1); a(2); a(3) }. :~ a(1). [1]",
      0
    )) as ClingoResult;
    expect(result).toMatchObject({
      Result: "OPTIMUM FOUND",
      Time: expect.any(Object),
      Models: {
        Number: 1,
        More: "no",
      },
      Calls: 1,
    });
    expect(Call[0].Witnesses[0]).toEqual({
      Time: expect.any(Number),
      Costs: [0],
      Value: [],
    });
  });

  it("should accept options", async () => {
    const { Call, ...result } = (await run("a. b. c :- a, b.", 0, [
      "--enum-mode brave",
    ])) as ClingoResult;
    expect(result).toMatchObject({
      Result: "SATISFIABLE",
      Time: expect.any(Object),
      Models: {
        Number: 1,
        More: "no",
        Brave: "yes",
        Consequences: { True: 3, Open: 0 },
      },
      Calls: 1,
    });
    expect(Call[0].Witnesses[0]).toEqual({
      Time: expect.any(Number),
      Value: ["b", "a", "c"],
      Consequences: {
        Open: 0,
        True: 3,
      },
    });
  });

  it("should return warnings", async () => {
    const { Warnings } = (await run(":- a. :- b.")) as ClingoResult;
    expect(Warnings).toHaveLength(2);
  });

  it("should support errors", async () => {
    const { Result } = (await run("foo")) as ClingoError;
    expect(Result).toBe("ERROR");
  });

  it("should support parallel solving", async () => {
    // Node supports SharedArrayBuffer unconditionally, so the threaded build
    // is picked automatically and clingo accepts -t.
    const { Result } = (await run(
      "pigeon(1..8). hole(1..7). 1 { in(P,H) : hole(H) } 1 :- pigeon(P). :- hole(H), 2 { in(P,H) : pigeon(P) }.",
      0,
      ["-t 4"]
    )) as ClingoResult;
    expect(Result).toBe("UNSATISFIABLE");
  });

  it("should report models to the onModel callback", async () => {
    const streamed: Witness[] = [];
    const { Call } = (await run("{a; b; c}.", 0, [], (model) =>
      streamed.push(model)
    )) as ClingoResult;
    expect(streamed).toHaveLength(8);
    expect(streamed).toEqual(Call[0].Witnesses);
  });

  it("should stream models with costs", async () => {
    const streamed: Witness[] = [];
    const result = (await run(
      "{a; b}. #minimize {1:a}.",
      0,
      ["--opt-mode=optN"],
      (model) => streamed.push(model)
    )) as ClingoResult;
    expect(result.Result).toBe("OPTIMUM FOUND");
    expect(streamed.length).toBeGreaterThan(0);
    expect(streamed[streamed.length - 1].Costs).toEqual([0]);
  });

  it("should support async iteration over models", async () => {
    const streamed: Witness[] = [];
    const generator = stream("{a; b; c}.", 0);
    let next = await generator.next();
    while (!next.done) {
      streamed.push(next.value);
      next = await generator.next();
    }
    expect(streamed).toHaveLength(8);
    expect((next.value as ClingoResult).Result).toBe("SATISFIABLE");
  });

  it("should stream models with adversarial atom contents", async () => {
    // strings with quotes, braces, backslashes, unicode, and text that looks
    // like the JSON structure the parser searches for
    const program =
      'a("{"). b("\\""). c("[Witnesses]"). d("\\\\"). e("日本語 }],"). ' +
      'f("\\"Witnesses\\": [").';
    const streamed: Witness[] = [];
    const { Call } = (await run(program, 0, [], (model) =>
      streamed.push(model)
    )) as ClingoResult;
    expect(streamed).toHaveLength(1);
    expect(streamed).toEqual(Call[0].Witnesses);
    expect(streamed[0].Value).toHaveLength(6);
  });

  it("should keep working after an error", async () => {
    const error = (await run("this is invalid")) as ClingoError;
    expect(error.Result).toBe("ERROR");

    const { Result } = (await run("a.")) as ClingoResult;
    expect(Result).toBe("SATISFIABLE");
  });
});

describe("restart", () => {
  it(
    "should abort a running solve and keep working",
    async () => {
      // enumerating all models of this program takes practically forever
      const running = run("{a(1..24)}.", 0);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await restart();

      const aborted = await running;
      expect(aborted.Result).toBe("ERROR");

      const { Result } = (await run("a.")) as ClingoResult;
      expect(Result).toBe("SATISFIABLE");
    },
    30000
  );
});

describe("WitnessParser", () => {
  const document = JSON.stringify(
    {
      Solver: "clingo version 5.8.1",
      Call: [
        {
          Witnesses: [
            { Time: 0.1, Value: ['tricky("{[\\"Witnesses\\": [")', "a"] },
            {
              Time: 0.2,
              Value: [],
              Costs: [0],
              Consequences: { True: 3, Open: 0 },
            },
          ],
        },
      ],
      Result: "SATISFIABLE",
    },
    null,
    2
  );
  const expected = [
    { Time: 0.1, Value: ['tricky("{[\\"Witnesses\\": [")', "a"] },
    { Time: 0.2, Value: [], Costs: [0], Consequences: { True: 3, Open: 0 } },
  ];

  it("should extract witnesses from pretty-printed output", () => {
    const witnesses: Witness[] = [];
    const parser = new WitnessParser((witness) => witnesses.push(witness));
    for (const line of document.split("\n")) {
      parser.feed(line);
    }
    expect(witnesses).toEqual(expected);
  });

  it("should not depend on chunking or formatting", () => {
    const witnesses: Witness[] = [];
    const parser = new WitnessParser((witness) => witnesses.push(witness));
    // compact document fed one character at a time
    for (const char of JSON.stringify(JSON.parse(document))) {
      parser.feed(char);
    }
    expect(witnesses).toEqual(expected);
  });
});

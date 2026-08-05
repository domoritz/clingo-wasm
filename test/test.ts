import { ClingoResult, Witness, run, stream } from "../src/index.node";
import { ClingoError } from "../src/run";

// uncomment to test compiled file
// import run from "../dist/clingo.node";

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

  it("should keep working after an error", async () => {
    const error = (await run("this is invalid")) as ClingoError;
    expect(error.Result).toBe("ERROR");

    const { Result } = (await run("a.")) as ClingoResult;
    expect(Result).toBe("SATISFIABLE");
  });
});

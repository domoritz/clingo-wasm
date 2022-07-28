import { ClingoResult, run } from "../src/index.node";
import { ClingoError } from "../src/run";

// uncomment to test compiled file
// import run from "../dist/clingo.node";

describe("run", () => {
  it("should work", async () => {
    const { Call, Time, ...result } = (await run(
      "a. b. c :- a, b.",
      0
    )) as ClingoResult;
    expect(result).toMatchObject({
      Result: "SATISFIABLE",
      Models: {
        Number: 1,
        More: "no",
      },
      Calls: 1,
    });
    expect(Call[0].Witnesses[0]).toEqual({
      Value: ["b", "a", "c"],
    });
  });

  it("should support optimizations", async () => {
    const { Call, Time, ...result } = (await run(
      "{ a(1); a(2); a(3) }. :~ a(1). [1]",
      0
    )) as ClingoResult;
    expect(result).toMatchObject({
      Result: "OPTIMUM FOUND",
      Models: {
        Number: 1,
        More: "no",
      },
      Calls: 1,
    });
    expect(Call[0].Witnesses[0]).toEqual({
      Costs: [0],
      Value: [],
    });
  });

  it("should accept options", async () => {
    const { Call, Time, ...result } = (await run("a. b. c :- a, b.", 0, [
      "--enum-mode brave",
    ])) as ClingoResult;
    expect(result).toMatchObject({
      Result: "SATISFIABLE",
      Models: {
        Number: 1,
        More: "no",
        Brave: "yes",
        Consequences: { True: 3, Open: 0 },
      },
      Calls: 1,
    });
    expect(Call[0].Witnesses[0]).toEqual({
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
});

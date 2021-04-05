import { Runner } from "../src/index.node";

describe("run", () => {
  let run;

  beforeAll(async () => {
    const runner = new Runner();
    await runner.init();
    run = runner.run;
  });

  it("should work", async () => {
    const { Call, Time, ...result } = await run("a. b. c :- a, b.", 0);
    expect(result).toEqual({
      Result: "SATISFIABLE",
      Models: {
        Number: 1,
        More: "no",
      },
      Calls: 1,
    });
    expect(Call[0].Witnesses[0].Value).toEqual(["b", "a", "c"]);
  });

  it("should accept options", async () => {
    const { Call, Time, ...result } = await run("a. b. c :- a, b.", 0, [
      "--enum-mode brave",
    ]);
    expect(result).toEqual({
      Result: "SATISFIABLE",
      Models: {
        Number: 1,
        More: "no",
        Brave: "yes",
        Consequences: { True: 3, Open: 0 },
      },
      Calls: 1,
    });
    expect(Call[0].Witnesses[0].Value).toEqual(["b", "a", "c"]);
  });
});

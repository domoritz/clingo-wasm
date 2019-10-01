const nodeClingoModule = require("./clingo");

export type ClingoResult = {
  Solver: "clingo version 5.3.1",
  Calls: number,
  Call: { Witnesses: { Value: string[] }[] }[],
  Models: { More: "yes" | "no", Number: number },
  Result: "SATISFIABLE" | "UNSATISFIABLE",
  Time: {
    CPU: number,
    Model: number,
    Solve: number,
    Total: number,
    Unsat: number,
  }
};

export function run(program: string, models: number = 1) {
  console.time("Clingo Run Time");
  return new Promise((res, rej) => {
    const results: string[] = [];
    const params = {
      print: x => results.push(x),
      printErr: console.error,
      postRun: () => {
        const parsedResults = JSON.parse(results.join(""));
        delete parsedResults.Solver;
        delete parsedResults.Input;
        res(parsedResults);
      },
    };

    nodeClingoModule(params).then(clingo => {
      clingo.ccall('run', 'number', ['string',
        'string'],
        [program, '--outf=2 --enum-mode brave ' + models])
    });
  });
}

run('a. b. c :- a, b.').then(x => console.log("done", x));

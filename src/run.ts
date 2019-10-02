export interface ClingoResult {
    Solver: string,
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

export const _run = clingoModule => (program: string, models: number = 1, options: string = "") =>
    new Promise((res, rej) => {
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
        clingoModule(params).then(clingo => {
            clingo.ccall('run', 'number', ['string',
                'string'],
                [program, `--outf=2 ${options} ${models}`])
        });
    }) as Promise<ClingoResult>;

import { _run } from "./src/run";
export { ClingoResult } from "./src/run";

const nodeClingoModule = require("./clingo");

export const run = _run(nodeClingoModule);

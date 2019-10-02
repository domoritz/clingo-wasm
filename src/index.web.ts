import { _run } from "./run";
export { ClingoResult } from "./run";

import emscripten from '../clingo.js';
const clingoModule = require('../clingo.wasm');

const webClingoModule = emscripten({
  locateFile(path) {
    if(path.endsWith('.wasm')) {
      return clingoModule;
    }
    return path;
  }
});

export const run = _run(webClingoModule);

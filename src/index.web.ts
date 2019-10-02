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

/**
 * @param program The logic program you wish to run.
 * @param models The number of models you wish returned. Defaults to 1.
 * @param options You pass in a string enumerating command line options for Clingo.
 * These are described in detail in the Potassco guide: https://github.com/potassco/guide/releases/
 */
export const run = _run(webClingoModule);

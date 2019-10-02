import { _run } from "./src/run";
export { ClingoResult } from "./src/run";

import emscripten from './clingo.js';
const clingoModule = require('./clingo.wasm');

// Since webpack will change the name and potentially the path of the 
// `.wasm` file, we have to provide a `locateFile()` hook to redirect
// to the appropriate URL.
// More details: https://kripken.github.io/emscripten-site/docs/api_reference/module.html
const webClingoModule = emscripten({
  locateFile(path) {
    if(path.endsWith('.wasm')) {
      return clingoModule;
    }
    return path;
  }
});

export const run = _run(webClingoModule);

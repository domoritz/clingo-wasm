import emscripten from './clingo.js';
const clingoModule = require('./clingo.wasm');

// Since webpack will change the name and potentially the path of the 
// `.wasm` file, we have to provide a `locateFile()` hook to redirect
// to the appropriate URL.
// More details: https://kripken.github.io/emscripten-site/docs/api_reference/module.html
const wasmModule = emscripten({
  locateFile(path) {
    if(path.endsWith('.wasm')) {
      return clingoModule;
    }
    return path;
  }
});


wasmModule.onRuntimeInitialized = () => {
  console.log(wasmModule);
};

/// <reference types="emscripten" />

// Type declarations for the emscripten-generated modules (clingo.js and
// clingo-mt.js) so the TypeScript build does not depend on what the compiler
// can infer from minified output.
declare function Module(
  moduleArg?: Partial<EmscriptenModule>
): Promise<EmscriptenModule & { ccall: typeof ccall }>;

export default Module;

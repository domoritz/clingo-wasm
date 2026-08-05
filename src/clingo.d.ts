/// <reference types="emscripten" />

// Type declarations for the emscripten-generated modules (clingo.js and
// clingo-mt.js) so the TypeScript build does not depend on what the compiler
// can infer from minified output. mainScriptUrlOrBlob is only used by the
// threaded build and ignored by the single-threaded one.
export declare function Module(
  moduleArg?: Partial<EmscriptenModule> & {
    mainScriptUrlOrBlob?: string | Blob;
  }
): Promise<EmscriptenModule & { ccall: typeof ccall }>;

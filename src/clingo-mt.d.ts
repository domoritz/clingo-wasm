/// <reference types="emscripten" />

// Type declarations for the emscripten-generated clingo-mt.js (the build with
// thread support) so the TypeScript build does not depend on what the compiler
// can infer from minified output.
export declare function Module(
  moduleArg?: Partial<EmscriptenModule> & { mainScriptUrlOrBlob?: string | Blob }
): Promise<EmscriptenModule & { ccall: typeof ccall }>;

/// <reference types="emscripten" />

// Type declarations for the emscripten-generated clingo.js so the TypeScript
// build does not depend on what the compiler can infer from minified output.
export declare function Module(
  moduleArg?: Partial<EmscriptenModule>
): Promise<EmscriptenModule & { ccall: typeof ccall }>;

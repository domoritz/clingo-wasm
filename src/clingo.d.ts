// Type declarations for the emscripten-generated modules (clingo.js and
// clingo-mt.js), limited to the surface the runner uses, so the TypeScript
// build does not depend on what the compiler can infer from minified output.

/** The parameters the runner passes to the emscripten module factory. */
export interface ModuleParams {
  print?(line: string): void;
  printErr?(line: string): void;
  locateFile?(path: string, prefix?: string): string;
}

export interface ClingoModule {
  ccall(
    name: string,
    returnType: string,
    argTypes: string[],
    args: unknown[]
  ): number;
}

declare function Module(moduleArg?: ModuleParams): Promise<ClingoModule>;

export default Module;

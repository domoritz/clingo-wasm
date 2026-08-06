/**
 * Whether the environment can run the build with thread support (and with it
 * clingo's parallel solving options such as -t): shared wasm memory needs
 * SharedArrayBuffer, which browsers only expose on cross-origin isolated
 * pages, and the thread pool is sized from navigator.hardwareConcurrency
 * (available in workers, and in Node >= 22).
 */
export function supportsThreads(): boolean {
  return (
    typeof SharedArrayBuffer !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.hardwareConcurrency
  );
}

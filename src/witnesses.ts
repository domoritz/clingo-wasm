/** A single model (witness) from clingo's JSON output. */
export interface Witness {
  Value: string[];
  Time?: number;
  Costs?: number[];
  Consequences?: any;
}

/**
 * Incrementally extracts witnesses from the JSON that clingo streams to
 * stdout with --outf=2, so models can be reported while solving is still
 * running.
 *
 * The parser tracks strings (honoring escapes) and the stack of containers
 * with the key each one was entered under. A witness is any object that is a
 * direct element of an array behind a "Witnesses" key; its text is captured
 * and parsed when the object closes. This only assumes the output is valid
 * JSON with the witnesses in "Witnesses" arrays; it is independent of
 * formatting, and atom contents cannot confuse it since structural characters
 * are only interpreted outside of strings.
 */
export class WitnessParser {
  /** Containers entered so far, each with the key it was entered under. */
  private stack: { container: "{" | "["; key?: string }[] = [];
  /** The key that the next value in the current object belongs to. */
  private pendingKey?: string;
  private inString = false;
  private escaped = false;
  private string = "";
  /** Stack depth at which the currently captured witness started. */
  private captureDepth = 0;
  private buffer = "";

  constructor(private onWitness: (witness: Witness) => void) {}

  feed(chunk: string) {
    for (const char of chunk) {
      if (this.captureDepth > 0) {
        this.buffer += char;
      }

      if (this.inString) {
        if (this.escaped) {
          this.escaped = false;
        } else if (char === "\\") {
          this.escaped = true;
        } else if (char === '"') {
          this.inString = false;
        } else {
          this.string += char;
        }
        continue;
      }

      switch (char) {
        case '"':
          this.inString = true;
          this.string = "";
          break;
        case ":":
          this.pendingKey = this.string;
          break;
        case "{":
        case "[": {
          const parent = this.stack[this.stack.length - 1];
          const key =
            parent?.container === "{" ? this.pendingKey : undefined;
          this.stack.push({ container: char, key });
          if (
            char === "{" &&
            this.captureDepth === 0 &&
            parent?.container === "[" &&
            parent.key === "Witnesses"
          ) {
            this.captureDepth = this.stack.length;
            this.buffer = char;
          }
          break;
        }
        case "}":
        case "]":
          if (this.captureDepth === this.stack.length) {
            this.onWitness(JSON.parse(this.buffer));
            this.captureDepth = 0;
          }
          this.stack.pop();
          break;
      }
    }
  }
}

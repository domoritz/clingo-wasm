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
 * running. Witness objects are found by tracking brace depth inside the
 * "Witnesses" array; JSON strings are skipped over character by character, so
 * the parser does not depend on the pretty-printer's indentation or on atom
 * contents.
 */
export class WitnessParser {
  private inWitnesses = false;
  private capturing = false;
  private inString = false;
  private escaped = false;
  private depth = 0;
  private buffer = "";

  constructor(private onWitness: (witness: Witness) => void) {}

  feed(line: string) {
    if (!this.inWitnesses) {
      this.inWitnesses = line.trim() === '"Witnesses": [';
      return;
    }

    for (const char of line) {
      if (this.capturing) {
        this.buffer += char;
      }

      if (this.inString) {
        // only look for the end of the string, honoring escapes
        if (this.escaped) {
          this.escaped = false;
        } else if (char === "\\") {
          this.escaped = true;
        } else if (char === '"') {
          this.inString = false;
        }
      } else if (char === '"') {
        this.inString = true;
      } else if (char === "{") {
        if (!this.capturing) {
          // a new witness begins
          this.capturing = true;
          this.buffer = char;
        }
        this.depth++;
      } else if (char === "}") {
        if (--this.depth === 0) {
          this.onWitness(JSON.parse(this.buffer));
          this.capturing = false;
        }
      } else if (char === "]" && this.depth === 0) {
        // the Witnesses array ends
        this.inWitnesses = false;
        return;
      }
    }
  }
}

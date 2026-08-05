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
 * running. Tracks JSON string and nesting state character by character, so it
 * does not depend on the pretty-printer's indentation or on atom contents.
 */
export class WitnessParser {
  private inWitnesses = false;
  private inString = false;
  private escaped = false;
  private depth = 0;
  private buffer = "";

  constructor(private onWitness: (witness: Witness) => void) {}

  feed(line: string) {
    if (!this.inWitnesses) {
      if (line.trim() === '"Witnesses": [') {
        this.inWitnesses = true;
      }
      return;
    }

    for (const char of line) {
      if (this.inString) {
        if (this.buffer) {
          this.buffer += char;
        }
        if (this.escaped) {
          this.escaped = false;
        } else if (char === "\\") {
          this.escaped = true;
        } else if (char === '"') {
          this.inString = false;
        }
        continue;
      }

      switch (char) {
        case '"':
          this.inString = true;
          if (this.buffer) {
            this.buffer += char;
          }
          break;
        case "{":
          this.depth++;
          this.buffer += char;
          break;
        case "}":
          this.depth--;
          this.buffer += char;
          if (this.depth === 0) {
            this.onWitness(JSON.parse(this.buffer));
            this.buffer = "";
          }
          break;
        case "]":
          if (this.depth === 0) {
            // end of the Witnesses array
            this.inWitnesses = false;
            return;
          }
          this.buffer += char;
          break;
        default:
          if (this.buffer) {
            this.buffer += char;
          }
      }
    }

    if (this.buffer) {
      this.buffer += "\n";
    }
  }
}

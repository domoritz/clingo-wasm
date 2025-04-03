# Clingo WebAssembly

[![npm version](https://img.shields.io/npm/v/clingo-wasm.svg)](https://www.npmjs.com/package/clingo-wasm)
[![CDN](https://data.jsdelivr.com/v1/package/npm/clingo-wasm/badge?style=rounded)](https://www.jsdelivr.com/package/npm/clingo-wasm)
[![Clingo version](https://img.shields.io/badge/Clingo-5.8.0-blue)](https://github.com/potassco/clingo)
[![Lua version](https://img.shields.io/badge/Lua-5.4.6-blue)](https://github.com/lua/lua)
[![Emscripten version](https://img.shields.io/badge/Emscripten-3.1.64-blue)](https://emscripten.org)
[![Build WASM](https://github.com/domoritz/clingo-wasm/actions/workflows/release.yml/badge.svg)](https://github.com/domoritz/clingo-wasm/actions/workflows/release.yml)

[Clingo](https://github.com/potassco/clingo) compiled to [WebAssembly](https://webassembly.org/) with [Emscripten](https://kripken.github.io/emscripten-site/).
Try it online at <https://observablehq.com/@cmudig/clingo> or <https://domoritz.github.io/clingo-wasm>.

This repo combines work from two previous repos: <https://github.com/Aluriak/webclingo-example> and <https://github.com/domoritz/wasm-clingo>.

## Installation and Usage

### Node

`npm install clingo-wasm` or `yarn add clingo-wasm`.

```js
const clingo = require("clingo-wasm");

clingo.run("a. b:- a.").then(console.log);
```

### In the Browser

Load Clingo from the [JSDelivr CDN](https://www.jsdelivr.com/package/npm/clingo-wasm).

```html
<script src="https://cdn.jsdelivr.net/npm/clingo-wasm@VERSION"></script>
```

We expose an UMD bundle that runs Clingo in a separate worker thread. Therefore, all commands need to be asynchronous.

```html
<script>
  async function main() {
    // optionally pass URL to WASM file:
    // await clingo.init("https://cdn.jsdelivr.net/npm/clingo-wasm@VERSION/dist/clingo.wasm")
    console.log(await clingo.run("a. b :- a."));
    console.log(await clingo.run("{a; b; c}.", 0));
  }

  main();
</script>
```

The Clingo worker can also be terminated and restarted with the following API. This API is useful when the Clingo program takes much time and the user want to interrupt it. Moreover, please re-initialize the Clingo WASM after restarting the worker.

```html
<script>
  async function restart() {
    await clingo.restart(
      "https://cdn.jsdelivr.net/npm/clingo-wasm@VERSION/dist/clingo.wasm"
    ); // re-initialize Clingo
  }

  restart();
</script>
```

## Developers

### Build WASM file

Run `npm run build:wasm` if you have Docker. For testing purposes, you can run `scripts/build_clingo.sh` from the root directory of the project.

### Build and Test JavaScript

Run `npm run build` to build the js files. Run `npm test` to run tests in node.

### Update Lua, Clingo, or Emscripten

Update the versions in `scripts/versions.sh` and in the badges in this `README.md`. Then push to a new branch and let GitHub actions build the new WASM file.

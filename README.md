# Clingo WebAssembly

[![npm version](https://img.shields.io/npm/v/clingo-wasm.svg)](https://www.npmjs.com/package/clingo-wasm)
[![CDN](https://data.jsdelivr.com/v1/package/npm/clingo-wasm/badge?style=rounded)](https://www.jsdelivr.com/package/npm/clingo-wasm)
[![Clingo version](https://img.shields.io/badge/Clingo-5.4.1-blue)](https://github.com/potassco/clingo)
[![Lua version](https://img.shields.io/badge/Lua-5.3.6-blue)](https://github.com/lua/lua)
[![Emscripten version](https://img.shields.io/badge/Emscripten-2.0.16-blue)](https://emscripten.org)
[![Build WASM](https://github.com/domoritz/clingo-wasm/actions/workflows/release.yml/badge.svg)](https://github.com/domoritz/clingo-wasm/actions/workflows/release.yml)

[Clingo](https://github.com/potassco/clingo) compiled to [WebAssembly](https://webassembly.org/) with [Emscripten](https://kripken.github.io/emscripten-site/).
Try it online at https://observablehq.com/@cmudig/clingo or https://domoritz.github.io/clingo-wasm.

**The API is not finalized and may change.**

This repo combines work from two previous repos: https://github.com/Aluriak/webclingo-example and https://github.com/domoritz/wasm-clingo.

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

## Developers

### Build WASM file

Run `yarn build:wasm` if you have docker. For testing purposes, you can run `scripts/build_clingo.sh` from the root directory of the project.

### Build and Test JavaScript

Run `yarn build` to build the js files. Run `yarn test` to run tests in node.

### Update Lua, Clingo, or Emscripten

Update the versions in `scripts/versions.sh` and in the badges in this `README.md`. Then push to a new branch and let GitHub actions build the new WASM file.

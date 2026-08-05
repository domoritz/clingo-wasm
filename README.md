# Clingo WebAssembly

[![npm version](https://img.shields.io/npm/v/clingo-wasm.svg)](https://www.npmjs.com/package/clingo-wasm)
[![CDN](https://data.jsdelivr.com/v1/package/npm/clingo-wasm/badge?style=rounded)](https://www.jsdelivr.com/package/npm/clingo-wasm)
[![Clingo version](https://img.shields.io/badge/Clingo-5.8.1-blue)](https://github.com/potassco/clingo)
[![Lua version](https://img.shields.io/badge/Lua-5.4.6-blue)](https://github.com/lua/lua)
[![Emscripten version](https://img.shields.io/badge/Emscripten-6.0.5-blue)](https://emscripten.org)
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

### Streaming Models

To receive models as Clingo finds them instead of all at once at the end, pass a callback to `run`:

```js
await clingo.run("{a; b; c}.", 0, [], (model) => console.log(model.Value));
```

or use the `stream` async generator:

```js
for await (const model of clingo.stream("{a; b; c}.", 0)) {
  console.log(model.Value);
}
```

In the browser, models arrive while solving runs in the worker. In Node, solving blocks, so the callback fires during the run but the generator yields only once solving finishes.

### Parallel Solving

The package ships a second build of Clingo with thread support and picks it automatically when the environment allows. Where threads are available, Clingo's parallel solving options work:

```js
if (clingo.supportsThreads()) {
  await clingo.run("{a; b; c}.", 0, ["-t 4"]);
}
```

Threads need `SharedArrayBuffer`: in Node it is always available (Node 21 or later), in browsers only on [cross-origin isolated](https://web.dev/articles/coop-coep) pages served with the COOP/COEP headers. Everywhere else the single-threaded build is used and `-t` reports an error. Use at most `navigator.hardwareConcurrency` threads, and note that passing a custom wasm URL to `init` selects the single-threaded build.

## Developers

### Build WASM file

Run `npm run build:wasm` if you have Docker. For testing purposes, you can run `scripts/build_clingo.sh` from the root directory of the project.

### Build and Test JavaScript

Run `npm run build` to build the js files. Run `npm test` to run tests in node.

### Update Lua, Clingo, or Emscripten

Update the versions in `scripts/versions.sh` and in the badges in this `README.md`. Then push to a new branch and let GitHub actions build the new WASM file.


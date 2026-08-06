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

The package is an ES module and needs Node 22 or a modern browser. Solving runs in a worker, so all commands are asynchronous, and a long-running solve can be aborted with `clingo.restart()`.

### Node

`npm install clingo-wasm` or `yarn add clingo-wasm`.

```js
import clingo from "clingo-wasm";

console.log(await clingo.run("a. b :- a."));
```

(`const clingo = require("clingo-wasm")` works too.)

### In the Browser

Import Clingo from the [JSDelivr CDN](https://www.jsdelivr.com/package/npm/clingo-wasm) — the wasm files load from the CDN automatically:

```html
<script type="module">
  import clingo from "https://cdn.jsdelivr.net/npm/clingo-wasm@VERSION/dist/index.web.js";

  console.log(await clingo.run("a. b :- a."));
  console.log(await clingo.run("{a; b; c}.", 0));
</script>
```

Bundlers pick up the package's worker and wasm files automatically as well (Vite needs `worker: { format: "es" }` in its config). To host the wasm file somewhere else, pass its URL to `clingo.init`, which throws if the wasm cannot be loaded.

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

Models arrive while solving, which runs in a worker in both the browser and Node.

### Parallel Solving

The package ships a second build of Clingo with thread support and picks it automatically when the environment allows. Where threads are available, Clingo's parallel solving options work:

```js
if (clingo.supportsThreads()) {
  await clingo.run("{a; b; c}.", 0, ["-t 4"]);
}
```

Threads need `SharedArrayBuffer`: in Node it is always available, in browsers only on [cross-origin isolated](https://web.dev/articles/coop-coep) pages served with the COOP/COEP headers. Everywhere else the single-threaded build is used and `-t` reports an error. Use at most `navigator.hardwareConcurrency` threads, and note that passing a custom wasm URL to `init` selects the single-threaded build.

## Developers

### Build WASM file

Run `npm run build:wasm` if you have Docker. For testing purposes, you can run `scripts/build_clingo.sh` from the root directory of the project.

### Build and Test JavaScript

Run `npm run build` to build the js files. Run `npm test` to run tests in node.

### Update Lua, Clingo, or Emscripten

Update the versions in `scripts/versions.sh` and in the badges in this `README.md`. Then push to a new branch and let GitHub actions build the new WASM file.


# Clingo WebAssembly

[![npm version](https://img.shields.io/npm/v/clingo-wasm.svg)](https://www.npmjs.com/package/clingo-wasm)
[![CDN](https://data.jsdelivr.com/v1/package/npm/clingo-wasm/badge?style=rounded)](https://www.jsdelivr.com/package/npm/clingo-wasm)
[![Clingo version](https://img.shields.io/badge/Clingo-5.4.0-blue)](https://github.com/potassco/clingo)
[![Lua version](https://img.shields.io/badge/Lua-5.3.5-blue)](https://github.com/lua/lua)
![Build WASM](https://github.com/domoritz/clingo-wasm/workflows/Build%20WASM/badge.svg)

[Clingo](https://github.com/potassco/clingo) compiled to [WebAssembly](https://webassembly.org/) with [Emscripten](https://kripken.github.io/emscripten-site/).

**This is work in progress!**

This repo combines work from two previous repos: https://github.com/Aluriak/webclingo-example and https://github.com/domoritz/wasm-clingo.

## Installation

### Using NPM or Yarn

`npm install clingo-wasm` or `yarn add clingo-wasm`.

### Without NPM

Load Clingo from the [JSDelivr CDN](https://www.jsdelivr.com/package/npm/clingo-wasm).

```html
<script src="https://cdn.jsdelivr.net/npm/clingo-wasm@VERSION"></script>
```

## Usage

TODO

## Developers

### Build WASM file

Run `yarn build` if you have docker. For testing purposes, you can run `scripts/build_clingo.sh` from the root directory of the project.

### Update Lua or Clingo

Update the versions in `scripts/versions.sh` and in the badges in this `README.md`. Then push to a new branch and let Travis build the new WASM file.

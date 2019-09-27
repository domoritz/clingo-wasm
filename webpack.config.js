// Adapted from https://gist.github.com/surma/b2705b6cca29357ebea1c9e6e15684cc 
/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const webpack = require("webpack");
const path = require("path");

module.exports = {
  mode: "development",
  context: path.resolve(__dirname, "."),
  entry: "./index.web.ts",
  output: {
    path: path.resolve(__dirname),
    filename: "web.js",
  },
  // This is necessary due to the fact that emscripten puts both Node and web
  // code into one file. The node part uses Node’s `fs` module to load the wasm
  // file.
  // Issue: https://github.com/kripken/emscripten/issues/6542.
  node: {
    "fs": "empty"
  },
  resolve: {
    extensions: ['ts', '.js'],
  },
  module: {
    rules: [
      // Typescript
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // Emscripten JS files define a global. With `exports-loader` we can 
      // load these files correctly (provided the global’s name is the same
      // as the file name).
      {
        test: /clingo\.js$/,
        loader: "exports-loader"
      },
      // wasm files should not be processed but just be emitted and we want
      // to have their public URL.
      {
        test: /clingo\.wasm$/,
        type: "javascript/auto",
        loader: "file-loader",
        options: {
          publicPath: "dist/"
        }
      }
    ]
  },
};

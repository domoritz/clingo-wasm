const path = require("path");
const webpack = require("webpack");

// The emscripten-generated clingo.js requires node builtins with the "node:"
// scheme (e.g. require("node:fs")), which bypasses the browser field mappings
// in package.json. Strip the prefix so those mappings apply in web builds.
const nodeSchemePlugin = new webpack.NormalModuleReplacementPlugin(
  /^node:/,
  (resource) => {
    resource.request = resource.request.replace(/^node:/, "");
  }
);

module.exports = [
  {
    mode: "production",
    target: "web",
    entry: "./src/index.web.ts",
    plugins: [nodeSchemePlugin],
    module: {
      rules: [
        {
          test: /\.worker\.ts$/,
          loader: "worker-loader",
          options: { inline: "fallback" },
        },
        {
          // The threaded module is also emitted as a standalone asset
          // (imported with a ?url query) so its pthread workers can be
          // spawned from a real URL.
          test: /clingo-mt\.js$/,
          resourceQuery: /url/,
          type: "asset/resource",
          generator: {
            filename: "[base]",
            publicPath: "/dist/",
          },
        },
        {
          test: /clingo(-mt)?\.js$/,
          resourceQuery: { not: [/url/] },
          loader: "exports-loader",
          options: {
            exports: "Module",
          },
        },
        {
          test: /\.wasm$/,
          type: "asset/resource",
          generator: {
            filename: "[base]",
            publicPath: "/dist/",
          },
        },
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      filename: "clingo.web.js",
      path: path.resolve(__dirname, "./dist"),
      library: "clingo",
      libraryTarget: "umd",
    },
  },
  {
    mode: "production",
    target: "node",
    entry: "./src/index.node.ts",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      filename: "clingo.node.js",
      path: path.resolve(__dirname, "./dist"),
      libraryTarget: "commonjs",
    },
  },
];

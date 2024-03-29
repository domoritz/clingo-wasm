const path = require("path");

module.exports = [
  {
    mode: "production",
    target: "web",
    entry: "./src/index.web.ts",
    module: {
      rules: [
        {
          test: /\.worker\.ts$/,
          loader: "worker-loader",
          options: { inline: "fallback" },
        },
        {
          test: /clingo\.js$/,
          loader: "exports-loader",
          options: {
            exports: "Module",
          },
        },
        {
          test: /\.wasm$/,
          type:
            "javascript/auto" /** this disabled webpacks default handling of wasm */,
          use: [
            {
              loader: "file-loader",
              options: {
                publicPath: "/dist/",
                name: "clingo.wasm",
              },
            },
          ],
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

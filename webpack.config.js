const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.web.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /clingo\.js$/,
        loader: "exports-loader",
        options: {
          exports: "Module",
        },
      },
      {
        test: /clingo\.wasm$/,
        type: "javascript/auto",
        loader: "file-loader",
        options: {
          publicPath: "dist/",
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "clingo.js",
    path: path.resolve(__dirname, "./dist"),
    library: "clingo",
    libraryTarget: "umd",
  },
  experiments: {
    topLevelAwait: true,
    asyncWebAssembly: true
  }
};

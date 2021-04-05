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
          exports: 'Module'
        }
      },
      {
        test: /\.worker\.(js|ts)$/i,
        use: [{
          loader: 'comlink-loader',
          options: {
            singleton: true
          }
        }]
      },
      {
        test: /\.wasm$/,
        type:
          "javascript/auto" /** this disabled webpacks default handling of wasm */,
        use: [
          {
            loader: "file-loader",
            options: {
              publicPath: "/dist/"
            }
          }
        ]
      }
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

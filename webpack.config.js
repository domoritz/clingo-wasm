const path = require("path");

module.exports = [{
  mode: "production",
  target: "web",
  entry: "./src/index.web.ts",
  module: {
    rules: [
      {
        test: /\.worker\.ts$/,
        use: { loader: "worker-loader" },
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
              name: "clingo.wasm"
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "clingo.web.js",
    path: path.resolve(__dirname, "./dist"),
    library: "clingo",
    libraryTarget: "umd"
  }
}, {
  mode: "production",
  target: 'node',
  entry: "./src/index.node.ts",
  module: {
    rules: [
      {
        test: /clingo\.js$/,
        loader: "exports-loader",
        options: {
          exports: "Module",
        },
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "clingo.node.js",
    path: path.resolve(__dirname, "./dist")
  },
}];

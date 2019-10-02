const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.web.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /clingo\.js$/,
        loader: "exports-loader"
      },
      {
        test: /clingo\.wasm$/,
        type: "javascript/auto",
        loader: "file-loader",
        options: {
          publicPath: "dist/"
        }
      }
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'web.js',
    path: path.resolve(__dirname, './dist'),
  },
  node: {
    "fs": "empty"
  }
};

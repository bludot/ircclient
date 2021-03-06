// webpack.config.js
var webpack = require('webpack');

module.exports = {
  context: __dirname + '/src',
  entry: './entry.js',

  output: {
    filename: 'bundle.js',
    path: __dirname + '/compiled'
  },

  module: {
    loaders: [
      {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          query: {
                  presets: ['es2015', 'react']
                }
        }
    ]
  }
};

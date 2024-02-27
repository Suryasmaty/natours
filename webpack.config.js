const path = require('path');
module.exports = {
  mode: 'development', // or 'production' for production mode
  entry: './public/js/index.mjs', // Entry point of your application
  output: {
    path: path.resolve(__dirname, 'public/js'), // Output directory
    filename: 'bundle.js', // Output filename
  },
  resolve: {
    extensions: ['.js', '.mjs'], // Add '.js' extension to the resolve.extensions array
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults', modules: false }],
            ],
          },
        },
      },
    ],
  },
};

const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    publicPath: '.',
    configureWebpack: {
      performance: {
        maxAssetSize: 2000000,
        maxEntrypointSize: 2000000
      },
      plugins: [
        new CopyWebpackPlugin({
          patterns: [
            { from: '../node_modules/handsontable/dist/*.css', to: 'assets/handsontable/dist/[name][ext]' },
            { from: '../node_modules/handsontable/styles/*.css', to: 'assets/handsontable/styles/[name][ext]' },
          ],
        }),
      ],
    },
    devServer: {
      historyApiFallback: true,
    },
}

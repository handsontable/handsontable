module.exports = {
    publicPath: '.',
    configureWebpack: {
      performance: {
        maxAssetSize: 2000000,
        maxEntrypointSize: 2000000
      }
    }
}

const path = require('path');
const { spawnProcess } = require('../../tools/utils');

spawnProcess('webpack --config ./angular-webpack.config.js', {
  cwd: path.resolve(__dirname, '.'),
});

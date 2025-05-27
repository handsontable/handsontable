const path = require('path');
const { spawnProcess } = require('../../tools/utils');

const cwd = path.resolve(__dirname, '.');

spawnProcess('npm run umd-builder:full-build', { cwd }, true);

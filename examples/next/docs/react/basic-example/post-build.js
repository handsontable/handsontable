// this script renames the production folder from `build` to `dist`
// it's because other frameworks name their production folder named `dist`

const fs = require('fs');
const path = require('path');

fs.renameSync(path.join(__dirname, 'build'), path.join(__dirname, 'dist'));

const ORDER = [
  'handsontable',
  'angular-handsontable',
  'react-handsontable',
  'vue-handsontable'
];

const { spawnProcess } = require('./common');
const [/* node bin */, /* path to this script */, command] = process.argv;

ORDER.forEach((project) => {
  spawnProcess(`npm run in ${project} ${command} -- --if-present`);
});


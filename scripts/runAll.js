const ORDER = [
  'handsontable',
  'angular-handsontable',
  'react-handsontable',
  'vue-handsontable'
];

const { spawnSync } = require('child_process');

const [/* node bin */, /* path to this script */, command] = process.argv;
let hasErrors = false;

ORDER.forEach((project) => {
  if (hasErrors) {
    return;
  }
  const spawnedCommand = spawnSync('npm', [
    'run',
    'in',
    project,
    command
  ], {
    stdio: 'inherit'
  });

  if (spawnedCommand.status) {
    hasErrors = true;
  }
});

if (hasErrors) {
  process.exitCode = 1;
}


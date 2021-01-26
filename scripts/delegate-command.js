const { spawn } = require('child_process');

const [/* node bin */, /* path to this script */, project, command, args] = process.argv;
const PROJECT_ALIASES = {
  angular: 'angular-handsontable',
  react: 'react-handsontable',
  vue: 'vue-handsontable'
};
const commandArray = [
  'run',
  command
];

if (args) {
  commandArray.push(args);
}

const spawnedCommand = spawn('npm', commandArray, {
  cwd: (project === 'handsontable' ? '.' : `./wrappers/${PROJECT_ALIASES[project] || project}`),
  stdio: 'inherit'
});

spawnedCommand.on('error', (error) => {
  // eslint-disable-next-line no-restricted-globals
  console.log(`error: ${error.message}`);
});

spawnedCommand.on('close', (code) => {
  process.exitCode = code;
});

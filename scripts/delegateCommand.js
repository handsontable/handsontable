const [ /* node bin */, /* path to this script */, project, command] = process.argv;
const { spawn } = require('child_process');

const spawnedCommand = spawn('npm', [
  'run',
  command
], {
  cwd: (project === 'handsontable' ? '.' : `./wrappers/${project}`),
  stdio: 'inherit'
});

spawnedCommand.on('error', (error) => {
  console.log(`error: ${error.message}`);
});

spawnedCommand.on('close', (code) => {
  process.exitCode = code;
});

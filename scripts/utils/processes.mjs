import execa from 'execa';

/**
 * Spawn a process.
 *
 * @param {string} command The command to spawn.
 * @param {boolean} [silent] `true` if there's supposed to be no output to the console.
 */
export async function spawnProcess(command, silent = false) {
  const cmdSplit = command.split(' ');
  const mainCmd = cmdSplit[0];
  const spawnOptions = {
    silent
  };

  cmdSplit.shift();

  if (!spawnOptions.silent) {
    spawnOptions.stdio = 'inherit';
  }

  return execa(mainCmd, cmdSplit, spawnOptions);
}

/**
 * Execute the provided command for the specified project.
 *
 * @param {string} project Project name. Either full (e.g. `vue-handsontable`) or shortened (`vue`).
 * @param {string} command Command to be executed.
 * @param {string} args Additional arguments to be applied for the executed command.
 * @returns {Promise}
 */
export async function delegateCommand(project, command, args) {
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

  try {
    await execa('npm', commandArray, {
      cwd: (project === 'handsontable' ? '.' : `./wrappers/${PROJECT_ALIASES[project] || project}`),
      stdio: 'inherit'
    });
  } catch (error) {
    process.exit(error.exitCode);
  }
}

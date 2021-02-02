import execa from 'execa';

/**
 * Spawn a process.
 *
 * @param {string} command The command to spawn.
 * @param {boolean} [silent] `true` if there's supposed to be no output to the console.
 * @param {Function} [callback] A callback to be called _before_ a potential end to the process.
 * @param {Function} [errCallback] A callback to be called if the process exited with an error..
 */
export async function spawnProcess(command, silent = false, callback, errCallback) {
  const cmdSplit = command.split(' ');
  const mainCmd = cmdSplit[0];
  const spawnOptions = {
    silent
  };

  cmdSplit.shift();

  if (!spawnOptions.silent) {
    spawnOptions.stdio = 'inherit';
  }

  try {
    const processInfo = await execa(mainCmd, cmdSplit, spawnOptions);

    if (callback) {
      callback(processInfo);
    }

    return processInfo;

  } catch (error) {

    if (errCallback) {
      errCallback(error);
    }

    process.exit(error.exitCode);
  }
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

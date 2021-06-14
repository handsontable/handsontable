import execa from 'execa';

/**
 * Spawn a process.
 *
 * @param {string} command The command to spawn.
 * @param {object} [options] Options object to be passed to the child process.
 * @returns {execa.ExecaChildProcess}
 */
export async function spawnProcess(command, options = {}) {
  const cmdSplit = command.split(' ');
  const mainCmd = cmdSplit[0];

  cmdSplit.shift();

  if (!options.silent) {
    options.stdin = options.stdin ?? 'inherit';
    options.stdout = options.stdout ?? 'inherit';
    options.stderr = options.stderr ?? 'inherit';
  }

  return execa(mainCmd, cmdSplit, options);
}

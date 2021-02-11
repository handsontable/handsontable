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

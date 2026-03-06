import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import concurrently from 'concurrently';
import { Writable } from 'stream';
import { command as execaCommand } from 'execa';
import debounce from 'lodash.debounce';

const argv = yargs(hideBin(process.argv))
  .array('cmdToListen')
  .string('runnerFile')
  .demandOption(['runnerFile'])
  .argv;

const PUPPETEER_CMD = 'node test/scripts/run-puppeteer.mjs';
const PUPPETEER_KILL_TIMEOUT = 2000;
const writableStream = new Writable();
let targetProcess = null;

const spawnPuppeteer = debounce(() => {
  console.log(`${PUPPETEER_CMD} ${argv.runnerFile}`);
  targetProcess = execaCommand(`${PUPPETEER_CMD} ${argv.runnerFile}`, {
    stdin: 'ignore',
  });

  targetProcess.stdout.pipe(process.stdout);
  targetProcess.stderr.pipe(process.stderr);
}, PUPPETEER_KILL_TIMEOUT);

writableStream._write = (chunk, encoding, next) => {
  // strip colorized logs that may occurs while executing commands
  const chunkRawText = chunk.toString().replace(/\x1B[[(?);]{0,2}(;?\d)*./g, '');
  const isProcessFinished = /\x9d\t\x9d/.test(chunkRawText);

  if (isProcessFinished) {
    if (targetProcess && !targetProcess.killed) {
      targetProcess.kill('SIGTERM', {
        forceKillAfterTimeout: Math.max(100, PUPPETEER_KILL_TIMEOUT - 1000),
      });
    }

    spawnPuppeteer();
  }

  // forward logs to the stdout stream (bash screen)
  process.stdout.write(chunk, encoding, next);
}

await concurrently(argv.cmdToListen, {
  prefix: 'none',
  killOthers: ['failure', 'success'],
  outputStream: writableStream,
});

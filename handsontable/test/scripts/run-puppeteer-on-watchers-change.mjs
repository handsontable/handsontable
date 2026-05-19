import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import concurrently from 'concurrently';
import { Writable } from 'stream';
import { command as execaCommand } from 'execa';
import debounce from 'lodash.debounce';

const argv = yargs(hideBin(process.argv))
  .array('cmdToListen')
  .string('runnerFile')
  .argv;

const PUPPETEER_CMD = 'node test/scripts/run-puppeteer.mjs';
const PUPPETEER_KILL_TIMEOUT = 2000;
const writableStream = new Writable();
let targetProcess = null;

// Only forward `--runnerFile` when the caller gave one (e.g. the Walkontable
// watch script that targets a fixed `SpecRunner.html`). When it's omitted,
// let `run-puppeteer.mjs` resolve its own per-run HTML from
// `--testPathPattern` + `--theme`, so two parallel `test:e2e.watch`
// invocations don't both open the same shared `test/E2ERunner.html`.
const puppeteerArgs = argv.runnerFile ? ` ${argv.runnerFile}` : '';

const spawnPuppeteer = debounce(() => {
  console.log(`${PUPPETEER_CMD}${puppeteerArgs}`);
  targetProcess = execaCommand(`${PUPPETEER_CMD}${puppeteerArgs}`, {
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

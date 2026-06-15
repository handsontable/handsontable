import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import concurrently from 'concurrently';
import { Writable } from 'stream';
import { command as execaCommand } from 'execa';
import debounce from 'lodash.debounce';

const argv = yargs(hideBin(process.argv))
  .array('cmdToListen')
  .string('runnerFile')
  .string('testPathPattern')
  .string('theme')
  .argv;

const IS_TTY = process.stdout.isTTY;

// Suppress DEP0190 Node.js warning in all child processes.
// Must be set before concurrently spawns children so they inherit the env.
process.env.NODE_NO_WARNINGS = '1';

// concurrently pipes child stdout, breaking process.stdout.isTTY in sub-scripts.
// HOT_QUIET=1 tells run-step.mjs to use quiet mode even without a visible TTY.
if (IS_TTY) {
  process.env.HOT_QUIET = '1';
}

// Propagate testPathPattern and theme so both the dump step and Puppeteer
// compute the same run ID and open the matching HTML file.
if (argv.testPathPattern) {
  process.env.npm_config_testpathpattern = argv.testPathPattern;
}
if (argv.theme) {
  process.env.npm_config_theme = argv.theme;
}

// On TTY suppress npm lifecycle headers; on CI keep full output.
const silentize = cmd => (IS_TTY ? cmd.replace(/^npm run /, 'npm --silent run ') : cmd);
const commands = argv.cmdToListen.map(silentize);

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
  console.log(`${PUPPETEER_CMD}${puppeteerArgs}`); // eslint-disable-line no-console
  targetProcess = execaCommand(`${PUPPETEER_CMD}${puppeteerArgs}`, {
    stdin: 'ignore',
  });

  targetProcess.stdout.pipe(process.stdout);
  targetProcess.stderr.pipe(process.stderr);
}, PUPPETEER_KILL_TIMEOUT);

writableStream._write = (chunk, encoding, next) => {
  // strip colorized logs that may occurs while executing commands
  // eslint-disable-next-line no-control-regex
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

  if (IS_TTY) {
    // On TTY suppress all build/watcher output — Puppeteer pipes its own
    // stdout/stderr directly to process.stdout so its lines still appear.
    next();
  } else {
    // On CI forward everything for full log visibility.
    process.stdout.write(chunk, encoding, next);
  }
};

await concurrently(commands, {
  prefix: 'none',
  killOthers: ['failure', 'success'],
  outputStream: writableStream,
});

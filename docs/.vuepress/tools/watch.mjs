import watch from 'glob-watcher';
import { spawn, exec } from 'node:child_process';
import process from 'node:process';
import browserSync from 'browser-sync';

/* eslint-disable no-console, no-restricted-globals */

const watcherJs = watch([
  './content/**/*.js',
  './content/**/*.jsx',
  './content/**/*.html',
  './content/**/*.css',
  '!./**/sidebar.js',
]);

const watcherTs = watch(['./content/**/*.ts', './content/**/*.tsx']);

const bs = browserSync.create();
let jsReload = true;

/**
 * Start a new one process
 * Listens for the success message from vuepress and init or reloads the browser
 * Browser sync is creating a proxy to the vuepress server.
 *
 * @returns {ChildProcess}
 */
const startProcess = () => {
  const newDocProcess = spawn(
    'npm',
    [
      'run',
      process.env.VUEPRESS_NO_CACHE ? 'docs:start:no-cache' : 'docs:start',
    ],
    {
      stdio: 'pipe',
      detached: true,
    }
  );

  newDocProcess.stdin.setEncoding('utf-8');
  newDocProcess.stdout.pipe(process.stdout);

  if (newDocProcess) {
    newDocProcess.stdout.on('data', (data) => {
      if (data.toString().includes('Compiling Client')) {
        console.log('Building ... (it could take 1-2 minutes to rebuild)"');
      }
      // vue press dev is returning patter `success [10:06:15] Build 01050a finished in 83 ms! ( http://localhost:8080/docs/ )`
      const test = new RegExp('success.*(http://localhost.*/)');

      if (data.toString().match(test)) {
        const url = data.toString().match(test)[1];

        if (jsReload) {
          if (bs.active) {
            bs.reload();
          } else {
            bs.init({
              proxy: url,
            });
          }
        }
        jsReload = false;
      }
    });
  }

  return newDocProcess;
};

let docProcess = startProcess();

/**
 * Listen for exit events then calls the exitHandler.
 *
 * @param {Function} exitHandler - Function to be called on exit.
 */
const onExitListener = (exitHandler) => {
  // do something when app is closing
  process.on('exit', exitHandler.bind(null, { cleanup: true }));
  // catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, { exit: true }));
  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
  // catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
};

/**
 * Used as method for onExitListener
 * Gracefully destroys the spawn process and exits the current process.
 *
 * @param {object} options - Options for the exitHandler.
 * @param {string} exitCode - Process exit code.
 */
const exitHandler = (options, exitCode) => {
  if (docProcess) {
    process.kill(-docProcess.pid);
    console.log('BYE BYE Handsontable developer !!!', 'Exit code', exitCode);
    docProcess = null;
  }
  process?.exit();
};

onExitListener(exitHandler);

/**
 * Watch for changes in the content folder and set jsReload flat to true
 * which triggers the browser reload after vuepress is rebuilt.
 */
watcherJs.on('change', (/* path , _stat */) => {
  jsReload = true;
});

/**
 * Watch for changes in the content folder and compiles typescript *.(ts|tsx) files
 * Once they are compiled watcher for js files is triggered.
 */
watcherTs.on('change', (path/* , _stat */) => {
  console.log(`File ${path} was changed`);
  exec(
    `npm run docs:code-examples:generate-js ${path}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);

        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    }
  );
});

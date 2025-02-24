import watch from "glob-watcher";
import { spawn, exec } from "node:child_process";
import process from "node:process";
import browserSync from "browser-sync";

const watcherJs = watch([
  "./content/**/*.js",
  "./content/**/*.html",
  "./content/**/*.css",
  "!./**/sidebar.js",
]);

const watcherTs = watch(["./content/**/*.ts", "./content/**/*.tsx"]);

/**
 *
 * @param {function} callback
 * @param {number} wait
 * @returns
 */
const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, wait);
  };
};

/**
 * Kills the process and whole pid group, then starts a new one
 * Listens for the success message from vuepress and init or reloads the browser
 * Browser stack is creating a proxy to the vuepress server
 * @param {ChildProcess} docProcess
 * @returns ChildProcess
 */
const restartProcess = (docProcess) => {
  if (docProcess) {
    process.kill(-docProcess.pid);
    docProcess = null;
  }
  let newDocProcess = spawn(
    "npm",
    [
      "run",
      process.env.VUEPRESS_NO_CACHE ? "docs:start:no-cache" : "docs:start",
    ],
    {
      stdio: "pipe",
      detached: true,
    }
  );

  newDocProcess.stdin.setEncoding("utf-8");
  newDocProcess.stdout.pipe(process.stdout);
  newDocProcess.stdout &&
    newDocProcess.stdout.on("data", (data) => {
      // vue press dev is returning patter `success [10:06:15] Build 01050a finished in 83 ms! ( http://localhost:8080/docs/ )`
      const test = new RegExp("success.*(http://localhost.*/)");
      if (data.toString().match(test)) {
        const url = data.toString().match(test)[1];
        if (bs.active) {
          bs.reload();
        } else {
          bs.init({
            proxy: url,
          });
        }
      }
    });
  return newDocProcess;
};
/**
 * Listen for exit events then calls the exitHandler
 * @param {function} exitHandler
 */
const onExitListener = (exitHandler) => {
  // do something when app is closing
  process.on("exit", exitHandler.bind(null, { cleanup: true }));
  // catches ctrl+c event
  process.on("SIGINT", exitHandler.bind(null, { exit: true }));
  // catches "kill pid" (for example: nodemon restart)
  process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
  process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
  // catches uncaught exceptions
  process.on("uncaughtException", exitHandler.bind(null, { exit: true }));
};

let bs = browserSync.create();
let docProcess = restartProcess();

/**
 * Restarts the server by calling the `restartProcess` function
 */
const restartServer = () => {
  console.log("Restarting the server");
  docProcess = restartProcess(docProcess);
};

/**
 * Used as method for onExitListener
 * Gracefully destroys the spawn process and exits the current process
 * @param {*} options
 * @param {*} _exitCode
 */
const exitHandler = (options, _exitCode) => {
  if (docProcess) {
    process.kill(-docProcess.pid);
    console.log("BYE BYE Handsontable developer !!!");
    docProcess = null;
  }
  if (options.exit) process.exit();
};

onExitListener(exitHandler);

/**
 * Watch for changes in the content folder and restart the server in content *.(html|js|css) files
 */
watcherJs.on("change", function (path, _stat) {
  debounce(restartServer, 1000)();
  console.log(`File ${path} was changed`);
});

/**
 * Watch for changes in the content folder and compiles typescript *.(ts|tsx) files
 * Once they are compiled watcher for js files is triggered
 */
watcherTs.on("change", function (path, _stat) {
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

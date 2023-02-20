/*
 * This script:
 * - Runs a background `http-server` for each framework example.
 * - Runs Handsontable's visual tests.
 * - Takes screenshots and prepares them for upload to an external service (Argos).
 */
import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import chalk from 'chalk';
import mainPackageJSON from '../package.json' assert { type: 'json' };
import { isReferenceBranch, getFrameworkList, sleep, killProcess } from './utils/utils.mjs';
import { WRAPPERS, REFERENCE_FRAMEWORK, EXAMPLES_SERVER_PORT } from '../src/config.mjs';

const playwrightVersion = mainPackageJSON.devDependencies.playwright;
const pathToMount = path.resolve(process.cwd(), '..');
const dirs = {
  examples: '../examples/next/visual-tests',
  codeToRun: 'demo',
  screenshots: './screenshots',
};

console.log(chalk.green('Running Visual Tests...'));

// if we're on the reference branch, we create screenshots for the main framework only
const frameworksToTest = getFrameworkList();

for (let i = 0; i < frameworksToTest.length; i++) {
  const frameworkName = frameworksToTest[i];
  const localhostProcess = execa.command(`npm run serve -- --port=${EXAMPLES_SERVER_PORT}`, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    cwd: `${dirs.examples}/${frameworkName}/${dirs.codeToRun}`
  });

  // make sure that the `http-server` has time to load and serve examples
  await sleep(1000);

  if (localhostProcess.exitCode > 0) {
    throw new Error(`The examples static server startup failed. The port ${EXAMPLES_SERVER_PORT} is already in use.`);
  }

  console.log(chalk.green(`Testing "${frameworkName}" examples...`));

  try {
    if (process.env.CI) {
      await execa.command('npx playwright test', {
        env: {
          HOT_FRAMEWORK: frameworkName
        },
        stdout: 'inherit'
      });
    } else {
      // we need access to the `examples` and `virtual-tests` directories,
      // so we mount the entire Handsontable directory as a virtual `vtests` directory,
      // and then open the `visual-tests` directory inside of `vtests`
      const dockerCommand = `docker run \
        --rm \
        -it \
        --name vtests-container \
        --env HOT_FRAMEWORK=${frameworkName} \
        -v ${pathToMount}:/vtests/ \
        -w /vtests/visual-tests \
        mcr.microsoft.com/playwright:v${playwrightVersion}-focal npx playwright test \
        --reporter=dot \
        --timeout=7000`;

      await execa.command(dockerCommand, { stdio: 'inherit' });
    }
  } catch (ex) {
    await killProcess(localhostProcess.pid);
    throw new Error(ex.message);
  }

  await killProcess(localhostProcess.pid);

  console.log(chalk.green(`Finished testing "${frameworkName}" examples.`));
  console.log('');
}

// the screenshots are ready
console.log(chalk.green('Done.'));

// if we're on the reference branch, we copy the screenshots to the remaining frameworks
if (isReferenceBranch()) {
  if (!fse.existsSync(dirs.screenshots)) {
    throw new Error(`Directory \`${dirs.screenshots}\` doesn't exist.`);
  }

  if (!fse.existsSync(`${dirs.screenshots}/${REFERENCE_FRAMEWORK}`)) {
    throw new Error(`Directory \`${dirs.screenshots}/${REFERENCE_FRAMEWORK}\` doesn't exist.`);
  }

  // Argos compares screenshot files of the same name and path,
  // so we need to make sure the paths are the same
  for (let i = 0; i < WRAPPERS.length; ++i) {
    fse.copySync(
      path.resolve(`${dirs.screenshots}/${REFERENCE_FRAMEWORK}`),
      path.resolve(`${dirs.screenshots}/${WRAPPERS[i]}`),
      { overwrite: true });
  }
}

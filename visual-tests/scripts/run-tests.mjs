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
import { isReferenceBranch, getFrameworkList, sleep, killProcess } from './utils/utils.mjs';
import {
  WRAPPERS,
  THEMES,
  REFERENCE_FRAMEWORK,
  EXAMPLES_SERVER_PORT
} from '../src/config.mjs';

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
    await execa.command('npx playwright test --reporter=dot', {
      env: {
        HOT_FRAMEWORK: frameworkName
      },
      stdout: 'inherit'
    });
  } catch (ex) {
    await killProcess(localhostProcess.pid);
    throw new Error(ex.message);
  }

  if (frameworkName === 'js') {
    console.log('');
    console.log(chalk.green(`Finished testing "${frameworkName}" examples.`));

    for (let themeIndex = 0; themeIndex < THEMES.length; themeIndex++) {
      const themeName = THEMES[themeIndex];

      console.log(chalk.green(`Testing JavaScript examples with "${themeName}" theme...`));

      try {
        await execa.command('npx playwright test --reporter=dot', {
          env: {
            HOT_FRAMEWORK: frameworkName,
            HOT_THEME: themeName,
          },
          stdout: 'inherit'
        });
      } catch (ex) {
        await killProcess(localhostProcess.pid);
        throw new Error(ex.message);
      }

      console.log('');
      console.log(chalk.green(`Finished testing examples with "${themeName}" theme.`));
    }
  } else {
    console.log('');
    console.log(chalk.green(`Finished testing "${frameworkName}" examples.`));
  }

  await killProcess(localhostProcess.pid);
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
      path.resolve(`${dirs.screenshots}/${REFERENCE_FRAMEWORK}/chromium/multi-frameworks`),
      path.resolve(`${dirs.screenshots}/${WRAPPERS[i]}/chromium/multi-frameworks`),
      { overwrite: true });
  }
}

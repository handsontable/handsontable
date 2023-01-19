/**
 * Visual testing runner and screenshots package builder responsible for following steps:
 * - builds all of examples for all of frameworks to test;
 * - runs visual testing;
 * - builds package of screenshots which will be send to compare by `upload` script.
 */
import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import chalk from 'chalk';
import mainPackageJSON from '../package.json' assert { type: 'json' };
import { isReferenceBranch, getFrameworkList, sleep } from './utils/utils.mjs';
import { WRAPPERS, REFERENCE_FRAMEWORK } from './utils/config.mjs';

const playwrightVersion = mainPackageJSON.devDependencies.playwright;
const pathToMount = `${process.cwd().split('\\').join('/')}/../`;
const dirs = {
  examples: '../examples/next/visual-tests',
  codeToRun: 'demo',
  screenshots: './screenshots',
};

console.log(chalk.green('Running Visual Tests...'));

// If we are on a base branch, we do not want to run all of tests
// and make screenshots for all of frameworks.
// On base branch we need to create golden screenshots from main framework only.
const frameworksToTest = getFrameworkList();

for (let i = 0; i < frameworksToTest.length; ++i) {
  const frameworkName = frameworksToTest[i];
  const localhostProcess = execa.command('npm run serve', {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    cwd: `${dirs.examples}/${frameworkName}/${dirs.codeToRun}`
  });

  // Make sure that the `http-server` has time to load and serve example
  await sleep(200);

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
      // we need access to `examples` and `virtual-tests` directories,
      // so here we mount entire HoT directory as a virtual `vtests`
      // and on start open `visual-tests` in it
      const dockerCommand = `docker run \
        --rm \
        -t \
        --name vtests-container \
        --env HOT_FRAMEWORK=${frameworkName} \
        -v ${pathToMount}:/vtests/ \
        -w /vtests/visual-tests \
        mcr.microsoft.com/playwright:v${playwrightVersion}-focal npx playwright test`;

      await execa.command(dockerCommand, { stdio: 'inherit' });
    }
  } catch {
    console.log(chalk.yellow(`There are reported some errors while testing "${frameworkName}" examples.`));
  }

  localhostProcess.kill();
  console.log(chalk.green(`Finished testing "${frameworkName}" examples.`));
  console.log('');
}

console.log(chalk.green('Done.'));

if (isReferenceBranch()) {
  // Golden screenshots are already done,
  // now we need to copy them into rest of frameworks -
  // external services compares files with the same name and path,
  // so we have to make this trick to make comparison available.
  // On other branches we will generate screenshots for frameworks in a "normal" way
  // and then we will be able to see differences
  if (!fse.existsSync(dirs.screenshots)) {
    throw new Error(`Directory \`${dirs.screenshots}\` doesn't exists`);
  }

  if (!fse.existsSync(`${dirs.screenshots}/${REFERENCE_FRAMEWORK}`)) {
    throw new Error(`Directory \`${dirs.screenshots}/${REFERENCE_FRAMEWORK}\` doesn't exists`);
  }

  for (let i = 0; i < WRAPPERS.length; ++i) {
    fse.copySync(
      path.resolve(`${dirs.screenshots}/${REFERENCE_FRAMEWORK}`),
      path.resolve(`${dirs.screenshots}/${WRAPPERS[i]}`),
      { overwrite: true });
  }
}

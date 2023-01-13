/**
 * Visual testing runner and screenshots package builder responsible for following steps:
 * - builds all of examples for all of wrappers to test;
 * - runs visual testing;
 * - builds package of screenshots which will be send to compare by `upload` script.
 */
import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import chalk from 'chalk';
import mainPackageJSON from '../package.json' assert { type: 'json' };
import { getCurrentBranchName, sleep } from './utils/utils.mjs';
import { baseBranch, wrappers } from './utils/config.mjs';

const currentBranch = getCurrentBranchName();
const playwrightVersion = mainPackageJSON.dependencies.playwright;
const pathToMount = `${process.cwd().split('\\').join('/')}/../`;
const dirs = {
  examples: '../examples/next/visual-tests',
  codeToRun: 'demo',
  screenshots: './screenshots',
};

console.log(chalk.green('Installing dependencies for Visual Tests Examples project...'));

await execa.command('npm install', {
  stdout: 'ignore',
  stderr: 'inherit',
  cwd: dirs.examples
});

// If we are on a base branch, we do not want to run all of tests
// and make screenshots for all of wrappers.
// On base branch we need to create golden screenshots from main wrapper only,
// which is declared as a first position in wrappers array.

for (let i = 0, maxi = (currentBranch === baseBranch ? 1 : wrappers.length); i < maxi; ++i) {
  console.log(chalk.green(`Installing dependencies for "${wrappers[i]}" examples...`));

  await execa.command('npm install', {
    stdout: 'ignore',
    stderr: 'inherit',
    cwd: `${dirs.examples}/${wrappers[i]}`
  });

  console.log(chalk.green(`Building "${wrappers[i]}" examples...`));

  await execa.command('npm run build', {
    stdout: 'ignore',
    stderr: 'inherit',
    cwd: `${dirs.examples}/${wrappers[i]}/${dirs.codeToRun}`
  });

  const localhostProcess = execa.command('npm run serve', {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    cwd: `${dirs.examples}/${wrappers[i]}/${dirs.codeToRun}`
  });

  // Make sure that the `http-server` has time to load and serve example
  await sleep(200);

  console.log(chalk.green(`Testing "${wrappers[i]}" examples...`));

  try {
    if (process.env.CI) {
      await execa.command('npx playwright test', {
        env: {
          HOT_WRAPPER: wrappers[i]
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
        --env HOT_WRAPPER=${wrappers[i]} \
        -v ${pathToMount}:/vtests/ \
        -w /vtests/visual-tests \
        mcr.microsoft.com/playwright:v${playwrightVersion}-focal npx playwright test`;

      await execa.command(dockerCommand, { stdio: 'inherit' });
    }
  } catch {
    console.log(chalk.yellow(`There are reported some errors while testing "${wrappers[i]}" examples.`));
  }

  localhostProcess.kill();
  console.log(chalk.green(`Finished testing "${wrappers[i]}" examples.`));
  console.log('');
}

console.log(chalk.green('Done.'));

if (currentBranch === baseBranch) {
  // Golden screenshots are already done,
  // now we need to copy them into rest of wrappers -
  // external services compares files with the same name and path,
  // so we have to make this trick to make comparison available.
  // On other branches we will generate screenshots for wrappers in a "normal" way
  // and then we will be able to see differences
  if (!fse.existsSync(dirs.screenshots)) {
    throw new Error(`Directory \`${dirs.screenshots}\` doesn't exists`);
  }

  if (!fse.existsSync(`${dirs.screenshots}/${wrappers[0]}`)) {
    throw new Error(`Directory \`${dirs.screenshots}/${wrappers[0]}\` doesn't exists`);
  }

  for (let i = 1; i < wrappers.length; ++i) {
    fse.copySync(
      path.resolve(`${dirs.screenshots}/${wrappers[0]}`),
      path.resolve(`${dirs.screenshots}/${wrappers[i]}`),
      { overwrite: true });
  }
}

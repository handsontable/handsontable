/**
 * Visual testing runner and screenshots package builder responsible for following steps:
 * - builds all of examples for all of wrappers to test;
 * - runs visual testing;
 * - builds package of screenshots which will be send to compare by `upload` script.
 */

/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */
import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
// eslint-disable-next-line import/extensions
import { baseBranch, wrappers } from './config.mjs';

const currentBranch = process?.env?.CURRENT_BRANCH;
const dirs = {
  init: process.cwd(),
  examples: '../examples/next/visual-tests',
  codeToRun: 'demo',
  screenshots: './tests/screenshots',
};

process.chdir(dirs.examples);
await execa.command('npm install');

// If we are on a base branch, we do not want to run all of tests
// and make screenshots for all of wrappers.
// On base branch we need to create golden screenshots from main wrapper only,
// which is declared as a first position in wrappers array.

for (let i = 0, maxi = (currentBranch === baseBranch ? 1 : wrappers.length); i < maxi; ++i) {
  process.chdir(`${wrappers[i]}`);
  // eslint-disable-next-line no-await-in-loop
  await execa.command('npm install', { stdout: 'inherit' });

  process.chdir(`${dirs.codeToRun}`);
  // eslint-disable-next-line no-await-in-loop
  await execa.command('npm run build', { stdout: 'inherit' });

  // eslint-disable-next-line no-await-in-loop
  const localhostProcess = execa.command('npm run start', {
    detached: true,
    stdio: 'ignore',
    windowsHide: true });

  process.chdir(dirs.init);

  console.log(`
  
  =====
  
  Run tests for ${wrappers[i]} wrapper
  
  =====
  
  `);
  // eslint-disable-next-line no-await-in-loop
  await execa.command('npx playwright test', { env: { HOT_WRAPPER: wrappers[i] }, stdout: 'inherit' });

  localhostProcess.kill();

  if (i !== maxi - 1) {
    process.chdir(dirs.examples);
  }
}

if (currentBranch === baseBranch) {
  // Golden screenshots are already done,
  // now we need to copy them into rest of wrappers -
  // external services compares files with the same name and path,
  // so we have to make this trick to make comparision available.
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

import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';

// Main wrapper should be defined as a first one -
// it will be used to generate golden screenshots,
// rest of wrappers will be compared to it.
const wrappers = ['js', 'angular-13', 'react'];
// const wrappers = ['js', 'angular-13', 'react', 'vue'];
const baseBranch = 'develop';
const currentBranchName = (await execa.command('git rev-parse --abbrev-ref HEAD', { silent: true })).stdout;
const dirs = {
  init: process.cwd(),
  examples: '../examples/next/visual-tests',
  codeToRun: 'demo',
};

// const HOTversion = '12.2.0';

process.chdir(dirs.examples);
execa.command('npm install');

// If we are on a base branch, we do not want to run all of tests
// and make screenshots for all of wrappers.
// On base branch we need to create golden screenshots from main wrapper only,
// which is declared as a first position in wrappers array.

for (let i = 0, maxi = (currentBranchName === baseBranch ? 1 : wrappers.length); i < maxi; ++i) {
  process.chdir(`${wrappers[i]}/${dirs.codeToRun}`);

  // eslint-disable-next-line no-await-in-loop
  await execa.command('npm install', { stdout: 'inherit' });
  // eslint-disable-next-line no-await-in-loop
  await execa.command('npm run build', { stdout: 'inherit' });
  // eslint-disable-next-line no-await-in-loop
  const localhostProcess = execa.command('npm run start', {
    detached: true,
    stdio: 'ignore',
    windowsHide: true });

  process.chdir(dirs.init);

  // eslint-disable-next-line no-await-in-loop
  await execa.command('npx playwright test', { env: { HOT_WRAPPER: wrappers[i] }, stdout: 'inherit' });

  localhostProcess.kill();

  if (i !== maxi - 1) {
    process.chdir(dirs.examples);
  }
}

if (currentBranchName === baseBranch) {
  // Golden screenshots are already done,
  // now we need to copy them into rest of wrappers -
  // external services compares files with the same name and path,
  // so we have to make this trick to make comparision available.
  // On other branches we will generate screenshots for wrappers in a "normal" way
  // and then we will be able to see differences

  const copies = [];

  for (let i = 1; i < wrappers.length; ++i) {
    copies.push(fse.copySync(
      path.resolve(`./tests/screenshots/${wrappers[0]}`),
      path.resolve(`./tests/screenshots/${wrappers[i]}`),
      { overwrite: true })
    );
  }

  await Promise.all(copies);
}

// import { spawnProcess } from './utils/processes.mjs';
import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';

const baseBranch = 'develop';
// const dockerImage = 'mcr.microsoft.com/playwright:v1.28.1-focal';
const currentBranchName = (await execa.command('git rev-parse --abbrev-ref HEAD', { silent: true })).stdout;
// Main wrapper should be defined as a first one -
// it will be used to generate golden screenshots,
// rest of wrappers will be compared to it.
const wrappers = ['js', 'angular-13', 'react', 'vue'];
// const version = '12.2.0';

// execa.command('git config --global --add safe.directory /__w/handsontable-visual-testing/handsontable-visual-testing');

if (process.env.docker) {
  // await execa.command(`docker pull ${dockerImage}`, { stdout: 'inherit' });
  // await execa.command(`docker run -v ${process.cwd()}/../:tests -w /tests --rm -i ${dockerImage} /bin/bash`);
}

// await execa.command('npx playwright install --with-deps');

const tests = [];

// If we are on a base branch, we do not want to run all of tests
// and make screenshots for all of wrappers.
// On base branch we need to create golden screenshots from main wrapper only,
// which is declared as a first position in wrappers array.

process.chdir('../examples/next/visual-tests');
execa.command('npm install');

for (let i = 0, maxi = (currentBranchName === baseBranch ? 1 : wrappers.length); i < maxi; ++i) {
  tests.push(await process.chdir(`${wrappers[i]}/demo`));

  // eslint-disable-next-line no-await-in-loop
  tests.push(await execa.command('npm install', { stdout: 'inherit' }));
  tests.push(await execa.command('npm run build', { stdout: 'inherit' }));
  tests.push(await execa.command('npm run start', { stdout: 'inherit' }));
  tests.push(await process.chdir('../../../../../visual-test'));

  tests.push(await execa.command('npx playwright test', { env: { HOT_WRAPPER: wrappers[i] }, stdout: 'inherit' }));

  if (i !== maxi - 1) {
    tests.push(await process.chdir('../examples/next/visual-tests'));
  }
}

await Promise.all(tests);

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


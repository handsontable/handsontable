/**
 * This script:
 * - Installs the examples' dependencies, one framework at a time, for the tier's frameworks only.
 * - Builds all the examples, for each framework that is going to be tested.
 */
import execa from 'execa';
import chalk from 'chalk';
import { REFERENCE_FRAMEWORK, WRAPPERS } from '../src/config.mjs';
import { getTier } from './utils/utils.mjs';

const ALL_FRAMEWORKS = [REFERENCE_FRAMEWORK, ...WRAPPERS];

const dirs = {
  monorepoRoot: '..',
  examples: '../examples/next/visual-tests',
  codeToRun: 'demo',
  screenshots: './screenshots',
};

const tier = getTier();
const frameworksToTest = tier.frameworks;

console.log(chalk.green(`Visual tier "${tier.name}": installing and building `
  + `${frameworksToTest.join(', ')} examples...`));

// Per framework rather than the whole `next/visual-tests` tree: the installer filters by path prefix
// (`examples/scripts/install-subpackages.mjs` and `link-packages.mjs`), and the Angular install is the
// slow one at about two minutes — the pr tier never pays for a wrapper it does not render.
//
// Except when the tier renders EVERY framework, which the `full` tier does. Each per-framework call
// runs `link-packages.mjs` over the whole tree, so four calls repeat that pass four times to install
// the same set the single whole-tree call installs with one pass. The filter buys nothing once
// nothing is being filtered out.
const rendersEveryFramework = frameworksToTest.length === ALL_FRAMEWORKS.length;

if (rendersEveryFramework) {
  console.log(chalk.green('Installing dependencies for every Visual Tests Examples project...'));

  await execa.command('npm run examples:install next/visual-tests', {
    stdout: 'ignore',
    stderr: 'inherit',
    cwd: dirs.monorepoRoot
  });
}

// One loop, not two: a framework builds as soon as its own install is done. That does not shorten the
// run — every call here is awaited in turn — but a broken build surfaces after the first framework
// rather than after all of the installs.
for (let i = 0; i < frameworksToTest.length; ++i) {
  const frameworkName = frameworksToTest[i];

  if (!rendersEveryFramework) {
    console.log(chalk.green(`Installing dependencies for "${frameworkName}" Visual Tests Examples project...`));

    await execa.command(`npm run examples:install next/visual-tests/${frameworkName}`, {
      stdout: 'ignore',
      stderr: 'inherit',
      cwd: dirs.monorepoRoot
    });
  }

  console.log(chalk.green(`Building "${frameworkName}" examples...`));

  await execa.command('npm run build', {
    stdout: 'ignore',
    stderr: 'inherit',
    cwd: `${dirs.examples}/${frameworkName}/${dirs.codeToRun}`
  });

  console.log(chalk.green(`Finished building "${frameworkName}" examples.`));
  console.log('');
}

console.log(chalk.green('Done.'));

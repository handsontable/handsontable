/**
 * This script:
 * - Installs the examples' dependencies, one framework at a time, for the tier's frameworks only.
 * - Builds all the examples, for each framework that is going to be tested.
 */
import execa from 'execa';
import chalk from 'chalk';
import { getTier } from './utils/utils.mjs';

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
for (let i = 0; i < frameworksToTest.length; ++i) {
  const frameworkName = frameworksToTest[i];

  console.log(chalk.green(`Installing dependencies for "${frameworkName}" Visual Tests Examples project...`));

  await execa.command(`npm run examples:install next/visual-tests/${frameworkName}`, {
    stdout: 'ignore',
    stderr: 'inherit',
    cwd: dirs.monorepoRoot
  });
}

for (let i = 0; i < frameworksToTest.length; ++i) {
  const frameworkName = frameworksToTest[i];

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

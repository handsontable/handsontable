/**
 * This script:
 * - Installs the examples' dependencies.
 * - Builds all the examples, for each framework that is going to be tested.
 */
import execa from 'execa';
import chalk from 'chalk';
import { getFrameworkList } from './utils/utils.mjs';

const dirs = {
  monorepoRoot: '..',
  examples: '../examples/next/visual-tests',
  codeToRun: 'demo',
  screenshots: './screenshots',
};

console.log(chalk.green('Installing dependencies for Visual Tests Examples project...'));

await execa.command('npm run examples:install next/visual-tests', {
  stdout: 'ignore',
  stderr: 'inherit',
  cwd: dirs.monorepoRoot
});

const frameworksToTest = getFrameworkList();

for (let i = 0; i < frameworksToTest.length; ++i) {
  const frameworkName = frameworksToTest[i];
  const packageName = frameworkName === 'js' ? 'handsontable' : `@handsontable/${frameworkName}`;

  console.log(chalk.green(`Building "${frameworkName}" examples...`));

  await execa.command(`node --experimental-json-modules ./scripts/swap-package-links.mjs ${packageName}`, {
    stdio: 'inherit',
    cwd: dirs.monorepoRoot
  });
  await execa.command('npm run build', {
    stdout: 'ignore',
    stderr: 'inherit',
    cwd: `${dirs.examples}/${frameworkName}/${dirs.codeToRun}`
  });

  console.log(chalk.green(`Finished building "${frameworkName}" examples.`));
  console.log('');
}

console.log(chalk.green('Done.'));

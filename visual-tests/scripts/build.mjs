/**
 * This script:
 * - Checks that the local builds the demos render exist, before it installs anything.
 * - Installs the examples' dependencies, one framework at a time, for the tier's frameworks only.
 * - Builds all the examples, for each framework that is going to be tested.
 */
import { join } from 'node:path';
import execa from 'execa';
import chalk from 'chalk';
import { REFERENCE_FRAMEWORK, WRAPPERS } from '../src/config.mjs';
import {
  findBuildProblems, formatProblems, preflightOptions, readConfirmations,
} from '../lib/local-builds.mjs';
import { getTier } from './utils/utils.mjs';

const ALL_FRAMEWORKS = [REFERENCE_FRAMEWORK, ...WRAPPERS];
const REPO_ROOT = join(import.meta.dirname, '..', '..');

// Absolute, like REPO_ROOT, so the script builds the same tree whichever directory it is started from.
const dirs = {
  monorepoRoot: REPO_ROOT,
  examples: join(REPO_ROOT, 'examples', 'next', 'visual-tests'),
  codeToRun: 'demo',
};

const tier = getTier();
const frameworksToTest = tier.frameworks;

/**
 * Installs and builds the tier's demos. Called only when the preflight found nothing, so no install can run
 * after a refusal.
 */
async function installAndBuild() {
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

    // The demo's own `build` script runs `check-linked-packages.mjs` first, which refuses when the install
    // left a registry copy of a monorepo package in place. Its refusal goes to stderr, which stays visible;
    // its confirmations go to stdout with the bundler's output, so they are picked out of it and printed.
    const { stdout } = await execa.command('npm run build', {
      stdout: 'pipe',
      stderr: 'inherit',
      cwd: join(dirs.examples, frameworkName, dirs.codeToRun)
    });

    readConfirmations(stdout).forEach(line => console.log(`  ${line}`));
    console.log(chalk.green(`Finished building "${frameworkName}" examples.`));
    console.log('');
  }

  console.log(chalk.green('Done.'));
}

// The preflight. Without it a first local run of the js demo looks like it works: the linker skips a package
// whose local build is missing, so the demo installs, builds, and renders the registry's handsontable, and
// nothing fails (lib/local-builds.mjs has the measurement). Checked before the installs, so a missing build
// costs a line rather than the two minutes of an Angular install. `ageCheckEnabled()` says why the age check
// is off on CI.
const options = preflightOptions({
  env: process.env,
  frameworks: frameworksToTest,
  referenceFramework: REFERENCE_FRAMEWORK,
});
const problems = findBuildProblems({ repoRoot: REPO_ROOT, ...options });

if (problems.length > 0) {
  console.error(chalk.red(`Visual tier "${tier.name}" cannot build its demos yet:`));
  formatProblems(problems, { highlight: chalk.red }).forEach(line => console.error(line));
  process.exitCode = 1;
} else {
  console.log(chalk.green('The local builds are in place'
    + `${options.checkAge ? ', and the core build is current' : ''}.`));

  await installAndBuild();
}

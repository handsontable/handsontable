/*
 * This script:
 * - Runs a background `http-server` for each framework example.
 * - Runs Handsontable's visual tests.
 * - Takes screenshots and prepares them for comparison against the golden records.
 *
 * What it renders is the tier: `VISUAL_TIER`, else by branch (`VISUAL_TIERS` in ../src/config.mjs).
 */
import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import chalk from 'chalk';
import { getTier, sleep, killProcess } from './utils/utils.mjs';
import {
  WRAPPERS,
  REFERENCE_FRAMEWORK,
  EXAMPLES_SERVER_PORT
} from '../src/config.mjs';
import { BARE_JS_DIRECTORY, copyDeclaredWrapperCaptures } from '../lib/wrapper-copy.mjs';

const dirs = {
  examples: '../examples/next/visual-tests',
  codeToRun: 'demo',
  screenshots: './screenshots',
};

const tier = getTier();

// The wrapper copy duplicates the bare js render, so a tier that copies without rendering it would
// copy a directory that does not exist — after a ten-minute render. A table error, caught first.
if (tier.copyWrappers && !tier.classic) {
  throw new Error(`Visual tier "${tier.name}" copies the js render into the wrappers (copyWrappers) `
    + 'but does not render it (classic: false). Fix VISUAL_TIERS in src/config.mjs.');
}

console.log(chalk.green('Running Visual Tests...'));
console.log(chalk.green(`Visual tier "${tier.name}": frameworks ${tier.frameworks.join(', ')}; `
  + `classic ${tier.classic ? 'yes' : 'no'}; themes ${tier.themes.join(', ') || 'none'}; `
  + `wrappers copied ${tier.copyWrappers ? 'yes' : 'no'}`));

const frameworksToTest = tier.frameworks;

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

  // A wrapper always renders bare. js renders bare only in a tier with the classic variant: the pr
  // tier drops it (byte-identical to `main` on 199 of its 234 goldens, it is a delivery-path check
  // the seed and the nightly keep) and renders the themes alone.
  if (frameworkName !== REFERENCE_FRAMEWORK || tier.classic) {
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

    console.log('');
    console.log(chalk.green(`Finished testing "${frameworkName}" examples.`));
  }

  if (frameworkName === REFERENCE_FRAMEWORK && tier.themes.length > 0) {
    const themeProcesses = [];
    // All theme runs share the same static file server on port 8082 — concurrent reads are safe.
    // --reporter=dot overrides the html reporter in playwright.config.ts, so there are no
    // concurrent writes to playwright-report/. Screenshots go to separate per-theme directories.
    // Each theme gets its own --output directory so failure artifacts (traces, screenshots) don't
    // collide when the same test fails in multiple themes simultaneously.
    const themeRuns = tier.themes.map((themeName) => {
      console.log(chalk.green(`Testing JavaScript examples with "${themeName}" theme...`));

      const proc = execa.command(`npx playwright test --reporter=dot --output=test-results/theme-${themeName}`, {
        env: {
          HOT_FRAMEWORK: frameworkName,
          HOT_THEME: themeName,
        },
        stdout: 'inherit'
      });

      themeProcesses.push(proc);

      return proc.then(() => {
        console.log('');
        console.log(chalk.green(`Finished testing examples with "${themeName}" theme.`));
      });
    });

    try {
      await Promise.all(themeRuns);
    } catch (ex) {
      await Promise.all(themeProcesses.map(p => killProcess(p.pid).catch(() => {})));
      await killProcess(localhostProcess.pid);
      throw new Error(ex.message);
    }
  }

  await killProcess(localhostProcess.pid);
}

// the screenshots are ready
console.log(chalk.green('Done.'));

// The seed tier renders js once and copies it into the wrapper directories, so the golden set keeps its
// full shape and every other tier is compared against an exact subset of it (the js-copied-baseline
// gotcha in ../AGENTS.md).
//
// The copy follows the declarations, spec by spec (`lib/wrapper-copy.mjs`): each spec's own
// `<stem>-N.png` captures go into only the wrappers that spec declares. A wholesale copy of the
// `multi-frameworks` directory would write wrapper goldens for every spec there, and the `full` tier,
// which skips a wrapper a spec does not declare, would report the extra ones deleted every night.
//
// The declarations are read from `npx playwright test --list --reporter=json` (collection cost, no browser
// launched), where `visualTest()` reports each one as a `visual-variants` annotation. The spec path comes
// from the ENCLOSING SUITE's `file` in that JSON, never from the test's own `spec.file`: `visualTest()`
// registers every test, so Playwright records `../src/test-runner.ts` as the location of all of them.
if (tier.copyWrappers) {
  if (!fse.existsSync(dirs.screenshots)) {
    throw new Error(`Directory \`${dirs.screenshots}\` doesn't exist.`);
  }

  const bareJs = path.resolve(dirs.screenshots, ...BARE_JS_DIRECTORY.split('/'));

  if (!fse.existsSync(bareJs)) {
    throw new Error(`Directory \`${bareJs}\` doesn't exist, so there is no bare js render to copy.`);
  }

  const { stdout } = await execa.command('npx playwright test --list --reporter=json', {
    env: {
      HOT_FRAMEWORK: REFERENCE_FRAMEWORK
    },
  });
  const plan = copyDeclaredWrapperCaptures(path.resolve(dirs.screenshots), JSON.parse(stdout));

  WRAPPERS.forEach((wrapper) => {
    const copies = plan.filter(entry => entry.wrapper === wrapper);
    const specs = new Set(copies.map(entry => entry.spec));

    console.log(chalk.green(`Copied ${copies.length} bare js capture(s) of ${specs.size} spec(s) into "${wrapper}".`));
  });
}

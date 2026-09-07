// Playwright globalSetup -- records the environment the scenarios are about to run in.
//
// The teardown runs in a separate Node process with no browser, so the Chromium build number has
// to be captured here, before the scenarios, from the same Playwright installation they will use.
// `browser.version()` is the build the CDP traces will come from; it is the field the baseline
// compatibility key is built on (lib/environment.mjs).

import { chromium } from '@playwright/test';
import { join } from 'node:path';

import { collectEnvironment, writeEnvironment } from './environment.mjs';

const OUTPUT_DIR = join(import.meta.dirname, '..', 'output');

/** Playwright globalSetup entry point */
export default async function setup() {
  const browser = await chromium.launch();
  let version = null;

  try {
    version = browser.version();
  } finally {
    await browser.close();
  }

  const environment = collectEnvironment({ chromium: version });

  await writeEnvironment(OUTPUT_DIR, environment);

  console.log(
    `\nEnvironment: Chromium ${environment.chromium ?? 'unknown'}, `
    + `${environment.cpuModel ?? 'unknown CPU'} ×${environment.cpuCount}, `
    + `${environment.runnerImage ?? 'no runner image'}\n`
  );
}

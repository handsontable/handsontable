import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { LicenseBuildPage } from '../fixtures/pages/LicenseBuildPage';
import { keyWithTier } from '../fixtures/xlsxLicenseKeys';
import { featureTiers, manifestTiers, releaseKeyUntil, soldPluginLicenses } from '../fixtures/licenseTiers';

// What only the built bundle can answer: the tokens its plugin classes carry after minification, the
// real tiers of the shipped manifest, the release date the build inlined, and the host name the core
// reads. The unit suites read the TypeScript sources, made-up tiers and a date passed as an argument,
// and `license-capabilities.spec.ts` redefines every plugin's tiers, so a build that dropped a token,
// shipped a tier list the keys do not name, or inlined no date passes all of them.

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The release date the build inlines (`HOT_RELEASE_DATE`, dd/mm/yyyy), read from the config the build
 * reads it from, never from the bundle: a bundle that inlined no date must fail here, not agree with itself.
 *
 * @returns {Date} Midnight UTC of that day.
 */
function buildReleaseDate(): Date {
  const config = readFileSync(fileURLToPath(new URL('../../hot.config.js', import.meta.url)), 'utf8');
  const match = config.match(/HOT_RELEASE_DATE:\s*'(\d{2})\/(\d{2})\/(\d{4})'/);

  if (!match) {
    throw new Error('hot.config.js holds no HOT_RELEASE_DATE in dd/mm/yyyy.');
  }

  const [, day, month, year] = match;

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

/**
 * Formats a date as the ISO day a key's `release_until` holds.
 *
 * @param {Date} date The date.
 * @returns {string}
 */
function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Sorts a license's tiers, so two lists compare as sets.
 *
 * @param {object} license A license token.
 * @param {string[]} license.tiers Its tiers.
 * @returns {object}
 */
function withSortedTiers<T extends { tiers: string[] }>(license: T): T {
  return { ...license, tiers: [...license.tiers].sort() };
}

/**
 * A tier name no build knows, built from the real ones so it can never collide with one.
 *
 * @returns {string}
 */
function unknownTier(): string {
  return `${manifestTiers().join('-')}-unknown`;
}

test.describe('License checks on the built bundle', { tag: BUNDLES_TAG }, () => {
  let grid: LicenseBuildPage;

  test.beforeEach(({ page, theme, bundle, baseURL }) => {
    grid = new LicenseBuildPage(page, baseURL as string, theme, bundle);
  });

  test('every sold plugin in the bundle carries the license token the manifest lists', async() => {
    await grid.goto({ licenseKey: keyWithTier(manifestTiers()) });

    const bundled = (await grid.pluginLicenses()).map(withSortedTiers);
    const expected = soldPluginLicenses().map(withSortedTiers);

    // A minifier that dropped or renamed a static LICENSE would leave that plugin out of the gate entirely.
    expect(expected.length).toBeGreaterThan(0);
    expect(bundled.map(({ capability }) => capability).sort())
      .toEqual(expected.map(({ capability }) => capability).sort());

    expected.forEach((license) => {
      expect(bundled.find(({ capability }) => capability === license.capability), license.capability)
        .toEqual(license);
    });
  });

  test('a key that names a real tier turns on the plugins the manifest puts in that tier', async() => {
    const tiers = manifestTiers();

    expect(tiers.length).toBeGreaterThan(0);

    // The tiers that include both plugins the page turns on. No real tier leaves either out today, so a branch
    // for that case would never run; the next test covers its console message and bar with a tier the build
    // does not know. The count below fails the day a real tier leaves one out, so this test gains that case.
    let tiersWithBoth = 0;

    for (const [index, tier] of tiers.entries()) {
      await grid.goto({ licenseKey: keyWithTier([tier]) });

      const filtersIncluded = featureTiers('feat:filters').includes(tier);
      const columnMenuIncluded = featureTiers('feat:dropdown_menu').includes(tier);
      const label = `the manifest's tier at index ${index}`;

      expect(await grid.isPluginEnabled('filters'), `Filters under ${label}`).toBe(filtersIncluded);
      expect(await grid.isPluginEnabled('dropdownMenu'), `DropdownMenu under ${label}`).toBe(columnMenuIncluded);
      await expect(grid.lock, label).toHaveCount(0);

      if (filtersIncluded && columnMenuIncluded) {
        tiersWithBoth += 1;
        expect(grid.licenseMessages(), label).toEqual([]);
        await expect(grid.bar, label).toHaveCount(0);
      }
    }

    expect(tiersWithBoth, 'A tier of the manifest leaves Filters or DropdownMenu out: assert its console message '
      + 'and its bar here.').toBe(tiers.length);
  });

  test('a key that names only a tier this build does not know turns the sold plugins off', async() => {
    await grid.goto({ licenseKey: keyWithTier([unknownTier()]) });

    expect(await grid.isPluginEnabled('filters')).toBe(false);
    expect(await grid.isPluginEnabled('dropdownMenu')).toBe(false);
    await expect(grid.bar).toBeVisible();
    await expect(grid.lock).toHaveCount(0);
    await expect.poll(() => grid.licenseMessages().join('\n')).toMatch(/does not include these features/);
  });

  test('a perpetual key reads as expired only for a build released after it', async() => {
    const releaseDate = buildReleaseDate();

    // Covers this build: nothing to say.
    await grid.goto({ licenseKey: releaseKeyUntil(isoDay(releaseDate)), plugins: 'filters' });

    await expect(grid.bar).toHaveCount(0);
    await expect(grid.lock).toHaveCount(0);
    expect(grid.licenseMessages()).toEqual([]);

    // Ends the day before this build was released: only the date the build inlined can tell.
    await grid.goto({
      licenseKey: releaseKeyUntil(isoDay(new Date(releaseDate.getTime() - DAY_MS))),
      plugins: 'filters',
    });

    await expect(grid.bar).toBeVisible();
    await expect(grid.bar).toContainText('expired');
    await expect(grid.lock).toHaveCount(0);
    await expect.poll(() => grid.licenseMessages().join('\n')).toMatch(/license key for Handsontable expired/);
    // A key past its maintenance date keeps every feature the version it covers had.
    expect(await grid.isPluginEnabled('filters')).toBe(true);
  });

  test('a grid on a handsontable.com host needs no key', async() => {
    for (const host of ['handsontable.com', 'www.handsontable.com', 'demos.handsontable.com']) {
      await grid.goto({ host });

      expect(await grid.host()).toBe(host);
      await expect(grid.lock, host).toHaveCount(0);
      await expect(grid.bar, host).toHaveCount(0);
      expect(grid.licenseMessages(), host).toEqual([]);
      expect(await grid.isPluginEnabled('filters'), host).toBe(true);
    }
  });

  test('a host that only looks like handsontable.com gets the lock', async() => {
    for (const host of ['evilhandsontable.com', 'handsontable.com.evil.test']) {
      await grid.goto({ host });

      expect(await grid.host()).toBe(host);
      await expect(grid.lock, host).toHaveCount(1);
      await expect.poll(() => grid.licenseMessages().join('\n'), host).toMatch(/license key for Handsontable is missing/);
    }
  });

  test('on a handsontable.com host a key that names an unknown tier restricts nothing', async() => {
    await grid.goto({ host: 'demos.handsontable.com', licenseKey: keyWithTier([unknownTier()]) });

    expect(await grid.isPluginEnabled('filters')).toBe(true);
    expect(await grid.isPluginEnabled('dropdownMenu')).toBe(true);
    await expect(grid.bar).toHaveCount(0);
    expect(grid.licenseMessages()).toEqual([]);
  });
});

import { test, expect } from '../fixtures/test';
import { LICENSE_LOCK_BINDING, watchLicenseLocks } from '../fixtures/licenseLockGuard';
import { LicenseLockGuardPage } from '../fixtures/pages/LicenseLockGuardPage';

// The `page` fixture fails a passing test whose page showed the license lock (`fixtures/licenseLockGuard.ts`).
// These tests drive the same guard on a page they open in the test's context, which the fixture does not
// guard, so the locked grid each one builds on purpose fails only what the test asserts.

test.describe('The license lock guard', () => {
  test('watches the page the fixture hands a test', async({ page, theme, bundle }) => {
    await new LicenseLockGuardPage(page, theme, bundle).goto();

    expect(await page.evaluate(binding => typeof (window as unknown as Record<string, unknown>)[binding],
      LICENSE_LOCK_BINDING)).toBe('function');
  });

  test('finds a lock whose grid was destroyed before the test ended', async({ context, theme, bundle }) => {
    const page = await context.newPage();
    const watch = await watchLicenseLocks(page);
    const grid = new LicenseLockGuardPage(page, theme, bundle);

    await grid.goto();

    expect(await grid.buildSecondGrid({ keyed: false })).toBe(1);
    expect(await grid.destroySecondGrid()).toBe(0);
    await expect.poll(() => watch.lockedFrames()).toEqual([page.url()]);
  });

  test('finds a lock on a page the test navigated away from', async({ context, theme, bundle }) => {
    const page = await context.newPage();
    const watch = await watchLicenseLocks(page);
    const grid = new LicenseLockGuardPage(page, theme, bundle);

    await grid.goto();
    const lockedUrl = page.url();

    expect(await grid.buildSecondGrid({ keyed: false })).toBe(1);
    await page.goto('about:blank');

    await expect.poll(() => watch.lockedFrames()).toEqual([lockedUrl]);
  });

  test('finds a lock on a page the test closed', async({ context, theme, bundle }) => {
    const page = await context.newPage();
    const watch = await watchLicenseLocks(page);
    const grid = new LicenseLockGuardPage(page, theme, bundle);

    await grid.goto();
    const lockedUrl = page.url();

    expect(await grid.buildSecondGrid({ keyed: false })).toBe(1);
    await page.close();

    // Only the report the page sent as the lock mounted can say so: the page is gone.
    await expect.poll(() => watch.lockedFrames()).toEqual([lockedUrl]);
  });

  test('finds nothing on a page whose grids all take the key', async({ context, theme, bundle }) => {
    const page = await context.newPage();
    const watch = await watchLicenseLocks(page);
    const grid = new LicenseLockGuardPage(page, theme, bundle);

    await grid.goto();

    expect(await grid.buildSecondGrid({ keyed: true })).toBe(0);
    expect(await grid.destroySecondGrid()).toBe(0);
    expect(await watch.lockedFrames()).toEqual([]);
  });

  test('leaves out a lock on a page that asks for a license state', async({ context, theme, bundle }) => {
    const page = await context.newPage();
    const watch = await watchLicenseLocks(page);
    const grid = new LicenseLockGuardPage(page, theme, bundle);

    await grid.goto('invalid');
    expect(await grid.buildSecondGrid({ keyed: false })).toBe(1);
    expect(await grid.destroySecondGrid()).toBe(0);

    // The positive control: the same lock on the page without the query is reported. Reports arrive in
    // order, so once this one has, the first one has too, and was left out.
    await grid.goto();
    const reportedUrl = page.url();

    expect(await grid.buildSecondGrid({ keyed: false })).toBe(1);
    expect(await grid.destroySecondGrid()).toBe(0);
    await expect.poll(() => watch.lockedFrames()).toEqual([reportedUrl]);
  });

  test('checks only the frames still open when it does not watch the mounts', async({ context, theme, bundle }) => {
    // The guard as it was before it watched the mounts: a destroyed grid's lock reads as none. This pins
    // what the mount reports add, so a guard that stops reporting them fails the first test above.
    const page = await context.newPage();
    const watch = await watchLicenseLocks(page, { observeMounts: false });
    const grid = new LicenseLockGuardPage(page, theme, bundle);

    await grid.goto();

    expect(await grid.buildSecondGrid({ keyed: false })).toBe(1);
    expect(await watch.lockedFrames()).toEqual([page.url()]);
    expect(await grid.destroySecondGrid()).toBe(0);
    expect(await watch.lockedFrames()).toEqual([]);
  });
});

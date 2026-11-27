import type { Page } from '@playwright/test';

/**
 * The license lock guard of the `page` fixture (`fixtures/test.ts`), in a module of its own so a spec can
 * drive it on a page the fixture does not guard (`e2e/license-lock-guard.spec.ts`).
 *
 * Since 19.0 a grid built without a valid key sits behind the license lock. API calls still work, so a test
 * that only reads the grid passes, while its clicks, focus moves and screenshots meet the lock. The guard
 * finds every lock a page mounted during the test, in any frame, also one that is gone by the end: the grid
 * was destroyed, the frame navigated away, or the test closed the page. A mount reaches Node asynchronously,
 * so a lock that mounts and goes away in the test's last step counts once its report has arrived: reading the
 * open frames at the end gives the reports in flight one round trip per frame to land.
 */

/**
 * The fixture pages that show a license surface on purpose: the license specs build their keys there.
 */
const LICENSE_PAGES = /\/(?:license-branding|license-bar|license-capabilities|xlsx-license)\.html(?:[?#]|$)/;

/**
 * The class the lock element carries (`handsontable/src/utils/licenseBranding/lockScreen.ts`).
 */
const LOCK_CLASS = 'ht-license-lock';

/**
 * The name of the binding through which a page reports a lock it mounted.
 */
export const LICENSE_LOCK_BINDING = '__htReportLicenseLock';

/**
 * The errors that only say the frame went away while it was read: its lock, if any, was reported as it
 * mounted. Any other error reading a frame fails the test, because it would otherwise read as no lock.
 */
const FRAME_GONE = /Execution context was destroyed|Frame was detached|Target page, context or browser has been closed/;

/**
 * Whether a page in this frame asks for a license state on purpose: one of the license pages, or a page
 * opened with a `?license=` query other than `test` (`side-layout-slots.html?license=trial`,
 * `trusted-types.html?license=invalid`).
 *
 * @param {string} url The frame's URL.
 * @returns {boolean}
 */
export function asksForLicenseState(url: string): boolean {
  if (LICENSE_PAGES.test(url)) {
    return true;
  }

  try {
    const license = new URL(url).searchParams.get('license');

    return license !== null && license !== 'test';
  } catch {
    return false;
  }
}

/**
 * Runs in every frame of the page, before the page's own scripts: reports each lock element added to the
 * document, once, with the frame's URL at that moment. Only added element nodes are read: a class check and
 * a class query of the node's subtree each, which a grid's render keeps small (it adds cells, not tables).
 *
 * @param {object} config The script's arguments.
 * @param {string} config.binding The name of the reporting binding.
 * @param {string} config.lockClass The lock element's class.
 */
function reportLocksAsTheyMount({ binding, lockClass }: { binding: string, lockClass: string }): void {
  const reported = new WeakSet<Element>();
  const report = (element: Element) => {
    if (!reported.has(element)) {
      reported.add(element);
      (window as unknown as Record<string, (url: string) => void>)[binding]?.(location.href);
    }
  };

  new MutationObserver((records) => {
    records.forEach(record => record.addedNodes.forEach((node) => {
      if (node instanceof Element) {
        if (node.classList.contains(lockClass)) {
          report(node);
        }

        node.querySelectorAll(`.${lockClass}`).forEach(report);
      }
    }));
  }).observe(document, { childList: true, subtree: true });
}

export interface LicenseLockWatch {
  /**
   * Returns the URLs of the frames that showed a lock during the test without asking for a license state:
   * every lock reported as it mounted, and, unless `readFrames` is `false`, every lock still on a frame of an
   * open page. A frame that went away while it was read is skipped; any other error reading a frame is
   * thrown.
   *
   * @param {object} [options] The options.
   * @param {boolean} [options.readFrames] Whether to read the open frames too. A failed test passes `false`:
   *   its page can be stuck, and a read would hang the teardown.
   */
  lockedFrames(options?: { readFrames?: boolean }): Promise<string[]>;
}

/**
 * Starts watching a page for license locks. Call it before the page loads anything.
 *
 * @param {Page} page The page.
 * @param {object} [options] The options.
 * @param {boolean} [options.observeMounts] Whether to report the locks as they mount; `false` checks only the
 *   frames that are still open at the end (the guard's state before the mount reports, kept as the negative
 *   control of the spec).
 * @returns {Promise<LicenseLockWatch>}
 */
export async function watchLicenseLocks(
  page: Page,
  { observeMounts = true }: { observeMounts?: boolean } = {},
): Promise<LicenseLockWatch> {
  const reported: string[] = [];

  if (observeMounts) {
    await page.exposeBinding(LICENSE_LOCK_BINDING, (source, url: string) => {
      reported.push(url);
    });
    await page.addInitScript(reportLocksAsTheyMount, { binding: LICENSE_LOCK_BINDING, lockClass: LOCK_CLASS });
  }

  return {
    async lockedFrames({ readFrames = true } = {}) {
      const urls: string[] = [];

      if (readFrames && !page.isClosed()) {
        for (const frame of page.frames().filter(child => !asksForLicenseState(child.url()))) {
          let count = 0;

          try {
            count = await frame.evaluate(lockClass => document.getElementsByClassName(lockClass).length, LOCK_CLASS);
          } catch (error) {
            if (!(page.isClosed() || frame.isDetached() || FRAME_GONE.test(String(error)))) {
              throw new Error(`The license lock guard could not read the frame ${frame.url()}: ${String(error)}`);
            }
          }

          if (count > 0) {
            urls.push(frame.url());
          }
        }
      }

      // Read after the frames: each read is a round trip that lets a report in flight land first.
      return [...new Set([...reported, ...urls].filter(url => !asksForLicenseState(url)))];
    },
  };
}

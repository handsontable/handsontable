import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  A11Y_THEMES,
  findingsFromScan,
  marksForScan,
  representativeScans,
  type BaselineEntry,
  type NodeBox,
  type ScanMark,
} from '../lib/a11y-baseline.mjs';
import { A11Y_PAGES } from './pages.mjs';
import { PORTAL, emulate, openTarget, reachState } from './harness';

/**
 * The axe scan: every page of `pages.mjs` on every theme, through `@axe-core/playwright`,
 * against the WCAG 2.2 A and AA rule set (the level the published Accessibility Conformance
 * Report claims). The scan includes the grid's root container and that grid's own portal (its
 * `rootPortalElement`, where menus and the comment editor render) and nothing else on the fixture
 * page: the fixture's own buttons and text, and any other grid on it, are not under test. A page
 * that throws, or whose theme stylesheet did not load, is a red test before anything is scanned
 * (`openTarget()` and `reachState()` in `harness.ts`, which the checks beyond axe share).
 *
 * A test here never fails on a violation. It writes the raw axe result to
 * `test-results/a11y/scans/<page>--<theme>.json` (the CI artifact) and attaches it. Every
 * violating node carries what locates it: axe's selector, its full DOM path (`ancestry`) and its
 * box on the page. When the scan holds a finding the baseline does not (new, or on more nodes than
 * recorded), or it is the page a known issue is pictured on in the HTML report, the spec also
 * outlines and numbers those nodes and saves a screenshot beside the JSON (`marksForScan()` in
 * `lib/a11y-baseline.mjs` picks them); the reporter
 * (`reporters/a11y.ts`) compares every scan with the committed baseline
 * (`axe-baseline.json`) and decides the run's status from `A11Y_MODE`
 * (`lib/a11y-baseline.mjs`: `warn` keeps the job green, `block` fails it on a new finding or a
 * stale entry). What fails a test is tooling: a fixture that does not load, a constructor
 * throw, a menu or an editor the keyboard did not open. Policy and how to add a page:
 * `tests/AGENTS.md`, "A11y: the axe scan and its baseline".
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
// The outline colors of the screenshot marks, matching the report's numbered legend: new is the
// critical red, grown a dark orange, a pictured known issue a dark blue. Each carries its number in
// white, so each clears 4.5:1 against white.
const MARK_COLORS: Record<ScanMark['status'], string> = { new: '#d03b3b', grown: '#b85a2f', known: '#1c5cab' };

/**
 * The committed baseline, read once: the marks compare each scan with it. A baseline that does not
 * parse marks nothing here; the reporter reports it as a tooling failure.
 */
const BASELINE_ENTRIES: BaselineEntry[] = (() => {
  try {
    return JSON.parse(readFileSync(new URL('./axe-baseline.json', import.meta.url), 'utf8')).entries ?? [];
  } catch {
    return [];
  }
})();
const PICTURED = representativeScans(BASELINE_ENTRIES);

for (const theme of A11Y_THEMES) {
  for (const entry of A11Y_PAGES) {
    const scan = async({ page }: { page: Page }, testInfo: TestInfo) => {
      const started = Date.now();
      const opened = await openTarget(page, entry, theme);
      const { root, url } = opened;

      await reachState(page, entry, opened);

      // `options()` replaces the option object and `withTags()` adds to it, so the options go first.
      // `ancestry` adds each node's full DOM path, which locates it where axe's short selector is ambiguous.
      const results = await new AxeBuilder({ page })
        .options({ ancestry: true })
        .withTags(WCAG_TAGS)
        .include(root)
        .include(PORTAL)
        .analyze();
      const scansDir = path.join(testInfo.project.outputDir, 'scans');

      mkdirSync(scansDir, { recursive: true });
      await measureNodes(page, results.violations);

      const marks = marksForScan({
        findings: findingsFromScan({ page: entry.id, theme, violations: results.violations }),
        entries: BASELINE_ENTRIES.filter(item => item.page === entry.id && item.theme === theme),
        pictured: PICTURED.get(`${entry.id}|${theme}`),
      });
      const screenshot = marks.length > 0 ? `${entry.id}--${theme}.jpg` : null;
      let clip: NodeBox | null = null;

      if (screenshot) {
        clip = await outlineMarks(page, marks, root);
        await page.screenshot({ path: path.join(scansDir, screenshot), type: 'jpeg', quality: 75, fullPage: true, clip });
      }

      const scan = {
        page: entry.id,
        theme,
        fixture: entry.fixture,
        url,
        state: entry.state,
        surface: entry.surface,
        axeCoreVersion: results.testEngine.version,
        timestamp: results.timestamp,
        durationMs: Date.now() - started,
        counts: {
          violations: results.violations.length,
          incomplete: results.incomplete.length,
          passes: results.passes.length,
          inapplicable: results.inapplicable.length,
        },
        violations: results.violations,
        incomplete: results.incomplete.map(result => ({ id: result.id, impact: result.impact, nodes: result.nodes.length })),
        screenshot,
        clip,
        marks: marks.map(({ selectors, ...mark }) => mark),
      };
      const file = path.join(scansDir, `${entry.id}--${theme}.json`);

      writeFileSync(file, `${JSON.stringify(scan, null, 2)}\n`);
      await testInfo.attach('axe-scan', { path: file, contentType: 'application/json' });
    };
    const title = `${entry.id} on ${theme}`;

    if (entry.device) {
      // The device is set before the page loads: the core decides at construction whether it runs on a
      // phone (`isMobileOrIpadOS()`), so emulating it after the load would scan the desktop grid.
      const device = entry.device;

      test.describe(() => {
        test.use(emulate(device));
        test(title, scan);
      });
    } else {
      test(title, scan);
    }
  }
}

/**
 * Adds each violating node's box on the page (`box`, page coordinates, or `null` when the node
 * has none: hidden, collapsed or gone) to the axe results, in place, in one round trip.
 *
 * @param page The page.
 * @param violations The axe violations.
 */
async function measureNodes(page: Page, violations: Array<{ nodes: Array<{ target: unknown[]; box?: NodeBox | null }> }>): Promise<void> {
  const selectors = violations.flatMap(violation => violation.nodes.map(node => node.target.at(-1)));
  const boxes = await page.evaluate(list => list.map((css) => {
    const node = typeof css === 'string' ? document.querySelector(css) : null;
    const rect = node?.getBoundingClientRect();

    return rect && rect.width > 0 && rect.height > 0
      ? { x: Math.round(rect.left + window.scrollX), y: Math.round(rect.top + window.scrollY), width: Math.round(rect.width), height: Math.round(rect.height) }
      : null;
  }), selectors);
  let index = 0;

  for (const violation of violations) {
    for (const node of violation.nodes) {
      node.box = boxes[index];
      index += 1;
    }
  }
}

/**
 * Outlines every node of every mark on the page and numbers it, in an overlay above everything
 * else that takes no pointer events. A node with no box (a hidden editor input) gets a small
 * marker at its position, so its number still shows. Runs after the scan, so the overlay is never
 * part of what axe saw. Returns the page area to photograph: the grid's tables, slots and overlays,
 * whatever its portal shows (an open menu or editor), and every outline, with a margin around them.
 *
 * @param page The page.
 * @param marks The marks.
 * @param root The root container selector.
 * @returns The clip, in page coordinates.
 */
async function outlineMarks(page: Page, marks: ScanMark[], root: string): Promise<NodeBox> {
  return page.evaluate(([list, colors, rootSelector, portalSelector]) => {
    const layer = document.createElement('div');

    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:absolute;inset:0 auto auto 0;width:0;height:0;z-index:2147483647;pointer-events:none';
    for (const mark of list) {
      for (const selector of mark.selectors) {
        const css = selector.at(-1);
        const node = typeof css === 'string' ? document.querySelector(css) : null;

        if (!node) {
          continue;
        }

        const rect = node.getBoundingClientRect();
        const box = document.createElement('div');
        const label = document.createElement('span');
        const color = colors[mark.status];

        box.style.cssText = `position:absolute;left:${rect.left + window.scrollX - 2}px;top:${rect.top + window.scrollY - 2}px;`
          + `width:${Math.max(rect.width, 8) + 4}px;height:${Math.max(rect.height, 8) + 4}px;`
          + `outline:3px solid ${color};outline-offset:0;box-sizing:border-box`;
        label.textContent = String(mark.n);
        label.style.cssText = 'position:absolute;left:-3px;top:-22px;min-width:18px;padding:1px 5px;border-radius:9px;'
          + `background:${color};color:#fff;font:700 12px/18px system-ui,sans-serif;text-align:center`;
        box.append(label);
        layer.append(box);
      }
    }
    document.body.append(layer);

    // The grid's root container is as wide as the page; its tables, slots and overlays are as wide as
    // what they draw, so the crop follows them.
    const rootNode = document.querySelector(rootSelector);
    const drawn = rootNode ? [...rootNode.querySelectorAll('.htCore, .ht-slot-top > *, .ht-slot-bottom > *, .ht-overlay > *')] : [];
    const areas = [...(drawn.length > 0 ? drawn : [rootNode]), ...document.querySelectorAll(`${portalSelector} > *`), ...layer.children]
      .filter((node): node is Element => !!node)
      .map(node => node.getBoundingClientRect())
      .filter(rect => rect.width > 0 && rect.height > 0)
      // The outline's number sits above its box.
      .map(rect => ({ left: rect.left + window.scrollX, top: rect.top + window.scrollY - 24, right: rect.right + window.scrollX, bottom: rect.bottom + window.scrollY }));
    const margin = 16;
    const left = Math.max(0, Math.min(...areas.map(area => area.left)) - margin);
    const top = Math.max(0, Math.min(...areas.map(area => area.top)) - margin);
    const right = Math.min(document.documentElement.scrollWidth, Math.max(...areas.map(area => area.right)) + margin);
    const bottom = Math.min(document.documentElement.scrollHeight, Math.max(...areas.map(area => area.bottom)) + margin);

    return { x: Math.round(left), y: Math.round(top), width: Math.max(1, Math.round(right - left)), height: Math.max(1, Math.round(bottom - top)) };
  }, [marks, MARK_COLORS, root, PORTAL] as const);
}

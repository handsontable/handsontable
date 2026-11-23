import type { Page } from '@playwright/test';
import { restoreShortenedClass } from '../lib/a11y-baseline.mjs';
import type { NodeBox } from '../lib/a11y-baseline.mjs';

/**
 * What the two axe scans share: the product scan (`axe.spec.ts`, the fixture pages) and the docs site
 * scan (`docs/docs-axe.spec.ts`). Both run the same rule set and locate a violating node the same way,
 * so a finding reads the same in both reports and in the findings ledger.
 */

/**
 * WCAG 2.2 A and AA: the level the published Accessibility Conformance Report claims.
 */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Adds each violating node's box on the page (`box`, page coordinates, or `null` when the node
 * has none: hidden, collapsed or gone) to the axe results, in place, in one round trip, and puts the
 * node's whole `class` back into a start tag axe shortened (`restoreShortenedClass`).
 *
 * @param page The page.
 * @param violations The axe violations.
 */
export async function measureNodes(
  page: Page, violations: Array<{ nodes: Array<{ target: unknown[]; box?: NodeBox | null; html?: string }> }>,
): Promise<void> {
  const selectors = violations.flatMap(violation => violation.nodes.map(node => node.target.at(-1)));
  const measured = await page.evaluate(list => list.map((css) => {
    const node = typeof css === 'string' ? document.querySelector(css) : null;
    const rect = node?.getBoundingClientRect();

    return {
      box: rect && rect.width > 0 && rect.height > 0
        ? { x: Math.round(rect.left + window.scrollX), y: Math.round(rect.top + window.scrollY), width: Math.round(rect.width), height: Math.round(rect.height) }
        : null,
      className: node?.getAttribute('class') ?? null,
    };
  }), selectors);
  let index = 0;

  for (const violation of violations) {
    for (const node of violation.nodes) {
      const { box, className } = measured[index];

      node.box = box;
      node.html = restoreShortenedClass(node.html, className);
      index += 1;
    }
  }
}

import { test, expect } from '../fixtures/test';
import { CloneHolderScrollPage } from '../fixtures/pages/CloneHolderScrollPage';

/**
 * The scroll-mirrored clone holders must stay scrollbar-free under a page-wide scrollbar rule.
 *
 * The top, bottom and inline-start clone holders are scroll containers on one axis and hide their
 * scrollbar with `scrollbar-width: none`. A host page that restyles every holder's scrollbar
 * (`.handsontable .wtHolder { scrollbar-width: thin }`) must not paint one into them: nothing scrolls
 * these holders, and each clone is sized to the pixel against the master. Without the fix the rule
 * put an 11px bar under the column headers and shrank the row header layer by the same amount.
 *
 * Only the computed style and the box geometry are asserted, never the stylesheet text.
 *
 * Playwright's headless Chromium is started with `--hide-scrollbars`, which forces every scrollbar to
 * zero width, so the gutter checks could never fail there. So this file, and only this file, drops
 * that flag (as `overlay-scrollbar-bottom-gutter.spec.ts` does). `launchOptions` cannot be set in a
 * `describe`, which is why this is its own file. On a machine whose OS floats its scrollbars the
 * gutter is 0 either way, and the `scrollbarWidth` check is the one that catches the defect.
 */
test.use({
  launchOptions: {
    ignoreDefaultArgs: ['--hide-scrollbars'],
  },
});

test.describe('Clone holders under a page-wide scrollbar rule', () => {
  for (const rule of [
    '.handsontable .wtHolder { scrollbar-width: thin !important; }',
    '.handsontable .wtHolder { scrollbar-width: thin; }',
  ]) {
    test(`keep no scrollbar under \`${rule}\``, async({ page, theme, bundle }) => {
      const grid = new CloneHolderScrollPage(page, theme, bundle);

      await grid.goto('element');
      // Loaded after the grid's own stylesheet, so a tie on specificity would go to this rule.
      await page.addStyleTag({ content: rule });

      // Positive control: the injected rule is live, and it takes effect on the master holder.
      expect((await grid.holderBox('master')).scrollbarWidth, 'master scrollbar-width').toBe('thin');

      for (const name of ['inline_start', 'top', 'bottom'] as const) {
        const box = await grid.holderBox(name);

        expect(box.scrollbarWidth, `${name} scrollbar-width`).toBe('none');
        expect(box.scrollbarGutterX, `${name} vertical scrollbar space`).toBe(0);
        expect(box.scrollbarGutterY, `${name} horizontal scrollbar space`).toBe(0);
      }
    });
  }
});

import { test, expect } from '../fixtures/test';
import {
  EmptyDataStateClippedContainerPage,
  type ClippedContainerOptions,
} from '../fixtures/pages/EmptyDataStateClippedContainerPage';

const EDGE_TOLERANCE_PX = 0.5;

/**
 * An empty grid with `height: 'auto'` inside a container that clips its overflow, the shape of a docs
 * example. The container, not the grid, is then what the engine measures as the viewport, and it is
 * taller than the grid because it also holds a toolbar. The overlay used to take that height, so it
 * spilled out of the grid and covered the toolbar below it.
 */
test.describe('empty data state in a container that clips its overflow', () => {
  const shapes: [string, ClippedContainerOptions][] = [
    ['with no columns', { columns: false }],
    ['with columns and no rows', { columns: true }],
  ];

  for (const [name, options] of shapes) {
    test(`with \`height: auto\` the overlay stays inside the grid ${name}`, async({ page, theme, bundle }) => {
      const edsPage = new EmptyDataStateClippedContainerPage(page, theme, bundle);

      await edsPage.goto({ ...options, height: 'auto' });

      const geometry = await edsPage.geometry();

      expect(geometry.overlayBottom, 'overlay bottom vs the grid bottom')
        .toBeLessThanOrEqual(geometry.rootBottom + EDGE_TOLERANCE_PX);
      expect(geometry.overlayBottom, 'overlay bottom vs the toolbar top')
        .toBeLessThanOrEqual(geometry.toolbarTop + EDGE_TOLERANCE_PX);
      // The cap must not collapse the overlay: it still fills the grid body down to the grid's bottom.
      expect(geometry.overlayBottom - geometry.overlayTop, 'overlay height').toBeGreaterThan(0);
      expect(Math.abs(geometry.overlayBottom - geometry.rootBottom), 'overlay bottom vs the grid bottom')
        .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    });
  }

  for (const [name, options] of shapes) {
    test(`with a fixed height the overlay still fills the grid body ${name}`, async({ page, theme, bundle }) => {
      const edsPage = new EmptyDataStateClippedContainerPage(page, theme, bundle);

      await edsPage.goto({ ...options, height: '300' });

      const geometry = await edsPage.geometry();

      expect(geometry.rootBottom - geometry.rootTop).toBeCloseTo(300, 0);
      expect(Math.abs(geometry.overlayBottom - geometry.rootBottom)).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    });
  }
});

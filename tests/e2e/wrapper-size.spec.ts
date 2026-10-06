import { test, expect } from '../fixtures/test';
import { WrapperSizePage } from '../fixtures/pages/WrapperSizePage';

/**
 * A grid given `width: '100%'` and `height: '100%'` takes exactly its container's 500 x 400 px and
 * scrolls its 20 x 20 cells inside that box, on the visual suite's retired `/wrapper-demo` shape and on every
 * theme and bundle. The `wrapper-size` capture was the only check of it; nothing measured the root.
 */

const EDGE_TOLERANCE_PX = 0.5;

test('a grid sized 100% by 100% fills its container and scrolls inside it', async({ page, theme, bundle }) => {
  const wrapperPage = new WrapperSizePage(page, theme, bundle);

  await wrapperPage.goto();

  const geometry = await wrapperPage.geometry();

  expect(geometry.container.right - geometry.container.left).toBeCloseTo(500, 1);
  expect(geometry.container.bottom - geometry.container.top).toBeCloseTo(400, 1);
  (['left', 'top', 'right', 'bottom'] as const).forEach((edge) => {
    expect(Math.abs(geometry.root[edge] - geometry.container[edge]), `root ${edge}`).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    expect(Math.abs(geometry.wrapper[edge] - geometry.container[edge]), `wrapper ${edge}`).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    expect(Math.abs(geometry.holder[edge] - geometry.container[edge]), `holder ${edge}`).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
  });
  // The cells overflow the box both ways, and the grid, not the page, scrolls them.
  expect(geometry.scrollsDown).toBe(true);
  expect(geometry.scrollsAcross).toBe(true);
  expect(geometry.pageScrolls).toBe(false);
});

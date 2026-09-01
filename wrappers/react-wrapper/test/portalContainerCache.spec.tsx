import React from 'react';
import { act } from '@testing-library/react';
import { HotTable } from '../src/hotTable';
import { useHotTableContext } from '../src/hotTableContext';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef,
  sleep,
} from './_helpers';
import { HotRendererProps, HotTableRef } from '../src/types';

// Regression tests for the portal-container cache leak (PLAN A4): the wrapper
// kept one detached container DIV per (row, col) ever rendered with a
// component-based renderer and never evicted them, so scrolling grew retained
// DOM as O(rows × cols). The cache must stay bounded to the viewport.
describe('Portal container cache eviction', () => {
  const VISIBLE_ROWS = Math.ceil(300 / 23); // height / rowHeights ≈ 14 visible rows
  const COLS = 3;

  it('should keep the portal container cache bounded to the viewport while scrolling a tall grid', async () => {
    let capturedContext: ReturnType<typeof useHotTableContext> | undefined;

    function Cell(props: HotRendererProps) {
      // A renderer component renders inside the context provider, so it can
      // read the diagnostic cache size.
      capturedContext = useHotTableContext();

      return <span>{String(props.value)}</span>;
    }

    const ROWS = 1000;

    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(ROWS, COLS)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}
                renderer={(props) => <Cell {...props} />}
      />
    ), false).hotInstance!;

    await sleep(100);

    // Scroll the full height of the dataset in viewport-sized steps.
    for (let row = 0; row < ROWS; row += VISIBLE_ROWS) {
      await act(async () => {
        hotInstance.scrollViewportTo({ row: Math.min(row, ROWS - 1), col: 0 });
        hotInstance.render();
      });
      await sleep(10);
    }

    await sleep(50);

    const cacheSize = capturedContext!.getPortalContainerCacheSize();

    // Bounded to a few viewports' worth of cells (visible rows + overscan × cols),
    // NOT O(rows × cols). Measured: 39 with eviction vs 2781 without, for this
    // 1000 × 3 grid scrolled top-to-bottom.
    const viewportCells = (VISIBLE_ROWS + 4) * COLS;

    expect(cacheSize).toBeGreaterThan(0);
    expect(cacheSize).toBeLessThanOrEqual(viewportCells);
    expect(cacheSize).toBeLessThan(ROWS * COLS);
  });

  it('should evict the container of a cell that scrolled out of the viewport (remounts on return)', async () => {
    let nextSeed = 0;
    const seeds = new Map<string, number>();

    function SeededCell(props: HotRendererProps) {
      // useState initialiser runs once per mount. A fresh seed on return proves
      // the previous container was evicted (not reused from the cache).
      const [seed] = React.useState(() => {
        nextSeed += 1;
        return nextSeed;
      });

      seeds.set(`${props.row}-${props.col}`, seed);

      return <span data-cell={`${props.row}-${props.col}`} data-seed={seed}>{String(props.value)}</span>;
    }

    const ROWS = 1000;

    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(ROWS, COLS)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}
                renderer={(props) => <SeededCell {...props} />}
      />
    ), false).hotInstance!;

    await sleep(100);

    const seedBefore = seeds.get('0-0');

    expect(seedBefore).toBeGreaterThan(0);

    // Scroll far past cell (0, 0) so its container leaves the viewport...
    await act(async () => {
      hotInstance.scrollViewportTo({ row: ROWS - 1, col: 0 });
      hotInstance.render();
    });
    await sleep(50);

    // ...then back to the top.
    await act(async () => {
      hotInstance.scrollViewportTo({ row: 0, col: 0 });
      hotInstance.render();
    });
    await sleep(50);

    const seedAfter = seeds.get('0-0');

    // The component remounted with a fresh seed because its container was
    // evicted on scroll-out. (The cached value would be identical without eviction.)
    expect(seedAfter).toBeGreaterThan(seedBefore!);
  });
});

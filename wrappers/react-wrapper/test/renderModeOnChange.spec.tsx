import React from 'react';
import { baseRenderer, BaseRenderer } from 'handsontable/renderers';
import { act } from '@testing-library/react';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import { useHotTableContext } from '../src/hotTableContext';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef,
  sleep,
} from './_helpers';
import { HotRendererProps, HotTableRef } from '../src/types';
import { TEST_LICENSE_KEY } from './licenseKey';

// Under `renderMode: 'onChange'` the grid skips the renderer for a cell that did not change, and the
// cell element keeps its content. A component cell must then keep its mounted component and state.
describe('Component renderers under renderMode: \'onChange\'', () => {
  const ROWS = 200;
  const COLS = 3;

  let nextSeed = 0;
  let mountedCells = new Map<string, number>();
  // Every mounted component, by seed: a cell in a fixed column has one in the master table and one in
  // the overlay, under the same coordinates.
  let mountedSeeds = new Set<number>();
  let capturedContext: ReturnType<typeof useHotTableContext> | undefined;

  function SeededCell(props: HotRendererProps) {
    // The initializer runs once per mount, so a cell keeps its seed for as long as it stays mounted.
    const [seed] = React.useState(() => {
      nextSeed += 1;

      return nextSeed;
    });

    capturedContext = useHotTableContext();

    React.useEffect(() => {
      const key = `${props.row}-${props.col}`;

      mountedCells.set(key, seed);
      mountedSeeds.add(seed);

      return () => {
        mountedSeeds.delete(seed);

        if (mountedCells.get(key) === seed) {
          mountedCells.delete(key);
        }
      };
    }, [props.row, props.col, seed]);

    return <span className="seeded-cell" data-seed={seed}>{String(props.value)}</span>;
  }

  beforeEach(() => {
    nextSeed = 0;
    mountedCells = new Map();
    mountedSeeds = new Set();
    capturedContext = undefined;
  });

  async function mountGrid(
    strictMode = false,
    extraProps: Partial<React.ComponentProps<typeof HotTable>> = {},
  ): Promise<HotTableRef['hotInstance']> {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(ROWS, COLS)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        autoRowSize={false}
        autoColumnSize={false}
        renderMode="onChange"
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        renderer={SeededCell}
        {...extraProps}
      />
    ), strictMode).hotInstance!;

    await sleep(100);

    return hotInstance;
  }

  function getCellSeed(hotInstance: HotTableRef['hotInstance'], row: number, col: number): string | null {
    const span = hotInstance!.getCell(row, col)?.querySelector('.seeded-cell');

    return span ? span.getAttribute('data-seed') : null;
  }

  function expectCacheToMatchMountedComponents(hotInstance: HotTableRef['hotInstance']) {
    const componentsInDom = hotInstance!.rootElement.querySelectorAll('.seeded-cell').length;

    expect(capturedContext!.getPortalContainerCacheSize()).toBe(mountedSeeds.size);
    expect(componentsInDom).toBe(mountedSeeds.size);
  }

  it('should keep the other component cells mounted when one cell changes', async() => {
    const hotInstance = await mountGrid();
    const seedBefore = getCellSeed(hotInstance, 1, 0);
    let paintsOfUnchangedCell = 0;

    expect(seedBefore).not.toBeNull();
    expect(mountedCells.get('1-0')).toBe(Number(seedBefore));

    // The grid has to skip the unchanged cell, or this case would not tell a kept portal from a
    // repainted one.
    hotInstance!.addHook('afterRenderer', (TD, row, col) => {
      if (row === 1 && col === 0) {
        paintsOfUnchangedCell += 1;
      }
    });

    await act(async() => {
      hotInstance!.setDataAtCell(0, 1, 'changed');
    });
    await sleep(50);

    expect(paintsOfUnchangedCell).toBe(0);

    expect(hotInstance!.getCell(0, 1)?.textContent).toBe('changed');
    expect(getCellSeed(hotInstance, 1, 0)).toBe(seedBefore);
    expect(hotInstance!.getCell(1, 0)?.textContent).toBe('A2');
    expect(mountedCells.get('1-0')).toBe(Number(seedBefore));
  });

  it('should keep the other component cells mounted when one cell changes, under StrictMode', async() => {
    const hotInstance = await mountGrid(true);
    const seedBefore = getCellSeed(hotInstance, 1, 0);

    expect(document.querySelectorAll('.ht_master').length).toBe(1);
    expect(seedBefore).not.toBeNull();

    await act(async() => {
      hotInstance!.setDataAtCell(0, 1, 'changed');
    });
    await sleep(50);

    expect(document.querySelectorAll('.ht_master').length).toBe(1);
    expect(getCellSeed(hotInstance, 1, 0)).toBe(seedBefore);
    expect(hotInstance!.getCell(1, 0)?.textContent).toBe('A2');
    expectCacheToMatchMountedComponents(hotInstance);
  });

  it('should keep the component of a changed cell mounted and show its new value', async() => {
    const hotInstance = await mountGrid();
    const seedBefore = getCellSeed(hotInstance, 0, 1);

    await act(async() => {
      hotInstance!.setDataAtCell(0, 1, 'changed');
    });
    await sleep(50);

    expect(hotInstance!.getCell(0, 1)?.textContent).toBe('changed');
    expect(getCellSeed(hotInstance, 0, 1)).toBe(seedBefore);
  });

  it('should keep the component cells mounted when the grid renders with nothing changed', async() => {
    const hotInstance = await mountGrid();
    const seedBefore = getCellSeed(hotInstance, 2, 2);

    await act(async() => {
      hotInstance!.render();
    });
    await sleep(50);

    await act(async() => {
      hotInstance!.render();
    });
    await sleep(50);

    expect(getCellSeed(hotInstance, 2, 2)).toBe(seedBefore);
    expect(hotInstance!.getCell(2, 2)?.textContent).toBe('C3');
    expect(mountedCells.get('2-2')).toBe(Number(seedBefore));
  });

  it('should keep a <HotColumn> component cell mounted when a cell in another column changes', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(ROWS, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        autoRowSize={false}
        autoColumnSize={false}
        renderMode="onChange"
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}>
        <HotColumn renderer={SeededCell} />
        <HotColumn />
      </HotTable>
    ), false).hotInstance!;

    await sleep(100);

    const seedBefore = getCellSeed(hotInstance, 3, 0);

    expect(seedBefore).not.toBeNull();

    await act(async() => {
      hotInstance!.setDataAtCell(0, 1, 'changed');
    });
    await sleep(50);

    expect(getCellSeed(hotInstance, 3, 0)).toBe(seedBefore);
    expect(hotInstance!.getCell(3, 0)?.textContent).toBe('A4');
  });

  it('should keep the component cells of the rows that stay rendered across a vertical scroll', async() => {
    const hotInstance = await mountGrid();
    const holder = hotInstance!.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement;
    const seedBefore = getCellSeed(hotInstance, 5, 0);

    expect(seedBefore).not.toBeNull();

    // A scroll event makes a scroll-driven draw: the rows that stay rendered keep their elements, and
    // only the rows that enter the rendered area are painted.
    await act(async() => {
      holder.scrollTop = 69;
      holder.dispatchEvent(new Event('scroll'));
    });
    await sleep(100);

    expect(hotInstance!.getCell(5, 0)?.textContent).toBe('A6');
    expect(getCellSeed(hotInstance, 5, 0)).toBe(seedBefore);
    expect(mountedCells.get('5-0')).toBe(Number(seedBefore));

    await act(async() => {
      hotInstance!.render();
    });
    await sleep(50);

    expect(getCellSeed(hotInstance, 5, 0)).toBe(seedBefore);
  });

  it('should keep a component cell mounted after a full draw moved it to another cell element', async() => {
    const hotInstance = await mountGrid();

    // A full draw that shifts the rendered band repaints the rows into other cell elements.
    await act(async() => {
      hotInstance!.scrollViewportTo({ row: 60, col: 0, verticalSnap: 'top' });
      hotInstance!.render();
    });
    await sleep(50);
    await act(async() => {
      hotInstance!.scrollViewportTo({ row: 64, col: 0, verticalSnap: 'top' });
      hotInstance!.render();
    });
    await sleep(50);

    const seedBefore = getCellSeed(hotInstance, 70, 0);

    expect(seedBefore).not.toBeNull();

    // Cell (74, 0) now sits in the element that held cell (70, 0) before the last draw.
    await act(async() => {
      hotInstance!.setDataAtCell(74, 0, 'changed');
    });
    await sleep(50);

    expect(getCellSeed(hotInstance, 70, 0)).toBe(seedBefore);
    expect(hotInstance!.getCell(70, 0)?.textContent).toBe('A71');
    expectCacheToMatchMountedComponents(hotInstance);
  });

  it('should still drop the components of the cells that scrolled out of the rendered area', async() => {
    const hotInstance = await mountGrid();

    const holder = hotInstance!.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement;

    expect(mountedCells.has('0-0')).toBe(true);

    for (let row = 0; row < ROWS; row += 10) {
      await act(async() => {
        holder.scrollTop = row * 23;
        holder.dispatchEvent(new Event('scroll'));
      });
      await sleep(20);
    }

    await sleep(50);

    expect(mountedCells.has('0-0')).toBe(false);
    expectCacheToMatchMountedComponents(hotInstance);
  });

  it('should keep the component cells of a fixed column and drop them when the column stops being fixed',
    async() => {
      const hotInstance = await mountGrid(false, { fixedColumnsStart: 1 });
      const cloneCell = () => hotInstance!.rootElement
        .querySelectorAll('.ht_clone_inline_start tbody tr')[1]?.querySelector('td .seeded-cell');
      const cloneSeedBefore = cloneCell()?.getAttribute('data-seed');

      expect(cloneSeedBefore).toBeDefined();

      await act(async() => {
        hotInstance!.setDataAtCell(0, 1, 'changed');
      });
      await sleep(50);

      expect(cloneCell()?.getAttribute('data-seed')).toBe(cloneSeedBefore);
      expectCacheToMatchMountedComponents(hotInstance);

      // The overlay's cell elements are removed, so their containers are detached.
      await act(async() => {
        hotInstance!.updateSettings({ fixedColumnsStart: 0 });
      });
      await sleep(50);

      expect(hotInstance!.rootElement.querySelectorAll('.ht_clone_inline_start .seeded-cell').length).toBe(0);
      expectCacheToMatchMountedComponents(hotInstance);
    });

  (['always', 'onChange'] as const).forEach((renderMode) => {
    it(`should keep the component cells of the bottom fixed rows across a vertical scroll (renderMode: '${
      renderMode}')`, async() => {
      const hotInstance = await mountGrid(false, { renderMode, fixedRowsBottom: 2 });
      const holder = hotInstance!.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement;
      const bottomCell = () => hotInstance!.rootElement.querySelector('.ht_clone_bottom tbody tr td .seeded-cell');
      const seedBefore = bottomCell()?.getAttribute('data-seed');

      expect(seedBefore).toBeDefined();

      // A vertical scroll draws the bottom overlay without painting its cells.
      const scrollTo = async(scrollTop: number) => {
        await act(async() => {
          holder.scrollTop = scrollTop;
          holder.dispatchEvent(new Event('scroll'));
        });
        await sleep(80);
      };

      await scrollTo(23 * 15);
      await scrollTo(23 * 40);
      await scrollTo(23 * 80);

      expect(bottomCell()?.getAttribute('data-seed')).toBe(seedBefore);
      expect(bottomCell()?.textContent).toBe(`A${ROWS - 1}`);
      expectCacheToMatchMountedComponents(hotInstance);
    });

    it(`should drop the component of a cell whose element a non-clearing renderer reuses (renderMode: '${
      renderMode}')`, async() => {
      // A renderer that only styles the cell leaves the element's content as it was.
      const stylingRenderer: BaseRenderer = (instance, TD, ...rest) => {
        baseRenderer(instance, TD, ...rest);
        TD.style.color = 'red';
      };
      const hotInstance = await mountGrid(false, {
        renderMode,
        cells: row => (row % 2 ? { renderer: stylingRenderer } : {}),
      });
      const holder = hotInstance!.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement;

      // The rendered band moves by an odd number of rows, so the styled rows land in the elements that
      // held the component rows.
      await act(async() => {
        holder.scrollTop = 23 * 32;
        holder.dispatchEvent(new Event('scroll'));
      });
      await sleep(100);

      await act(async() => {
        hotInstance!.render();
      });
      await sleep(50);

      const firstRow = hotInstance!.getFirstRenderedVisibleRow()!;
      const lastRow = hotInstance!.getLastRenderedVisibleRow()!;

      expect(firstRow % 2).toBe(1);

      for (let row = firstRow; row <= lastRow; row++) {
        const span = hotInstance!.getCell(row, 0)?.querySelector('.seeded-cell');

        expect(span ? span.textContent : null).toBe(row % 2 ? null : `A${row + 1}`);
      }

      expectCacheToMatchMountedComponents(hotInstance);
    });
  });
});

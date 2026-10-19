import { test, expect, THEMES_TAG } from '../fixtures/test';
import { FreezeBarPage } from '../fixtures/pages/FreezeBarPage';

/**
 * The freezeBar plugin: a bar on the freeze line that changes the frozen rows and columns by dragging or with
 * the keyboard. The grid starts with 2 frozen columns and 2 frozen top rows.
 */
test.describe('freezeBar', { tag: THEMES_TAG }, () => {
  let grid: FreezeBarPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FreezeBarPage(page, theme, bundle);
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test.describe('dragging', () => {
    test('the column bar freezes more columns without reordering them', async() => {
      await grid.goto();
      const order = await grid.columnOrder();

      await grid.drag('start', 4);

      expect(await grid.count('start')).toBe(4);
      expect(await grid.columnOrder()).toEqual(order);
      expect(await grid.log()).toEqual([{ edge: 'start', newCount: 4, oldCount: 2, source: 'drag' }]);
    });

    test('dragging the bar back freezes fewer columns', async() => {
      await grid.goto();
      await grid.drag('start', 1);

      expect(await grid.count('start')).toBe(1);
    });

    test('the handle of an empty edge starts the freezing', async() => {
      await grid.goto({ cols: 0, rows: 0 });
      await expect(grid.bar('start')).toBeVisible();
      await grid.drag('start', 3);

      expect(await grid.count('start')).toBe(3);
    });

    test('the handle of an empty end edge starts the freezing, and the grid scrolls to the last columns', async() => {
      await grid.goto();
      await expect(grid.bar('end')).toBeVisible();

      await grid.dragTo('end', 2);

      expect((await grid.scrollPosition()).left).toBeGreaterThan(0);
      await grid.release();

      expect(await grid.count('end')).toBe(2);
    });

    test('an empty bottom handle stays on the corner while the grid is scrolled, and the drag scrolls to the end', async() => {
      await grid.goto();
      await grid.scrollTo({ row: 25 });

      await expect(grid.bar('bottom')).toBeVisible();

      await grid.dragTo('bottom', 2);

      expect((await grid.scrollPosition()).top).toBeGreaterThan(0);
      await grid.release();

      expect(await grid.count('bottom')).toBe(2);
    });

    test('an empty top handle stays on the corner while the grid is scrolled, and the drag scrolls to the top', async() => {
      await grid.goto({ rows: 0 });
      await grid.scrollTo({ row: 25 });

      await expect(grid.bar('top')).toBeVisible();

      await grid.dragTo('top', 3);

      expect((await grid.scrollPosition()).top).toBe(0);
      await grid.release();

      expect(await grid.count('top')).toBe(3);
    });

    test('the end bar follows the right to left layout', async() => {
      await grid.goto({ rtl: 1, end: 1 });
      await grid.drag('end', 3);

      expect(await grid.count('end')).toBe(3);
    });

    test('a drag stores nothing until the pointer is released', async() => {
      await grid.goto();
      await grid.dragTo('start', 5);

      expect(await grid.count('start')).toBe(2);
      await expect(grid.page.locator('.ht-freeze-bar-guide')).toBeVisible();

      await grid.release();

      expect(await grid.count('start')).toBe(5);
      await expect(grid.page.locator('.ht-freeze-bar-guide')).toHaveCount(0);
    });

    test('Escape cancels the drag and stores nothing', async() => {
      await grid.goto();
      await grid.dragTo('start', 5);
      await grid.page.keyboard.press('Escape');
      await grid.release();

      expect(await grid.count('start')).toBe(2);
      expect(await grid.log()).toEqual([]);
      await expect(grid.page.locator('.ht-freeze-bar-guide')).toHaveCount(0);
    });

    test('a count too large for the viewport is clamped', async() => {
      await grid.goto();
      await grid.dragByPixels('start', 5000);

      const count = await grid.count('start');
      const { strip, widest } = await grid.page.evaluate((frozen) => {
        const hot = window.hot;
        const viewport = hot.view.getWorkspaceWidth() - hot.view.getRowHeaderWidth();
        let frozenWidth = 0;
        let widestColumn = 0;

        for (let column = 0; column < hot.countCols(); column += 1) {
          widestColumn = Math.max(widestColumn, hot.getColWidth(column));

          if (column < frozen) {
            frozenWidth += hot.getColWidth(column);
          }
        }

        return { strip: viewport - frozenWidth, widest: widestColumn };
      }, count);

      expect(count).toBeGreaterThan(2);
      // the master keeps a scrollable strip, and the clamp stops within a column or two of the viewport
      expect(strip).toBeGreaterThan(0);
      expect(strip).toBeLessThan(widest * 2);
    });
  });

  test.describe('colors', () => {
    test('a bar keeps its gray while it is held, the indicators of the drag show where it lands', async() => {
      await grid.goto();

      const color = (selector: string) => grid.page.evaluate((sel) => {
        return getComputedStyle(document.querySelector(sel)!).backgroundColor;
      }, selector);
      const idle = await color('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)');

      await grid.dragTo('start', 4);

      await expect(grid.bar('start')).toHaveClass(/ht-freeze-bar--active/);
      await expect(grid.segments('start').first()).toHaveClass(/ht-freeze-bar--active/);
      expect(await color('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)')).toBe(idle);
      await expect(grid.page.locator('.ht-freeze-bar-ghost')).toHaveCount(1);

      await grid.release();

      await expect(grid.bar('start')).not.toHaveClass(/ht-freeze-bar--active/);
      expect(await color('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)')).toBe(idle);
    });

    test('the drawn piece of an empty edge keeps its gray while it is held', async() => {
      await grid.goto({ cols: 0 });

      const pieceColor = () => grid.page.evaluate(() => {
        return getComputedStyle(document.querySelector('.ht-freeze-bar--start')!, '::after').backgroundColor;
      });
      const idle = await pieceColor();

      await grid.dragTo('start', 3);

      expect(await pieceColor()).toBe(idle);

      await grid.release();

      // the edge is frozen now, so the bar itself is drawn, in the same gray
      const bar = await grid.page.evaluate(() => {
        return getComputedStyle(document.querySelector('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)')!)
          .backgroundColor;
      });

      expect(bar).toBe(idle);
    });

    test('a bar shows an open hand, which closes while the bar is held', async() => {
      const cursor = (selector: string) => grid.page.evaluate((sel) => {
        return getComputedStyle(document.querySelector(sel)!).cursor;
      }, selector);
      const startBar = '.ht-freeze-bar--start:not(.ht-freeze-bar--segment)';

      await grid.goto();

      expect(await cursor(startBar)).toBe('grab');
      expect(await cursor('.ht-freeze-bar--top:not(.ht-freeze-bar--segment)')).toBe('grab');
      expect(await cursor('.ht-freeze-bar--start.ht-freeze-bar--segment')).toBe('grab');

      await grid.dragTo('start', 4);

      expect(await cursor(startBar)).toBe('grabbing');
      expect(await cursor('.ht-freeze-bar--start.ht-freeze-bar--segment')).toBe('grabbing');
      // the pointer is over the cells during the drag, so they show the closed hand too
      expect(await cursor('.ht_master .htCore tbody td')).toBe('grabbing');

      await grid.release();

      expect(await cursor(startBar)).toBe('grab');
      expect(await cursor('.ht_master .htCore tbody td')).not.toBe('grabbing');
    });

    test('a bar and the drawn piece of an empty edge have square corners', async() => {
      const radius = (selector: string, pseudo?: string) => grid.page.evaluate(([sel, pse]) => {
        return getComputedStyle(document.querySelector(sel!)!, pse).borderRadius;
      }, [selector, pseudo]);

      await grid.goto();

      expect(await radius('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)')).toBe('0px');
      expect(await radius('.ht-freeze-bar--top:not(.ht-freeze-bar--segment)')).toBe('0px');

      await grid.goto({ cols: 0 });

      expect(await radius('.ht-freeze-bar--start', '::after')).toBe('0px');
    });
  });

  test.describe('hover and the resize handles', () => {
    type Rect = { left: number, right: number, top: number, bottom: number };

    /**
     * Resolves a color token to the computed color, through a probe in the grid (the theme scopes the tokens).
     */
    const tokenColor = (token: string) => grid.page.evaluate((name) => {
      const probe = document.createElement('div');

      probe.style.background = `var(${name})`;
      window.hot.rootElement.appendChild(probe);

      const color = getComputedStyle(probe).backgroundColor;

      probe.remove();

      return color;
    }, token);

    /**
     * The bar of an edge, and the two pills of the resize handle, as page rectangles.
     */
    const handleAround = (edge: 'start' | 'end' | 'top') => grid.page.evaluate((barEdge) => {
      const columns = barEdge !== 'top';
      const handle = document.querySelector<HTMLElement>(columns ? '.manualColumnResizer' : '.manualRowResizer')!;
      const bar = document.querySelector(`.ht-freeze-bar--${barEdge}:not(.ht-freeze-bar--segment)`)!
        .getBoundingClientRect();
      const box = handle.getBoundingClientRect();
      const pill = (pseudo: string) => {
        const style = getComputedStyle(handle, pseudo);

        return columns ?
          { from: box.left + parseFloat(style.left), to: box.left + parseFloat(style.left) + parseFloat(style.width) } :
          { from: box.top + parseFloat(style.top), to: box.top + parseFloat(style.top) + parseFloat(style.height) };
      };

      return {
        className: handle.className,
        bar: columns ? { from: bar.left, to: bar.right } : { from: bar.top, to: bar.bottom },
        pills: [pill('::before'), pill('::after')].sort((a, b) => a.from - b.from),
      };
    }, edge);

    const expectSymmetric = (geometry: Awaited<ReturnType<typeof handleAround>>) => {
      const [first, second] = geometry.pills;

      // 2px between each pill and the bar, one pill on each side
      expect(Math.abs((geometry.bar.from - first.to) - 2)).toBeLessThan(0.6);
      expect(Math.abs((second.from - geometry.bar.to) - 2)).toBeLessThan(0.6);
    };

    const barRect = async(edge: 'start' | 'end' | 'top'): Promise<Rect> => {
      const box = (await grid.bar(edge).boundingBox())!;

      return { left: box.x, right: box.x + box.width, top: box.y, bottom: box.y + box.height };
    };

    const headerStrip = () => grid.page.evaluate(() => {
      const root = window.hot.rootElement.getBoundingClientRect();

      return {
        columnHeaderMiddle: root.top + (window.hot.view.getColumnHeaderHeight() / 2),
        rowHeaderMiddle: window.hot.isRtl() ?
          root.right - (window.hot.view.getRowHeaderWidth() / 2) : root.left + (window.hot.view.getRowHeaderWidth() / 2),
      };
    });

    test('a bar is drawn in the freeze bar color, not in the resize indicator color', async() => {
      await grid.goto();

      const barColor = await grid.page.evaluate(() => {
        return getComputedStyle(document.querySelector('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)')!)
          .backgroundColor;
      });

      expect(barColor).toBe(await tokenColor('--ht-freeze-bar-color'));
      expect(barColor).not.toBe(await tokenColor('--ht-resize-indicator-color'));
    });

    const startPieces = () => grid.page.evaluate(() => {
      const root = window.hot.rootElement.getBoundingClientRect();
      const headerBottom = root.top + window.hot.view.getColumnHeaderHeight();

      return [...document.querySelectorAll<HTMLElement>('.ht-freeze-bar--start')].map((piece) => {
        const rect = piece.getBoundingClientRect();

        return {
          hovered: piece.classList.contains('ht-freeze-bar--hover'),
          image: getComputedStyle(piece).backgroundImage,
          // the part drawn over the headers, in page coordinates
          from: rect.top + parseFloat(piece.style.getPropertyValue('--ht-freeze-bar-header-from')),
          to: rect.top + parseFloat(piece.style.getPropertyValue('--ht-freeze-bar-header-to')),
          headerTop: root.top,
          headerBottom,
        };
      });
    });

    test('a hovered bar turns gray over the column headers, and only there', async() => {
      await grid.goto();

      const bar = await barRect('start');

      await grid.page.mouse.move((bar.left + bar.right) / 2, bar.top + 150);

      const hover = await tokenColor('--ht-freeze-bar-hover-color');
      const highlight = await tokenColor('--ht-freeze-bar-highlight-color');
      const pieces = await startPieces();

      expect(hover).not.toBe(await tokenColor('--ht-freeze-bar-color'));
      expect(pieces.length).toBeGreaterThan(1);
      pieces.forEach((piece) => {
        expect(piece.hovered).toBe(true);
        expect(piece.image).toContain(hover);
        expect(piece.image).not.toContain(highlight);
        expect(Math.abs(piece.from - piece.headerTop)).toBeLessThan(1);
        expect(Math.abs(piece.to - piece.headerBottom)).toBeLessThan(1);
      });

      await grid.page.mouse.move(bar.left - 100, bar.top + 150);

      await expect(grid.page.locator('.ht-freeze-bar--hover')).toHaveCount(0);
    });

    test('a hovered bar follows the column headers when their height changes under the pointer', async() => {
      await grid.goto();

      const bar = await barRect('start');

      await grid.page.mouse.move((bar.left + bar.right) / 2, bar.top + 150);
      await grid.page.evaluate(() => window.hot.updateSettings({ columnHeaderHeight: 70 }));

      const pieces = await startPieces();

      expect(await grid.page.evaluate(() => window.hot.view.getColumnHeaderHeight())).toBeGreaterThan(60);
      expect(pieces.length).toBeGreaterThan(1);
      pieces.forEach((piece) => {
        expect(piece.hovered).toBe(true);
        expect(Math.abs(piece.from - piece.headerTop)).toBeLessThan(1);
        expect(Math.abs(piece.to - piece.headerBottom)).toBeLessThan(1);
      });
    });

    test('a pressed bar takes the highlight color over the column headers, and its plain color once it is dragged',
      async() => {
        await grid.goto();

        const bar = await barRect('start');
        const x = (bar.left + bar.right) / 2;

        await grid.page.mouse.move(x, bar.top + 150);
        await grid.page.mouse.down();

        const highlight = await tokenColor('--ht-freeze-bar-highlight-color');

        (await startPieces()).forEach((piece) => {
          expect(piece.image).toContain(highlight);
        });

        // past the threshold the drag starts, and its indicators take over
        await grid.page.mouse.move(x + 40, bar.top + 150, { steps: 4 });

        await expect(grid.page.locator('.ht-freeze-bar--hover')).toHaveCount(0);
        expect(await grid.page.evaluate(() => {
          return getComputedStyle(document.querySelector('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)')!)
            .backgroundImage;
        })).toBe('none');

        await grid.release();
      });

    test('the pills of the column resize handle lie symmetrically around the start bar', async() => {
      await grid.goto({ resize: 1 });

      const bar = await barRect('start');
      const { columnHeaderMiddle } = await headerStrip();

      // the header of the last frozen column, next to the bar
      await grid.page.mouse.move(bar.left - 3, columnHeaderMiddle);
      await expect(grid.page.locator('.manualColumnResizer')).toHaveClass(/ht-resize-handle--freeze-before/);

      expectSymmetric(await handleAround('start'));
    });

    test('the pills of the column resize handle lie symmetrically around the end bar', async() => {
      await grid.goto({ resize: 1, end: 1 });
      await grid.scrollTo({ col: 13 });

      const bar = await barRect('end');
      const { columnHeaderMiddle } = await headerStrip();

      // the header of the last scrollable column, before the band
      await grid.page.mouse.move(bar.left - 3, columnHeaderMiddle);
      await expect(grid.page.locator('.manualColumnResizer')).toHaveClass(/ht-resize-handle--freeze-after/);

      expectSymmetric(await handleAround('end'));
    });

    test('the pills of the row resize handle lie symmetrically around the top bar', async() => {
      await grid.goto({ resize: 1 });

      const bar = await barRect('top');
      const { rowHeaderMiddle } = await headerStrip();

      await grid.page.mouse.move(rowHeaderMiddle, bar.top - 3);
      await expect(grid.page.locator('.manualRowResizer')).toHaveClass(/ht-resize-handle--freeze-before/);

      expectSymmetric(await handleAround('top'));
    });

    test('the pills lie symmetrically around the start bar in RTL', async() => {
      await grid.goto({ resize: 1, rtl: 1 });

      const bar = await barRect('start');
      const { columnHeaderMiddle } = await headerStrip();

      // in RTL the frozen columns are on the right of the bar
      await grid.page.mouse.move(bar.right + 3, columnHeaderMiddle);
      await expect(grid.page.locator('.manualColumnResizer')).toHaveClass(/ht-resize-handle--freeze-before/);

      expectSymmetric(await handleAround('start'));
    });

    test('a grid without the bars keeps the pills of the resize handle where they are', async() => {
      await grid.goto({ resize: 1, bar: 0 });

      const edge = await grid.boundaryPosition('start', 2);
      const { columnHeaderMiddle } = await headerStrip();

      await grid.page.mouse.move(edge - 3, columnHeaderMiddle);
      // the handle is still marked, only the stylesheet of the bars moves the pills
      await expect(grid.page.locator('.manualColumnResizer')).toHaveClass(/ht-resize-handle--freeze-before/);

      const pillOffset = await grid.page.evaluate(() => {
        return getComputedStyle(document.querySelector('.manualColumnResizer')!, '::before').left;
      });

      expect(pillOffset).toBe('1px');
    });
  });

  test.describe('drag indicators', () => {
    type Box = { left: number, right: number, top: number, bottom: number, display: string };

    const indicators = () => grid.page.evaluate(() => {
      const box = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);

        if (!element) {
          return null;
        }

        const { left, right, top, bottom } = element.getBoundingClientRect();

        return { left, right, top, bottom, display: getComputedStyle(element).display };
      };

      return {
        guide: box('.ht-freeze-bar-guide') as Box | null,
        ghost: box('.ht-freeze-bar-ghost') as Box | null,
        // every element the drag adds next to the bars, so a header highlight under any name is caught
        dragElements: [...window.hot.rootElement.querySelectorAll('[class*="ht-freeze-bar-"]:not(.ht-freeze-bar)')]
          .map(element => element.classList[0]),
      };
    });
    const centerX = (box: Box) => (box.left + box.right) / 2;
    const centerY = (box: Box) => (box.top + box.bottom) / 2;

    test('a shadow follows the pointer, a shadow marks where the bar lands, and no header is highlighted',
      async() => {
        await grid.goto();
        await grid.dragTo('start', 4);

        const b4 = await grid.boundaryPosition('start', 4);
        const b5 = await grid.boundaryPosition('start', 5);
        // inside column 4, closer to the boundary after 4 columns, so the drag snaps to 4
        const pointerX = b4 + ((b5 - b4) * 0.3);
        const bar = (await grid.bar('start').boundingBox())!;

        await grid.page.mouse.move(pointerX, bar.y + 100);

        const { guide, ghost, dragElements } = await indicators();

        expect(Math.abs(centerX(ghost!) - pointerX)).toBeLessThan(1.5);
        expect(Math.abs(centerX(guide!) - b4)).toBeLessThan(1.5);
        expect(dragElements.sort()).toEqual(['ht-freeze-bar-ghost', 'ht-freeze-bar-guide']);

        await grid.release();

        expect(await grid.count('start')).toBe(4);
        await expect(grid.page.locator('.ht-freeze-bar-guide, .ht-freeze-bar-ghost')).toHaveCount(0);
      });

    test('the indicators of a row bar lie across the rows in RTL', async() => {
      await grid.goto({ rtl: 1 });
      await grid.dragTo('top', 4);

      const b4 = await grid.boundaryPosition('top', 4);
      const b5 = await grid.boundaryPosition('top', 5);
      const pointerY = b4 + ((b5 - b4) * 0.3);
      const bar = (await grid.bar('top').boundingBox())!;

      await grid.page.mouse.move(bar.x + bar.width - 100, pointerY);

      const { guide, ghost, dragElements } = await indicators();

      expect(Math.abs(centerY(ghost!) - pointerY)).toBeLessThan(1.5);
      expect(Math.abs(centerY(guide!) - b4)).toBeLessThan(1.5);
      expect(dragElements.sort()).toEqual(['ht-freeze-bar-ghost', 'ht-freeze-bar-guide']);

      await grid.release();

      expect(await grid.count('top')).toBe(4);
    });
  });

  test.describe('scrolling to the edge', () => {
    test('a drag of the top bar scrolls the grid up, so the rows that get frozen are in view', async() => {
      await grid.goto();
      await grid.scrollTo({ row: 40 });

      expect((await grid.scrollPosition()).top).toBeGreaterThan(0);

      await grid.dragTo('top', 4);

      expect((await grid.scrollPosition()).top).toBe(0);
      await expect(grid.rowHeader(3)).toBeVisible();

      await grid.release();

      expect(await grid.count('top')).toBe(4);
    });

    test('a drag of the start bar scrolls the grid back to the first column', async() => {
      await grid.goto();
      await grid.scrollTo({ col: 12 });

      expect((await grid.scrollPosition()).left).toBeGreaterThan(0);

      await grid.dragTo('start', 4);

      expect((await grid.scrollPosition()).left).toBe(0);
      await grid.release();

      expect(await grid.count('start')).toBe(4);
    });

    test('a drag of the bottom bar scrolls the grid down to the last rows', async() => {
      await grid.goto({ bottom: 1 });

      expect((await grid.scrollPosition()).top).toBe(0);

      await grid.dragTo('bottom', 3);

      expect((await grid.scrollPosition()).top).toBeGreaterThan(0);
      await grid.release();

      expect(await grid.count('bottom')).toBe(3);
    });

    test('a drag of the end bar scrolls the grid to the last columns', async() => {
      await grid.goto({ end: 1 });
      await grid.dragTo('end', 3);

      expect((await grid.scrollPosition()).left).toBeGreaterThan(0);
      await grid.release();

      expect(await grid.count('end')).toBe(3);
    });

    test('a scroll while the start bar is held keeps the grid on the first columns and the guide on a column edge',
      async() => {
        await grid.goto({ cols: 4, rows: 0 });
        await grid.page.evaluate(() => {
          window.hot.updateSettings({
            width: 700,
            height: 400,
            colWidths: 100,
            data: window.Handsontable.helper.createSpreadsheetData(50, 40),
          });
          // the largest scroll position the grid reached, to tell a wheel that never scrolled from one that was undone
          (window as any).maxScrollLeft = 0;
          // a capturing listener runs before the plugin's own handling of the same event
          window.addEventListener('scroll', (event) => {
            if (event.target === window.hot.view._wt.wtTable.holder) {
              (window as any).maxScrollLeft = Math.max((window as any).maxScrollLeft, (event.target as HTMLElement).scrollLeft);
            }
          }, true);
        });

        await grid.dragTo('start', 5);
        await grid.page.mouse.wheel(150, 0);

        await expect.poll(() => grid.page.evaluate(() => (window as any).maxScrollLeft)).toBeGreaterThan(0);

        // the guide marks the boundary after the first 5 columns, so those columns must still be the ones in view
        await expect.poll(() => grid.page.evaluate(() => {
          const guide = document.querySelector('.ht-freeze-bar-guide')!.getBoundingClientRect();
          const header = document.querySelector('.ht_clone_top [data-testid="colheader-4"]')!.getBoundingClientRect();

          return {
            left: window.hot.view._wt.wtTable.holder.scrollLeft,
            guideOnEdge: Math.abs(guide.left + guide.width / 2 - header.right) < 2,
          };
        })).toEqual({ left: 0, guideOnEdge: true });

        await grid.release();

        expect(await grid.count('start')).toBe(5);
      });

    test('a scroll while the top bar is held keeps the grid on the first rows', async() => {
      await grid.goto();
      await grid.page.evaluate(() => {
        (window as any).maxScrollTop = 0;
        window.addEventListener('scroll', (event) => {
          if (event.target === window.hot.view._wt.wtTable.holder) {
            (window as any).maxScrollTop = Math.max((window as any).maxScrollTop, (event.target as HTMLElement).scrollTop);
          }
        }, true);
      });

      await grid.dragTo('top', 4);
      await grid.page.mouse.wheel(0, 150);

      await expect.poll(() => grid.page.evaluate(() => (window as any).maxScrollTop)).toBeGreaterThan(0);
      await expect.poll(async() => (await grid.scrollPosition()).top).toBe(0);
      await grid.release();

      expect(await grid.count('top')).toBe(4);
    });

    test('a scroll while the top bar is held keeps a grid of an automatic height in a scrolling div on the first rows',
      async() => {
        await grid.goto({ anc: 1 });
        await grid.page.evaluate(() => {
          (window as any).maxScrollTop = 0;
          window.addEventListener('scroll', (event) => {
            if (event.target === window.hot.view._wt.wtTable.holder) {
              (window as any).maxScrollTop = Math.max((window as any).maxScrollTop,
                (event.target as HTMLElement).scrollTop);
            }
          }, true);
        });

        await grid.dragTo('top', 4);
        await grid.page.mouse.wheel(0, 150);

        await expect.poll(() => grid.page.evaluate(() => (window as any).maxScrollTop)).toBeGreaterThan(0);
        await expect.poll(async() => (await grid.scrollPosition()).top).toBe(0);
        await grid.release();

        expect(await grid.count('top')).toBe(4);
      });
  });

  test.describe('hooks', () => {
    test('returning false from beforeFreezeChange leaves the grid unchanged and fires no afterFreezeChange', async() => {
      await grid.goto();
      await grid.page.evaluate(() => {
        window.hot.addHook('beforeFreezeChange', () => false);
      });
      await grid.drag('start', 4);

      expect(await grid.count('start')).toBe(2);
      expect(await grid.log()).toEqual([]);
      await expect(grid.page.locator('.ht-freeze-bar-guide')).toHaveCount(0);
    });
  });

  test.describe('keyboard', () => {
    test('exposes a separator that reports the count', async() => {
      await grid.goto();

      const bar = grid.separator('start');

      await expect(bar).toHaveAttribute('role', 'separator');
      await expect(bar).toHaveAttribute('aria-orientation', 'vertical');
      await expect(bar).toHaveAttribute('aria-valuenow', '2');
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(grid.separator('top')).toHaveAttribute('aria-orientation', 'horizontal');
    });

    test('the arrow keys change the count by one and Home sets 0', async() => {
      await grid.goto();
      await grid.separator('start').focus();
      await grid.page.keyboard.press('ArrowRight');

      expect(await grid.count('start')).toBe(3);
      await expect(grid.separator('start')).toHaveAttribute('aria-valuenow', '3');

      await grid.separator('start').focus();
      await grid.page.keyboard.press('ArrowLeft');
      await grid.page.keyboard.press('ArrowLeft');

      expect(await grid.count('start')).toBe(1);

      await grid.page.keyboard.press('Home');

      expect(await grid.count('start')).toBe(0);
      expect((await grid.log()).map(entry => entry.source)).toEqual(['keyboard', 'keyboard', 'keyboard', 'keyboard']);
    });
  });

  test.describe('edges with nothing frozen', () => {
    test('draw only a short piece on a header corner, but can be grabbed along the whole edge', async() => {
      await grid.goto({ cols: 0, rows: 0 });

      const geometry = await grid.page.evaluate(() => {
        const visible = (selector: string) => {
          const bar = document.querySelector(selector)!;
          const style = getComputedStyle(bar, '::after');
          const rect = bar.getBoundingClientRect();

          return {
            background: getComputedStyle(bar).backgroundColor,
            hitWidth: Math.round(rect.width),
            hitHeight: Math.round(rect.height),
            drawnWidth: Math.round(parseFloat(style.width) || 0),
            drawnHeight: Math.round(parseFloat(style.height) || 0),
          };
        };
        const root = window.hot.rootElement.getBoundingClientRect();

        return {
          headerWidth: window.hot.view.getRowHeaderWidth(),
          headerHeight: window.hot.view.getColumnHeaderHeight(),
          rootWidth: Math.round(root.width),
          rootHeight: Math.round(root.height),
          top: visible('.ht-freeze-bar--top'),
          start: visible('.ht-freeze-bar--start'),
        };
      });

      // grabbed along the whole edge...
      expect(geometry.top.hitWidth).toBeGreaterThan(geometry.rootWidth - 30);
      expect(geometry.start.hitHeight).toBeGreaterThan(geometry.rootHeight - 30);
      // ...but drawn only on the header corner
      expect(geometry.top.background).toBe('rgba(0, 0, 0, 0)');
      expect(geometry.start.background).toBe('rgba(0, 0, 0, 0)');
      expect(geometry.top.drawnWidth).toBe(geometry.headerWidth);
      expect(geometry.start.drawnHeight).toBe(geometry.headerHeight);
    });

    test('a frozen edge has a bar along the whole freeze line, through the other frozen rows and columns', async() => {
      await grid.goto();

      const extent = await grid.page.evaluate(() => {
        const bounds = (selector: string) => {
          const rects = [...document.querySelectorAll(selector)].map(el => el.getBoundingClientRect());

          return {
            left: Math.round(Math.min(...rects.map(rect => rect.left))),
            right: Math.round(Math.max(...rects.map(rect => rect.right))),
            top: Math.round(Math.min(...rects.map(rect => rect.top))),
            bottom: Math.round(Math.max(...rects.map(rect => rect.bottom))),
            pieces: rects.length,
          };
        };
        const root = window.hot.rootElement.getBoundingClientRect();

        return {
          root: { left: Math.round(root.left), top: Math.round(root.top) },
          top: bounds('.ht-freeze-bar--top'),
          start: bounds('.ht-freeze-bar--start'),
        };
      });

      // the top bar starts over the row headers, so it crosses the frozen start columns
      expect(extent.top.pieces).toBeGreaterThan(1);
      expect(extent.top.left).toBe(extent.root.left);
      // the start bar starts over the column headers, so it crosses the frozen top rows
      expect(extent.start.pieces).toBeGreaterThan(1);
      expect(extent.start.top).toBe(extent.root.top);
    });

    test('every piece of a bar starts the drag', async() => {
      await grid.goto();

      const piece = (await grid.segments('start').first().boundingBox())!;

      await grid.page.mouse.move(piece.x + piece.width / 2, piece.y + piece.height / 2);
      await grid.page.mouse.down();
      await grid.page.mouse.move(piece.x + 120, piece.y + piece.height / 2, { steps: 4 });
      await grid.release();

      expect(await grid.count('start')).toBeGreaterThan(2);
    });

    test('Home leaves the bar in place, so the area can grow again', async() => {
      await grid.goto();
      await grid.separator('start').focus();
      await grid.page.keyboard.press('Home');

      expect(await grid.count('start')).toBe(0);
      await expect(grid.separator('start')).toBeFocused();

      await grid.page.keyboard.press('ArrowRight');

      expect(await grid.count('start')).toBe(1);
    });

    test('setFreezeCount() freezes an edge, and its bar moves onto the freeze line', async() => {
      await grid.goto();
      await grid.page.evaluate(() => window.hot.getPlugin('freezeBar').setFreezeCount('end', 2));

      expect(await grid.count('end')).toBe(2);
      await expect(grid.bar('end')).toBeVisible();
    });
  });

  test.describe('a grid smaller than its container', () => {
    // 5 columns and 8 rows in a 500 x 300 box: the table ends before the container does
    test('the bars do not reach past the rendered table', async() => {
      await grid.goto({ narrow: 1, end: 1, bottom: 1, cols: 1, rows: 1 });

      const extent = await grid.page.evaluate(() => {
        const root = window.hot.rootElement.getBoundingClientRect();
        const table = {
          right: root.left + window.hot.view.getTotalTableWidth(),
          bottom: root.top + window.hot.view.getTotalTableHeight(),
        };
        const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();

        return {
          tableRight: Math.round(table.right),
          tableBottom: Math.round(table.bottom),
          top: Math.round(rect('.ht-freeze-bar--top').right),
          bottom: Math.round(rect('.ht-freeze-bar--bottom').right),
          start: Math.round(rect('.ht-freeze-bar--start').bottom),
          end: Math.round(rect('.ht-freeze-bar--end').bottom),
        };
      });

      expect(extent.top).toBeLessThanOrEqual(extent.tableRight);
      expect(extent.bottom).toBeLessThanOrEqual(extent.tableRight);
      expect(extent.start).toBeLessThanOrEqual(extent.tableBottom);
      expect(extent.end).toBeLessThanOrEqual(extent.tableBottom);
    });

    test('the end bar snaps to whole columns measured from the table edge, not the container edge', async() => {
      await grid.goto({ narrow: 1, end: 1, cols: 1 });
      await grid.drag('end', 2);

      expect(await grid.count('end')).toBe(2);
    });

    test('the bottom bar snaps to whole rows measured from the table edge', async() => {
      await grid.goto({ narrow: 1, bottom: 1, rows: 1 });
      await grid.drag('bottom', 3);

      expect(await grid.count('bottom')).toBe(3);
    });

    test('the handle of an empty end edge sits on the table edge and starts the freezing', async() => {
      await grid.goto({ narrow: 1, cols: 1 });

      const handle = (await grid.bar('end').boundingBox())!;
      const tableRight = await grid.page.evaluate(() => {
        return window.hot.rootElement.getBoundingClientRect().left + window.hot.view.getTotalTableWidth();
      });

      expect(Math.round(handle.x + handle.width)).toBeLessThanOrEqual(Math.round(tableRight) + 1);

      await grid.drag('end', 2);

      expect(await grid.count('end')).toBe(2);
    });
  });

  test.describe('keyboard reach and focus', () => {
    test('the focus stays on the bar when the first column gets frozen', async() => {
      await grid.goto({ cols: 0 });
      await grid.separator('start').focus();
      await grid.page.keyboard.press('ArrowRight');
      await grid.page.keyboard.press('ArrowRight');

      expect(await grid.count('start')).toBe(2);
      await expect(grid.separator('start')).toBeFocused();
    });

    test('the focus stays on the bar when the application updates the settings', async() => {
      await grid.goto();
      await grid.separator('start').focus();
      await grid.page.keyboard.press('ArrowRight');
      await grid.page.evaluate(() => {
        window.hot.updateSettings({ freezeBar: true, fixedColumnsStart: 2 });
      });
      await grid.page.keyboard.press('ArrowRight');

      expect(await grid.count('start')).toBe(4);
      await expect(grid.separator('start')).toBeFocused();
    });

    test('End freezes as many columns as fit', async() => {
      await grid.goto();
      await grid.separator('start').focus();
      await grid.page.keyboard.press('End');

      const count = await grid.count('start');

      expect(count).toBeGreaterThan(2);
      expect(count).toBeLessThan(14);
      await expect(grid.separator('start')).toHaveAttribute('aria-valuemax', String(count));
    });

    test('Ctrl+ArrowRight is left to the browser and screen readers', async() => {
      await grid.goto();
      await grid.separator('start').focus();
      await grid.page.keyboard.press('Control+ArrowRight');

      expect(await grid.count('start')).toBe(2);
    });

    test('ariaTags: false leaves the bars without ARIA attributes', async() => {
      await grid.goto({ aria: 0 });

      await expect(grid.separator('start')).not.toHaveAttribute('role', 'separator');
      await expect(grid.separator('start')).not.toHaveAttribute('aria-valuenow', /.*/);
    });
  });

  test.describe('a bar that holds the focus', () => {
    test('keeps Delete and Enter from reaching the grid', async() => {
      await grid.goto();
      await grid.page.evaluate(() => {
        window.hot.selectCell(5, 5);
      });

      const before = await grid.page.evaluate(() => window.hot.getDataAtCell(5, 5));

      await grid.page.keyboard.press('F6');
      await expect(grid.separator('start')).toBeFocused();
      await grid.page.keyboard.press('Delete');
      await grid.page.keyboard.press('Enter');
      await grid.page.keyboard.press('x');

      expect(await grid.page.evaluate(() => window.hot.getDataAtCell(5, 5))).toBe(before);
      expect(await grid.page.evaluate(() => window.hot.getActiveEditor()?.isOpened() ?? false)).toBe(false);
    });

    test('F6 moves on to the next bar, so the top, end and bottom bars can be reached', async() => {
      await grid.goto();
      await grid.page.evaluate(() => {
        window.hot.selectCell(5, 5);
      });
      await grid.page.keyboard.press('F6');
      await expect(grid.separator('start')).toBeFocused();
      await grid.page.keyboard.press('F6');
      await expect(grid.separator('top')).toBeFocused();
      await grid.page.keyboard.press('F6');
      await expect(grid.separator('end')).toBeFocused();
      await grid.page.keyboard.press('F6');
      await expect(grid.separator('bottom')).toBeFocused();
      await grid.page.keyboard.press('Shift+F6');
      await expect(grid.separator('end')).toBeFocused();
    });

    test('F6 does not scroll the page to the hidden separator', async() => {
      await grid.goto({ win: 1 });
      await grid.page.evaluate(() => {
        window.hot.selectCell(5, 5);
        window.scrollTo(0, 0);
      });

      const before = await grid.page.evaluate(() => window.scrollY);

      await grid.page.keyboard.press('F6');
      await grid.page.keyboard.press('F6');
      await expect(grid.separator('top')).toBeFocused();

      expect(await grid.page.evaluate(() => window.scrollY)).toBe(before);
    });

    test('an arrow on the top bar freezes a row', async() => {
      await grid.goto({ rows: 0 });
      await grid.page.evaluate(() => {
        window.hot.selectCell(5, 5);
      });
      await grid.page.keyboard.press('F6');
      await grid.page.keyboard.press('F6');
      await expect(grid.separator('top')).toBeFocused();
      await grid.page.keyboard.press('ArrowDown');

      expect(await grid.count('top')).toBe(1);
    });
  });

  test.describe('language', () => {
    test('the bars announce the new language after it changes', async() => {
      await grid.goto();
      await expect(grid.separator('start')).toHaveAttribute('aria-label', 'Frozen columns at the start');
      await grid.page.evaluate(() => {
        // the base bundle has no language files, so the dictionary is registered here
        const languages = (window as any).Handsontable.languages;

        languages.registerLanguageDictionary({
          ...languages.getLanguageDictionary('en-US'),
          languageCode: 'pl-PL',
          'FreezeBar:columns.start': 'Zablokowane kolumny na początku',
          'FreezeBar:columns.end': 'Zablokowane kolumny na końcu',
          'FreezeBar:rows.top': 'Zablokowane wiersze u góry',
          'FreezeBar:rows.bottom': 'Zablokowane wiersze na dole',
        });
        window.hot.updateSettings({ language: 'pl-PL' });
      });

      await expect(grid.separator('start')).toHaveAttribute('aria-label', 'Zablokowane kolumny na początku');
      await expect(grid.separator('top')).toHaveAttribute('aria-label', 'Zablokowane wiersze u góry');
    });
  });

  test.describe('a grid without headers', () => {
    test('has handles on an empty edge that stay inside the grid', async() => {
      await grid.goto({ headers: 0, cols: 0, rows: 0 });

      const inside = await grid.page.evaluate(() => {
        const root = window.hot.rootElement.getBoundingClientRect();

        return ['start', 'top', 'end', 'bottom'].map((edge) => {
          const rect = document.querySelector(`.ht-freeze-bar--${edge}`)!.getBoundingClientRect();

          return rect.left >= root.left - 0.5 && rect.top >= root.top - 0.5 &&
            rect.right <= root.right + 0.5 && rect.bottom <= root.bottom + 0.5;
        });
      });

      expect(inside).toEqual([true, true, true, true]);

      await grid.drag('start', 2);

      expect(await grid.count('start')).toBe(2);
    });
  });

  test.describe('a press that only wobbles', () => {
    test('does not scroll the grid or change the count when the bar is pressed and released', async() => {
      await grid.goto();
      await grid.scrollTo({ row: 40 });

      const before = await grid.scrollPosition();
      const bar = (await grid.bar('top').boundingBox())!;

      await grid.page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
      await grid.page.mouse.down();
      await grid.page.mouse.up();

      expect(await grid.scrollPosition()).toEqual(before);
      expect(await grid.count('top')).toBe(2);
      expect(await grid.log()).toEqual([]);
    });

    test('does not lower a count that no longer fits', async() => {
      // 12 columns of 50px do not fit in the 500px grid with a scrollable strip
      await grid.goto({ cols: 12 });

      const bar = (await grid.bar('start').boundingBox())!;
      const x = bar.x + bar.width / 2;
      const y = bar.y + bar.height / 2;

      await grid.page.mouse.move(x, y);
      await grid.page.mouse.down();
      await grid.page.mouse.move(x + 4, y + 1);
      await grid.page.mouse.move(x - 2, y);
      await grid.release();

      expect(await grid.count('start')).toBe(12);
      expect(await grid.log()).toEqual([]);
    });
  });

  test.describe('a bar next to the column and row resizers', () => {
    test('keeps its distance from the last column when the resizers are on', async() => {
      await grid.goto({ narrow: 1, resize: 1 });

      const gap = await grid.page.evaluate(() => {
        const content = window.hot.rootElement.getBoundingClientRect().left + window.hot.view.getTotalTableWidth();
        const handle = document.querySelector('.ht-freeze-bar--end')!.getBoundingClientRect();

        return Math.round(content - handle.right);
      });

      expect(gap).toBeGreaterThanOrEqual(12);
    });
  });

  test.describe('a grid in a scrolling ancestor', () => {
    test('keeps the empty top handle on the header corner while the ancestor scrolls', async() => {
      await grid.goto({ anc: 1, rows: 0 });
      await grid.page.getByTestId('ancestor').evaluate((element) => {
        element.scrollTop = 400;
      });

      await expect.poll(async() => {
        return grid.page.evaluate(() => {
          const ancestor = document.querySelector('[data-testid="ancestor"]')!.getBoundingClientRect();
          const handle = document.querySelector('.ht-freeze-bar--top')!.getBoundingClientRect();

          return handle.top >= ancestor.top - 1 && handle.bottom <= ancestor.bottom + 1;
        });
      }).toBe(true);
    });
  });

  test.describe('a press on the part of a bar in a corner overlay', () => {
    test('updates the maximum on the bar itself, and no ARIA on the piece', async() => {
      await grid.goto();

      const piece = grid.segments('top').first();

      await piece.dispatchEvent('pointerdown', { button: 0, isPrimary: true, pointerId: 7, bubbles: true });
      await grid.page.evaluate(() => document.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7 })));

      await expect(grid.separator('top')).toHaveAttribute('aria-valuemax', /\d+/);
      await expect(piece).not.toHaveAttribute('aria-valuemax', /.*/);
    });
  });

  test.describe('accessibility tree', () => {
    test('the separators are outside the treegrid, and the bars in it are hidden from assistive technology', async() => {
      await grid.goto();

      const tree = await grid.page.evaluate(() => {
        const treegrid = document.querySelector('[role="treegrid"]')!;
        const separators = [...document.querySelectorAll('[role="separator"]')];
        const bars = [...treegrid.querySelectorAll('.ht-freeze-bar')];

        return {
          separators: separators.length,
          insideTreegrid: separators.filter(separator => treegrid.contains(separator)).length,
          barsHidden: bars.every(bar => bar.getAttribute('aria-hidden') === 'true' && !bar.hasAttribute('role')),
          barsFocusable: bars.some(bar => bar.hasAttribute('tabindex')),
        };
      });

      expect(tree).toEqual({ separators: 4, insideTreegrid: 0, barsHidden: true, barsFocusable: false });
    });

    test('a keyboard focus shows a ring on the bar, and a pointer press does not', async() => {
      await grid.goto();
      await grid.page.evaluate(() => {
        window.hot.selectCell(5, 5);
      });
      await grid.page.keyboard.press('F6');
      await expect(grid.bar('start')).toHaveClass(/ht-freeze-bar--focused/);

      await grid.page.keyboard.press('Escape');
      await expect(grid.bar('start')).not.toHaveClass(/ht-freeze-bar--focused/);

      const bar = (await grid.bar('start').boundingBox())!;

      await grid.page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
      await grid.page.mouse.down();
      await grid.page.mouse.up();

      await expect(grid.separator('start')).toBeFocused();
      await expect(grid.bar('start')).not.toHaveClass(/ht-freeze-bar--focused/);
    });

    test('Escape gives the focus back to the grid and still reaches the page', async() => {
      await grid.goto();
      await grid.page.evaluate(() => {
        window.hot.selectCell(5, 5);
        (window as any).escapes = 0;
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            (window as any).escapes += 1;
          }
        });
      });
      await grid.page.keyboard.press('F6');
      await expect(grid.separator('start')).toBeFocused();
      await grid.page.keyboard.press('Escape');

      expect(await grid.page.evaluate(() => (window as any).escapes)).toBe(1);
      await expect(grid.separator('start')).not.toBeFocused();
      expect(await grid.page.evaluate(() => window.hot.getDataAtCell(5, 5))).toBe('F6');
    });

    test('a cut and a paste on a focused separator leave the selected cell alone', async() => {
      await grid.goto();
      await grid.page.evaluate(() => {
        window.hot.selectCell(5, 5);
      });
      await grid.page.keyboard.press('F6');
      await grid.separator('start').dispatchEvent('cut');
      await grid.separator('start').dispatchEvent('paste');

      expect(await grid.page.evaluate(() => window.hot.getDataAtCell(5, 5))).toBe('F6');
    });

    test('the value range stays valid when the count is above what fits', async() => {
      await grid.goto({ cols: 12 });
      await grid.separator('start').focus();

      const separator = grid.separator('start');

      await expect(separator).toHaveAttribute('aria-valuenow', '12');
      expect(Number(await separator.getAttribute('aria-valuemax'))).toBeGreaterThanOrEqual(12);
    });
  });

  test.describe('a wheel over a bar', () => {
    test('scrolls the grid, as it does over a cell', async() => {
      await grid.goto();

      const before = await grid.scrollPosition();
      const bar = (await grid.bar('start').boundingBox())!;

      await grid.page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
      await grid.page.mouse.wheel(0, 150);

      await expect.poll(async() => (await grid.scrollPosition()).top).toBeGreaterThan(before.top);
      expect(await grid.page.evaluate(() => window.scrollY)).toBe(0);
    });
  });

  test.describe('a step over a hidden column', () => {
    test('down skips the column that would be unfrozen', async() => {
      await grid.goto({ cols: 3, hidden: 1 });
      await grid.separator('start').focus();
      await grid.page.keyboard.press('ArrowLeft');

      // column 2 is hidden, so 3 to 2 would change nothing on screen
      expect(await grid.count('start')).toBe(1);
    });
  });

  test.describe('a press that follows an undo', () => {
    test('does not write the count read at the press back', async() => {
      await grid.goto({ undo: 1 });
      await grid.drag('start', 4);

      const bar = (await grid.bar('start').boundingBox())!;

      await grid.page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
      await grid.page.mouse.down();
      await grid.page.evaluate(() => {
        window.hot.getPlugin('undoRedo').undo();
      });
      await grid.page.mouse.up();

      expect(await grid.count('start')).toBe(2);
      expect((await grid.log()).map(entry => entry.source)).toEqual(['drag']);
    });
  });

  test.describe('Filters with filterFixedRows set to false', () => {
    test('exempts a row from the filter as soon as it is frozen', async() => {
      await grid.goto({ filters: 1, rows: 1 });

      const state = () => grid.page.evaluate(() => ({
        rows: window.hot.countRows(),
        first: [0, 1, 2, 3].map(row => window.hot.getDataAtCell(row, 0)).join(','),
      }));

      await grid.page.evaluate(() => {
        const filters = window.hot.getPlugin('filters');

        filters.addCondition(0, 'begins_with', ['A1']);
        filters.filter();
      });

      // A1 and A10 to A19 pass the filter
      expect(await state()).toEqual({ rows: 11, first: 'A1,A10,A11,A12' });

      const updates = await grid.page.evaluate(() => {
        let count = 0;

        window.hot.addHook('afterUpdateSettings', () => { count += 1; });
        window.hot.getPlugin('freezeBar').setFreezeCount('top', 3);

        return count;
      });

      // the three frozen rows are exempt from the filter now, as with `updateSettings({ fixedRowsTop: 3 })`
      expect(await state()).toEqual({ rows: 13, first: 'A1,A2,A3,A10' });
      // and no settings update was announced for a write that is not one
      expect(updates).toBe(0);
    });
  });

  test.describe('with the sheets bar', () => {
    test('a freeze made on one sheet does not follow the user onto a sheet that was never visited', async() => {
      await grid.goto({ sheets: 1, bottom: 1 });
      await grid.drag('start', 4);
      await grid.page.evaluate(() => window.hot.getPlugin('freezeBar').setFreezeCount('top', 3));

      expect(await grid.count('start')).toBe(4);
      expect(await grid.count('top')).toBe(3);

      await grid.page.evaluate(() => window.hot.getPlugin('sheetsBar').setActiveSheet('B'));

      // the frozen counts the grid started with
      expect(await grid.count('start')).toBe(2);
      expect(await grid.count('top')).toBe(2);
      expect(await grid.count('bottom')).toBe(1);

      await grid.page.evaluate(() => window.hot.getPlugin('sheetsBar').setActiveSheet('A'));

      expect(await grid.count('start')).toBe(4);
      expect(await grid.count('top')).toBe(3);
    });
  });

  test.describe('layout direction', () => {
  });

  test.describe('configuration', () => {
    test('a grid configured with the legacy fixedColumnsLeft option changes the count without throwing', async() => {
      await grid.goto({ legacy: 1 });
      await grid.drag('start', 3);

      expect(await grid.count('start')).toBe(3);
    });

    test('a wrapper that re-sends the original option does not revert the change', async() => {
      await grid.goto();
      await grid.drag('start', 4);
      await grid.page.evaluate(() => {
        window.hot.updateSettings({ fixedColumnsStart: 2 });
      });

      expect(await grid.count('start')).toBe(4);
    });

    test('with hidden tracks the stored count matches the visual indexes', async() => {
      await grid.goto({ hidden: 1 });
      await grid.drag('start', 4);

      expect(await grid.count('start')).toBe(4);
    });

    test('one undo reverts the whole drag', async() => {
      await grid.goto({ undo: 1 });
      await grid.drag('start', 4);
      await grid.page.evaluate(() => {
        window.hot.getPlugin('undoRedo').undo();
      });

      expect(await grid.count('start')).toBe(2);
    });
  });

  test.describe('window scroll', () => {
    test('the row bar stays on the freeze line while the page scrolls, and still drags', async() => {
      await grid.goto({ win: 1 });
      await grid.page.evaluate(() => window.scrollTo(0, 400));
      await expect.poll(() => grid.page.evaluate(() => window.scrollY)).toBeGreaterThan(300);

      const lineBottom = async() => grid.page.evaluate(() => {
        const clone = document.querySelector('.ht_clone_top') as HTMLElement;

        return Math.round(clone.getBoundingClientRect().bottom);
      });
      const bar = (await grid.bar('top').boundingBox())!;

      expect(Math.round(bar.y + bar.height)).toBe(await lineBottom());

      await grid.drag('top', 4);

      expect(await grid.count('top')).toBe(4);
    });
  });

  test.describe('pagination', () => {
    test('the row bars are not shown and the column bars keep working', async() => {
      await grid.goto({ rows: 0, pagination: 1 });

      await expect(grid.bar('top')).toHaveCount(0);
      await expect(grid.bar('bottom')).toHaveCount(0);
      await expect(grid.bar('start')).toBeVisible();

      await grid.drag('start', 3);

      expect(await grid.count('start')).toBe(3);
      expect(await grid.page.evaluate(() => window.hot.getPlugin('pagination').enabled)).toBe(true);
    });

    test('the API does not freeze rows next to Pagination', async() => {
      await grid.goto({ rows: 0, pagination: 1 });

      expect(await grid.page.evaluate(() => window.hot.getPlugin('freezeBar').setFreezeCount('top', 2))).toBe(false);
      expect(await grid.count('top')).toBe(0);
    });
  });

  test.describe('teardown', () => {
    test('updateSettings({ freezeBar: false }) removes every bar', async() => {
      await grid.goto();
      await expect(grid.bar('start')).toBeVisible();
      await grid.page.evaluate(() => {
        window.hot.updateSettings({ freezeBar: false });
      });

      await expect(grid.allBars).toHaveCount(0);
    });

    test('destroy() removes every bar', async() => {
      await grid.goto();
      await grid.page.evaluate(() => {
        window.hot.destroy();
      });

      await expect(grid.allBars).toHaveCount(0);
    });
  });
});

test.describe('freezeBar and the rest of the page', { tag: THEMES_TAG }, () => {
  let grid: FreezeBarPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FreezeBarPage(page, theme, bundle);
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('a press on a bar saves the editor that is open', async() => {
    await grid.goto();
    await grid.page.evaluate(() => window.hot.selectCell(5, 5));
    await grid.page.keyboard.type('typed');

    const bar = await grid.bar('start').boundingBox();

    await grid.page.mouse.move(bar!.x + (bar!.width / 2), bar!.y + 150);
    await grid.page.mouse.down();
    await grid.page.mouse.up();

    expect(await grid.page.evaluate(() => window.hot.getDataAtCell(5, 5))).toBe('typed');
    expect(await grid.page.evaluate(() => window.hot.getActiveEditor()?.isOpened())).toBe(false);
  });

  test('Escape on a bar reached with the focus alone gives the keys back to the grid', async() => {
    await grid.goto();
    await grid.page.evaluate(() => {
      window.hot.selectCell(5, 5);
      // a bar reached with Tab has an unknown focus source, and the grid does not listen to the keys then
      window.hot.unlisten();
    });
    await grid.separator('start').focus();
    await grid.page.keyboard.press('Escape');
    await grid.page.keyboard.press('ArrowRight');

    expect(await grid.page.evaluate(() => window.hot.getSelectedLast())).toEqual([5, 6, 5, 6]);
  });

  test('the four bars announce four different names', async() => {
    await grid.goto({ bottom: 1, end: 1 });

    const labels = await grid.page.evaluate(() => {
      return ['top', 'bottom', 'start', 'end'].map((edge) => {
        return document.querySelector(`[data-ht-freeze-separator="${edge}"]`)!.getAttribute('aria-label');
      });
    });

    expect(labels).toEqual([
      'Frozen rows at the top',
      'Frozen rows at the bottom',
      'Frozen columns at the start',
      'Frozen columns at the end',
    ]);
  });

  test('only one bar is a Tab stop, and F6 reaches the others', async() => {
    await grid.goto({ bottom: 1, end: 1 });

    const stops = await grid.page.evaluate(() => {
      return [...document.querySelectorAll<HTMLElement>('[data-ht-freeze-separator]')]
        .filter(separator => separator.tabIndex === 0).length;
    });

    expect(stops).toBe(1);
  });

  test('the focus goes back to the grid when the bar that holds it is removed', async() => {
    await grid.goto();
    await grid.page.evaluate(() => window.hot.selectCell(5, 5));
    await grid.page.keyboard.press('F6');
    await grid.page.keyboard.press('F6');
    await expect(grid.separator('top')).toBeFocused();
    await grid.page.evaluate(() => window.hot.updateSettings({ freezeBar: false }));

    expect(await grid.page.evaluate(() => document.activeElement === document.body)).toBe(false);
    expect(await grid.page.evaluate(() => window.hot.rootElement.contains(document.activeElement))).toBe(true);
  });

  test('a drag under a filter is one undo step, and an undo puts the frozen rows back under the filter', async() => {
    await grid.goto({ filters: 1, rows: 1, undo: 1 });
    await grid.page.evaluate(() => {
      const filters = window.hot.getPlugin('filters');

      filters.addCondition(0, 'begins_with', ['A1']);
      filters.filter();
    });

    const state = () => grid.page.evaluate(() => ({
      rows: window.hot.countRows(),
      top: window.hot.getPlugin('freezeBar').getFreezeCount('top'),
      first: [0, 1, 2, 3].map(row => window.hot.getDataAtCell(row, 0)).join(','),
    }));

    expect(await state()).toEqual({ rows: 11, top: 1, first: 'A1,A10,A11,A12' });

    await grid.drag('top', 3);

    expect(await state()).toEqual({ rows: 13, top: 3, first: 'A1,A2,A3,A10' });

    // Filters exempts the frozen rows again in the render of the drag, and that change joins the step of the drag
    await grid.page.evaluate(() => window.hot.getPlugin('undoRedo').undo());

    expect(await state()).toEqual({ rows: 11, top: 1, first: 'A1,A10,A11,A12' });

    await grid.page.evaluate(() => window.hot.getPlugin('undoRedo').redo());

    expect(await state()).toEqual({ rows: 13, top: 3, first: 'A1,A2,A3,A10' });
  });

  test('the hover does not stay on a bar that moved to another host', async() => {
    await grid.goto({ cols: 0 });

    // the pointer events are sent by hand: the browser may send its own `pointerleave` after the bar moved
    await grid.page.evaluate(() => {
      document.querySelector('.ht-freeze-bar--start')!.dispatchEvent(new PointerEvent('pointerenter'));
    });
    await expect(grid.page.locator('.ht-freeze-bar--hover')).not.toHaveCount(0);
    // the handle goes from the root element to the overlay, and no pointer event follows
    await grid.page.evaluate(() => window.hot.getPlugin('freezeBar').setFreezeCount('start', 1));

    await expect(grid.page.locator('.ht-freeze-bar--hover')).toHaveCount(0);
  });

  test('a keyboard step does not stop on a hidden column before the opposite band', async() => {
    await grid.goto();
    await grid.page.evaluate(() => window.hot.updateSettings({
      data: window.Handsontable.helper.createSpreadsheetData(20, 6),
      fixedColumnsStart: 3,
      fixedColumnsEnd: 2,
      hiddenColumns: { columns: [3] },
    }));

    expect(await grid.count('start')).toBe(3);

    await grid.separator('start').focus();
    await grid.page.keyboard.press('ArrowRight');

    expect(await grid.count('start')).toBe(3);
    expect(await grid.log()).toEqual([]);
    await expect(grid.separator('start')).toHaveAttribute('aria-valuemax', '3');
  });

  test('the counts follow the visual rows when rows are trimmed', async() => {
    await grid.goto();
    await grid.page.evaluate(() => {
      window.hot.updateSettings({ trimRows: true });
      window.hot.getPlugin('trimRows').trimRow(1);
      window.hot.getPlugin('trimRows').trimRow(2);
    });
    await grid.page.evaluate(() => window.hot.getPlugin('freezeBar').setFreezeCount('top', 3));

    const frozen = await grid.page.evaluate(() => ({
      count: window.hot.getPlugin('freezeBar').getFreezeCount('top'),
      shown: window.hot.countRows(),
      // the visual rows the top overlay draws
      rows: [...document.querySelectorAll('.ht_clone_top tbody tr')]
        .map(row => window.hot.getCoords(row.querySelector('td')!)?.row),
    }));

    expect(frozen.count).toBe(3);
    expect(frozen.shown).toBe(48);
    // the frozen rows are the first three that are shown
    expect(frozen.rows).toEqual([0, 1, 2]);
  });

  test('the bars stay inside the layout when the grid is scaled', async() => {
    await grid.goto({ scale: 0.5, cols: 0, rows: 0, end: 0, bottom: 0 });

    const placement = await grid.page.evaluate(() => {
      const root = window.hot.rootElement.getBoundingClientRect();
      const rect = (edge: string) => {
        const box = document.querySelector(`.ht-freeze-bar--${edge}:not(.ht-freeze-bar--segment)`)!
          .getBoundingClientRect();

        return { left: box.left - root.left, right: box.right - root.left, top: box.top - root.top, bottom: box.bottom - root.top };
      };

      return { root: { width: root.width, height: root.height }, end: rect('end'), bottom: rect('bottom') };
    });

    // the end handle is at the end edge of the grid, and the bottom handle at its bottom edge, not in the middle
    expect(placement.end.right).toBeGreaterThan(placement.root.width - 12);
    expect(placement.end.right).toBeLessThanOrEqual(placement.root.width + 1);
    expect(placement.bottom.bottom).toBeGreaterThan(placement.root.height - 12);
    expect(placement.bottom.bottom).toBeLessThanOrEqual(placement.root.height + 1);
  });

  test('the guide of a drag lies on the new freeze line when the grid is scaled', async() => {
    await grid.goto({ scale: 0.5 });
    await grid.dragTo('start', 4);

    const gap = await grid.page.evaluate(() => {
      const guide = document.querySelector('.ht-freeze-bar-guide')!.getBoundingClientRect();
      const header = document.querySelector('[data-testid="colheader-4"]')!.getBoundingClientRect();

      return Math.abs((guide.left + (guide.width / 2)) - header.left);
    });

    expect(gap).toBeLessThan(2);

    await grid.release();
  });

  test('a bar sits above the selection borders and below the fill handle', async() => {
    await grid.goto();

    const zIndex = await grid.page.evaluate(() => {
      return Number(getComputedStyle(document.querySelector('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)')!)
        .zIndex);
    });

    expect(zIndex).toBeGreaterThan(10);
    expect(zIndex).toBeLessThan(110);
  });

  test('the ring of a focused bar is drawn inside the bar', async() => {
    await grid.goto();
    await grid.page.evaluate(() => window.hot.selectCell(5, 5));
    await grid.page.keyboard.press('F6');
    await expect(grid.separator('start')).toBeFocused();

    const offset = await grid.page.evaluate(() => {
      return parseFloat(getComputedStyle(document.querySelector('.ht-freeze-bar--start.ht-freeze-bar--focused')!)
        .outlineOffset);
    });

    expect(offset).toBeLessThan(0);
  });
});

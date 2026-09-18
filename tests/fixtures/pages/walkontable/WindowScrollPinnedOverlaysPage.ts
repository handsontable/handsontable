import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Which pinned clone a scan looks at, and the unique color the fixture paints its row headers.
 */
interface PinnedClone {
  name: 'inlineStart' | 'topCorner' | 'bottomCorner';
  rgb: [number, number, number];
}

/**
 * How many screencast frames showed each pinned clone away from its viewport edge.
 */
export interface PinnedFramesReport {
  /** Frames the compositor painted with the page at a different horizontal offset than at rest. */
  scrolledFrames: number;
  /** Of those, frames where the clone's marker was not fully painted at its pinned place. */
  torn: Record<PinnedClone['name'], number>;
}

const PINNED_CLONES: PinnedClone[] = [
  { name: 'inlineStart', rgb: [255, 0, 255] },
  { name: 'topCorner', rgb: [0, 255, 255] },
  { name: 'bottomCorner', rgb: [255, 255, 0] },
];

/**
 * Page Object for the window-scroll pinned overlays fixture (DEV-127).
 *
 * With no `width` and no `height`, the window scrolls the grid, and three clones – the one holding
 * the row headers and the two inline-start corners – must stay at the viewport's inline-start edge
 * while the page scrolls sideways. Whether they did is a question about PAINTED frames only: every
 * DOM read answers "pinned" even while the screen shows the header torn away, because anything the
 * engine writes from a scroll listener agrees with itself when read back. So the scroll is recorded
 * with a CDP screencast (lossless PNG, one record per painted frame, each carrying the compositor's
 * own scroll offset), and the frames are scanned for the unique color the fixture paints each
 * clone's row headers.
 */
export class WindowScrollPinnedOverlaysPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly inlineStartClone: Locator;
  readonly topCornerClone: Locator;

  /** Whether the current page was opened right-to-left (`goto({ rtl: true })`). */
  rtl = false;

  /**
   * What the page reported while loading. A grid that never appears says nothing about why, so
   * `goto()` puts these into its failure instead of a bare "element not found".
   */
  readonly #pageProblems: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.inlineStartClone = this.grid.locator('.ht_clone_inline_start');
    this.topCornerClone = this.grid.locator('.ht_clone_top_inline_start_corner');

    page.on('pageerror', error => this.#pageProblems.push(`pageerror: ${error.message}`));
    page.on('requestfailed', request =>
      this.#pageProblems.push(`requestfailed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        this.#pageProblems.push(`console.error: ${message.text()}`);
      }
    });
  }

  /**
   * Navigate and wait for the grid to render. `frozen` adds two frozen columns and two frozen bottom
   * rows, so both inline-start corners carry content; `rtl` renders the grid and the page
   * right-to-left; `unpinned` is the positive control, where the clones stop following the page.
   */
  async goto({ frozen = false, rtl = false, unpinned = false } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (frozen) {
      params.set('frozen', '1');
    }

    if (rtl) {
      params.set('rtl', '1');
    }

    if (unpinned) {
      params.set('control', 'unpinned');
    }

    this.rtl = rtl;
    this.#pageProblems.length = 0;
    await this.page.goto(`/tests/fixtures/demo/walkontable/window-scroll-pinned-overlays.html?${params}`);

    try {
      await expect(this.master.locator('tbody td').first()).toBeVisible();
      await expect(this.inlineStartClone.locator('tbody th').first()).toBeVisible();
    } catch (error) {
      const report = this.#pageProblems.length > 0 ? this.#pageProblems.join(' | ') : 'the page reported no errors';

      throw new Error(`the grid did not render (${report})\n${error instanceof Error ? error.message : String(error)}`);
    }

    await this.page.evaluate(() => document.fonts.ready);
  }

  /**
   * The window's horizontal scroll distance from its resting place, positive towards the inline end
   * in both directions (RTL reports it as a negative `scrollX`).
   */
  async windowScrollDistance(): Promise<number> {
    return this.page.evaluate(() => Math.abs(window.scrollX));
  }

  /** The lowest column index the master actually renders. */
  async masterFirstRenderedColumn(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { view: { _wt: { wtTable: { getFirstRenderedColumn(): number } } } }
    }).hot.view._wt.wtTable.getFirstRenderedColumn());
  }

  /**
   * Put the pointer over the grid's body, where a wheel reaches the page, without pressing.
   */
  async hoverGrid(): Promise<void> {
    const box = await this.master.boundingBox();

    if (!box) {
      throw new Error('the master has no box to hover');
    }

    await this.page.mouse.move((this.page.viewportSize()?.width ?? 800) / 2, box.y + (box.height / 2));
  }

  /**
   * Scroll the page sideways with real wheel events, then wait until the engine has rendered a band
   * starting past the one it started on AND the scroll and that band have both stopped moving – a
   * render-state probe. A wheel step is applied asynchronously, so the first band past the start can
   * belong to a scroll still under way, and a cell picked from it would slide away before a click
   * lands. `deltaX` is "towards the inline end": the wheel sign flips in RTL.
   */
  async wheelScrollHorizontally(deltaX: number, steps = 8): Promise<void> {
    const columnBefore = await this.masterFirstRenderedColumn();

    await this.hoverGrid();

    for (let i = 0; i < steps; i += 1) {
      await this.page.mouse.wheel(this.rtl ? -deltaX : deltaX, 0);
    }

    await expect.poll(() => this.masterFirstRenderedColumn()).toBeGreaterThan(columnBefore);

    let previous = '';

    await expect.poll(async() => {
      const state = `${await this.windowScrollDistance()}:${await this.masterFirstRenderedColumn()}`;
      const settled = state === previous;

      previous = state;

      return settled;
    }, { intervals: [100] }).toBe(true);
  }

  /**
   * Scroll the page sideways and back with real wheel events while recording every painted frame,
   * then report, per pinned clone, how many frames with the page scrolled showed that clone's row
   * headers anywhere but fully at their pinned place.
   *
   * The profile accelerates and decelerates, as the original report describes, and stays far inside
   * the table: a scroll that parks at the document end runs end-of-table handling and measures that
   * instead.
   */
  async recordHorizontalWheelScroll(): Promise<PinnedFramesReport> {
    const scanlines = await this.#pinnedScanlines();
    const client = await this.page.context().newCDPSession(this.page);
    const frames: { data: string, scrollOffsetX: number, deviceWidth: number }[] = [];

    client.on('Page.screencastFrame', (frame) => {
      frames.push({
        data: frame.data,
        scrollOffsetX: frame.metadata.scrollOffsetX ?? 0,
        deviceWidth: frame.metadata.deviceWidth,
      });
      // Unacknowledged, the screencast stops after a few frames.
      client.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {});
    });

    const startDistance = await this.windowScrollDistance();

    await this.hoverGrid();
    await client.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
    // The first frame is the reference: it is taken at rest, with every clone where it belongs.
    await expect.poll(() => frames.length).toBeGreaterThan(0);

    const bursts = [
      { delta: 60, times: 5 },
      { delta: 160, times: 5 },
      { delta: 320, times: 5 },
      { delta: 160, times: 5 },
      { delta: 60, times: 5 },
    ];
    const sign = this.rtl ? -1 : 1;

    for (const direction of [1, -1]) {
      for (const burst of bursts) {
        for (let i = 0; i < burst.times; i += 1) {
          await this.page.mouse.wheel(sign * direction * burst.delta, 0);
        }
      }
    }

    // Wait for the page to come back to rest before the screencast stops, so the last frames are the
    // settled ones rather than a cut-off in the middle of the return scroll.
    await expect.poll(() => this.windowScrollDistance()).toBe(startDistance);
    await client.send('Page.stopScreencast');
    await client.detach();

    const reference = frames[0];
    const scrolled = frames.filter(frame => frame.scrollOffsetX !== reference.scrollOffsetX);

    // A leg that never scrolled reads as perfectly pinned. It is a dead leg, not a result.
    expect(scrolled.length, 'the page must actually scroll while the screencast records').toBeGreaterThan(20);

    return this.page.evaluate(async({ reference: ref, scrolled: moving, lines, clones, rtl }) => {
      const decode = async(data: string) => {
        const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
        const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d', { willReadFrequently: true })!;

        context.drawImage(bitmap, 0, 0);

        return context.getImageData(0, 0, bitmap.width, bitmap.height);
      };
      // How many pixels of a scanline, counted inwards from the pinned (inline-start) edge of the
      // viewport, carry the clone's color – with a short gap allowed for a header's text glyphs.
      const painted = (image: ImageData, y: number, rgb: number[], scale: number) => {
        const row = Math.round(y * scale);
        let count = 0;
        let gap = 0;

        for (let i = 0; i < image.width; i += 1) {
          const x = rtl ? image.width - 1 - i : i;
          const k = ((row * image.width) + x) * 4;
          const hit = Math.abs(image.data[k] - rgb[0]) <= 8
            && Math.abs(image.data[k + 1] - rgb[1]) <= 8
            && Math.abs(image.data[k + 2] - rgb[2]) <= 8;

          if (hit) {
            count += 1 + gap;
            gap = 0;
          } else if (count === 0 && i < 4) {
            // The run may start a pixel or two in from the edge (a frame border).
          } else if (gap < 4) {
            gap += 1;
          } else {
            break;
          }
        }

        return count;
      };

      const refImage = await decode(ref.data);
      const scale = refImage.width / ref.deviceWidth;
      const expected: Record<string, number> = {};

      for (const clone of clones) {
        const y = lines[clone.name];

        expected[clone.name] = y === null ? 0 : painted(refImage, y, clone.rgb, scale);
      }

      const torn: Record<string, number> = { inlineStart: 0, topCorner: 0, bottomCorner: 0 };

      for (const frame of moving) {
        const image = await decode(frame.data);

        for (const clone of clones) {
          const y = lines[clone.name];

          if (y !== null && painted(image, y, clone.rgb, scale) < expected[clone.name] - 3) {
            torn[clone.name] += 1;
          }
        }
      }

      return { scrolledFrames: moving.length, torn, expected };
    }, { reference, scrolled, lines: scanlines, clones: PINNED_CLONES, rtl: this.rtl })
      .then(({ scrolledFrames, torn, expected }) => {
        // The reference frame must show every scanned clone at close to its full width, or the scan
        // is mis-tuned and a zero below would mean nothing.
        for (const clone of PINNED_CLONES) {
          if (scanlines[clone.name] !== null) {
            expect(expected[clone.name], `the ${clone.name} clone must be painted on the resting frame`)
              .toBeGreaterThan(scanlines.headerWidth * 0.8);
          }
        }

        return { scrolledFrames, torn: torn as PinnedFramesReport['torn'] };
      });
  }

  /** A data cell in a frozen column, as the inline-start clone renders it. */
  frozenColumnCell(row: number, col: number): Locator {
    return this.inlineStartClone.getByTestId(`cell-${row}-${col}`);
  }

  /** The row header of a row, as the inline-start clone renders it. */
  rowHeader(row: number): Locator {
    return this.inlineStartClone.locator('tbody th')
      .filter({ has: this.page.getByText(String(row + 1), { exact: true }) });
  }

  /** Select a cell by clicking it, and wait for the selection to land on it. */
  async selectCell(cell: Locator): Promise<void> {
    await cell.click();
    await expect(cell).toHaveClass(/\bcurrent\b/);
  }

  /**
   * Open the editor on a cell with a double-click, and wait until the editor reports itself open
   * ON THAT CELL – the holder element is reused and merely moved, so its visibility says nothing
   * about which cell it is placed over.
   */
  async openEditor(cell: Locator): Promise<Locator> {
    await cell.dblclick();

    await expect.poll(() => cell.evaluate((td) => {
      const editor = (window as unknown as {
        hot: { getActiveEditor(): { isOpened(): boolean, TD: HTMLElement } | undefined }
      }).hot.getActiveEditor();

      return Boolean(editor && editor.isOpened() && editor.TD === td);
    })).toBe(true);

    return this.page.locator('.handsontableInputHolder').first();
  }

  /** The fill handle the inline-start clone draws for a selection in a frozen column. */
  frozenColumnFillHandle(): Locator {
    return this.inlineStartClone.locator('.wtBorder.corner').first();
  }

  /** Hover a row header and wait for the row-resize handle to appear. */
  async hoverRowHeader(row: number): Promise<Locator> {
    await this.rowHeader(row).hover();

    const handle = this.grid.locator('.manualRowResizer');

    await expect(handle).toBeVisible();

    return handle;
  }

  /**
   * A master cell of `row` in the column under the middle of the viewport – visible whatever the
   * scroll direction, and clear of the clones pinned at the inline-start edge.
   */
  async cellAtViewportCenter(row: number): Promise<Locator> {
    const testId = await this.page.evaluate(({ r }) => {
      const probe = document.querySelector(`.ht_master [data-testid^="cell-${r}-"]`)!;
      const y = probe.getBoundingClientRect().top + 4;
      const hit = document.elementsFromPoint(window.innerWidth / 2, y)
        .find(el => el.closest('.ht_master') && el.getAttribute('data-testid')?.startsWith(`cell-${r}-`));

      return hit?.getAttribute('data-testid') ?? null;
    }, { r: row });

    if (!testId) {
      throw new Error(`no master cell of row ${row} under the middle of the viewport`);
    }

    return this.master.getByTestId(testId);
  }

  /**
   * Move the horizontal scroll axis between the window and the grid's own box by clipping the page
   * container – the way a page can take the axis away from the window without touching the grid's
   * settings – and wait until the engine has re-resolved the owner.
   */
  async setContainerClipped(clipped: boolean): Promise<void> {
    await this.page.evaluate((clip) => {
      const container = document.querySelector<HTMLElement>('[data-testid="grid"]')!;

      container.style.width = clip ? '700px' : '';
      container.style.overflowX = clip ? 'clip' : '';
      // The owners are re-resolved on a full draw.
      (window as unknown as { hot: { render(): void } }).hot.render();
    }, clipped);

    await expect.poll(() => this.page.evaluate(() => (window as unknown as {
      hot: { view: { _wt: { wtViewport: { isHorizontallyScrollableByWindow(): boolean } } } }
    }).hot.view._wt.wtViewport.isHorizontallyScrollableByWindow())).toBe(!clipped);
  }

  /**
   * Switch the column headers off or on, then draw once more: the draw after the one that stops an
   * overlay rendering is the first to position the overlay as an idle one.
   */
  async setColumnHeaders(enabled: boolean): Promise<void> {
    await this.page.evaluate((on) => {
      const { hot } = window as unknown as { hot: { updateSettings(settings: object): void, render(): void } };

      hot.updateSettings({ colHeaders: on });
      hot.render();
    }, enabled);
  }

  /** Whether a clone sits inside a rail (`div.htInlineStartRail`), the way the page pins it. */
  async isInRail(clone: Locator): Promise<boolean> {
    return clone.evaluate(element => element.parentElement?.classList.contains('htInlineStartRail') ?? false);
  }

  /** The viewport's size in CSS pixels. */
  viewport(): { width: number, height: number } {
    const size = this.page.viewportSize();

    if (!size) {
      throw new Error('the page has no viewport size');
    }

    return size;
  }

  /** A locator's box, failing loudly when it has none. */
  async box(locator: Locator): Promise<{ x: number, y: number, width: number, height: number }> {
    const box = await locator.boundingBox();

    if (!box) {
      throw new Error('the element has no box');
    }

    return box;
  }

  /**
   * One scanline per pinned clone, in CSS pixels from the viewport top, taken through the second
   * row header each clone renders (away from any frame border), or `null` for a clone with nothing
   * to scan. Also the row header width the scan must find on the resting frame.
   */
  async #pinnedScanlines(): Promise<Record<PinnedClone['name'], number | null> & { headerWidth: number }> {
    return this.page.evaluate(() => {
      const line = (selector: string) => {
        const cells = document.querySelectorAll(selector);
        const cell = cells[Math.min(1, cells.length - 1)];

        if (!cell) {
          return null;
        }

        const rect = cell.getBoundingClientRect();

        return Math.round(rect.top + 4);
      };
      const header = document.querySelector('.ht_clone_inline_start tbody th')!;

      return {
        inlineStart: line('.ht_clone_inline_start tbody th'),
        topCorner: line('.ht_clone_top_inline_start_corner thead th'),
        bottomCorner: line('.ht_clone_bottom_inline_start_corner tbody th'),
        headerWidth: Math.round(header.getBoundingClientRect().width),
      };
    });
  }
}

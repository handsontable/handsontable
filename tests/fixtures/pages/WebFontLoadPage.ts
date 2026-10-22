import { type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface GridGeometry {
  wrappedCellHeight: number;
  wrappedRowHeaderHeight: number;
  wrappedFrozenCellHeight: number;
  autoSizedTextWidth: number;
  autoSizedCellWidth: number;
  tableHeight: number;
  rootHeight: number;
}

/**
 * Page Object for the fixture whose cells use a web font that loads only after the grid has drawn
 * (DEV-199). `loadFont()` adds the font face at the moment the test chooses, so the first draw always
 * measures the fallback font.
 */
export class WebFontLoadPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the first draw. A `variant` is extra query parameters such as
   * `&height=1` (see the fixture).
   */
  async goto(variant = ''): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/web-font-load.html?theme=${this.theme}&bundle=${this.bundle}${variant}`);
    await awaitBundle(this.page);
    await expect(this.page.locator('.ht_master tbody tr').first()).toBeVisible();
  }

  /**
   * Loads the `HtLateFont` face the fixture's cells ask for. It is a system font drawn at twice its size
   * (`size-adjust`), so it needs no network and the text gets much wider than the fallback. Resolves once
   * the face has loaded; the document fires `loadingdone` at that point. Throws when none of the local
   * fonts exists, so a missing font fails the test instead of passing it with nothing loaded.
   */
  async loadFont(): Promise<void> {
    await this.page.evaluate(async() => {
      const face = new FontFace(
        'HtLateFont',
        'local("DejaVu Sans"), local("Liberation Sans"), local("Arial"), local("Helvetica"), local("Noto Sans")',
        { sizeAdjust: '200%' },
      );

      document.fonts.add(face);
      await face.load();
    });
  }

  /**
   * Reads, in one evaluation, the sizes the font changes: the wrapped cell (B2) beside its row header and
   * its frozen-column neighbor, the no-wrap cell (C4) against its text, and the table against the grid's
   * root element.
   */
  async geometry(): Promise<GridGeometry> {
    return this.page.evaluate(() => {
      const height = (element: Element | null | undefined) => element?.getBoundingClientRect().height ?? NaN;
      const masterRows = document.querySelectorAll('.ht_master .htCore tbody tr');
      const frozenRows = document.querySelectorAll('.ht_clone_inline_start .htCore tbody tr');
      const autoSizedCell = masterRows[3].querySelectorAll('td')[2];

      return {
        wrappedCellHeight: height(masterRows[1].querySelectorAll('td')[1]),
        wrappedRowHeaderHeight: height(frozenRows[1].querySelector('th')),
        wrappedFrozenCellHeight: height(frozenRows[1].querySelector('td')),
        autoSizedTextWidth: autoSizedCell.scrollWidth,
        autoSizedCellWidth: autoSizedCell.clientWidth,
        tableHeight: height(document.querySelector('.ht_master .htCore')),
        rootHeight: height(document.querySelector('[data-testid="grid"]')),
      };
    });
  }

  /**
   * Destroys the grid.
   */
  async destroyGrid(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { hot: { destroy(): void } }).hot.destroy();
    });
  }

  /**
   * Resolves after the browser has painted the given number of frames, so work queued for the next
   * animation frame has had its turn. Counts frames, not milliseconds.
   */
  async waitForFrames(frames: number): Promise<void> {
    await this.page.evaluate(async(count) => {
      for (let i = 0; i < count; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    }, frames);
  }
}

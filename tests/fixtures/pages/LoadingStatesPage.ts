import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * The fixture's options, the visual suite's `/loading-demo` route params by another name.
 */
export interface LoadingOptions {
  content?: 'default' | 'custom';
  noData?: boolean;
  dir?: 'ltr' | 'rtl';
}

/**
 * A box in viewport coordinates, as `getBoundingClientRect()` reports it.
 */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * The overlay, the grid's root, the icon, the texts and the colors a test compares, read in one
 * evaluation.
 */
export interface LoadingGeometry {
  overlay: Box;
  root: Box;
  icon: Box;
  /**
   * The title's text as the browser laid it out (a `Range` box, so it is the glyphs, not the block).
   */
  titleText: Box;
  title: Box;
  /**
   * The description's box and type, or `null` without a description.
   */
  description: { box: Box; color: string; fontSize: string } | null;
  /**
   * The column gap of `.ht-loading__content`, the flex row that holds the icon and the texts.
   */
  contentGap: number;
  /**
   * The backdrop's alpha, and the theme's `--ht-dialog-semi-transparent-background-opacity` as a fraction.
   */
  backdropAlpha: number;
  semiTransparentOpacity: number;
  /**
   * The overlay's top border color and the theme tokens the tests compare with, read through a probe
   * element in the same evaluation: `--ht-accent-color`, `--ht-foreground-secondary-color` and
   * `--ht-font-size-small`.
   */
  borderColor: string;
  accentColor: string;
  secondaryColor: string;
  smallFontSize: string;
  dir: string | null;
}

/**
 * Page object for `fixtures/demo/loading-states.html`, the loading overlay laid out as the visual
 * suite's `/loading-demo` route lays it out.
 */
export class LoadingStatesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  /**
   * The loading overlay is a dialog wearing the `ht-loading` class.
   */
  readonly overlay: Locator;
  readonly icon: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly inputBefore: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.overlay = page.locator('.ht-dialog.ht-loading');
    this.icon = this.overlay.locator('.ht-loading__icon');
    this.title = this.overlay.locator('.ht-loading__title');
    this.description = this.overlay.locator('.ht-loading__description');
    this.inputBefore = page.getByTestId('input-before');
  }

  /**
   * Opens the fixture with the given options and waits for the overlay it shows on load.
   *
   * @param {LoadingOptions} options The fixture's options.
   */
  async goto(options: LoadingOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (options.content) {
      params.set('content', options.content);
    }
    if (options.noData !== undefined) {
      params.set('nodata', options.noData ? '1' : '0');
    }
    if (options.dir) {
      params.set('dir', options.dir);
    }

    await this.page.goto(`/tests/fixtures/demo/loading-states.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.overlay).toHaveClass(/\bht-dialog--show\b/);
  }

  /**
   * The number of rows the grid holds.
   *
   * @returns {Promise<number>}
   */
  async rowCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { hot: { countRows(): number } }).hot.countRows());
  }

  /**
   * The name of the shortcut context the grid's keyboard goes to.
   *
   * @returns {Promise<string>}
   */
  async activeShortcutContext(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getShortcutManager(): { getActiveContextName(): string } };
    }).hot.getShortcutManager().getActiveContextName());
  }

  /**
   * Reads the overlay, the grid's root, the icon, the texts and the colors in one evaluation.
   *
   * @returns {Promise<LoadingGeometry>}
   */
  async geometry(): Promise<LoadingGeometry> {
    return this.page.evaluate(() => {
      const box = (rect: DOMRect) => ({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
      // `rgb()` or `rgba()`, or the `color(srgb r g b / a)` form a `color-mix()` resolves to.
      const alphaOf = (color: string) => {
        const slash = color.match(/\/\s*([\d.]+)\s*\)$/);

        if (slash) {
          return Number(slash[1]);
        }

        const rgba = color.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);

        return rgba ? Number(rgba[1]) : 1;
      };
      const overlay = document.querySelector('.ht-dialog.ht-loading') as HTMLElement;
      const title = overlay.querySelector('.ht-loading__title') as HTMLElement;
      const description = overlay.querySelector('.ht-loading__description') as HTMLElement | null;
      const range = document.createRange();
      const probe = document.createElement('span');

      range.selectNodeContents(title);
      probe.style.color = 'var(--ht-accent-color)';
      probe.style.backgroundColor = 'var(--ht-foreground-secondary-color)';
      probe.style.fontSize = 'var(--ht-font-size-small)';
      overlay.appendChild(probe);

      const probeStyle = getComputedStyle(probe);
      const tokens = {
        accentColor: probeStyle.color,
        secondaryColor: probeStyle.backgroundColor,
        smallFontSize: probeStyle.fontSize,
      };

      probe.remove();

      const opacity = getComputedStyle(overlay).getPropertyValue('--ht-dialog-semi-transparent-background-opacity').trim();

      return {
        overlay: box(overlay.getBoundingClientRect()),
        root: box((window as unknown as { hot: { rootElement: HTMLElement } }).hot.rootElement.getBoundingClientRect()),
        icon: box((overlay.querySelector('.ht-loading__icon') as HTMLElement).getBoundingClientRect()),
        titleText: box(range.getBoundingClientRect()),
        title: box(title.getBoundingClientRect()),
        description: description ? {
          box: box(description.getBoundingClientRect()),
          color: getComputedStyle(description).color,
          fontSize: getComputedStyle(description).fontSize,
        } : null,
        contentGap: Number.parseFloat(getComputedStyle(overlay.querySelector('.ht-loading__content') as HTMLElement).columnGap),
        backdropAlpha: alphaOf(getComputedStyle(overlay).backgroundColor),
        semiTransparentOpacity: opacity.endsWith('%') ? Number.parseFloat(opacity) / 100 : Number.parseFloat(opacity),
        borderColor: getComputedStyle(overlay).borderTopColor,
        ...tokens,
        dir: overlay.getAttribute('dir'),
      };
    });
  }
}

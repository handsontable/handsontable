import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * The fixture's options, the visual suite's `/dialog-demo` route params by another name. Each one is
 * left out of the URL when omitted, so the fixture's own default applies.
 */
export interface DialogOptions {
  background?: 'solid' | 'semi-transparent';
  contentBackground?: boolean;
  template?: 'confirm';
  focus?: boolean;
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
 * Everything a dialog test compares, read in one evaluation so no read straddles a render.
 */
export interface DialogGeometry {
  dialog: Box;
  root: Box;
  content: Box;
  backdropAlpha: number;
  contentAlpha: number;
  contentHasBackgroundClass: boolean;
  dir: string | null;
  direction: string;
  /**
   * The heading's text, as the browser laid its glyphs out (a `Range` box, not the block's box, so
   * it moves with `text-align`), next to the heading block it sits in. `null` on the confirm template.
   */
  headingText: Box | null;
  headingBlock: Box | null;
  /**
   * The element at the centre of the grid's root, which the open dialog must be.
   */
  hitInsideDialog: boolean;
}

/**
 * Page object for `fixtures/demo/dialog-states.html`, the dialog laid out as the visual suite's
 * `/dialog-demo` route lays it out.
 */
export class DialogStatesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly dialog: Locator;
  readonly inputBefore: Locator;
  readonly inputAfter: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.dialog = page.locator('.ht-dialog');
    this.inputBefore = page.getByTestId('input-before');
    this.inputAfter = page.getByTestId('input-after');
  }

  /**
   * Opens the fixture with the given options and waits for the dialog it shows on load.
   *
   * @param {DialogOptions} options The fixture's options.
   */
  async goto(options: DialogOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (options.background) {
      params.set('background', options.background);
    }
    if (options.contentBackground !== undefined) {
      params.set('contentbackground', options.contentBackground ? '1' : '0');
    }
    if (options.template) {
      params.set('template', options.template);
    }
    if (options.focus !== undefined) {
      params.set('focus', options.focus ? '1' : '0');
    }
    if (options.dir) {
      params.set('dir', options.dir);
    }

    await this.page.goto(`/tests/fixtures/demo/dialog-states.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.dialog).toHaveClass(/\bht-dialog--show\b/);
  }

  /**
   * A control inside the dialog's content, by its fixture test id (`dialog-input-1`, `dialog-input-2`).
   *
   * @param {string} testId The control's `data-testid`.
   * @returns {Locator}
   */
  dialogControl(testId: string): Locator {
    return this.dialog.getByTestId(testId);
  }

  /**
   * A button of the dialog, by its label.
   *
   * @param {string} name The button's text.
   * @returns {Locator}
   */
  button(name: string): Locator {
    return this.dialog.getByRole('button', { name, exact: true });
  }

  /**
   * Whether the plugin reports the dialog as shown.
   *
   * @returns {Promise<boolean>}
   */
  async isVisible(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as { hot: { getPlugin(name: string): { isVisible(): boolean } } })
      .hot.getPlugin('dialog').isVisible());
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
   * Whether nothing on the page holds the focus (`document.activeElement` is the body).
   *
   * @returns {Promise<boolean>}
   */
  async focusIsOnBody(): Promise<boolean> {
    return this.page.evaluate(() => document.activeElement === document.body);
  }

  /**
   * Reads the dialog, the grid's root and the content box in one evaluation.
   *
   * @returns {Promise<DialogGeometry>}
   */
  async geometry(): Promise<DialogGeometry> {
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
      const hot = (window as unknown as { hot: { rootElement: HTMLElement } }).hot;
      const dialog = document.querySelector('.ht-dialog') as HTMLElement;
      const content = dialog.querySelector('.ht-dialog__content') as HTMLElement;
      const heading = dialog.querySelector('h6');
      let headingText = null;

      if (heading?.firstChild) {
        const range = document.createRange();

        range.selectNodeContents(heading.firstChild);
        headingText = box(range.getBoundingClientRect());
      }

      const root = hot.rootElement.getBoundingClientRect();
      const hit = document.elementFromPoint((root.left + root.right) / 2, (root.top + root.bottom) / 2);

      return {
        dialog: box(dialog.getBoundingClientRect()),
        root: box(root),
        content: box(content.getBoundingClientRect()),
        backdropAlpha: alphaOf(getComputedStyle(dialog).backgroundColor),
        contentAlpha: alphaOf(getComputedStyle(content).backgroundColor),
        contentHasBackgroundClass: content.classList.contains('ht-dialog__content--background'),
        dir: dialog.getAttribute('dir'),
        direction: getComputedStyle(content).direction,
        headingText,
        headingBlock: heading ? box(heading.getBoundingClientRect()) : null,
        hitInsideDialog: hit !== null && dialog.contains(hit),
      };
    });
  }
}

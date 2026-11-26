import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

type HotWindow = Window & {
  hot: {
    updateSettings(settings: Record<string, unknown>): void;
  };
  buildGrid(extraSettings?: Record<string, unknown>, containerAttributes?: Record<string, string>): void;
};

/**
 * Page Object for the grid accessible name fixture.
 *
 * The state under test is the accessible name and description of the grid's root element, which
 * the fixture stamps with `data-testid="grid-root"` after the build. The page holds a heading and
 * three paragraphs with ids for the id-reference options to point at.
 */
export class GridAccessibleNamePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;
  readonly root: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.root = page.getByTestId('grid-root');
  }

  /**
   * Opens the fixture without building a grid.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/grid-accessible-name.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
  }

  /**
   * Builds the grid with extra settings merged over the fixture defaults.
   *
   * @param {object} extraSettings JSON-serializable settings.
   * @param {object} containerAttributes Attributes the app puts on the container before the build.
   */
  async build(
    extraSettings: Record<string, unknown> = {},
    containerAttributes: Record<string, string> = {}
  ): Promise<void> {
    await this.page.evaluate(
      ([settings, attributes]) => (window as unknown as HotWindow).buildGrid(settings, attributes),
      [extraSettings, containerAttributes] as const
    );

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.root).toBeVisible();
  }

  /**
   * Calls `updateSettings()` on the grid. An `undefined` value stays an own key of the payload.
   *
   * @param {object} settings The settings to pass.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      nextSettings => (window as unknown as HotWindow).hot.updateSettings(nextSettings),
      settings
    );
  }

  /**
   * Writes an attribute on the grid's root element the way app code does, outside the grid's options.
   *
   * @param {string} name The attribute name.
   * @param {string} value The attribute value.
   */
  async writeRootAttribute(name: string, value: string): Promise<void> {
    await this.root.evaluate(
      (element, [attributeName, attributeValue]) => element.setAttribute(attributeName, attributeValue),
      [name, value] as const
    );
  }

  /**
   * The grid found by its role and its exact accessible name.
   *
   * @param {string} name The expected accessible name.
   */
  treegridNamed(name: string): Locator {
    return this.page.getByRole('treegrid', { name, exact: true });
  }
}

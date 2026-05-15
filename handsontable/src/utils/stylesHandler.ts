import type { HotInstance } from '../core/types';
import { warn } from '../helpers/console';
import handsontableStyles from '../styles/handsontableStyles';

/**
 * The id of the core styles element injected into the document head.
 *
 * @type {string}
 */
const CORE_STYLES_ID = 'handsontable-core-styles';

/**
 * Handles the theme-related style operations.
 */
export class StylesHandler {
  /**
   * The instance of the Handsontable.
   *
   * @type {Core}
   */
  readonly #hot: HotInstance;

  /**
   * The name of the theme.
   *
   * @type {string|undefined}
   */
  #themeName: string | undefined;

  /**
   * The instance's root element.
   *
   * @type {HTMLElement}
   */
  readonly #rootElement: HTMLElement;

  /**
   * The computed style of the root element.
   *
   * @type {CSSStyleDeclaration}
   * @private
   */
  #rootComputedStyle: CSSStyleDeclaration | null = null;

  /**
   * The root document of the instance.
   *
   * @type {Document}
   */
  readonly #rootDocument: Document;

  /**
   * An object to store CSS variable values.
   *
   * @type {object}
   */
  #cssVars: Record<string, unknown> = {};

  /**
   * Stores the computed styles for various elements.
   *
   * @type {object} - An object containing the computed styles if a nested structure of `element: { [element type]: {property: value} }`.
   */
  #computedStyles: Record<string, Record<string, string>> = {};

  /**
   * The callback function to be called when the theme changes.
   *
   * @type {function(string)}
   */
  readonly #onThemeChange: Function;

  /**
   * Initializes a new instance of the `StylesHandler` class.
   *
   * @param {object} options The options for the `StylesHandler` instance.
   * @param {Core} options.hot The instance of the Handsontable.
   * @param {HTMLElement} options.rootElement The root element of the instance.
   * @param {Document} options.rootDocument The root document of the instance.
   * @param {function(string)} options.onThemeChange The callback function to be called when the theme changes.
   * @param {boolean} options.injectCoreCss Whether to inject the core styles into the document head.
   */
  constructor({ hot, rootElement, rootDocument, onThemeChange = (_?: unknown) => {}, injectCoreCss = true }: {
    hot: unknown; rootElement: HTMLElement; rootDocument: Document;
    onThemeChange?: Function; injectCoreCss?: boolean;
  }) {
    this.#hot = hot as HotInstance;
    this.#rootElement = rootElement;
    this.#rootDocument = rootDocument;
    this.#onThemeChange = onThemeChange;

    if (injectCoreCss) {
      this.#injectCoreStyles();
    }
  }

  /**
   * Retrieves the value of a specified CSS variable.
   *
   * @param {string} variableName - The name of the CSS variable to retrieve.
   * @returns {number|null|undefined} The value of the specified CSS variable, or `undefined` if not found.
   */
  getCSSVariableValue(variableName: string) {
    if (this.#cssVars[`--ht-${variableName}`]) {
      return this.#cssVars[`--ht-${variableName}`];
    }

    const acquiredValue =
      this.#getParsedNumericCSSValue(`--ht-${variableName}`) ??
      this.#getCSSValue(`--ht-${variableName}`);

    if (acquiredValue !== null) {
      this.#cssVars[`--ht-${variableName}`] = acquiredValue;

      return acquiredValue;
    }
  }

  /**
   * Retrieves the computed style value for a specified CSS property of a `td` element.
   *
   * @param {string} cssProperty - The CSS property to retrieve the value for.
   * @returns {number|string|undefined} The value of the specified CSS property, or `undefined` if not found.
   */
  getStyleForTD(cssProperty: string) {
    return this.#computedStyles?.td?.[cssProperty];
  }

  /**
   * Calculates the row height based on the current theme and CSS variables.
   *
   * @param {number} [visualRowIndex] The visual row index.
   * @returns {number} The calculated row height.
   */
  getDefaultRowHeight(visualRowIndex?: number) {
    const rowHeight = this.#calculateRowHeight();

    if (
      visualRowIndex !== undefined &&
      visualRowIndex === this.#hot.view.getFirstRenderedVisibleRow()
    ) {
      // add 1px border-top-width compensation for the first rendered row
      return rowHeight + 1;
    }

    return rowHeight;
  }

  /**
   * Checks if the cells are using the `border-box` box-sizing model.
   *
   * @returns {boolean}
   */
  areCellsBorderBox() {
    return this.getStyleForTD('box-sizing') === 'border-box';
  }

  /**
   * Applies the specified theme to the instance.
   *
   * @param {string|undefined|boolean} [themeName] - The name of the theme to apply.
   */
  useTheme(themeName: string | undefined | boolean) {
    if (typeof themeName !== 'string' || !/ht-theme-.*/.test(themeName)) {
      warn(`${themeName} isn't a valid theme name. Please ensure it follows the format ht-theme-<theme-name>.`);

      return;
    }

    this.#clearCachedValues();

    if (themeName !== this.#themeName) {
      this.#themeName = themeName;
    }

    this.#onThemeChange(this.#themeName);
    this.#cacheStylesheetValues();
  }

  /**
   * Gets the name of the theme.
   *
   * @returns {string|undefined}
   */
  getThemeName() {
    return this.#themeName;
  }

  #injectCoreStyles() {
    if (!this.#hot || !this.#rootDocument || !this.#rootDocument.head) {
      return;
    }

    const existing = this.#rootDocument.getElementById(CORE_STYLES_ID);

    if (existing && existing instanceof HTMLStyleElement) {
      return;
    }

    const baseStyles = this.#rootDocument.createElement('style');

    baseStyles.id = CORE_STYLES_ID;
    baseStyles.textContent = handsontableStyles;
    this.#rootDocument.head.appendChild(baseStyles);
  }

  /**
   * Calculates the row height based on the current theme and CSS variables.
   *
   * @returns {number|null} The calculated row height, or `null` if any required CSS variable is not found.
   */
  #calculateRowHeight() {
    const lineHeightVarValue = this.getCSSVariableValue('line-height');
    const verticalPaddingVarValue = this.getCSSVariableValue('cell-vertical-padding');
    // Math.round (not Math.ceil) so that fractional computed values from sub-100% browser zoom
    // (e.g. "1.111px" at 90%) round to the correct 1px rather than overshooting to 2px, which
    // would make the hider taller than the actual table content and leave a visible gap.
    const bottomBorderWidth = Math.round(Number.parseFloat(this.getStyleForTD('border-bottom-width') ?? ''));

    if (
      lineHeightVarValue === null ||
      verticalPaddingVarValue === null ||
      isNaN(bottomBorderWidth)
    ) {
      return null;
    }

    return (lineHeightVarValue as number) + (2 * (verticalPaddingVarValue as number)) + bottomBorderWidth;
  }

  /**
   * Caches the computed style values for the root element and `td` element.
   */
  #cacheStylesheetValues() {
    this.#rootComputedStyle = getComputedStyle(this.#rootElement);

    const stylesForTD = this.#getStylesForTD([
      'box-sizing',
      'border-bottom-width',
    ]);

    this.#computedStyles.td = {
      ...this.#computedStyles.td,
      ...{
        'box-sizing': stylesForTD['box-sizing'],
        'border-bottom-width': stylesForTD['border-bottom-width'],
      },
    };
  }

  /**
   * Retrieves and processes the computed styles for a `td` element.
   *
   * This method creates a temporary table structure, appends it to the root element,
   * retrieves the computed styles for the `td` element, and then removes the table
   * from the DOM. The computed styles are passed to the provided callback function.
   *
   * @param {Array} cssProps - An array of CSS properties to retrieve.
   * @returns {object} An object containing the requested computed styles for the `td` element.
   * @private
   */
  #getStylesForTD(cssProps: string[]) {
    const rootDocument = this.#rootDocument;
    const rootElement = this.#rootElement;
    const table = rootDocument.createElement('table');
    const tbody = rootDocument.createElement('tbody');
    const tr = rootDocument.createElement('tr');
    // This needs not to be the first row in order to get "regular" values.
    const tr2 = rootDocument.createElement('tr');
    const td = rootDocument.createElement('td');

    tr2.appendChild(td);
    tbody.appendChild(tr);
    tbody.appendChild(tr2);
    table.appendChild(tbody);

    rootElement.appendChild(table);

    const computedStyle = getComputedStyle(td);
    const returnObject: Record<string, string> = {};

    cssProps.forEach((prop: string) => {
      returnObject[prop] = computedStyle.getPropertyValue(prop);
    });

    rootElement.removeChild(table);

    return returnObject;
  }

  /**
   * Parses the numeric value of a specified CSS property from the root element's computed style.
   *
   * @param {string} property - The CSS property to retrieve and parse.
   * @returns {number|null} The parsed value of the CSS property or `null` if non-existent.
   */
  #getParsedNumericCSSValue(property: string) {
    const parsedValue = Math.ceil(Number.parseFloat(this.#getCSSValue(property) ?? ''));

    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  /**
   * Retrieves the non-numeric value of a specified CSS property from the root element's computed style.
   *
   * @param {string} property - The CSS property to retrieve.
   * @returns {string|null} The value of the specified CSS property or `null` if non-existent.
   */
  #getCSSValue(property: string): string | null {
    const acquiredValue = this.#rootComputedStyle?.getPropertyValue(property) ?? null;

    return acquiredValue === '' ? null : acquiredValue;
  }

  /**
   * Clears the cached values.
   */
  #clearCachedValues() {
    this.#computedStyles = {};
    this.#cssVars = {};
  }

  /**
   * Clears all cached CSS variable values and computed styles.
   * This should be called when theme CSS variables are dynamically updated.
   */
  clearCache() {
    this.#clearCachedValues();
    this.#cacheStylesheetValues();
  }
}

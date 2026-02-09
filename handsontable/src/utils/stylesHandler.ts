import type { HotInstance } from '../common';
import { warn } from '../helpers/console';

const CLASSIC_THEME_DEFAULT_HEIGHT = 23;

/**
 * Handles the theme-related style operations.
 */
export class StylesHandler {
  /**
   * The instance of the Handsontable.
   *
   * @type {Core}
   */
  #hot: HotInstance;

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
  #rootElement: HTMLElement;

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
  #rootDocument: Document;

  /**
   * `true` if the classic theme is enabled, `false` otherwise.
   *
   * @type {boolean}
   */
  #isClassicTheme = true;

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
  #onThemeChange: Function;

  /**
   * Initializes a new instance of the `StylesHandler` class.
   *
   * @param {object} options The options for the `StylesHandler` instance.
   * @param {Core} options.hot The instance of the Handsontable.
   * @param {HTMLElement} options.rootElement The root element of the instance.
   * @param {Document} options.rootDocument The root document of the instance.
   * @param {function(string)} options.onThemeChange The callback function to be called when the theme changes.
   */
  constructor({ hot, rootElement, rootDocument, onThemeChange = (_?: unknown) => {} }: { hot: unknown; rootElement: HTMLElement; rootDocument: Document; onThemeChange?: Function }) {
    this.#hot = hot as HotInstance;
    this.#rootElement = rootElement;
    this.#rootDocument = rootDocument;
    this.#onThemeChange = onThemeChange;
  }

  /**
   * Gets the value indicating whether the classic theme is enabled.
   *
   * @returns {boolean} `true` if the classic theme is enabled, `false` otherwise.
   */
  isClassicTheme() {
    return this.#isClassicTheme;
  }

  /**
   * Retrieves the value of a specified CSS variable.
   *
   * @param {string} variableName - The name of the CSS variable to retrieve.
   * @returns {number|null|undefined} The value of the specified CSS variable, or `undefined` if not found.
   */
  getCSSVariableValue(variableName: string) {
    if (this.#isClassicTheme) {
      return null;
    }

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
    if (this.#isClassicTheme) {
      return CLASSIC_THEME_DEFAULT_HEIGHT;
    }

    const rowHeight = this.#calculateRowHeight();

    if (!rowHeight) {
      return CLASSIC_THEME_DEFAULT_HEIGHT;
    }

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
    if (!themeName) {

      this.#themeName = undefined;
      this.#isClassicTheme = true;
      this.#onThemeChange(this.#themeName);
      this.#cacheStylesheetValues();

      return;
    }

    if (themeName && themeName !== this.#themeName) {
      if (!/ht-theme-.*/.test(themeName as string)) {
        warn(`Invalid theme name: ${themeName}. Please provide a valid theme name.`);

        this.#themeName = undefined;
        this.#isClassicTheme = false;
        this.#onThemeChange(this.#themeName);
        this.#cacheStylesheetValues();

        return;
      }

      if (this.#themeName) {
        this.#clearCachedValues();
      }

      this.#themeName = themeName as string;
      this.#isClassicTheme = false;
      this.#onThemeChange(this.#themeName);
      this.#cacheStylesheetValues();
    }
  }

  /**
   * Gets the name of the theme.
   *
   * @returns {string|undefined}
   */
  getThemeName() {
    return this.#themeName;
  }

  /**
   * Calculates the row height based on the current theme and CSS variables.
   *
   * @returns {number|null} The calculated row height, or `null` if any required CSS variable is not found.
   */
  #calculateRowHeight() {
    const lineHeightVarValue = this.getCSSVariableValue('line-height');
    const verticalPaddingVarValue = this.getCSSVariableValue('cell-vertical-padding');
    const bottomBorderWidth = Math.ceil(parseFloat(this.getStyleForTD('border-bottom-width') as string));

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
    if (!this.isClassicTheme()) {
      this.#rootComputedStyle = getComputedStyle(this.#rootElement);
    }

    const stylesForTD = this.#getStylesForTD([
      'box-sizing',
      'border-bottom-width',
    ]);

    this.#computedStyles.td = {
      ...this.#computedStyles.td,
      ...{
        'box-sizing': stylesForTD['box-sizing'] as string,
        'border-bottom-width': stylesForTD['border-bottom-width'] as string,
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
    const returnObject: Record<string, unknown> = {};

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
    const parsedValue = Math.ceil(parseFloat(this.#getCSSValue(property) as string));

    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  /**
   * Retrieves the non-numeric value of a specified CSS property from the root element's computed style.
   *
   * @param {string} property - The CSS property to retrieve.
   * @returns {string|null} The value of the specified CSS property or `null` if non-existent.
   */
  #getCSSValue(property: string) {
    const acquiredValue = this.#rootComputedStyle!.getPropertyValue(property);

    return acquiredValue === '' ? null : acquiredValue;
  }

  /**
   * Clears the cached values.
   */
  #clearCachedValues() {
    this.#computedStyles = {};
    this.#cssVars = {};
    this.#isClassicTheme = true;
  }
}

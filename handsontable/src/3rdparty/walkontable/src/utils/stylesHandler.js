const CLASSIC_THEME_DEFAULT_HEIGHT = 23;

/**
 * Handles the theme-related style operations.
 */
export class StylesHandler {
  /**
   * The instance's root element.
   *
   * @type {HTMLElement}
   */
  #rootElement;

  /**
   * The computed style of the root element.
   *
   * @type {CSSStyleDeclaration}
   * @private
   */
  #rootComputedStyle;

  /**
   * The root document of the instance.
   *
   * @type {Document}
   * @private
   */
  #rootDocument;

  /**
   * `true` if the classic theme is enabled, `false` otherwise.
   *
   * @type {boolean}
   */
  #isClassicTheme = false;

  /**
   * An object to store CSS variable values.
   *
   * @type {object}
   * @private
   */
  #cssVars = {};

  /**
   * Stores the computed styles for various elements.
   *
   * @type {object} - An object containing the computed styles if a nested structore of `element: { [element type]: {property: value} }`.
   * @private
   */
  #computedStyles = {};

  /**
   * Initializes a new instance of the `StylesHandler` class.
   *
   * @param {string} themeName - The name of the theme.
   * @param {object} domBindings - The DOM bindings for the instance.
   */
  constructor(themeName, domBindings) {
    this.#rootElement = domBindings.rootTable.parentElement;
    this.#rootComputedStyle = getComputedStyle(this.#rootElement);
    this.#rootDocument = domBindings.rootDocument;

    if (!themeName) {
      this.#isClassicTheme = true;
    }

    const stylesForTD = this.#getStylesForTD([
      'box-sizing',
    ]);

    this.#computedStyles.td = {
      ...this.#computedStyles.td,
      ...{
        'box-sizing': stylesForTD['box-sizing'],
      },
    };
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
   * @returns {number|undefined} The value of the specified CSS variable, or `undefined` if not found.
   */
  getCSSVariableValue(variableName) {
    if (this.#cssVars[`--ht-${variableName}`]) {
      return this.#cssVars[`--ht-${variableName}`];
    }

    const acquiredValue = this.#getParsedCSSValue(`--ht-${variableName}`);

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
  getStyleForTD(cssProperty) {
    return this.#computedStyles?.td[cssProperty];
  }

  /**
   * Calculates the row height based on the current theme and CSS variables.
   *
   * @returns {number} The calculated row height.
   */
  getDefaultRowHeight() {
    if (this.#isClassicTheme) {
      return CLASSIC_THEME_DEFAULT_HEIGHT;
    }

    return this.getCSSVariableValue('row-height');
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
  #getStylesForTD(cssProps) {
    const rootDocument = this.#rootDocument;
    const rootElement = this.#rootElement;
    const table = rootDocument.createElement('table');
    const tbody = rootDocument.createElement('tbody');
    const tr = rootDocument.createElement('tr');
    // This needs not to be the first row in order to get "regular" vaules.
    const tr2 = rootDocument.createElement('tr');
    const td = rootDocument.createElement('td');

    tr2.appendChild(td);
    tbody.appendChild(tr);
    tbody.appendChild(tr2);
    table.appendChild(tbody);

    rootElement.appendChild(table);

    const computedStyle = getComputedStyle(td);
    const returnObject = {};

    cssProps.forEach((prop) => {
      returnObject[prop] = computedStyle.getPropertyValue(prop);
    });

    rootElement.removeChild(table);

    return returnObject;
  }

  /**
   * Parses the value of a specified CSS property from the root element's computed style.
   *
   * @param {string} property - The CSS property to retrieve and parse.
   * @returns {number|null} The parsed value of the CSS property.
   */
  #getParsedCSSValue(property) {
    const parsedValue = parseInt(this.#rootComputedStyle.getPropertyValue(property), 10);

    return Number.isNaN(parsedValue) ? null : parsedValue;
  }
}

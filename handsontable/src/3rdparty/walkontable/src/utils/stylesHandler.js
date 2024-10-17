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
   * @param {object} domBindings - The DOM bindings for the instance.
   */
  constructor(domBindings) {
    this.#rootElement = domBindings.rootTable.parentElement;
    this.#rootComputedStyle = getComputedStyle(this.#rootElement);
    this.#rootDocument = domBindings.rootDocument;

    if (this.#rootComputedStyle?.getPropertyValue('--ht-line-height') === '') {
      this.#isClassicTheme = true;
    }

    // Some of the properties are not stored in the CSS variables, so we need to get them from the computed style.
    this.#getStylesForTD((computedStyle) => {
      this.#computedStyles = {
        ...this.#computedStyles,
        ...{
          td: {
            'box-sizing': computedStyle['box-sizing'],
            'border-top-width': parseInt(computedStyle['border-top-width'], 10),
            'border-bottom-width': parseInt(computedStyle['border-bottom-width'], 10),
          },
        },
      };
    });
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
   * @returns {number|string|undefined} The value of the specified CSS variable, or `undefined` if not found.
   */
  getCSSVariableValue(variableName) {
    if (this.#cssVars[`--ht-${variableName}`]) {
      return this.#cssVars[`--ht-${variableName}`];
    }

    const acquiredValue = this.#getParsedCSSValue(`--ht-${variableName}`);

    if (acquiredValue && acquiredValue !== '') {
      this.#cssVars = {
        ...this.#cssVars,
        ...{ [variableName]: acquiredValue },
      };

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
    const value = this.#computedStyles?.td[cssProperty];

    if (value !== undefined && value !== '') {
      return value;
    }
  }

  /**
   * Calculates the row height based on the current theme and CSS variables.
   *
   * @returns {number} The calculated row height.
   */
  getDefaultRowHeight() {
    if (this.#isClassicTheme) {
      return 23;
    }

    return this.getStyleForTD('border-top-width') +
      (this.getCSSVariableValue('cell-vertical-padding') * 2) +
      this.getCSSVariableValue('line-height') +
      this.getStyleForTD('border-bottom-width');
  }

  /**
   * Retrieves and processes the computed styles for a `td` element.
   *
   * This method creates a temporary table structure, appends it to the root element,
   * retrieves the computed styles for the `td` element, and then removes the table
   * from the DOM. The computed styles are passed to the provided callback function.
   *
   * @param {Function} getterCallback - A callback function that processes the computed styles.
   *                                    It receives a `CSSStyleDeclaration` object as its argument.
   * @private
   */
  #getStylesForTD(getterCallback) {
    const table = this.#rootDocument.createElement('table');
    const tbody = this.#rootDocument.createElement('tbody');
    const tr = this.#rootDocument.createElement('tr');
    // This needs not to be the first row in order to get "regular" vaules.
    const tr2 = this.#rootDocument.createElement('tr');
    const td = this.#rootDocument.createElement('td');

    tr2.appendChild(td);
    tbody.appendChild(tr);
    tbody.appendChild(tr2);
    table.appendChild(tbody);

    this.#rootElement.appendChild(table);

    getterCallback(getComputedStyle(td));

    this.#rootElement.removeChild(table);
  }

  /**
   * Parses the value of a specified CSS property from the root element's computed style.
   *
   * @param {string} property - The CSS property to retrieve and parse.
   * @returns {number|string} The parsed value of the CSS property.
   */
  #getParsedCSSValue(property) {
    return parseInt(this.#rootComputedStyle?.getPropertyValue(property), 10);
  }
}

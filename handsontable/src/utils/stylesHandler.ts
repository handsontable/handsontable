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
   * Whether the last caching pass ran while the root element resolved no computed styles, so every
   * value it cached describes nothing.
   *
   * @type {boolean}
   * @private
   */
  #cachedWithoutResolvedStyles = false;

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
   * The last measured height of a populated cell, together with the two inputs that decide it. Kept
   * apart from `#computedStyles` because that snapshot can predate the theme stylesheet.
   *
   * @type {object|null}
   */
  #renderedCellHeight: {
    declaredRowHeight: number;
    devicePixelRatio: number;
    cellHeight: number;
  } | null = null;

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
      return (rowHeight ?? 0) + 1;
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

  /**
   * Injects the core Handsontable stylesheet into the document head, skipping injection if it is already present.
   */
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
    const renderedBottomBorderWidth = Number.parseFloat(this.getStyleForTD('border-bottom-width') ?? '');
    // Math.round (not Math.ceil) so that fractional computed values from sub-100% browser zoom
    // (e.g. "1.111px" at 90%) round to the correct 1px rather than overshooting to 2px, which
    // would make the hider taller than the actual table content and leave a visible gap.
    const bottomBorderWidth = Math.round(renderedBottomBorderWidth);

    if (
      lineHeightVarValue === null ||
      verticalPaddingVarValue === null ||
      isNaN(bottomBorderWidth)
    ) {
      return null;
    }

    // `NaN` when a theme variable resolved to nothing: `getCSSVariableValue()` returns `undefined`
    // there, not `null`, so the guard above does not catch it. That is deliberate and load-bearing —
    // every caller coalesces with `?? 0`, which passes `NaN` through but turns `null` into a row
    // height of ZERO, collapsing the grid until the theme lands. The stylesheet is usually just late
    // (a non-blocking `<link>`), and the next draw reads the variables live and recovers. So the
    // value is left exactly as it was; it only must not reach the measurement cache below, whose key
    // `NaN` would never match, re-probing on every call.
    const declaredRowHeight =
      (lineHeightVarValue as number) + (2 * (verticalPaddingVarValue as number)) + bottomBorderWidth;

    // A border wider than the 1px the theme asks for is the whole defect: below 100% zoom the browser
    // cannot paint one thinner than a device pixel, so it reports 1.111px at 90%, 1.25px at 80%, and
    // the cell outgrows its declared box on every row (issue #6280). Every other case keeps the
    // declared height, which is what this method has always returned:
    //
    //   - exactly 1px — the page is at 100%, nothing to correct;
    //   - below 1px — above 100% the border shrinks to a fraction, but the cell's declared height
    //     governs and the row keeps it;
    //   - a whole number of pixels (2px at 50% zoom) — already rounded correctly, and adding a
    //     measured correction on top overshot by ~0.5px per row;
    //   - 0 — a surface that removes the border, such as the Filters by-value list.
    //
    // The border is read from the `#computedStyles` SNAPSHOT, so this decision is taken at init and
    // retaken only on a theme change or an explicit `clearCache()`. A grid loaded at 100% and then
    // zoomed out therefore keeps the declared height, and overflows exactly as it did before this
    // correction existed — the same amount, not a new defect. Following a runtime zoom needs more
    // than re-reading the border here: with the height corrected by hand, the grid still renders the
    // old sum until the row-height cache AND the hider sizing are invalidated too.
    //
    // `Number.isFinite` first: a `NaN` declared height must never reach the measurement, whose cache
    // key it would defeat (`NaN !== NaN`), turning one probe per theme into a probe — a DOM mutation
    // and a forced layout — on every call, per row, inside the draw.
    if (!Number.isFinite(declaredRowHeight) || !(renderedBottomBorderWidth > bottomBorderWidth)) {
      return declaredRowHeight;
    }

    return this.#resolveRenderedRowHeight(declaredRowHeight);
  }

  /**
   * Replaces the theme's declared row height with the height the browser actually renders, once the
   * inflated border has been established as the reason they differ.
   *
   * The rendered height is measured rather than derived, because it also carries the browser's
   * sub-pixel snapping of the cell box, which no arithmetic here can reproduce: at 90% the arithmetic
   * answer is 29.111px against a rendered 29.097px, and that 0.014px lands on every row.
   *
   * The measurement is only reached when the border resolved wider than the theme's whole-pixel value,
   * which is what makes reading the probe's absolute height safe here. The cells' height rule is
   * `calc(<vertical padding> * 2 + <line height> + 1px)` — a **literal** 1px — so a surface that
   * carries a different border renders a different height than the probe reports, and the caller keeps
   * those on the declared height instead.
   *
   * @param {number} declaredRowHeight The row height derived from the theme's CSS variables.
   * @returns {number} The row height to size the grid from.
   */
  #resolveRenderedRowHeight(declaredRowHeight: number): number {
    const renderedRowHeight = this.#measureRenderedRowHeight(declaredRowHeight);
    const overgrowth = renderedRowHeight - declaredRowHeight;

    // `>` rather than `!==` also covers a probe that reports nothing usable (`NaN`): the root element
    // resolves no layout — a grid built into a detached or `display: none` container — or the engine
    // lays out nothing at all, jsdom above all.
    if (!(overgrowth > 0)) {
      return declaredRowHeight;
    }

    // What the browser adds cannot exceed the device pixel the border was rounded up to, so the bound
    // is derived from the ratio rather than picked: 0.25px at 80%, 3px at Chrome's 25% minimum zoom.
    // Anything past it is cell styling the probe cannot represent, so the declared height stays
    // authoritative. A fixed cap would be a cliff — a theme override that pushed the cell just past it
    // would silently reopen this defect while a slightly smaller one stayed corrected.
    return overgrowth > this.#maxCellOvergrowth() ? declaredRowHeight : renderedRowHeight;
  }

  /**
   * The largest overgrowth still explained by the device-pixel border inflation.
   *
   * @returns {number} The bound, in pixels.
   */
  #maxCellOvergrowth(): number {
    const devicePixelRatio = this.#devicePixelRatio();

    // A ratio at or above 1 inflates nothing, and this is only reached when something did grow, so
    // fall back to one whole pixel rather than to zero.
    return devicePixelRatio > 0 && devicePixelRatio < 1 ? (1 / devicePixelRatio) - 1 : 1;
  }

  /**
   * The device pixel ratio the grid's own window renders at.
   *
   * @returns {number} The ratio, or `1` when the window is unavailable.
   */
  #devicePixelRatio(): number {
    return this.#rootDocument.defaultView?.devicePixelRatio ?? 1;
  }

  /**
   * Measures the height a populated cell renders at, reusing the last measurement while the inputs
   * that decide it are unchanged.
   *
   * The measurement cannot join the `#cacheStylesheetValues()` snapshot: that pass can run before the
   * theme stylesheet applies, and unlike `#rootComputedStyle` — a live declaration, so the CSS
   * variables read through it are always current — a snapshotted string stays frozen at whatever the
   * unthemed cell measured. Keying the cache on the declared height and the device pixel ratio
   * re-measures once either moves, which covers a late-arriving theme, and a zoom change on a grid
   * that was ALREADY below 100% when it was built. It does not cover a grid built at 100% and zoomed
   * out afterwards: the gate in front of this reads the border from the `#computedStyles` snapshot,
   * so the caller never gets here — see the note there.
   *
   * Only a usable measurement is stored. A probe that resolves no layout — a grid built inside a
   * `display: none` tab, accordion or modal — must not be cached: neither key moves when the container
   * is revealed, so the grid would keep the unusable answer for the rest of its life and this fix
   * would never reach the most common way a grid is built off-screen.
   *
   * @param {number} declaredRowHeight The row height derived from the theme's CSS variables.
   * @returns {number} The measured cell height, or `NaN` when the probe resolves no layout.
   */
  #measureRenderedRowHeight(declaredRowHeight: number): number {
    const devicePixelRatio = this.#devicePixelRatio();

    if (
      this.#renderedCellHeight !== null &&
      this.#renderedCellHeight.declaredRowHeight === declaredRowHeight &&
      this.#renderedCellHeight.devicePixelRatio === devicePixelRatio
    ) {
      return this.#renderedCellHeight.cellHeight;
    }

    const cellHeight = Number.parseFloat(this.#getStylesForTD(['height']).height);

    if (cellHeight > 0) {
      this.#renderedCellHeight = { declaredRowHeight, devicePixelRatio, cellHeight };
    }

    return cellHeight;
  }

  /**
   * Caches the computed style values for the root element and `td` element.
   */
  #cacheStylesheetValues() {
    this.#cachedWithoutResolvedStyles = !this.#stylesResolve();
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
   * It no longer runs only at init: `#measureRenderedRowHeight()` calls it lazily, and
   * `getDefaultRowHeight()` runs inside the Walkontable draw. So this mutates the root element's
   * child list and forces a synchronous layout mid-render. That is why the measurement is cached on
   * the inputs that decide it — one probe per theme per zoom level, not one per call — and why the
   * caller must keep `NaN` out of those keys, since a key that never matches turns this into a
   * forced layout per row per draw.
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

    // The probe must carry the grid table's `htCore` class: cell styling (box-sizing,
    // border-bottom-width) is scoped to `table.htCore > … > td`, so a class-less probe reads the
    // browser defaults (content-box / 0px) and flips `areCellsBorderBox()`, corrupting row-height
    // measurement (issue #4363).
    table.className = 'htCore';

    // A non-breaking space gives the probe cell a line box. Without one the cell has no content to
    // lay out, so its used `height` collapses to the height the theme declares instead of the height
    // a populated row actually renders at — and the two differ below 100% zoom (issue #6280).
    td.textContent = '\u00A0';

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
    this.#renderedCellHeight = null;
  }

  /**
   * Checks whether the root element resolves computed styles, so that a value read from them
   * describes how the grid is rendered.
   *
   * An element outside the flat tree resolves against nothing – `getComputedStyle()` yields an empty
   * declaration, or a full property list of empty strings, depending on the engine. Reading `display`
   * separates that from an element that merely generates no boxes, which reads its styles fine.
   *
   * @returns {boolean} `true` when the root element's computed styles resolve.
   * @private
   */
  #stylesResolve(): boolean {
    if (!this.#rootElement.isConnected) {
      return false;
    }

    const elementWindow = this.#rootElement.ownerDocument.defaultView;

    return elementWindow !== null && elementWindow.getComputedStyle(this.#rootElement).display !== '';
  }

  /**
   * Re-reads the cached values when the last pass cached them against unresolved styles and the root
   * element resolves them now.
   *
   * A grid built into an element outside the flat tree caches values that describe nothing, and every
   * size derived from them – the default row height above all – is wrong. Re-reading them is only
   * possible once the element resolves its styles, and it is only necessary if an earlier pass did
   * not, so both are checked here rather than by the caller.
   *
   * @returns {boolean} `true` when the values were re-read, so sizes derived from the old ones have
   *                    to be discarded too.
   */
  recacheValuesMeasuredWithoutStyles(): boolean {
    if (!this.#cachedWithoutResolvedStyles || !this.#stylesResolve()) {
      return false;
    }

    this.clearCache();

    return true;
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

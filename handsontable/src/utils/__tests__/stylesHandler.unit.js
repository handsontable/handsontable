import { StylesHandler } from '../stylesHandler';
import handsontableStyles from '../../styles/handsontableStyles';

const CORE_STYLES_ID = 'handsontable-core-styles';

describe('StylesHandler', () => {
  // The RENDERED column-header count decides whether the first rendered row draws its own
  // `border-top`, which is what `getDefaultRowHeight` compensates for. Both are on the mock because
  // the predicate reads the count and falls back to the setting only before the view exists, and the
  // two genuinely disagree on a grid whose head rows come from a plugin rather than from
  // `colHeaders`. Both default to "no header", the state the compensation exists for.
  const createMockHot = () => ({
    view: {
      getFirstRenderedVisibleRow: jest.fn().mockReturnValue(0),
      getColumnHeadersCount: jest.fn().mockReturnValue(0),
    },
    hasColHeaders: jest.fn().mockReturnValue(false),
  });

  const createMockDocument = () => {
    const mockElement = {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    };

    return {
      createElement: jest.fn().mockReturnValue(mockElement),
    };
  };

  const createMockRootElement = () => {
    const mockElement = document.createElement('div');

    return mockElement;
  };

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      const mockHot = createMockHot();
      const mockRootElement = createMockRootElement();
      const mockRootDocument = createMockDocument();
      const mockOnThemeChange = jest.fn();

      const handler = new StylesHandler({
        hot: mockHot,
        rootElement: mockRootElement,
        rootDocument: mockRootDocument,
        onThemeChange: mockOnThemeChange,
      });

      expect(handler).toBeInstanceOf(StylesHandler);
    });
  });

  describe('injectCoreStyles (constructor with injectCoreCss)', () => {
    it('should inject core styles into document head when injectCoreCss is true', () => {
      const doc = document.implementation.createHTMLDocument('');

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: doc.body,
        rootDocument: doc,
        injectCoreCss: true,
      });

      const injected = doc.getElementById(CORE_STYLES_ID);

      expect(handler).toBeDefined();
      expect(injected).not.toBeNull();
      expect(injected).toBeInstanceOf(HTMLStyleElement);
      expect(injected.textContent).toBe(handsontableStyles);
      expect(doc.head.contains(injected)).toBe(true);
    });

    it('should not inject core styles when injectCoreCss is false', () => {
      const doc = document.implementation.createHTMLDocument('');

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: doc.body,
        rootDocument: doc,
        injectCoreCss: false,
      });

      expect(handler).toBeDefined();
      expect(doc.getElementById(CORE_STYLES_ID)).toBeNull();
    });

    it('should not inject when hot is null', () => {
      const doc = document.implementation.createHTMLDocument('');

      const handler = new StylesHandler({
        hot: null,
        rootElement: doc.body,
        rootDocument: doc,
      });

      expect(handler).toBeDefined();
      expect(doc.getElementById(CORE_STYLES_ID)).toBeNull();
    });

    it('should report whether it was told to inject the core styles', () => {
      const doc = document.implementation.createHTMLDocument('');
      const hot = createMockHot();

      expect(new StylesHandler({ hot, rootElement: doc.body, rootDocument: doc, injectCoreCss: true })
        .isCoreCssInjectionEnabled()).toBe(true);
      expect(new StylesHandler({ hot, rootElement: doc.body, rootDocument: doc, injectCoreCss: false })
        .isCoreCssInjectionEnabled()).toBe(false);
      expect(new StylesHandler({ hot, rootElement: doc.body, rootDocument: doc })
        .isCoreCssInjectionEnabled()).toBe(true);
    });

    it('should report the injection it was told to do even when a copy is already in the document', () => {
      const doc = document.implementation.createHTMLDocument('');
      const hot = createMockHot();

      const first = new StylesHandler({ hot, rootElement: doc.body, rootDocument: doc, injectCoreCss: true });
      const second = new StylesHandler({ hot, rootElement: doc.body, rootDocument: doc, injectCoreCss: true });

      expect(first.isCoreCssInjectionEnabled()).toBe(true);
      expect(second.isCoreCssInjectionEnabled()).toBe(true);
      expect(doc.querySelectorAll(`#${CORE_STYLES_ID}`).length).toBe(1);
    });

    it('should not inject when rootDocument has no head', () => {
      const docWithoutHead = {
        head: null,
        getElementById: jest.fn().mockReturnValue(null),
      };

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: document.createElement('div'),
        rootDocument: docWithoutHead,
      });

      expect(handler).toBeDefined();
      expect(docWithoutHead.getElementById).not.toHaveBeenCalled();
    });

    it('should not add duplicate when a style element with CORE_STYLES_ID already exists', () => {
      const doc = document.implementation.createHTMLDocument('');
      const existingStyle = doc.createElement('style');

      existingStyle.id = CORE_STYLES_ID;
      existingStyle.textContent = '/* existing */';
      doc.head.appendChild(existingStyle);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: doc.body,
        rootDocument: doc,
      });

      const styleElements = doc.head.querySelectorAll(`#${CORE_STYLES_ID}`);

      expect(handler).toBeDefined();
      expect(styleElements.length).toBe(1);
      expect(styleElements[0]).toBe(existingStyle);
      expect(styleElements[0].textContent).toBe('/* existing */');
    });

    it('should inject when an element with CORE_STYLES_ID exists but is not an HTMLStyleElement', () => {
      const doc = document.implementation.createHTMLDocument('');
      const existingDiv = doc.createElement('div');

      existingDiv.id = CORE_STYLES_ID;
      doc.head.appendChild(existingDiv);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: doc.body,
        rootDocument: doc,
      });

      const styleElements = doc.head.querySelectorAll('style');

      expect(handler).toBeDefined();
      expect(styleElements.length).toBe(1);
      expect(styleElements[0].id).toBe(CORE_STYLES_ID);
      expect(styleElements[0].textContent).toBe(handsontableStyles);
    });
  });

  describe('getThemeName', () => {
    it('should return undefined when no theme is set', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: createMockDocument(),
      });

      expect(handler.getThemeName()).toBeUndefined();
    });

    it('should return the theme name when a theme is set', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      handler.useTheme('ht-theme-main');

      expect(handler.getThemeName()).toBe('ht-theme-main');
    });
  });

  describe('useTheme', () => {
    it('should warn for invalid theme name format', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      handler.useTheme('invalid-theme-name');

      expect(consoleSpy).toHaveBeenCalledWith(
        'invalid-theme-name isn\'t a valid theme name. Please ensure it follows the format ht-theme-<theme-name>.'
      );

      consoleSpy.mockRestore();
    });

    it('should warn for theme name without ht-theme- prefix', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      handler.useTheme('my-custom-theme');

      expect(consoleSpy).toHaveBeenCalledWith(
        'my-custom-theme isn\'t a valid theme name. Please ensure it follows the format ht-theme-<theme-name>.'
      );

      consoleSpy.mockRestore();
    });

    it('should set theme and call onThemeChange callback for valid theme name', () => {
      const mockOnThemeChange = jest.fn();
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
        onThemeChange: mockOnThemeChange,
      });

      handler.useTheme('ht-theme-main');

      expect(handler.getThemeName()).toBe('ht-theme-main');
      expect(mockOnThemeChange).toHaveBeenCalledWith('ht-theme-main');
    });

    it('should update theme name when switching themes', () => {
      const mockOnThemeChange = jest.fn();
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
        onThemeChange: mockOnThemeChange,
      });

      handler.useTheme('ht-theme-main');

      expect(handler.getThemeName()).toBe('ht-theme-main');

      handler.useTheme('ht-theme-horizon');

      expect(handler.getThemeName()).toBe('ht-theme-horizon');
      expect(mockOnThemeChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCSSVariableValue', () => {
    it('should return undefined when CSS variable is not found', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      expect(handler.getCSSVariableValue('non-existent-var')).toBeUndefined();
    });

    it('should return the numeric value when CSS variable is defined', () => {
      const rootElement = document.createElement('div');

      rootElement.style.setProperty('--ht-line-height', '24px');
      document.body.appendChild(rootElement);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      expect(handler.getCSSVariableValue('line-height')).toBe(24);

      document.body.removeChild(rootElement);
    });
  });

  describe('getResolvedLength', () => {
    const EXPRESSION = 'calc(var(--ht-icon-size) + 2 * var(--ht-cell-horizontal-padding))';
    let rootElement;
    let handler;
    let offsetWidth;

    beforeEach(() => {
      rootElement = document.createElement('div');
      document.body.appendChild(rootElement);

      handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      // jsdom has no layout: every width is 0, so the browser's answer is stubbed.
      offsetWidth = jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(32);
    });

    afterEach(() => {
      offsetWidth.mockRestore();
      rootElement.remove();
    });

    it('should return the width the browser resolves the expression to', () => {
      expect(handler.getResolvedLength(EXPRESSION)).toBe(32);
    });

    it('should measure with a hidden element inside the root element and remove it again', () => {
      const appendChild = jest.spyOn(rootElement, 'appendChild');

      handler.getResolvedLength(EXPRESSION);

      const probe = appendChild.mock.calls[0][0];

      // Inside the root element, because that is where the theme tokens are defined.
      expect(probe.tagName).toBe('DIV');
      expect(probe.style.visibility).toBe('hidden');
      expect(probe.style.position).toBe('absolute');
      expect(rootElement.contains(probe)).toBe(false);
      expect(rootElement.childElementCount).toBe(0);
    });

    it('should cache the answer', () => {
      handler.getResolvedLength(EXPRESSION);
      handler.getResolvedLength(EXPRESSION);

      expect(offsetWidth).toHaveBeenCalledTimes(1);
    });

    it('should cache each expression on its own', () => {
      offsetWidth.mockReturnValueOnce(32).mockReturnValueOnce(8);

      expect(handler.getResolvedLength(EXPRESSION)).toBe(32);
      expect(handler.getResolvedLength('calc(var(--ht-gap-size) * 2)')).toBe(8);
      expect(handler.getResolvedLength(EXPRESSION)).toBe(32);
    });

    it('should answer null for an unusable measurement, and not cache it', () => {
      // A grid inside a hidden tab, or a token the theme does not declare, measures 0. Neither key
      // moves once the grid is revealed or the theme arrives, so a cached 0 would stick.
      offsetWidth.mockReturnValue(0);

      expect(handler.getResolvedLength(EXPRESSION)).toBeNull();

      offsetWidth.mockReturnValue(32);

      expect(handler.getResolvedLength(EXPRESSION)).toBe(32);
    });

    it('should measure again after a theme change', () => {
      expect(handler.getResolvedLength(EXPRESSION)).toBe(32);

      offsetWidth.mockReturnValue(40);
      handler.useTheme('ht-theme-horizon');

      expect(handler.getResolvedLength(EXPRESSION)).toBe(40);
    });

    it('should measure again after the cache is cleared', () => {
      expect(handler.getResolvedLength(EXPRESSION)).toBe(32);

      offsetWidth.mockReturnValue(24);
      handler.clearCache();

      expect(handler.getResolvedLength(EXPRESSION)).toBe(24);
    });
  });

  describe('getStyleForTD', () => {
    it('should return undefined when no computed styles are cached', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      expect(handler.getStyleForTD('box-sizing')).toBeUndefined();
    });

    it('should return the computed style value for TD element', () => {
      const rootElement = document.createElement('div');

      document.body.appendChild(rootElement);

      const style = document.createElement('style');

      style.textContent = 'td { box-sizing: border-box; border-bottom-width: 2px; }';
      document.head.appendChild(style);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      expect(handler.getStyleForTD('box-sizing')).toBe('border-box');
      expect(handler.getStyleForTD('border-bottom-width')).toBe('2px');

      document.body.removeChild(rootElement);
      document.head.removeChild(style);
    });
  });

  describe('areCellsBorderBox', () => {
    it('should return false when no styles are cached', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      expect(handler.areCellsBorderBox()).toBe(false);
    });

    it('should return true when TD box-sizing is border-box', () => {
      const rootElement = document.createElement('div');

      document.body.appendChild(rootElement);

      const style = document.createElement('style');

      style.textContent = 'td { box-sizing: border-box; }';
      document.head.appendChild(style);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      expect(handler.areCellsBorderBox()).toBe(true);

      document.body.removeChild(rootElement);
      document.head.removeChild(style);
    });

    it('should return false when TD box-sizing is content-box', () => {
      const rootElement = document.createElement('div');

      document.body.appendChild(rootElement);

      const style = document.createElement('style');

      style.textContent = 'td { box-sizing: content-box; }';
      document.head.appendChild(style);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      expect(handler.areCellsBorderBox()).toBe(false);

      document.body.removeChild(rootElement);
      document.head.removeChild(style);
    });
  });

  describe('getDefaultRowHeight', () => {
    it('should return null when CSS variables are not available', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      expect(handler.getDefaultRowHeight()).toBeNull();
    });

    it('should handle visualRowIndex when row height cannot be calculated', () => {
      const mockHot = createMockHot();

      mockHot.view.getFirstRenderedVisibleRow.mockReturnValue(5);

      const handler = new StylesHandler({
        hot: mockHot,
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      // When CSS variables are missing, row height calculation returns null
      expect(handler.getDefaultRowHeight(0)).toBeNull();
    });

    it('should calculate row height as lineHeight + (2 * verticalPadding) + borderBottomWidth', () => {
      const rootElement = document.createElement('div');

      // Set CSS custom properties: lineHeight=20, verticalPadding=5
      rootElement.style.setProperty('--ht-line-height', '20px');
      rootElement.style.setProperty('--ht-cell-vertical-padding', '5px');
      document.body.appendChild(rootElement);

      // Add styles for td border-bottom-width
      const style = document.createElement('style');

      style.textContent = 'td { border-bottom-width: 1px; }';
      document.head.appendChild(style);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      // Expected: 20 + (2 * 5) + 1 = 31
      expect(handler.getDefaultRowHeight()).toBe(31);

      document.body.removeChild(rootElement);
      document.head.removeChild(style);
    });

    it('should return base height and base+1 for the first rendered row at 100% zoom (border-bottom-width: 1px)', () => {
      const mockHot = createMockHot();

      mockHot.view.getFirstRenderedVisibleRow.mockReturnValue(0);

      const rootElement = document.createElement('div');

      rootElement.style.setProperty('--ht-line-height', '20px');
      rootElement.style.setProperty('--ht-cell-vertical-padding', '5px');
      document.body.appendChild(rootElement);

      const style = document.createElement('style');

      style.textContent = 'td { border-bottom-width: 1px; }';
      document.head.appendChild(style);

      const handler = new StylesHandler({
        hot: mockHot,
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      // Base height: 20 + (2 * 5) + Math.round(1) = 31
      expect(handler.getDefaultRowHeight()).toBe(31);
      // First rendered row gets +1 for the tr:first-child border-top compensation
      expect(handler.getDefaultRowHeight(0)).toBe(32);

      document.body.removeChild(rootElement);
      document.head.removeChild(style);
    });

    it('should round fractional border-bottom-width to the nearest integer (sub-100% zoom)', () => {
      const rootElement = document.createElement('div');

      rootElement.style.setProperty('--ht-line-height', '20px');
      rootElement.style.setProperty('--ht-cell-vertical-padding', '5px');
      document.body.appendChild(rootElement);

      const style = document.createElement('style');

      // Simulate what the browser reports at 90% zoom: 1px / 0.9 ≈ 1.111px
      style.textContent = 'td { border-bottom-width: 1.11111px; }';
      document.head.appendChild(style);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      // Math.round(1.111) = 1, not Math.ceil(1.111) = 2
      // Expected: 20 + (2 * 5) + 1 = 31
      expect(handler.getDefaultRowHeight()).toBe(31);

      document.body.removeChild(rootElement);
      document.head.removeChild(style);
    });

    it('should add 1px compensation for the first rendered visible row', () => {
      const mockHot = createMockHot();

      mockHot.view.getFirstRenderedVisibleRow.mockReturnValue(0);

      const rootElement = document.createElement('div');

      rootElement.style.setProperty('--ht-line-height', '20px');
      rootElement.style.setProperty('--ht-cell-vertical-padding', '5px');
      document.body.appendChild(rootElement);

      const style = document.createElement('style');

      style.textContent = 'td { border-bottom-width: 1px; }';
      document.head.appendChild(style);

      const handler = new StylesHandler({
        hot: mockHot,
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      // Base height: 20 + (2 * 5) + 1 = 31
      // For first rendered row (visualRowIndex=0), add 1px: 31 + 1 = 32
      expect(handler.getDefaultRowHeight(0)).toBe(32);

      // Other rows should not have the compensation
      expect(handler.getDefaultRowHeight(1)).toBe(31);

      document.body.removeChild(rootElement);
      document.head.removeChild(style);
    });

    it('should not compensate the first rendered row when column headers own the seam', () => {
      // With a column header above it, the first rendered row draws no `border-top` of its own - the
      // header carries that gridline at every scroll position - so there is no missing pixel to add
      // back and every row reports the same height. Compensating anyway is what made the reported
      // symptom: one row a pixel taller than the rest.
      const mockHot = createMockHot();

      mockHot.view.getFirstRenderedVisibleRow.mockReturnValue(0);
      mockHot.view.getColumnHeadersCount.mockReturnValue(1);

      const rootElement = document.createElement('div');

      rootElement.style.setProperty('--ht-line-height', '20px');
      rootElement.style.setProperty('--ht-cell-vertical-padding', '5px');
      document.body.appendChild(rootElement);

      const style = document.createElement('style');

      style.textContent = 'td { border-bottom-width: 1px; }';
      document.head.appendChild(style);

      const handler = new StylesHandler({
        hot: mockHot,
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      expect(handler.getDefaultRowHeight(0)).toBe(31);
      expect(handler.getDefaultRowHeight(1)).toBe(31);

      document.body.removeChild(rootElement);
      document.head.removeChild(style);
    });
  });

  // The predicate the compensation is gated on, asserted on its own because three call sites read it
  // - `getDefaultRowHeight` here, `AutoRowSize`, and `ManualRowMove`'s drop guideline - and a change
  // to any one of them must not be able to drift from the others.
  describe('firstRenderedRowDrawsTopBorder', () => {
    it('should report that the first rendered row draws the border on a headerless grid', () => {
      const mockHot = createMockHot();

      mockHot.view.getColumnHeadersCount.mockReturnValue(0);

      const handler = new StylesHandler({
        hot: mockHot,
        rootElement: document.createElement('div'),
        rootDocument: document,
      });

      expect(handler.firstRenderedRowDrawsTopBorder()).toBe(true);
    });

    it('should report that it does not when the grid renders column headers', () => {
      const mockHot = createMockHot();

      mockHot.view.getColumnHeadersCount.mockReturnValue(1);

      const handler = new StylesHandler({
        hot: mockHot,
        rootElement: document.createElement('div'),
        rootDocument: document,
      });

      expect(handler.firstRenderedRowDrawsTopBorder()).toBe(false);
    });

    it('should follow the rendered head rows, not the colHeaders setting, when they disagree', () => {
      // `afterGetColumnHeaderRenderers` lets a plugin add head rows to a grid that declared none, and
      // NestedHeaders does exactly that. The grid then renders a `thead`, the CSS rule fires, and the
      // first body row draws no top border while `hasColHeaders()` still reports `false`. Keyed on
      // the setting, every row-height sum in the core would be 1px long.
      const mockHot = createMockHot();

      mockHot.hasColHeaders.mockReturnValue(false);
      mockHot.view.getColumnHeadersCount.mockReturnValue(2);

      const handler = new StylesHandler({
        hot: mockHot,
        rootElement: document.createElement('div'),
        rootDocument: document,
      });

      expect(handler.firstRenderedRowDrawsTopBorder()).toBe(false);
    });

    it('should fall back to the setting before the view exists', () => {
      // `StylesHandler` outlives no grid, but it is constructed before the first render, and the
      // header renderers are resolved by the view. The setting is the only answer available there.
      const mockHot = createMockHot();

      mockHot.view = undefined;
      mockHot.hasColHeaders.mockReturnValue(true);

      const handler = new StylesHandler({
        hot: mockHot,
        rootElement: document.createElement('div'),
        rootDocument: document,
      });

      expect(handler.firstRenderedRowDrawsTopBorder()).toBe(false);
    });
  });

  // Below 100% zoom the browser cannot paint the cells' 1px bottom border thinner than one device
  // pixel, so it inflates it and every row renders taller than the theme declared. Summing the
  // declared height then leaves the grid's scroll range short of its own content, which overflows
  // the container and clips the bottom row headers (issue #6280). The probe cell's measured height
  // is what the row actually renders at, so it wins - but only when it is the taller of the two.
  describe('getDefaultRowHeight (rendered height reconciliation)', () => {
    let createdNodes = [];
    // The property descriptor, not the value: jsdom defines `devicePixelRatio` as an accessor, and
    // restoring it as a plain data property would freeze it for every later test in this file. Only
    // captured when a test actually overrides it, so the untouched majority restore nothing.
    let originalDevicePixelRatioDescriptor = null;

    // Cleanup belongs here, not at the end of each test: a failing assertion would skip it and leak
    // a `td { height }` rule into every test that runs after.
    afterEach(() => {
      createdNodes.forEach(node => node.remove());
      createdNodes = [];

      if (originalDevicePixelRatioDescriptor !== null) {
        Object.defineProperty(window, 'devicePixelRatio', originalDevicePixelRatioDescriptor);
        originalDevicePixelRatioDescriptor = null;
      }
    });

    const setDevicePixelRatio = (value) => {
      if (originalDevicePixelRatioDescriptor === null) {
        originalDevicePixelRatioDescriptor =
          Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
      }

      Object.defineProperty(window, 'devicePixelRatio', { value, configurable: true });
    };

    const setUpHandler = (cellStyles, mockHot = createMockHot(), cssZoom = undefined) => {
      const rootElement = document.createElement('div');

      rootElement.style.setProperty('--ht-line-height', '20px');
      rootElement.style.setProperty('--ht-cell-vertical-padding', '5px');

      // jsdom implements no `currentCSSZoom`, so the engine's effective CSS zoom is set by hand.
      if (cssZoom !== undefined) {
        Object.defineProperty(rootElement, 'currentCSSZoom', { value: cssZoom, configurable: true });
      }

      document.body.appendChild(rootElement);

      const style = document.createElement('style');

      style.textContent = `td { ${cellStyles} }`;
      document.head.appendChild(style);
      createdNodes.push(rootElement, style);

      const handler = new StylesHandler({
        hot: mockHot,
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      return { handler, style };
    };

    it('should size rows from the rendered height when a cell renders taller than the theme declared', () => {
      // 90% zoom: the 1px border is reported as 1.111px and the cell renders 31.111px tall, while
      // the theme still declares 20 + (2 * 5) + Math.round(1.111) = 31.
      const { handler } = setUpHandler('border-bottom-width: 1.11111px; height: 31.111px;');

      expect(handler.getDefaultRowHeight()).toBeCloseTo(31.111, 3);
    });

    it('should keep the first rendered row compensation on top of the rendered height', () => {
      const mockHot = createMockHot();

      mockHot.view.getFirstRenderedVisibleRow.mockReturnValue(0);

      const { handler } = setUpHandler('border-bottom-width: 1.11111px; height: 31.111px;', mockHot);

      expect(handler.getDefaultRowHeight(0)).toBeCloseTo(32.111, 3);
      expect(handler.getDefaultRowHeight(1)).toBeCloseTo(31.111, 3);
    });

    it('should ignore a rendered height shorter than the declared one', () => {
      // Above 100% zoom the border shrinks to a fraction but the row keeps its declared height, so
      // the declared height stays authoritative and nothing changes for those users.
      const { handler } = setUpHandler('border-bottom-width: 0.8px; height: 30.8px;');

      expect(handler.getDefaultRowHeight()).toBe(31);
    });

    it('should ignore a rendered height that overshoots the declared one beyond the border inflation', () => {
      // Cell styling the probe cannot represent, not the device-pixel border inflation.
      const { handler } = setUpHandler('border-bottom-width: 1px; height: 45px;');

      expect(handler.getDefaultRowHeight()).toBe(31);
    });

    it('should fall back to the declared height when the probe reports no usable height', () => {
      const { handler } = setUpHandler('border-bottom-width: 1px;');

      expect(handler.getDefaultRowHeight()).toBe(31);
    });

    it('should not read the height rule\'s reserved border as overgrowth when cells have none', () => {
      // The Filters by-value list's shape. The cells' height rule reserves a literal 1px border, so
      // the probe measures 31px, but the list removes the border and its rows render at 30px. Reading
      // the probe's absolute height sized the list's scroll range from 31 and let it scroll past its
      // last item, so a border that is not wider than its rounded value must not reach the probe.
      const { handler } = setUpHandler('border-bottom-width: 0px; height: 31px;');

      expect(handler.getDefaultRowHeight()).toBe(30);
    });

    it('should not correct a border that resolves to a whole number of pixels', () => {
      // 50% zoom: the 1px border resolves to exactly 2px, so `Math.round` already lands on the right
      // row height and the probe's 32px is that same height. Treating the difference against the
      // rule's reserved 1px as overgrowth added ~0.5px to every row - 49.5px over 100 rows, turning
      // the fix into a worse defect than the one it corrects, in a range the original code got right.
      const { handler } = setUpHandler('border-bottom-width: 2px; height: 32px;');

      expect(handler.getDefaultRowHeight()).toBe(32);
    });

    it('should not count an inflated border past half a pixel as the next whole pixel', () => {
      // 40% CSS zoom in Chromium: the border reads 2.5px and the cell renders 32.47px. Rounding counted a
      // 3px border, declared 33px, and left the grid 0.53px taller than every row - 53px over 100 rows.
      setDevicePixelRatio(1);

      const { handler } = setUpHandler('border-bottom-width: 2.5px; height: 32.46875px;', undefined, 0.4);

      expect(handler.getDefaultRowHeight()).toBeCloseTo(32.469, 3);
    });

    it('should count an inflated border past half a pixel by its whole pixels at a device scale below 1', () => {
      // Chrome at 67%: the ratio reads 0.667 and the border 1.5px. Rounding counted 2px and declared 32px
      // for a cell that renders 31.48px.
      setDevicePixelRatio(0.6667);

      const { handler } = setUpHandler('border-bottom-width: 1.5px; height: 31.4776px;');

      expect(handler.getDefaultRowHeight()).toBeCloseTo(31.478, 3);
    });

    it('should keep counting a whole border reported a hair short on its pixel', () => {
      // 50%: a 2px border reported as 1.99999px. Without the slack it counted 1px and sized rows from the
      // probe's 31.5px instead of the declared 32px.
      setDevicePixelRatio(0.5);

      const { handler } = setUpHandler('border-bottom-width: 1.99999px; height: 31.5px;');

      expect(handler.getDefaultRowHeight()).toBe(32);
    });

    it('should round a fractional custom border at or above 100% as before', () => {
      // A theme that sets a 2px border, at 125%: it reads 1.6px and still counts 2px.
      setDevicePixelRatio(1.25);

      const { handler } = setUpHandler('border-bottom-width: 1.6px; height: 31.6px;');

      expect(handler.getDefaultRowHeight()).toBe(32);
    });

    it('should keep rounding a border thinner than 1px up to the 1px the cells reserve', () => {
      // Above 100% the border snaps down (0.8px at 125%), while the cells' height rule keeps its 1px.
      const { handler } = setUpHandler('border-bottom-width: 0.8px; height: 31px;');

      expect(handler.getDefaultRowHeight()).toBe(31);
    });

    it('should accept an overgrowth equal to the bound when the ratio is a float32 value', () => {
      // WebKit at a device scale of 0.8: the ratio reads 0.800000011920929, so the bound is
      // 1 / ratio - 1 = 0.24999998, while the cell renders exactly 0.25px taller. Rejecting it kept the
      // declared height and left the grid 0.25px short per row - 25px over 100 rows.
      setDevicePixelRatio(0.800000011920929);

      const { handler } = setUpHandler('border-bottom-width: 1.25px; height: 31.25px;');

      expect(handler.getDefaultRowHeight()).toBeCloseTo(31.25, 3);
    });

    describe('when the engine reports the border uninflated under CSS zoom', () => {
      // WebKit reads the cells' border as 1px at every CSS zoom level, while the cell still renders as
      // tall as one whose border was rounded up to a device pixel: 31.097px at 90% for a 31px row.

      it('should size rows from the rendered height when no device pixel can paint the border', () => {
        setDevicePixelRatio(1);

        const { handler } = setUpHandler('border-bottom-width: 1px; height: 31.097223px;', undefined, 0.9);

        expect(handler.getDefaultRowHeight()).toBeCloseTo(31.097, 3);
      });

      it('should keep the declared height for cells with no border', () => {
        setDevicePixelRatio(1);

        // 0.097px over the declared 30px is within the bound, so only the borderless check keeps it out.
        const { handler } = setUpHandler('border-bottom-width: 0px; height: 30.097223px;', undefined, 0.9);

        expect(handler.getDefaultRowHeight()).toBe(30);
      });

      it('should size rows from the rendered height when the device pixel is a whole number of CSS pixels', () => {
        // 50%: one device pixel is 2 CSS pixels, so the border is painted 2px wide while it reads, and the
        // declared height counts, 1px. Unlike a border that READS 2px, nothing has rounded it in yet.
        setDevicePixelRatio(1);

        const { handler } = setUpHandler('border-bottom-width: 1px; height: 32px;', undefined, 0.5);

        expect(handler.getDefaultRowHeight()).toBe(32);
      });

      it('should size rows from the rendered height below 50%', () => {
        // 40%: the border is painted 2.5px wide, so the cell grows 1.5px - more than the 1px a bound from
        // the device pixel ratio alone allowed.
        setDevicePixelRatio(1);

        const { handler } = setUpHandler('border-bottom-width: 1px; height: 32.5px;', undefined, 0.4);

        expect(handler.getDefaultRowHeight()).toBeCloseTo(32.5, 3);
      });

      it('should ignore an overgrowth beyond what the zoom can inflate', () => {
        // At 90% the border can add 0.111px at most; 0.5px is cell styling the probe cannot represent.
        setDevicePixelRatio(1);

        const { handler } = setUpHandler('border-bottom-width: 1px; height: 31.5px;', undefined, 0.9);

        expect(handler.getDefaultRowHeight()).toBe(31);
      });

      it('should keep the declared height when the zoomed border still spans a device pixel', () => {
        // A high-density screen at 90%: 1.8 device pixels per CSS pixel, so nothing is inflated.
        setDevicePixelRatio(2);

        const { handler } = setUpHandler('border-bottom-width: 1px; height: 31.097223px;', undefined, 0.9);

        expect(handler.getDefaultRowHeight()).toBe(31);
      });

      it('should keep the declared height when a device pixel is within a layout unit of the border', () => {
        // 99%: one device pixel is 1.0101 CSS pixels, less than a layout unit wider than the 1px counted.
        setDevicePixelRatio(1);

        const { handler } = setUpHandler('border-bottom-width: 1px; height: 31.0101px;', undefined, 0.99);

        expect(handler.getDefaultRowHeight()).toBe(31);
      });

      it('should keep the declared height at 100%', () => {
        setDevicePixelRatio(1);

        const { handler } = setUpHandler('border-bottom-width: 1px; height: 31.5px;', undefined, 1);

        expect(handler.getDefaultRowHeight()).toBe(31);
      });
    });

    it('should not probe the DOM when a required theme variable is missing', () => {
      // `getCSSVariableValue()` returns `undefined`, not `null`, for a variable that resolves to
      // nothing - the case core.ts warns about when an `ht-theme-*` class has no stylesheet behind
      // it yet. The arithmetic then yields NaN, which every caller passes through (`?? 0` only
      // catches null/undefined) and the next draw recovers from once the stylesheet lands.
      //
      // NaN must be RETURNED but must never reach the measurement cache key: `NaN !== NaN`, so the
      // key could never match and every call would rebuild the probe table and force a layout -
      // per row, inside the draw. Returning `null` here instead is NOT the fix: `?? 0` would then
      // collapse the row height to zero and the grid with it.
      const rootElement = document.createElement('div');

      document.body.appendChild(rootElement);
      createdNodes.push(rootElement);

      const style = document.createElement('style');

      style.textContent = 'td { border-bottom-width: 1.11111px; height: 31.111px; }';
      document.head.appendChild(style);
      createdNodes.push(style);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();
      setDevicePixelRatio(0.9);

      const appendChildSpy = jest.spyOn(rootElement, 'appendChild');

      // The value is unchanged from before this reconciliation existed...
      expect(handler.getDefaultRowHeight()).toBeNaN();
      expect(handler.getDefaultRowHeight()).toBeNaN();
      expect(handler.getDefaultRowHeight()).toBeNaN();
      // ...and it cost no DOM work at all.
      expect(appendChildSpy).not.toHaveBeenCalled();

      appendChildSpy.mockRestore();
    });

    it('should re-measure after a grid built while hidden becomes visible', () => {
      // Tabs, accordions and modals build their grid inside a `display: none` ancestor, where the
      // probe measures nothing. Caching that unusable answer stuck forever, because neither cache
      // key moves when the container is revealed - so the fix never reached the most common way a
      // grid is built off-screen. `#stylesResolve()` does not catch this either: the root element's
      // own computed `display` is still `block` inside a hidden ancestor.
      const wrapper = document.createElement('div');

      wrapper.style.display = 'none';
      document.body.appendChild(wrapper);
      createdNodes.push(wrapper);

      const rootElement = document.createElement('div');

      rootElement.style.setProperty('--ht-line-height', '20px');
      rootElement.style.setProperty('--ht-cell-vertical-padding', '5px');
      wrapper.appendChild(rootElement);

      const style = document.createElement('style');

      // No `height` while hidden: the probe resolves no layout, exactly as in a real browser.
      style.textContent = 'td { border-bottom-width: 1.11111px; }';
      document.head.appendChild(style);
      createdNodes.push(style);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();
      setDevicePixelRatio(0.9);

      // Hidden: nothing usable to measure, so the declared height stands.
      expect(handler.getDefaultRowHeight()).toBe(31);

      // Revealed. Neither cache key changed, so only refusing to store the unusable measurement
      // lets this be picked up.
      style.textContent = 'td { border-bottom-width: 1.11111px; height: 31.111px; }';
      wrapper.style.display = '';

      expect(handler.getDefaultRowHeight()).toBeCloseTo(31.111, 3);
    });

    it('should re-measure the rendered height after the device pixel ratio changes', () => {
      const { handler, style } = setUpHandler('border-bottom-width: 1.11111px; height: 31.111px;');

      setDevicePixelRatio(0.9);

      expect(handler.getDefaultRowHeight()).toBeCloseTo(31.111, 3);

      // Zooming to 80% inflates the border further. The measurement is cached, so only a changed
      // ratio may retake it - a stale one would keep sizing rows from the 90% height.
      style.textContent = 'td { border-bottom-width: 1.25px; height: 31.25px; }';
      setDevicePixelRatio(0.8);

      expect(handler.getDefaultRowHeight()).toBeCloseTo(31.25, 3);
    });

    describe('getMaxDefaultRowOvergrowth', () => {
      it('should be what the border inflation can add to a default row at the ratio of now', () => {
        const { handler } = setUpHandler('border-bottom-width: 1px;');

        setDevicePixelRatio(0.9);

        expect(handler.getMaxDefaultRowOvergrowth()).toBeCloseTo(0.111, 3);

        setDevicePixelRatio(0.8);

        expect(handler.getMaxDefaultRowOvergrowth()).toBeCloseTo(0.25, 3);
      });

      it('should be 0 at or above 100%, where nothing is inflated', () => {
        const { handler } = setUpHandler('border-bottom-width: 1px;');

        setDevicePixelRatio(1);

        expect(handler.getMaxDefaultRowOvergrowth()).toBe(0);

        setDevicePixelRatio(1.5);

        expect(handler.getMaxDefaultRowOvergrowth()).toBe(0);
      });
    });
  });

  describe('clearCache', () => {
    it('should not throw when called', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      expect(() => handler.clearCache()).not.toThrow();
    });

    it('should refresh TD styles from the DOM', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      handler.clearCache();

      // After clearCache, styles are re-read from DOM (empty string in JSDOM)
      expect(handler.getStyleForTD('box-sizing')).toBe('');
      expect(handler.getStyleForTD('border-bottom-width')).toBe('');
    });

    it('should clear the CSS variable cache', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      handler.clearCache();

      expect(handler.getCSSVariableValue('non-existent-var')).toBeUndefined();
    });

    it('should result in correct derived values based on refreshed cache', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      handler.clearCache();

      expect(handler.areCellsBorderBox()).toBe(false);
      expect(handler.getDefaultRowHeight()).toBeNull();
    });
  });
  describe('recacheValuesMeasuredWithoutStyles', () => {
    it('should report no re-read for a root element that resolved its styles from the start', () => {
      const rootElement = createMockRootElement();

      document.body.appendChild(rootElement);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.useTheme('ht-theme-main');

      expect(handler.recacheValuesMeasuredWithoutStyles()).toBe(false);

      rootElement.remove();
    });

    it('should report no re-read while the root element still resolves no styles', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      handler.useTheme('ht-theme-main');

      expect(handler.recacheValuesMeasuredWithoutStyles()).toBe(false);
    });

    it('should re-read the values once the root element resolves its styles, and only once', () => {
      const rootElement = createMockRootElement();
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.useTheme('ht-theme-main');
      document.body.appendChild(rootElement);

      expect(handler.recacheValuesMeasuredWithoutStyles()).toBe(true);
      expect(handler.recacheValuesMeasuredWithoutStyles()).toBe(false);

      rootElement.remove();
    });
  });

  describe('refreshZoomDependentValues', () => {
    let createdNodes = [];

    afterEach(() => {
      createdNodes.forEach(node => node.remove());
      createdNodes = [];
    });

    const setUpHandler = (cellStyles) => {
      const rootElement = document.createElement('div');

      rootElement.style.setProperty('--ht-line-height', '20px');
      rootElement.style.setProperty('--ht-cell-vertical-padding', '5px');
      document.body.appendChild(rootElement);

      const style = document.createElement('style');

      style.textContent = `td { ${cellStyles} }`;
      document.head.appendChild(style);
      createdNodes.push(rootElement, style);

      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement,
        rootDocument: document,
      });

      handler.clearCache();

      return { handler, style, rootElement };
    };

    it('should report a change when the CSS zoom moved while the border reads the same', () => {
      // WebKit reads the border as 1px at every CSS zoom level, so only the zoom itself shows that a grid
      // built at 100% was zoomed out afterwards.
      const { handler, style, rootElement } = setUpHandler('border-bottom-width: 1px; height: 31px;');

      expect(handler.getDefaultRowHeight()).toBe(31);

      Object.defineProperty(rootElement, 'currentCSSZoom', { value: 0.9, configurable: true });
      style.textContent = 'td { border-bottom-width: 1px; height: 31.097223px; }';

      expect(handler.refreshZoomDependentValues()).toBe(true);
      expect(handler.getDefaultRowHeight()).toBeCloseTo(31.097, 3);
      expect(handler.refreshZoomDependentValues()).toBe(false);
    });

    it('should report a change and re-read the border when the browser zoom moved the cell border', () => {
      const { handler, style } = setUpHandler('border-bottom-width: 1px;');

      expect(handler.getStyleForTD('border-bottom-width')).toBe('1px');

      // Zooming out to 80% after the grid was built: the border cannot be painted thinner than a device
      // pixel, so the cells now report 1.25px while the snapshot still holds the 100% value.
      style.textContent = 'td { border-bottom-width: 1.25px; }';

      expect(handler.refreshZoomDependentValues()).toBe(true);
      expect(handler.getStyleForTD('border-bottom-width')).toBe('1.25px');
    });

    it('should size rows from the rendered height after a zoom made once the grid was built', () => {
      const { handler, style } = setUpHandler('border-bottom-width: 1px; height: 31px;');

      // 20 (line height) + 2 * 5 (padding) + 1 (border): the declared height at 100%.
      expect(handler.getDefaultRowHeight()).toBe(31);

      style.textContent = 'td { border-bottom-width: 1.25px; height: 31.25px; }';
      handler.refreshZoomDependentValues();

      expect(handler.getDefaultRowHeight()).toBeCloseTo(31.25, 3);
    });

    it('should report a change when the zoom returns to 100%', () => {
      const { handler, style } = setUpHandler('border-bottom-width: 1.25px; height: 31.25px;');

      style.textContent = 'td { border-bottom-width: 1px; height: 31px; }';

      expect(handler.refreshZoomDependentValues()).toBe(true);
      expect(handler.getDefaultRowHeight()).toBe(31);
    });

    it('should report no change and keep the cached values while the border is the same', () => {
      const { handler } = setUpHandler('border-bottom-width: 1.25px;');

      expect(handler.refreshZoomDependentValues()).toBe(false);
      expect(handler.getStyleForTD('border-bottom-width')).toBe('1.25px');
    });

    it('should report no change when the probe reads no border now, and keep the cached one', () => {
      const { handler, style } = setUpHandler('border-bottom-width: 1px;');

      // A stylesheet that is gone, or an element outside the flat tree: the probe cell reports no
      // border, which says nothing about the zoom. Wiping the snapshot on it would churn the caches on
      // every resize.
      style.textContent = '';

      expect(handler.refreshZoomDependentValues()).toBe(false);
      expect(handler.getStyleForTD('border-bottom-width')).toBe('1px');
    });

    it('should report no change when the cache holds no border, though the probe reads one now', () => {
      const { handler, style } = setUpHandler('border-bottom-width: 1px;');

      // Cached while the cells resolved no border (a stylesheet that had not applied yet).
      style.textContent = '';
      handler.clearCache();
      style.textContent = 'td { border-bottom-width: 1.25px; }';

      expect(handler.getStyleForTD('border-bottom-width')).toBe('');
      // The values read against unresolved styles are `recacheValuesMeasuredWithoutStyles()`'s to
      // re-read; a zoom check that also cleared them would drop sizes on the first resize.
      expect(handler.refreshZoomDependentValues()).toBe(false);
      expect(handler.getStyleForTD('border-bottom-width')).toBe('');
    });

    it('should report no change and not throw for a root element outside the document', () => {
      const handler = new StylesHandler({
        hot: createMockHot(),
        rootElement: createMockRootElement(),
        rootDocument: document,
      });

      expect(() => handler.refreshZoomDependentValues()).not.toThrow();
      expect(handler.refreshZoomDependentValues()).toBe(false);
    });
  });
});

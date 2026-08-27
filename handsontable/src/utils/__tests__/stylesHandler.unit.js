import { StylesHandler } from '../stylesHandler';
import handsontableStyles from '../../styles/handsontableStyles';

const CORE_STYLES_ID = 'handsontable-core-styles';

describe('StylesHandler', () => {
  const createMockHot = () => ({
    view: {
      getFirstRenderedVisibleRow: jest.fn().mockReturnValue(0),
    },
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

    const setUpHandler = (cellStyles, mockHot = createMockHot()) => {
      const rootElement = document.createElement('div');

      rootElement.style.setProperty('--ht-line-height', '20px');
      rootElement.style.setProperty('--ht-cell-vertical-padding', '5px');
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
});

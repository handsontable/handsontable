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
});

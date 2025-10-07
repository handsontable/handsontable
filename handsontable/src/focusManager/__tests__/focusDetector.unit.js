import { installFocusDetector } from '../utils/focusDetector';

describe('focusDetector', () => {
  let hot;
  let hooks;

  beforeEach(() => {
    const rootElement = document.createElement('div');
    const rootWrapperElement = document.createElement('div');

    rootElement.className = 'handsontable';
    rootElement.innerHTML = '<div></div><div></div>';

    rootWrapperElement.appendChild(rootElement);

    hot = {
      rootWrapperElement,
      rootElement,
      rootDocument: document,
      _registerTimeout: jest.fn(),
      getSettings: () => ({
        ariaTags: true,
      }),
    };
    hooks = {
      onFocus: jest.fn(),
    };
  });

  afterEach(() => {
    hot = null;
    hooks = null;
  });

  it('should add input traps with correct attributes to the wrapper element', () => {
    installFocusDetector(hot, hot.rootWrapperElement, hooks);

    const inputTrapTop = hot.rootWrapperElement.firstChild;
    const inputTrapBottom = hot.rootWrapperElement.lastChild;

    expect(inputTrapTop.className).toBe('htFocusCatcher');
    expect(inputTrapTop.name).toBe('htFocusCatcher');
    expect(inputTrapTop.getAttribute('aria-label')).toBe('Focus catcher');
    expect(inputTrapBottom.className).toBe('htFocusCatcher');
    expect(inputTrapBottom.name).toBe('htFocusCatcher');
    expect(inputTrapTop.getAttribute('aria-label')).toBe('Focus catcher');

    const inputTrapTopStyle = window.getComputedStyle(inputTrapTop);

    expect(inputTrapTopStyle.position).toBe('absolute');
    expect(inputTrapTopStyle.width).toBe('0px');
    expect(inputTrapTopStyle.height).toBe('0px');
    expect(inputTrapTopStyle.opacity).toBe('0');
    expect(inputTrapTopStyle.zIndex).toBe('-1');
    expect(inputTrapTopStyle.border).toBe('0px');
    expect(inputTrapTopStyle.outline).toBe('0px');
    expect(inputTrapTopStyle.padding).toBe('0px');
    expect(inputTrapTopStyle.margin).toBe('0px');

    const inputTrapBottomStyle = window.getComputedStyle(inputTrapBottom);

    expect(inputTrapBottomStyle.position).toBe('absolute');
    expect(inputTrapBottomStyle.width).toBe('0px');
    expect(inputTrapBottomStyle.height).toBe('0px');
    expect(inputTrapBottomStyle.opacity).toBe('0');
    expect(inputTrapBottomStyle.zIndex).toBe('-1');
    expect(inputTrapBottomStyle.border).toBe('0px');
    expect(inputTrapBottomStyle.outline).toBe('0px');
    expect(inputTrapBottomStyle.padding).toBe('0px');
    expect(inputTrapBottomStyle.margin).toBe('0px');
  });

  // More tests around the focusCatcher module you'll find here ./handsontable/test/e2e/keyboardShortcuts/tabNavigation.spec.js
});

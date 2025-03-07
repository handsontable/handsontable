import { installFocusDetector } from './../focusDetector';

describe('focusDetector', () => {
  let hot;
  let hooks;

  beforeEach(() => {
    const rootElement = document.createElement('div');

    rootElement.className = 'handsontable';
    rootElement.innerHTML = '<div></div><div></div>';

    hot = {
      rootElement,
      rootDocument: document,
      _registerTimeout: jest.fn(),
      getSettings: () => ({
        ariaTags: true,
      }),
    };
    hooks = {
      onFocusFromTop: jest.fn(),
      onFocusFromBottom: jest.fn(),
    };
  });

  afterEach(() => {
    hot = null;
    hooks = null;
  });

  it('should add input traps with correct attributes to the Handsontable root element', () => {
    installFocusDetector(hot, hooks);

    const inputTrapTop = hot.rootElement.firstChild;
    const inputTrapBottom = hot.rootElement.lastChild;

    expect(inputTrapTop.className).toBe('htFocusCatcher');
    expect(inputTrapTop.name).toBe('__htFocusCatcher');
    expect(inputTrapTop.getAttribute('role')).toBe('presentation');
    expect(inputTrapTop.getAttribute('aria-hidden')).toBe('true');
    expect(inputTrapBottom.className).toBe('htFocusCatcher');
    expect(inputTrapBottom.name).toBe('__htFocusCatcher');
    expect(inputTrapBottom.getAttribute('role')).toBe('presentation');
    expect(inputTrapBottom.getAttribute('aria-hidden')).toBe('true');
  });

  // More tests around the focusCatcher module you'll find here ./handsontable/test/e2e/keyboardShortcuts/tabNavigation.spec.js
});

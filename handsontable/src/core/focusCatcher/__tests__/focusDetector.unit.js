import { installFocusDetector } from './../focusDetector';

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

    const inputTrapTop = hot.rootWrapperElement.firstChild;
    const inputTrapBottom = hot.rootWrapperElement.lastChild;

    expect(inputTrapTop.className).toBe('htFocusCatcher');
    expect(inputTrapTop.name).toBe('__htFocusCatcher');
    expect(inputTrapTop.getAttribute('aria-label')).toBe('Focus catcher');
    expect(inputTrapBottom.className).toBe('htFocusCatcher');
    expect(inputTrapBottom.name).toBe('__htFocusCatcher');
    expect(inputTrapTop.getAttribute('aria-label')).toBe('Focus catcher');
  });

  // More tests around the focusCatcher module you'll find here ./handsontable/test/e2e/keyboardShortcuts/tabNavigation.spec.js
});

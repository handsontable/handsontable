describe('ScopeManager', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should add input traps with correct attributes to the wrapper element', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(10, 10),
    });

    const inputTrapTop = hot.rootGridElement.firstChild;
    const inputTrapBottom = hot.rootGridElement.lastChild;

    expect(inputTrapTop.className).toBe('htFocusCatcher');
    expect(inputTrapTop.name).toBe('htFocusCatcher');
    expect(inputTrapTop.getAttribute('aria-label')).toBe('Focus catcher');
    expect(inputTrapTop.dataset.htFocusSource).toBe('tab_from_above');
    expect(inputTrapBottom.className).toBe('htFocusCatcher');
    expect(inputTrapBottom.name).toBe('htFocusCatcher');
    expect(inputTrapBottom.getAttribute('aria-label')).toBe('Focus catcher');
    expect(inputTrapBottom.dataset.htFocusSource).toBe('tab_from_below');

    const inputTrapTopStyle = window.getComputedStyle(inputTrapTop);

    expect(inputTrapTopStyle.position).toBe('absolute');
    expect(inputTrapTopStyle.width).toBe('0px');
    expect(inputTrapTopStyle.height).toBe('0px');
    expect(inputTrapTopStyle.opacity).toBe('0');
    expect(inputTrapTopStyle.zIndex).toBe('-1');
    expect(inputTrapTopStyle.borderWidth).toBe('0px');
    expect(inputTrapTopStyle.outlineWidth).toBe('0px');
    expect(inputTrapTopStyle.padding).toBe('0px');
    expect(inputTrapTopStyle.margin).toBe('0px');

    const inputTrapBottomStyle = window.getComputedStyle(inputTrapBottom);

    expect(inputTrapBottomStyle.position).toBe('absolute');
    expect(inputTrapBottomStyle.width).toBe('0px');
    expect(inputTrapBottomStyle.height).toBe('0px');
    expect(inputTrapBottomStyle.opacity).toBe('0');
    expect(inputTrapBottomStyle.zIndex).toBe('-1');
    expect(inputTrapBottomStyle.borderWidth).toBe('0px');
    expect(inputTrapBottomStyle.outlineWidth).toBe('0px');
    expect(inputTrapBottomStyle.padding).toBe('0px');
    expect(inputTrapBottomStyle.margin).toBe('0px');
  });

  // More tests around the focusCatcher module you'll find here ./handsontable/test/e2e/keyboardShortcuts/tabNavigation.spec.js
});

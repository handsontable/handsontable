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

  it('should add catcher traps with correct attributes to the wrapper element', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(10, 10),
    });

    const catcherTop = hot.rootGridContentElement.firstChild;
    const catcherBottom = hot.rootGridContentElement.lastChild;

    expect(catcherTop.className).toBe('htFocusCatcher');
    expect(catcherTop.dataset.htFocusSource).toBe('tab_from_above');
    expect(catcherBottom.className).toBe('htFocusCatcher');
    expect(catcherBottom.dataset.htFocusSource).toBe('tab_from_below');

    const catcherTopStyle = window.getComputedStyle(catcherTop);

    expect(catcherTopStyle.position).toBe('absolute');
    expect(catcherTopStyle.width).toBe('0px');
    expect(catcherTopStyle.height).toBe('0px');
    expect(catcherTopStyle.opacity).toBe('0');
    expect(catcherTopStyle.zIndex).toBe('-1');
    expect(catcherTopStyle.borderWidth).toBe('0px');
    expect(catcherTopStyle.outlineWidth).toBe('0px');
    expect(catcherTopStyle.padding).toBe('0px');
    expect(catcherTopStyle.margin).toBe('0px');

    const catcherBottomStyle = window.getComputedStyle(catcherBottom);

    expect(catcherBottomStyle.position).toBe('absolute');
    expect(catcherBottomStyle.width).toBe('0px');
    expect(catcherBottomStyle.height).toBe('0px');
    expect(catcherBottomStyle.opacity).toBe('0');
    expect(catcherBottomStyle.zIndex).toBe('-1');
    expect(catcherBottomStyle.borderWidth).toBe('0px');
    expect(catcherBottomStyle.outlineWidth).toBe('0px');
    expect(catcherBottomStyle.padding).toBe('0px');
    expect(catcherBottomStyle.margin).toBe('0px');
  });

  // More tests around the focusCatcher module you'll find here ./handsontable/test/e2e/keyboardShortcuts/tabNavigation.spec.js
});

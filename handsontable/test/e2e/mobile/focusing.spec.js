const id = 'testContainer';

describe('Focusing', () => {
  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not call the `select` method on the "focusable" textarea when selecting a cell', async() => {
    const hot = handsontable({
      data: [['test']],
      width: 400,
      height: 400
    });

    hot.selectCell(0, 0);

    const copyPastePlugin = hot.getPlugin('copyPaste');
    const focusableElement = copyPastePlugin.focusableElement.getFocusableElement();

    spyOn(focusableElement, 'select');

    hot.selectCell(0, 0);

    expect(focusableElement.select).not.toHaveBeenCalled();
  });
});

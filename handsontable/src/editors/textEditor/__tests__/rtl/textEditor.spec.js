describe('TextEditor (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px; overflow: hidden;"></div>`)
      .appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should render an editable editor\'s element without messing with "dir" attribute', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 5),
      editor: 'text',
    });

    selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  it('should change editor\'s CSS properties during switching to being visible', () => {
    handsontable({
      editor: 'text',
    });

    selectCell(0, 0);
    keyDownUp('enter');

    const cell = getCell(0, 0);
    const master = getMaster();
    const cellOffsetTop = cell.offsetTop;
    const cellOffsetLeft = cell.offsetLeft + master.find('.wtHider').position().left;
    const { left, right, position, top, zIndex, overflow } = spec().$container.find('.handsontableInputHolder').css([
      'left',
      'right',
      'position',
      'top',
      'zIndex',
      'overflow',
    ]);

    expect(parseInt(left, 10)).toBeAroundValue(cellOffsetLeft);
    expect(parseInt(right, 10)).not.toBe(document.body.offsetWidth);
    expect(position).toBe('absolute');
    expect(parseInt(top, 10)).toBeAroundValue(cellOffsetTop);
    expect(zIndex).not.toBe('-1');
    expect(overflow).not.toBe('hidden');
  });
});

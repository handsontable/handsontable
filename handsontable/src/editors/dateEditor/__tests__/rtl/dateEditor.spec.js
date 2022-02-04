describe('DateEditor (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
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
      editor: 'date',
    });

    selectCell(0, 0);

    const editableElement = getActiveEditor().TEXTAREA;

    expect(editableElement.getAttribute('dir')).toBeNull();
  });

  it('should render Pikaday within element that contains correct "dir" attribute value', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      columns: [
        { type: 'date' },
        { type: 'date' }
      ]
    });

    selectCell(1, 1);
    keyDown('enter');

    const datePicker = getActiveEditor().datePicker;
    const config = getActiveEditor().$datePicker.config();

    expect(datePicker.getAttribute('dir')).toBe('rtl');
    // it's set as `false` in RTL due to https://github.com/Pikaday/Pikaday/issues/647 bug. The Pikaday layout
    // direction mode is controlled by above "dir" attribute.
    expect(config.isRTL).toBe(false);
  });

  it('should display Pikaday Calendar left-bottom of the selected cell', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 2),
      columns: [
        { type: 'date' },
        { type: 'date' }
      ]
    });

    selectCell(1, 1);
    keyDown('enter');

    const cellOffset = $(getActiveEditor().TD).offset();
    const cellWidth = $(getActiveEditor().TD).outerWidth();
    const $datePicker = $('.htDatepickerHolder');
    const datePickerOffset = $datePicker.offset();
    const datePickerWidth = $datePicker.outerWidth();

    // 23 is a height of the editor's cell
    expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0);
    expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
  });

  it('should display Pikaday Calendar left-bottom of the selected cell when table have scrolls', () => {
    const container = $('#testContainer');

    container[0].style.height = '300px';
    container[0].style.width = '200px';
    container[0].style.overflow = 'hidden';

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(30, 10),
      colWidths: 60,
      columns: [
        { type: 'date' },
        { type: 'date' },
        { type: 'date' },
        { type: 'date' },
        { type: 'date' },
        { type: 'date' },
        { type: 'date' }
      ]
    });

    selectCell(20, 6);
    keyDown('enter');

    const cellOffset = $(getActiveEditor().TD).offset();
    const cellWidth = $(getActiveEditor().TD).outerWidth();
    const $datePicker = $('.htDatepickerHolder');
    const datePickerOffset = $datePicker.offset();
    const datePickerWidth = $datePicker.outerWidth();

    // 23 is a height of the editor's cell
    expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0);
    expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
  });
});

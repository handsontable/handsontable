describe('DateEditor (RTL mode)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('should render an editable editor\'s element without messing with "dir" attribute', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(2, 5),
        editor: 'date',
      });

      await selectCell(0, 0);

      const editableElement = getActiveEditor().TEXTAREA;

      expect(editableElement.getAttribute('dir')).toBeNull();
    });

    it('should render Pikaday within element that contains correct "dir" attribute value', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(5, 2),
        columns: [
          { type: 'date' },
          { type: 'date' }
        ]
      });

      await selectCell(1, 1);
      await keyDown('enter');

      const datePicker = getActiveEditor().datePicker;
      const config = getActiveEditor().$datePicker.config();

      expect(datePicker.getAttribute('dir')).toBe('rtl');
      // it's set as `false` in RTL due to https://github.com/Pikaday/Pikaday/issues/647 bug. The Pikaday layout
      // direction mode is controlled by above "dir" attribute.
      expect(config.isRTL).toBe(false);
    });

    it('should display Pikaday Calendar left-bottom of the selected cell', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(5, 2),
        columns: [
          { type: 'date' },
          { type: 'date' }
        ]
      });

      await selectCell(1, 1);
      await keyDown('enter');

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const $datePicker = $('.htDatepickerHolder');
      const datePickerOffset = $datePicker.offset();
      const datePickerWidth = $datePicker.outerWidth();

      expect(cellOffset.top).forThemes(({ classic, main, horizon }) => {
        classic.toBeCloseTo(datePickerOffset.top - 23, 0); // 23 is a height of the editor's cell
        main.toBeCloseTo(datePickerOffset.top - 29, 0);
        horizon.toBeCloseTo(datePickerOffset.top - 37, 0);
      });
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
    });

    it.forTheme('classic')('should display Pikaday Calendar left-bottom of the selected cell when ' +
      'table have scrolls', async() => {
      const container = $('#testContainer');

      container[0].style.height = '300px';
      container[0].style.width = '200px';
      container[0].style.overflow = 'hidden';

      handsontable({
        layoutDirection,
        data: createSpreadsheetData(30, 10),
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

      await selectCell(20, 6);
      await keyDown('enter');
      await sleep(50);

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const $datePicker = $('.htDatepickerHolder');
      const datePickerOffset = $datePicker.offset();
      const datePickerWidth = $datePicker.outerWidth();

      expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0);
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
    });

    it.forTheme('main')('should display Pikaday Calendar left-bottom of the selected cell when ' +
      'table have scrolls', async() => {
      const container = $('#testContainer');

      container[0].style.height = '378px';
      container[0].style.width = '252px';
      container[0].style.overflow = 'hidden';

      handsontable({
        layoutDirection,
        data: createSpreadsheetData(30, 10),
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

      await selectCell(20, 6);
      await keyDown('enter');
      await sleep(50);

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const $datePicker = $('.htDatepickerHolder');
      const datePickerOffset = $datePicker.offset();
      const datePickerWidth = $datePicker.outerWidth();

      expect(cellOffset.top + 45).toBeCloseTo(datePickerOffset.top, 0);
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
    });

    it.forTheme('horizon')('should display Pikaday Calendar left-bottom of the selected cell when ' +
      'table have scrolls', async() => {
      const container = $('#testContainer');

      container[0].style.height = '482px';
      container[0].style.width = '252px';
      container[0].style.overflow = 'hidden';

      handsontable({
        layoutDirection,
        data: createSpreadsheetData(30, 10),
        colWidths: 90,
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

      await selectCell(20, 6);
      await keyDown('enter');
      await sleep(50);

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const $datePicker = $('.htDatepickerHolder');
      const datePickerOffset = $datePicker.offset();
      const datePickerWidth = $datePicker.outerWidth();

      expect(cellOffset.top + 37).toBeCloseTo(datePickerOffset.top, 0);
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
    });

    it.forTheme('classic')('should move a datepicker together with the edited cell when the ' +
      'table is scrolled left', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(50, 20),
        width: 200,
        height: 200,
        type: 'date',
      });

      await selectCell(2, 10);
      await keyDownUp('enter');

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const pikaElement = $('.pika-single');
      const datePicker = $('.htDatepickerHolder');
      const datePickerOffset = datePicker.offset();
      const datePickerWidth = datePicker.outerWidth();

      await sleep(50);

      expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(520); // scroll the viewport so the edited cell is partially visible from right

      expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(550); // scroll the viewport so the edited cell is not visible

      expect(pikaElement.is(':visible')).toBe(false);
    });

    it.forTheme('main')('should move a datepicker together with the edited cell when the table is ' +
      'scrolled left', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(50, 20),
        width: 252,
        height: 252,
        type: 'date',
      });

      await selectCell(2, 10);
      await keyDownUp('enter');

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const pikaElement = $('.pika-single');
      const datePicker = $('.htDatepickerHolder');
      const datePickerOffset = datePicker.offset();
      const datePickerWidth = datePicker.outerWidth();

      expect(cellOffset.top + 29).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(450); // scroll the viewport so the edited cell is partially visible from right

      expect(cellOffset.top + 29).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(300); // scroll the viewport so the edited cell is not visible

      expect(pikaElement.is(':visible')).toBe(false);
    });

    it.forTheme('horizon')('should move a datepicker together with the edited cell when the table is ' +
      'scrolled left', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(50, 20),
        width: 252,
        height: 321,
        type: 'date',
      });

      await selectCell(2, 10);
      await keyDownUp('enter');

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const pikaElement = $('.pika-single');
      const datePicker = $('.htDatepickerHolder');
      const datePickerOffset = datePicker.offset();
      const datePickerWidth = datePicker.outerWidth();

      expect(cellOffset.top + 37).toBeCloseTo(datePickerOffset.top, 0);
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(574); // scroll the viewport so the edited cell is partially visible from right

      expect(cellOffset.top + 37).toBeCloseTo(datePickerOffset.top, 0);
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(300); // scroll the viewport so the edited cell is not visible

      expect(pikaElement.is(':visible')).toBe(false);
    });

    it.forTheme('classic')('should move a datepicker together with the edited cell when the ' +
      'table is scrolled right', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(50, 20),
        width: 200,
        height: 200,
        type: 'date',
      });

      await selectCell(2, 10);
      await keyDownUp('enter');

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const pikaElement = $('.pika-single');
      const datePicker = $('.htDatepickerHolder');
      const datePickerOffset = datePicker.offset();
      const datePickerWidth = datePicker.outerWidth();

      expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(340); // scroll the viewport so the edited cell is partially visible from left

      expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(310); // scroll the viewport so the edited cell is not visible

      expect(pikaElement.is(':visible')).toBe(false);
    });

    it.forTheme('main')('should move a datepicker together with the edited cell when the table is ' +
      'scrolled right', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(50, 20),
        width: 252,
        height: 252,
        type: 'date',
      });

      await selectCell(2, 10);
      await keyDownUp('enter');

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const pikaElement = $('.pika-single');
      const datePicker = $('.htDatepickerHolder');
      const datePickerOffset = datePicker.offset();
      const datePickerWidth = datePicker.outerWidth();

      expect(cellOffset.top + 29).toBeCloseTo(datePickerOffset.top, 0); // 29 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(442); // scroll the viewport so the edited cell is partially visible from left

      expect(cellOffset.top + 29).toBeCloseTo(datePickerOffset.top, 0); // 29 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(400); // scroll the viewport so the edited cell is not visible

      expect(pikaElement.is(':visible')).toBe(false);
    });

    it.forTheme('horizon')('should move a datepicker together with the edited cell when the table is ' +
      'scrolled right', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(50, 20),
        width: 252,
        height: 321,
        type: 'date',
      });

      await selectCell(2, 10);
      await keyDownUp('enter');

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const pikaElement = $('.pika-single');
      const datePicker = $('.htDatepickerHolder');
      const datePickerOffset = datePicker.offset();
      const datePickerWidth = datePicker.outerWidth();

      expect(cellOffset.top + 37).toBeCloseTo(datePickerOffset.top, 0);
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(570); // scroll the viewport so the edited cell is partially visible from left

      expect(cellOffset.top + 37).toBeCloseTo(datePickerOffset.top, 0);
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(400); // scroll the viewport so the edited cell is not visible

      expect(pikaElement.is(':visible')).toBe(false);
    });
  });
});

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

    it('should render an editable editor\'s element without messing with "dir" attribute', () => {
      handsontable({
        layoutDirection,
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        editor: 'date',
      });

      selectCell(0, 0);

      const editableElement = getActiveEditor().TEXTAREA;

      expect(editableElement.getAttribute('dir')).toBeNull();
    });

    it('should render Pikaday within element that contains correct "dir" attribute value', () => {
      handsontable({
        layoutDirection,
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
        layoutDirection,
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

      expect(cellOffset.top + 23).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
        main.toBeCloseTo(datePickerOffset.top - 6, 0); // -6 to compensate the difference between the main and classic theme
      });
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
    });

    it.forTheme('classic')('should display Pikaday Calendar left-bottom of the selected cell when ' +
      'table have scrolls', () => {
      const container = $('#testContainer');

      container[0].style.height = '300px';
      container[0].style.width = '200px';
      container[0].style.overflow = 'hidden';

      handsontable({
        layoutDirection,
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

      await sleep(50);

      keyDown('enter');

      await sleep(50);

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const $datePicker = $('.htDatepickerHolder');
      const datePickerOffset = $datePicker.offset();
      const datePickerWidth = $datePicker.outerWidth();

      expect(cellOffset.top + 45).toBeCloseTo(datePickerOffset.top, 0);
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

      selectCell(2, 10);
      keyDownUp('enter');

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

      setScrollLeft(-520); // scroll the viewport so the edited cell is partially visible from right

      await sleep(50);

      expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      setScrollLeft(-550); // scroll the viewport so the edited cell is not visible

      await sleep(50);

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

      selectCell(2, 10);
      keyDownUp('enter');

      await sleep(50);

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const pikaElement = $('.pika-single');
      const datePicker = $('.htDatepickerHolder');
      const datePickerOffset = datePicker.offset();
      const datePickerWidth = datePicker.outerWidth();

      expect(cellOffset.top + 29).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      setScrollLeft(-450); // scroll the viewport so the edited cell is partially visible from right

      await sleep(50);

      expect(cellOffset.top + 29).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      setScrollLeft(-300); // scroll the viewport so the edited cell is not visible

      await sleep(50);

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

      selectCell(2, 10);
      keyDownUp('enter');

      await sleep(50);

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const pikaElement = $('.pika-single');
      const datePicker = $('.htDatepickerHolder');
      const datePickerOffset = datePicker.offset();
      const datePickerWidth = datePicker.outerWidth();

      expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      setScrollLeft(-340); // scroll the viewport so the edited cell is partially visible from left

      await sleep(50);

      expect(cellOffset.top + 23).toBeCloseTo(datePickerOffset.top, 0); // 23 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      setScrollLeft(-310); // scroll the viewport so the edited cell is not visible

      await sleep(50);

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

      selectCell(2, 10);
      keyDownUp('enter');

      await sleep(50);

      const cellOffset = $(getActiveEditor().TD).offset();
      const cellWidth = $(getActiveEditor().TD).outerWidth();
      const pikaElement = $('.pika-single');
      const datePicker = $('.htDatepickerHolder');
      const datePickerOffset = datePicker.offset();
      const datePickerWidth = datePicker.outerWidth();

      expect(cellOffset.top + 29).toBeCloseTo(datePickerOffset.top, 0); // 29 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      setScrollLeft(-440); // scroll the viewport so the edited cell is partially visible from left

      await sleep(50);

      expect(cellOffset.top + 29).toBeCloseTo(datePickerOffset.top, 0); // 29 is a height of the editor's cell
      expect(cellOffset.left).toBeCloseTo(datePickerOffset.left + datePickerWidth - cellWidth, 0);
      expect(pikaElement.is(':visible')).toBe(true);

      setScrollLeft(-400); // scroll the viewport so the edited cell is not visible

      await sleep(50);

      expect(pikaElement.is(':visible')).toBe(false);
    });
  });
});

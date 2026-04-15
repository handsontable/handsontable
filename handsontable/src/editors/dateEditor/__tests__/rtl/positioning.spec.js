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
      await keyDownUp('enter');

      const editorElement = $(getActiveEditor().TD);
      const pikaElement = $('.pika-single');

      expect(pikaElement.offset()).toEqual({
        top: editorElement.offset().top + editorElement.outerHeight(),
        left: editorElement.offset().left + editorElement.outerWidth() - pikaElement.outerWidth(),
      });
      expect(pikaElement.is(':visible')).toBe(true);
    });

    it('should display Pikaday Calendar left-bottom of the selected cell when table have scrolls', async() => {
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
      await waitForNextAnimationFrames(2);
      await keyDownUp('enter');

      const cellElement = $(getActiveEditor().TD);
      const datePickerElement = $('.pika-single');

      expect(datePickerElement.offset().top).toBe(cellElement.offset().top + cellElement.outerHeight());

      if (htmlDir === 'ltr') {
        expect(datePickerElement.offset().left).toBe(cellElement.offset().left);
      } else {
        expect(datePickerElement.offset().left)
          .toBe(cellElement.offset().left - datePickerElement.outerWidth() + cellElement.outerWidth());
      }
    });

    it('should move a datepicker together with the edited cell when the table is scrolled left', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(50, 20),
        width: 230,
        height: 230,
        type: 'date',
        colWidths: 80,
      });

      await selectCell(2, 10);
      await keyDownUp('enter');

      const editorElement = $(getActiveEditor().TD);
      const pikaElement = $('.pika-single');

      expect(pikaElement.offset()).toEqual({
        top: editorElement.offset().top + editorElement.outerHeight(),
        left: editorElement.offset().left + editorElement.outerWidth() - pikaElement.outerWidth(),
      });
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(620); // scroll the viewport so the edited cell is partially visible from right

      expect(pikaElement.offset()).toEqual({
        top: editorElement.offset().top + editorElement.outerHeight(),
        left: editorElement.offset().left + editorElement.outerWidth() - pikaElement.outerWidth(),
      });
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(580); // scroll the viewport so the edited cell is not visible

      expect(pikaElement.is(':visible')).toBe(false);
    });

    it('should move a datepicker together with the edited cell when the table is scrolled right', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(50, 20),
        width: 230,
        height: 230,
        type: 'date',
        colWidths: 80,
      });

      await selectCell(2, 10);
      await keyDownUp('enter');

      const editorElement = $(getActiveEditor().TD);
      const pikaElement = $('.pika-single');

      expect(pikaElement.offset()).toEqual({
        top: editorElement.offset().top + editorElement.outerHeight(),
        left: editorElement.offset().left + editorElement.outerWidth() - pikaElement.outerWidth(),
      });
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(820); // scroll the viewport so the edited cell is partially visible from left

      expect(pikaElement.offset()).toEqual({
        top: editorElement.offset().top + editorElement.outerHeight(),
        left: document.documentElement.clientWidth - pikaElement.outerWidth(),
      });
      expect(pikaElement.is(':visible')).toBe(true);

      await scrollViewportHorizontally(890); // scroll the viewport so the edited cell is not visible

      expect(pikaElement.is(':visible')).toBe(false);
    });
  });
});

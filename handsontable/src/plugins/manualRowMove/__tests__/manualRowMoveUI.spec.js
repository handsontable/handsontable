describe('manualRowMove', () => {
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

  describe('UI', () => {
    it('should append UI elements to wtHider after click on row header', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true
      });

      const $headerTH = spec().$container.find('tbody tr:eq(0) th:eq(0)');

      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect(spec().$container.find('.ht__manualRowMove--guideline').length).toBe(1);
      expect(spec().$container.find('.ht__manualRowMove--backlight').length).toBe(1);
    });

    it('should part of UI elements be visible on dragging action', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true
      });

      const $headerTH = spec().$container.find('tbody tr:eq(0) th:eq(0)');

      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect(spec().$container.find('.ht__manualRowMove--guideline:visible').length).toBe(0);
      expect(spec().$container.find('.ht__manualRowMove--backlight:visible').length).toBe(1);
    });

    it('should all of UI elements be visible on dragging action', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true
      });

      const $headers = [
        spec().$container.find('tbody tr:eq(0) th:eq(0)'),
        spec().$container.find('tbody tr:eq(1) th:eq(0)'),
        spec().$container.find('tbody tr:eq(2) th:eq(0)'),
      ];

      $headers[0].simulate('mousedown');
      $headers[0].simulate('mouseup');
      $headers[0].simulate('mousedown');
      $headers[1].simulate('mouseover');
      $headers[2].simulate('mouseover');

      expect(spec().$container.find('.ht__manualRowMove--guideline:visible').length).toBe(1);
      expect(spec().$container.find('.ht__manualRowMove--backlight:visible').length).toBe(1);
    });

    it('should set proper z-index of the backlight and guideline element and be greater than left overlay z-index', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualRowMove: true,
        rowHeaders: true,
      });

      const $headerTH = spec().$container.find('tbody tr:eq(0) th:eq(0)');

      $headerTH.simulate('mousedown');
      $headerTH.simulate('mouseup');
      $headerTH.simulate('mousedown');

      expect($('.ht__manualRowMove--backlight').css('z-index')).toBeGreaterThan(getInlineStartClone().css('z-index'));
      expect($('.ht__manualRowMove--guideline').css('z-index')).toBeGreaterThan(getInlineStartClone().css('z-index'));
    });

    describe('backlight', () => {
      it('should set proper left position of element when colWidths is undefined', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true
        });

        const $headerTH = spec().$container.find('tbody tr:eq(0) th:eq(0)');

        $headerTH.simulate('mousedown');
        $headerTH.simulate('mouseup');
        $headerTH.simulate('mousedown');

        expect(spec().$container.find('.ht__manualRowMove--backlight')[0].offsetLeft).toBe(50);
      });

      it('should set proper left position of element when colWidths is defined', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
          colWidths: 100,
        });

        const $headerTH = spec().$container.find('tbody tr:eq(0) th:eq(0)');

        $headerTH.simulate('mousedown');
        $headerTH.simulate('mouseup');
        $headerTH.simulate('mousedown');

        expect(spec().$container.find('.ht__manualRowMove--backlight')[0].offsetLeft).toBe(50);
      });

      it('should set proper top position of element when wrapper is scrolled', async() => {
        spec().$container.remove();
        spec().$wrapper = $(`
          <div class="wrapper">
            <div class="extra-div">
              <div class="extra-content">SOME TEXT</div>
            </div>
          </div>
        `);

        spec().$container = $(`<div id="${id}"></div>`);
        spec().$styleDomElement = $('<style type="text/css"></style>');

        const css = `
          .wrapper {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
          }

          .extra-div {
            height: 100%;
            overflow: auto;
          }

          .extra-content {
            height: 500px;
          }
       `;

        $(document.createTextNode(css)).appendTo(spec().$styleDomElement);
        $(spec().$styleDomElement).appendTo('body');
        $(spec().$wrapper).appendTo('body');
        $(spec().$container).appendTo($(spec().$wrapper.find('.extra-div')));

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        $('.extra-div').scrollTop(200);

        await sleep(100);

        const $headerTH = spec().$container.find('tbody tr:eq(0) th:eq(0)');
        const $destination = spec().$container.find('tbody tr:eq(9) th:eq(0)');

        $headerTH.simulate('mousedown');
        $headerTH.simulate('mouseup');
        $headerTH.simulate('mousedown'); // Triggers backlight

        $destination.simulate('mouseover');
        $destination.simulate('mousemove', {
          clientY: $destination.offset().top + 100
        });

        const $backlight = spec().$container.find('.ht__manualRowMove--backlight');
        const $guideline = spec().$container.find('.ht__manualRowMove--guideline');

        expect($backlight.offset().top).toBe($destination.offset().top);
        // Guideline is 2 pixels high, table cell is 22 pixels high + has extra 1px of border.
        expect($guideline.offset().top).toBe($destination.offset().top + 21);
        expect($backlight.height()).toBe(23);

        $headerTH.simulate('mouseup');

        expect(getData()).toEqual([
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
          ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6'],
          ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7'],
          ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
          ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9'],
          ['A10', 'B10', 'C10', 'D10', 'E10', 'F10', 'G10', 'H10', 'I10', 'J10'],
          ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
        ]);

        spec().$styleDomElement[0].remove();
        spec().$wrapper[0].remove();
      });
    });

    describe('guideline', () => {
      it('should set proper top position of element when target is first row and column headers are disabled', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          colHeaders: false,
          manualRowMove: true,
        });

        const $headers = [
          spec().$container.find('tbody tr:eq(0) th:eq(0)'),
          spec().$container.find('tbody tr:eq(1) th:eq(0)'),
        ];

        $headers[1].simulate('mousedown');
        $headers[1].simulate('mouseup');
        $headers[1].simulate('mousedown');
        $headers[0].simulate('mouseover');
        $headers[0].simulate('mousemove');

        expect(spec().$container.find('.ht__manualRowMove--guideline')[0].offsetTop).toBe(-1);
      });
    });

    describe('selection', () => {
      it('should be shown properly when moving multiple rows from the top to the bottom', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true
        });

        const $rowHeader = spec().$container.find('tbody tr:eq(4) th:eq(0)');

        selectRows(0, 2);

        spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousedown');
        spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseup');
        spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousedown');

        $rowHeader.simulate('mouseover');
        $rowHeader.simulate('mousemove', {
          clientY: $rowHeader.offset().bottom - $rowHeader.height()
        });
        $rowHeader.simulate('mouseup');

        expect(getSelected()).toEqual([[1, -1, 3, 9]]);
      });

      it('should be shown properly when moving multiple rows from the bottom to the top', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true
        });

        const $rowHeader = spec().$container.find('tbody tr:eq(1) th:eq(0)');

        selectRows(3, 5);

        spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mousedown');
        spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mouseup');
        spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mousedown');

        $rowHeader.simulate('mouseover');
        $rowHeader.simulate('mousemove', {
          offsetX: 5,
          offsetY: 5,
        });
        $rowHeader.simulate('mouseup');

        expect(getSelected()).toEqual([[1, -1, 3, 9]]);
      });

      describe('should be shown properly after undo action', () => {
        it('when moving multiple rows from the top to the bottom', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            manualRowMove: true
          });

          const $rowHeader = spec().$container.find('tbody tr:eq(4) th:eq(0)');

          selectRows(0, 2);

          spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousedown');
          spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseup');
          spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousedown');

          $rowHeader.simulate('mouseover');
          $rowHeader.simulate('mousemove', {
            clientY: $rowHeader.offset().bottom - $rowHeader.height()
          });
          $rowHeader.simulate('mouseup');

          hot.undo();

          expect(getSelected()).toEqual([[0, -1, 2, 9]]);
        });

        it('when moving multiple rows from the bottom to the top', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            manualRowMove: true
          });

          const $rowHeader = spec().$container.find('tbody tr:eq(1) th:eq(0)');

          selectRows(3, 5);

          spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mousedown');
          spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mouseup');
          spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mousedown');

          $rowHeader.simulate('mouseover');
          $rowHeader.simulate('mousemove', {
            offsetX: 5,
            offsetY: 5,
          });
          $rowHeader.simulate('mouseup');

          hot.undo();

          expect(getSelected()).toEqual([[3, -1, 5, 9]]);
        });
      });

      describe('should be shown properly after redo action', () => {
        it('when moving multiple rows from the top to the bottom', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            manualRowMove: true
          });

          const $rowHeader = spec().$container.find('tbody tr:eq(4) th:eq(0)');

          selectRows(0, 2);

          spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousedown');
          spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseup');
          spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousedown');

          $rowHeader.simulate('mouseover');
          $rowHeader.simulate('mousemove', {
            clientY: $rowHeader.offset().bottom - $rowHeader.height()
          });
          $rowHeader.simulate('mouseup');

          hot.undo();
          hot.redo();

          expect(getSelected()).toEqual([[1, -1, 3, 9]]);
        });

        it('when moving multiple rows from the bottom to the top', () => {
          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            manualRowMove: true
          });

          const $rowHeader = spec().$container.find('tbody tr:eq(1) th:eq(0)');

          selectRows(3, 5);

          spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mousedown');
          spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mouseup');
          spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mousedown');

          $rowHeader.simulate('mouseover');
          $rowHeader.simulate('mousemove', {
            offsetX: 5,
            offsetY: 5,
          });
          $rowHeader.simulate('mouseup');

          hot.undo();
          hot.redo();

          expect(getSelected()).toEqual([[1, -1, 3, 9]]);
        });
      });
    });
  });
});

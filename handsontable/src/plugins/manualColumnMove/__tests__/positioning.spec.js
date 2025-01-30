describe('manualColumnMove', () => {
  using('configuration object', [
    { htmlDir: 'ltr', layoutDirection: 'inherit' },
    { htmlDir: 'rtl', layoutDirection: 'ltr' },
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

    describe('positioning', () => {
      it('should draw backlight element properly using Handsontable default settings', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 10),
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        const TH = $(getCell(-1, 3));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(TH.offset().left);
      });

      it('should draw backlight element properly when target element points to header\'s child element', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 10),
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        const TH = $(getCell(-1, 3));

        TH.find('.colHeader')
          .simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown', {
            clientX: TH.offset().left + (TH.outerWidth() / 2)
          })
          .simulate('mousemove', {
            clientX: TH.offset().left + (TH.outerWidth() / 2)
          });

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(TH.offset().left);
      });

      it('should move backlight and guideline element with the movement of the mouse (move left)', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 10),
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        const TH = $(getCell(-1, 3));
        const THNext = $(getCell(-1, 1));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown', {
            clientX: TH.offset().left,
          });
        THNext.simulate('mouseover')
          .simulate('mousemove', {
            clientX: THNext.offset().left
          });

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');
        const guideline = spec().$container.find('.ht__manualColumnMove--guideline');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(THNext.offset().left);
        expect(guideline.outerWidth()).forThemes(({ classic, main }) => {
          classic.toBe(2);
          main.toBe(1);
        });
        expect(guideline.offset().left).forThemes(({ classic, main }) => {
          classic.toBe(THNext.offset().left - 1);
          main.toBe(THNext.offset().left - 0.5);
        });
      });

      it('should move backlight and guideline element with the movement of the mouse (move right)', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 10),
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        const TH = $(getCell(-1, 1));
        const THNext = $(getCell(-1, 3));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown', {
            clientX: TH.offset().left,
          });
        THNext.simulate('mouseover')
          .simulate('mousemove', {
            clientX: THNext.offset().left
          });

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');
        const guideline = spec().$container.find('.ht__manualColumnMove--guideline');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(THNext.offset().left);
        expect(guideline.outerWidth()).forThemes(({ classic, main }) => {
          classic.toBe(2);
          main.toBe(1);
        });
        expect(guideline.offset().left).forThemes(({ classic, main }) => {
          classic.toBe(THNext.offset().left - 1);
          main.toBe(THNext.offset().left - 0.5);
        });
      });

      it('should move guideline element to the last header when the mouse exceeds half of the width of that header', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 10),
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        const TH = $(getCell(-1, 1));
        const THNext = $(getCell(-1, 3));
        const THLast = $(getCell(-1, 4));
        const dropOffset = 10;

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown', {
            clientX: TH.offset().left,
          });
        THNext.simulate('mouseover')
          .simulate('mousemove', {
            clientX: THNext.offset().left + THNext.outerWidth() - dropOffset,
          });

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');
        const guideline = spec().$container.find('.ht__manualColumnMove--guideline');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(THLast.offset().left - dropOffset);
        expect(guideline.outerWidth()).forThemes(({ classic, main }) => {
          classic.toBe(2);
          main.toBe(1);
        });
        expect(guideline.offset().left).forThemes(({ classic, main }) => {
          classic.toBe(THLast.offset().left - 1);
          main.toBe(THLast.offset().left - 0.5);
        });
      });

      it('should draw backlight element properly when the table is scrolled (overflow: hidden)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 30),
          width: 300,
          height: 300,
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        scrollViewportTo({
          row: 0,
          col: 20,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        await sleep(100);

        const TH = $(getCell(-1, 22));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(TH.offset().left);
      });

      it('should move backlight and guideline element with the movement of the mouse when the table is scrolled ' +
        '(overflow: hidden, move left)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 50),
          width: 300,
          height: 200,
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        scrollViewportTo({
          row: 0,
          col: 20,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        await sleep(100);

        const TH = $(getCell(-1, 22));
        const THNext = $(getCell(-1, 20));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown', {
            clientX: TH.offset().left,
          });
        THNext.simulate('mouseover')
          .simulate('mousemove', {
            clientX: THNext.offset().left
          });

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');
        const guideline = spec().$container.find('.ht__manualColumnMove--guideline');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(THNext.offset().left);
        expect(guideline.outerWidth()).forThemes(({ classic, main }) => {
          classic.toBe(2);
          main.toBe(1);
        });
        expect(guideline.offset().left).forThemes(({ classic, main }) => {
          classic.toBe(THNext.offset().left - 1);
          main.toBe(THNext.offset().left - 0.5);
        });
      });

      it('should move backlight and guideline element with the movement of the mouse when the table is scrolled ' +
        '(overflow: hidden, move right)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 50),
          width: 300,
          height: 200,
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        scrollViewportTo({
          row: 0,
          col: 20,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        await sleep(100);

        const TH = $(getCell(-1, 20));
        const THNext = $(getCell(-1, 22));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown', {
            clientX: TH.offset().left,
          });
        THNext.simulate('mouseover')
          .simulate('mousemove', {
            clientX: THNext.offset().left
          });

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');
        const guideline = spec().$container.find('.ht__manualColumnMove--guideline');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(THNext.offset().left);
        expect(guideline.outerWidth()).forThemes(({ classic, main }) => {
          classic.toBe(2);
          main.toBe(1);
        });
        expect(guideline.offset().left).forThemes(({ classic, main }) => {
          classic.toBe(THNext.offset().left - 1);
          main.toBe(THNext.offset().left - 0.5);
        });
      });

      it('should draw backlight element properly when the table is scrolled (window as scrollable element)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 100),
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        scrollViewportTo({
          row: 0,
          col: 20,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        await sleep(100);

        const TH = $(getCell(-1, 22));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(TH.offset().left);
      });

      it('should move backlight and guideline element with the movement of the mouse when the table is scrolled ' +
        '(window as scrollable element, move left)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 100),
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        scrollViewportTo({
          row: 0,
          col: 20,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        await sleep(100);

        const TH = $(getCell(-1, 26));
        const THNext = $(getCell(-1, 24));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown', {
            clientX: TH.offset().left - window.scrollX,
          });
        THNext.simulate('mouseover')
          .simulate('mousemove', {
            clientX: THNext.offset().left - window.scrollX,
          });

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');
        const guideline = spec().$container.find('.ht__manualColumnMove--guideline');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(THNext.offset().left);
        expect(guideline.outerWidth()).forThemes(({ classic, main }) => {
          classic.toBe(2);
          main.toBe(1);
        });
        expect(guideline.offset().left).forThemes(({ classic, main }) => {
          classic.toBe(THNext.offset().left - 1);
          main.toBe(THNext.offset().left - 0.5);
        });
      });

      it('should move backlight and guideline element with the movement of the mouse when the table is scrolled ' +
        '(window as scrollable element, move right)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 100),
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
        });

        scrollViewportTo({
          row: 0,
          col: 20,
          verticalSnap: 'top',
          horizontalSnap: 'start',
        });

        await sleep(100);

        const TH = $(getCell(-1, 24));
        const THNext = $(getCell(-1, 26));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown', {
            clientX: TH.offset().left - window.scrollX,
          });
        THNext.simulate('mouseover')
          .simulate('mousemove', {
            clientX: THNext.offset().left - window.scrollX,
          });

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');
        const guideline = spec().$container.find('.ht__manualColumnMove--guideline');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(THNext.offset().left);
        expect(guideline.outerWidth()).forThemes(({ classic, main }) => {
          classic.toBe(2);
          main.toBe(1);
        });
        expect(guideline.offset().left).forThemes(({ classic, main }) => {
          classic.toBe(THNext.offset().left - 1);
          main.toBe(THNext.offset().left - 0.5);
        });
      });

      it('should draw backlight element properly when colWidths is defined', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 10),
          manualColumnMove: true,
          rowHeaders: true,
          colWidths: 100,
          colHeaders: true,
        });

        const TH = $(getCell(-1, 3));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(TH.offset().left);
      });

      it('should draw backlight element properly when stretchH is enabled', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 5),
          width: 600,
          colHeaders: true,
          stretchH: 'all',
          manualColumnMove: true
        });

        const TH = $(getCell(-1, 1));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(TH.offset().left);
      });

      it('should draw backlight element properly when stretchH is enabled and column order is changed', () => {
        handsontable({
          layoutDirection,
          data: [
            {
              id: 1,
              flag: 'EUR',
              currencyCode: 'EUR',
              currency: 'Euro',
              level: 0.9033,
              units: 'EUR / USD',
              asOf: '08/19/2015',
              onedChng: 0.0026
            },
          ],
          width: 600,
          colHeaders: true,
          stretchH: 'all',
          manualColumnMove: [2, 4, 6, 3, 1, 0],
          columns: [
            { data: 'id', type: 'numeric', width: 40 },
            { data: 'currencyCode', type: 'text' },
            { data: 'currency', type: 'text' },
            { data: 'level', type: 'numeric', numericFormat: { pattern: '0.0000' } },
            { data: 'units', type: 'text' },
            { data: 'asOf', type: 'date', dateFormat: 'MM/DD/YYYY' },
            { data: 'onedChng', type: 'numeric', numericFormat: { pattern: '0.00%' } }
          ]
        });

        const TH = $(getCell(-1, 6));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');

        expect(backlight.outerWidth()).toBe(TH.outerWidth());
        expect(backlight.offset().left).toBe(TH.offset().left);
      });

      it('should draw backlight element properly when there are hidden columns', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(5, 5),
          manualColumnMove: true,
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [2, 3],
          }
        });

        selectColumns(1, 4);

        const TH = $(getCell(-1, 1));

        TH.simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        const backlight = spec().$container.find('.ht__manualColumnMove--backlight');

        expect(backlight.outerWidth()).toBe(100);
        expect(backlight.offset().left).toBe(TH.offset().left);
      });
    });
  });
});

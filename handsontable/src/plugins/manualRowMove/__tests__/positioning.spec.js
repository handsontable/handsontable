describe('manualRowMove', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('positioning', () => {
    it('should draw backlight element properly using Handsontable default settings', () => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      const TH = $(getCell(3, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown');

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(TH.offset().top);
    });

    it('should draw backlight element properly when target element points to header\'s child element', () => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      const TH = $(getCell(3, -1));

      TH.find('.rowHeader')
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: TH.offset().top + (TH.outerHeight() / 2)
        })
        .simulate('mousemove', {
          clientY: TH.offset().top + (TH.outerHeight() / 2)
        });

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(TH.offset().top);
    });

    it('should move backlight and guideline element with the movement of the mouse (move top)', () => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      const TH = $(getCell(3, -1));
      const THNext = $(getCell(1, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: TH.offset().top,
        });
      THNext.simulate('mouseover')
        .simulate('mousemove', {
          clientY: THNext.offset().top
        });

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');
      const guideline = spec().$container.find('.ht__manualRowMove--guideline');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(THNext.offset().top);
      expect(guideline.outerHeight()).forThemes(({ classic, main }) => {
        classic.toBe(2);
        main.toBe(1);
      });
      expect(guideline.offset().top).forThemes(({ classic, main }) => {
        classic.toBe(THNext.offset().top - 2);
        main.toBe(THNext.offset().top - 1.5);
      });
    });

    it('should move backlight and guideline element with the movement of the mouse (move bottom)', () => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      const TH = $(getCell(1, -1));
      const THNext = $(getCell(3, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: TH.offset().top,
        });
      THNext.simulate('mouseover')
        .simulate('mousemove', {
          clientY: THNext.offset().top
        });

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');
      const guideline = spec().$container.find('.ht__manualRowMove--guideline');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(THNext.offset().top);
      expect(guideline.outerHeight()).forThemes(({ classic, main }) => {
        classic.toBe(2);
        main.toBe(1);
      });
      expect(guideline.offset().top).forThemes(({ classic, main }) => {
        classic.toBe(THNext.offset().top - 2);
        main.toBe(THNext.offset().top - 1.5);
      });
    });

    it('should move guideline element to the last header when the mouse exceeds half of the height of that header', () => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      const TH = $(getCell(1, -1));
      const THNext = $(getCell(3, -1));
      const THLast = $(getCell(4, -1));
      const dropOffset = 10;

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: TH.offset().top,
        });
      THNext.simulate('mouseover')
        .simulate('mousemove', {
          clientY: THNext.offset().top + THNext.outerHeight() - dropOffset,
        });

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');
      const guideline = spec().$container.find('.ht__manualRowMove--guideline');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(THLast.offset().top - dropOffset);
      expect(guideline.outerHeight()).forThemes(({ classic, main }) => {
        classic.toBe(2);
        main.toBe(1);
      });
      expect(guideline.offset().top).forThemes(({ classic, main }) => {
        classic.toBe(THLast.offset().top - 2);
        main.toBe(THLast.offset().top - 1.5);
      });
    });

    it('should draw backlight element properly when the table is scrolled (overflow: hidden)', async() => {
      handsontable({
        data: createSpreadsheetData(30, 5),
        width: 300,
        height: 300,
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      scrollViewportTo({
        row: 20,
        col: 0,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(100);

      const TH = $(getCell(22, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown');

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(TH.offset().top);
    });

    it('should move backlight and guideline element with the movement of the mouse when the table is scrolled ' +
      '(overflow: hidden, move top)', async() => {
      handsontable({
        data: createSpreadsheetData(50, 5),
        width: 200,
        height: 300,
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      scrollViewportTo({
        row: 20,
        col: 0,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(100);

      const TH = $(getCell(22, -1));
      const THNext = $(getCell(20, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: TH.offset().top,
        });
      THNext.simulate('mouseover')
        .simulate('mousemove', {
          clientY: THNext.offset().top
        });

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');
      const guideline = spec().$container.find('.ht__manualRowMove--guideline');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(THNext.offset().top);
      expect(guideline.outerHeight()).forThemes(({ classic, main }) => {
        classic.toBe(2);
        main.toBe(1);
      });
      expect(guideline.offset().top).forThemes(({ classic, main }) => {
        classic.toBe(THNext.offset().top - 2);
        main.toBe(THNext.offset().top - 1.5);
      });
    });

    it('should move backlight and guideline element with the movement of the mouse when the table is scrolled ' +
      '(overflow: hidden, move bottom)', async() => {
      handsontable({
        data: createSpreadsheetData(50, 5),
        width: 200,
        height: 300,
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      scrollViewportTo({
        row: 20,
        col: 0,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(100);

      const TH = $(getCell(20, -1));
      const THNext = $(getCell(22, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: TH.offset().top,
        });
      THNext.simulate('mouseover')
        .simulate('mousemove', {
          clientY: THNext.offset().top
        });

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');
      const guideline = spec().$container.find('.ht__manualRowMove--guideline');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(THNext.offset().top);
      expect(guideline.outerHeight()).forThemes(({ classic, main }) => {
        classic.toBe(2);
        main.toBe(1);
      });
      expect(guideline.offset().top).forThemes(({ classic, main }) => {
        classic.toBe(THNext.offset().top - 2);
        main.toBe(THNext.offset().top - 1.5);
      });
    });

    it('should draw backlight element properly when the table is scrolled (window as scrollable element)', async() => {
      handsontable({
        data: createSpreadsheetData(100, 5),
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      scrollViewportTo({
        row: 20,
        col: 0,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(100);

      const TH = $(getCell(22, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown');

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(TH.offset().top);
    });

    it('should move backlight and guideline element with the movement of the mouse when the table is scrolled ' +
      '(window as scrollable element, move top)', async() => {
      handsontable({
        data: createSpreadsheetData(100, 5),
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      scrollViewportTo({
        row: 20,
        col: 0,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(100);

      const TH = $(getCell(26, -1));
      const THNext = $(getCell(24, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: TH.offset().top - window.scrollY,
        });
      THNext.simulate('mouseover')
        .simulate('mousemove', {
          clientY: THNext.offset().top - window.scrollY,
        });

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');
      const guideline = spec().$container.find('.ht__manualRowMove--guideline');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(THNext.offset().top);
      expect(guideline.outerHeight()).forThemes(({ classic, main }) => {
        classic.toBe(2);
        main.toBe(1);
      });
      expect(guideline.offset().top).forThemes(({ classic, main }) => {
        classic.toBe(THNext.offset().top - 2);
        main.toBe(THNext.offset().top - 1.5);
      });
    });

    it('should move backlight and guideline element with the movement of the mouse when the table is scrolled ' +
      '(window as scrollable element, move bottom)', async() => {
      handsontable({
        data: createSpreadsheetData(100, 5),
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
      });

      scrollViewportTo({
        row: 20,
        col: 0,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(100);

      const TH = $(getCell(24, -1));
      const THNext = $(getCell(26, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown', {
          clientY: TH.offset().top - window.scrollY,
        });
      THNext.simulate('mouseover')
        .simulate('mousemove', {
          clientY: THNext.offset().top - window.scrollY,
        });

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');
      const guideline = spec().$container.find('.ht__manualRowMove--guideline');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(THNext.offset().top);
      expect(guideline.outerHeight()).forThemes(({ classic, main }) => {
        classic.toBe(2);
        main.toBe(1);
      });
      expect(guideline.offset().top).forThemes(({ classic, main }) => {
        classic.toBe(THNext.offset().top - 2);
        main.toBe(THNext.offset().top - 1.5);
      });
    });

    it('should draw backlight element properly when rowHeights is defined', () => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        manualRowMove: true,
        rowHeaders: true,
        rowHeights: 100,
        colHeaders: true,
      });

      const TH = $(getCell(3, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown');

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');

      expect(backlight.outerHeight()).toBe(TH.outerHeight());
      expect(backlight.offset().top).toBe(TH.offset().top);
    });

    it('should draw backlight element properly when there are hidden rows', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        manualRowMove: true,
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [2, 3],
        }
      });

      selectRows(1, 4);

      const TH = $(getCell(1, -1));

      TH.simulate('mousedown')
        .simulate('mouseup')
        .simulate('mousedown');

      const backlight = spec().$container.find('.ht__manualRowMove--backlight');

      expect(backlight.outerHeight()).forThemes(({ classic, main }) => {
        classic.toBe(46);
        main.toBe(58);
      });
      expect(backlight.offset().top).toBe(TH.offset().top);
    });
  });
});

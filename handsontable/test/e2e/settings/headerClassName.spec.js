describe('settings', () => {
  describe('headerClassName', () => {
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

    it('allow adding a provided class name to the header\'s inner `div` element when passed as a global setting',
      () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 3),
          headerClassName: 'test1',
          colHeaders: true,
          rowHeaders: true,
        });

        expect(getCell(-1, 0).querySelector('div')).toHaveClass('test1');
        expect(getCell(-1, 1).querySelector('div')).toHaveClass('test1');
        expect(getCell(-1, 2).querySelector('div')).toHaveClass('test1');
      });

    it('allow adding multiple classes to the headers\' inner `div` elements when passed as a global setting', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        headerClassName: 'test1 test2',
        colHeaders: true,
        rowHeaders: true,
      });

      expect(getCell(-1, 0).querySelector('div')).toHaveClass('test1');
      expect(getCell(-1, 0).querySelector('div')).toHaveClass('test2');
      expect(getCell(-1, 1).querySelector('div')).toHaveClass('test1');
      expect(getCell(-1, 1).querySelector('div')).toHaveClass('test2');
      expect(getCell(-1, 2).querySelector('div')).toHaveClass('test1');
      expect(getCell(-1, 2).querySelector('div')).toHaveClass('test2');
    });

    it('allow adding a provided class name to the header\'s inner `div` element when passed as a column setting',
      () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 3),
          columns: [
            {
              headerClassName: 'test1',
            },
            {
              headerClassName: 'test2',
            },
            {
              headerClassName: 'test3',
            },
          ],
          colHeaders: true,
          rowHeaders: true,
        });

        expect(getCell(-1, 0).querySelector('div')).toHaveClass('test1');
        expect(getCell(-1, 1).querySelector('div')).toHaveClass('test2');
        expect(getCell(-1, 2).querySelector('div')).toHaveClass('test3');
      });

    it('allow adding multiple classes to the headers\' inner `div` elements when passed as a column setting', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        columns: [
          {
            headerClassName: 'test1a test1b',
          },
          {
            headerClassName: 'test2a test2b',
          },
          {
            headerClassName: 'test3a test3b',
          },
        ],
        colHeaders: true,
        rowHeaders: true,
      });

      expect(getCell(-1, 0).querySelector('div')).toHaveClass('test1a');
      expect(getCell(-1, 0).querySelector('div')).toHaveClass('test1b');
      expect(getCell(-1, 1).querySelector('div')).toHaveClass('test2a');
      expect(getCell(-1, 1).querySelector('div')).toHaveClass('test2b');
      expect(getCell(-1, 2).querySelector('div')).toHaveClass('test3a');
      expect(getCell(-1, 2).querySelector('div')).toHaveClass('test3b');
    });

    it('should allow adding both global and column settings of `headerClassName` and make them work in a cascade' +
      ' manner', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        headerClassName: 'global-test',
        columns: [
          {
            headerClassName: 'test1',
          },
          {},
          {
            headerClassName: 'test3',
          },
        ],
        colHeaders: true,
        rowHeaders: true,
      });

      expect(getCell(-1, 0).querySelector('div')).toHaveClass('test1');
      expect(getCell(-1, 1).querySelector('div')).toHaveClass('global-test');
      expect(getCell(-1, 2).querySelector('div')).toHaveClass('test3');
    });

    describe('predefined classes', () => {
      it('should align the content of the column header\'s inner `div` element to the left, when `htLeft` is passed' +
        'as `headerClassName', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 3),
          headerClassName: 'htLeft',
          colHeaders: true,
          rowHeaders: true,
        });

        expect(getCell(-1, 0).querySelector('div')).toHaveClass('htLeft');
        expect(getComputedStyle(getCell(-1, 0).querySelector('div')).textAlign).toBe('left');
      });

      it('should align the content of the column header\'s inner `div` element to the right, when `htRight` is passed' +
        'as `headerClassName', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 3),
          headerClassName: 'htRight',
          colHeaders: true,
          rowHeaders: true,
        });

        expect(getCell(-1, 0).querySelector('div')).toHaveClass('htRight');
        expect(getComputedStyle(getCell(-1, 0).querySelector('div')).textAlign).toBe('right');
      });

      it('should align the content of the column header\'s inner `div` element to the center, when `htCenter` is' +
        ' passed as `headerClassName', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 3),
          headerClassName: 'htCenter',
          colHeaders: true,
          rowHeaders: true,
        });

        expect(getCell(-1, 0).querySelector('div')).toHaveClass('htCenter');
        expect(getComputedStyle(getCell(-1, 0).querySelector('div')).textAlign).toBe('center');
      });

      it('should align the header\'s `div` elements according to the class being added, regardless of the data type' +
        ' declared in the settings', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 4),
          colHeaders: true,
          rowHeaders: true,
          columns: [
            { type: 'text', headerClassName: 'htRight' },
            { type: 'numeric', headerClassName: 'htLeft' },
            { type: 'date', headerClassName: 'htCenter' },
            { type: 'checkbox', headerClassName: 'htCenter' }
          ]
        });

        expect(getCell(-1, 0).querySelector('div')).toHaveClass('htRight');
        expect(getComputedStyle(getCell(-1, 0).querySelector('div')).textAlign).toBe('right');
        expect(getCell(-1, 1).querySelector('div')).toHaveClass('htLeft');
        expect(getComputedStyle(getCell(-1, 1).querySelector('div')).textAlign).toBe('left');
        expect(getCell(-1, 2).querySelector('div')).toHaveClass('htCenter');
        expect(getComputedStyle(getCell(-1, 2).querySelector('div')).textAlign).toBe('center');
        expect(getCell(-1, 3).querySelector('div')).toHaveClass('htCenter');
        expect(getComputedStyle(getCell(-1, 3).querySelector('div')).textAlign).toBe('center');
      });
    });
  });
});

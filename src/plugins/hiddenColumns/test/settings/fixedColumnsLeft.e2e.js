describe('HiddenColumns', () => {
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

  function extractDOMStructure(overlay) {
    const overlayBody = overlay.find('tbody')[0].cloneNode(true);

    Array.from(overlayBody.querySelectorAll('th')).forEach((TH) => {
      // Simplify header content
      TH.innerText = TH.querySelector('.rowHeader').innerText;
      TH.removeAttribute('style');
    });

    return `${overlayBody.outerHTML}`;
  }

  describe('should cooperate with the `fixedColumnsLeft` option properly', () => {
    it('when there are hidden columns in the middle of fixed columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          columns: [2, 3],
          indicators: true
        },
        fixedColumnsLeft: 6
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(6 - 2);
      expect(getLeftClone().width()).toBe((4 * 50) + (2 * 15)); // 4 fixed, visible columns, with space for indicators.
      expect($(getCell(-1, 0).querySelector('span')).text()).toBe('A');
      expect($(getCell(-1, 1).querySelector('span')).text()).toBe('B');
      expect(getCell(-1, 2)).toBe(null);
      expect(getCell(-1, 3)).toBe(null);
      expect($(getCell(-1, 4).querySelector('span')).text()).toBe('E');
      expect($(getCell(-1, 5).querySelector('span')).text()).toBe('F');
    });

    it('when there is hidden column by the fixed column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true
        },
        fixedColumnsLeft: 1
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(1);
      expect(getLeftClone().width()).toBe(50 + 15); // 1 fixed, visible column, with space for indicator.
      expect($(getCell(-1, 0).querySelector('span')).text()).toBe('A');
      expect(getCell(-1, 1)).toBe(null);
      expect($(getCell(-1, 2).querySelector('span')).text()).toBe('C');
    });

    it('when there are hidden columns at the start of fixed columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2],
          indicators: true
        },
        fixedColumnsLeft: 6
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(6 - 3);
      expect(getLeftClone().width()).toBe((3 * 50) + 15); // 3 fixed, visible columns, with space for indicator.
      expect(getCell(-1, 0)).toBe(null);
      expect(getCell(-1, 1)).toBe(null);
      expect(getCell(-1, 2)).toBe(null);
      expect($(getCell(-1, 3).querySelector('span')).text()).toBe('D');
      expect($(getCell(-1, 4).querySelector('span')).text()).toBe('E');
      expect($(getCell(-1, 5).querySelector('span')).text()).toBe('F');
    });

    it('when there are hidden columns at the end of fixed columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          columns: [3, 4, 5],
          indicators: true
        },
        fixedColumnsLeft: 6
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(6 - 3);
      expect(getLeftClone().width()).toBe((3 * 50) + 15); // 3 fixed, visible columns, with space for indicator.
      expect($(getCell(-1, 0).querySelector('span')).text()).toBe('A');
      expect($(getCell(-1, 1).querySelector('span')).text()).toBe('B');
      expect($(getCell(-1, 2).querySelector('span')).text()).toBe('C');
      expect(getCell(-1, 3)).toBe(null);
      expect(getCell(-1, 4)).toBe(null);
      expect(getCell(-1, 5)).toBe(null);
    });

    it('when all fixed columns are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3],
          indicators: true
        },
        fixedColumnsLeft: 4
      });

      expect(getLeftClone().find('tbody tr:eq(0) td').length).toEqual(0);
      expect(getLeftClone().width()).toBe(0);
    });

    it('should not display cells after API call hiding all columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        hiddenColumns: true,
        fixedColumnsLeft: 3
      });

      getPlugin('hiddenColumns').hideColumns([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      render();

      expect(getLeftClone().find('tbody td').length).toBe(0);
      expect(extractDOMStructure(getLeftClone())).toMatchHTML(`
        <tbody>
          <tr></tr>
        </tbody>
        `);
    });
  });
});

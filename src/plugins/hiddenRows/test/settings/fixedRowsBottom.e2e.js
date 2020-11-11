describe('HiddenRows', () => {
  const id = 'testContainer';

  function extractDOMStructure(overlay) {
    const overlayBody = overlay.find('tbody')[0].cloneNode(true);

    Array.from(overlayBody.querySelectorAll('th')).forEach((TH) => {
      // Simplify header content
      TH.innerText = TH.querySelector('.rowHeader').innerText;
      TH.removeAttribute('style');
    });

    return `${overlayBody.outerHTML}`;
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('fixedRowsBottom', () => {
    it('should reduce fixed rows by the number of hidden rows (the first row from bottom overlay is hidden)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 1),
        rowHeaders: true,
        hiddenRows: {
          rows: [7],
          indicators: true
        },
        fixedRowsBottom: 3
      });

      expect(getBottomClone().find('tbody tr').length).toBe(2);
      expect(extractDOMStructure(getBottomClone())).toMatchHTML(`
        <tbody class="afterEmptyThead">
          <tr>
            <th class="${CSS_CLASS_AFTER_HIDDEN}">9</th>
            <td class="${CSS_CLASS_AFTER_HIDDEN}">A9</td>
          </tr>
          <tr>
            <th class="">10</th>
            <td class="">A10</td>
          </tr>
        </tbody>
        `);
    });

    it('should reduce fixed rows by the number of hidden rows (the second row from bottom overlay is hidden)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 1),
        rowHeaders: true,
        hiddenRows: {
          rows: [8],
          indicators: true
        },
        fixedRowsBottom: 3
      });

      expect(getBottomClone().find('tbody tr').length).toBe(2);
      expect(extractDOMStructure(getBottomClone())).toMatchHTML(`
        <tbody class="afterEmptyThead">
          <tr>
            <th class="${CSS_CLASS_BEFORE_HIDDEN}">8</th>
            <td class="">A8</td>
          </tr>
          <tr>
            <th class="${CSS_CLASS_AFTER_HIDDEN}">10</th>
            <td class="${CSS_CLASS_AFTER_HIDDEN}">A10</td>
          </tr>
        </tbody>
        `);
    });

    it('should reduce fixed rows by the number of hidden rows (two last rows within bottom overlay are hidden)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 1),
        rowHeaders: true,
        hiddenRows: {
          rows: [8, 9],
          indicators: true
        },
        fixedRowsBottom: 3
      });

      expect(getBottomClone().find('tbody tr').length).toBe(1);
      expect(extractDOMStructure(getBottomClone())).toMatchHTML(`
        <tbody class="afterEmptyThead">
          <tr>
            <th class="${CSS_CLASS_BEFORE_HIDDEN}">8</th>
            <td class="">A8</td>
          </tr>
        </tbody>
        `);
    });

    it('should reduce fixed rows by the number of hidden rows (total hidden rows are greater ' +
       'than fixedRowsBottom and one row is not hidden within fixed rows range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 1),
        rowHeaders: true,
        hiddenRows: {
          rows: [2, 3, 4, 5, 6, 7, 9],
          indicators: true
        },
        fixedRowsBottom: 3
      });

      expect(getBottomClone().find('tbody tr').length).toBe(1);
      expect(extractDOMStructure(getBottomClone())).toMatchHTML(`
        <tbody class="afterEmptyThead">
          <tr>
            <th class="${CSS_CLASS_AFTER_HIDDEN} ${CSS_CLASS_BEFORE_HIDDEN}">9</th>
            <td class="${CSS_CLASS_AFTER_HIDDEN}">A9</td>
          </tr>
        </tbody>
        `);
    });

    it('should reduce fixed rows to 0 when all rows all hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 1),
        rowHeaders: true,
        hiddenRows: {
          rows: [5, 6, 7, 8, 9],
          indicators: true
        },
        fixedRowsBottom: 3
      });

      expect(getBottomClone().find('tbody tr').length).toBe(0);
      expect(extractDOMStructure(getBottomClone())).toMatchHTML(`
        <tbody>
        </tbody>
        `);
    });
  });
});

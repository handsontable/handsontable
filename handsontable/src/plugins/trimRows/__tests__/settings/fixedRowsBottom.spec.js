describe('TrimRows', () => {
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

  // TODO: Tests should be moved to Core.fixedRowsBottom E2E tests as soon as the TrimmingMap can be
  // available for UMD (browsers).
  describe('fixedRowsBottom', () => {
    it('should render bottom overlay with the same amount of rows than a master overlay', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        rowHeaders: true,
        fixedRowsBottom: 2,
        trimRows: [0, 1, 2],
      });

      expect(extractDOMStructure(getBottomClone())).toMatchHTML(`
        <tbody>
          <tr>
            <th>1</th>
            <td>A4</td>
            <td>B4</td>
          </tr>
          <tr>
            <th>2</th>
            <td>A5</td>
            <td>B5</td>
          </tr>
        </tbody>
        `);
      expect(extractDOMStructure(getBottomInlineStartClone())).toMatchHTML(`
        <tbody>
          <tr>
            <th>1</th>
          </tr>
          <tr>
            <th>2</th>
          </tr>
        </tbody>
        `);
    });

    it('should shrink bottom overlay to a master overlay when defined overlay size is higher than total amount of rows', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        rowHeaders: true,
        fixedRowsBottom: 2,
        trimRows: [0, 1, 2, 3],
      });

      expect(extractDOMStructure(getBottomClone())).toMatchHTML(`
        <tbody>
          <tr>
            <th>1</th>
            <td>A5</td>
            <td>B5</td>
          </tr>
        </tbody>
        `);
      expect(extractDOMStructure(getBottomInlineStartClone())).toMatchHTML(`
        <tbody>
          <tr>
            <th>1</th>
          </tr>
        </tbody>
        `);
    });

    it('should shrink bottom overlay to a master overlay when all rows are trimmed', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        rowHeaders: true,
        fixedRowsBottom: 2,
        trimRows: [0, 1, 2, 3, 4],
      });

      expect(extractDOMStructure(getBottomClone())).toMatchHTML(`
        <tbody></tbody>
        `);
      expect(extractDOMStructure(getBottomInlineStartClone())).toMatchHTML(`
        <tbody></tbody>
        `);
    });
  });
});

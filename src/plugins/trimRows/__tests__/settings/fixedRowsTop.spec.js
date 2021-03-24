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

  // TODO: Tests should be moved to Core.fixedRowsTop E2E tests as soon as the TrimmingMap can be
  // available for UMD (browsers).
  describe('fixedRowsTop', () => {
    it('should render top overlay with the same amount of rows than a master overlay', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        rowHeaders: true,
        fixedRowsTop: 2,
        trimRows: [0, 1, 2],
      });

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <tbody>
          <tr>
            <th class="">1</th>
            <td class="">A4</td>
            <td class="">B4</td>
          </tr>
          <tr>
            <th class="">2</th>
            <td class="">A5</td>
            <td class="">B5</td>
          </tr>
        </tbody>
        `);
      expect(extractDOMStructure(getTopLeftClone())).toMatchHTML(`
        <tbody>
          <tr>
            <th class="">1</th>
          </tr>
          <tr>
            <th class="">2</th>
          </tr>
        </tbody>
        `);
    });

    it('should shrink top overlay to a master overlay when defined overlay size is higher than total amount of rows', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        rowHeaders: true,
        fixedRowsTop: 2,
        trimRows: [0, 1, 2, 3],
      });

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <tbody>
          <tr>
            <th class="">1</th>
            <td class="">A5</td>
            <td class="">B5</td>
          </tr>
        </tbody>
        `);
      expect(extractDOMStructure(getTopLeftClone())).toMatchHTML(`
        <tbody>
          <tr>
            <th class="">1</th>
          </tr>
        </tbody>
        `);
    });

    it('should shrink top overlay to a master overlay when all rows are trimmed', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        rowHeaders: true,
        fixedRowsTop: 2,
        trimRows: [0, 1, 2, 3, 4],
      });

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <tbody></tbody>
        `);
      expect(extractDOMStructure(getTopLeftClone())).toMatchHTML(`
        <tbody></tbody>
        `);
    });

    it('should resize the container after trimming rows using the `trimRows` API method, when there are fixed rows' +
      ' declared', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 2),
        rowHeaders: true,
        fixedRowsTop: 2,
        trimRows: true,
      });

      selectCell(1, 1);

      const initialHeight = spec().$container.height();

      hot().getPlugin('trimRows').trimRows(
        Array.from(Array(45).keys())
      );
      hot().render();

      const resultingHeight = spec().$container.height();

      expect(resultingHeight < initialHeight).toBe(true);

      hot().getPlugin('trimRows').untrimAll();
      hot().render();

      expect(spec().$container.height()).toEqual(initialHeight);
    });
  });
});

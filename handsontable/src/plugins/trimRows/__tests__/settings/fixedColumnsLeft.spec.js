describe('TrimRows', () => {
  const id = 'testContainer';

  function extractDOMStructure(overlay) {
    const overlayHead = overlay.find('thead')[0].cloneNode(true);
    const overlayBody = overlay.find('tbody')[0].cloneNode(true);

    Array.from(overlayHead.querySelectorAll('th')).forEach((TH) => {
      // Simplify header content
      TH.innerText = TH.querySelector('.colHeader').innerText;
      TH.removeAttribute('style');
    });

    return `${overlayHead.outerHTML}${overlayBody.outerHTML}`;
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

  // TODO: Tests should be moved to Core.fixedColumnsLeft E2E tests as soon as the TrimmingMap can be
  // available for UMD (browsers).
  describe('fixedColumnsLeft', () => {
    it('should render left overlay with the same amount of columns than a master overlay', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        colHeaders: true,
        fixedColumnsLeft: 2,
        columns: [{}, {}],
      });

      expect(extractDOMStructure(getLeftClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
          </tr>
          <tr>
            <td class="">A2</td>
            <td class="">B2</td>
          </tr>
        </tbody>
        `);
      expect(extractDOMStructure(getTopLeftClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
          </tr>
        </thead>
        <tbody></tbody>
        `);
    });

    it('should shrink left overlay to a master overlay when defined overlay size is higher than total amount of columns', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        colHeaders: true,
        fixedColumnsLeft: 2,
        columns: [{}],
      });

      expect(extractDOMStructure(getLeftClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
          </tr>
          <tr>
            <td class="">A2</td>
          </tr>
        </tbody>
        `);
      expect(extractDOMStructure(getTopLeftClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
          </tr>
        </thead>
        <tbody></tbody>
        `);
    });

    it('should shrink top overlay to a master overlay when all rows are trimmed', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        colHeaders: true,
        fixedColumnsLeft: 2,
        columns: [],
      });

      expect(extractDOMStructure(getLeftClone())).toMatchHTML(`
        <thead>
          <tr></tr>
        </thead>
        <tbody>
          <tr></tr>
          <tr></tr>
        </tbody>
        `);
      expect(extractDOMStructure(getTopLeftClone())).toMatchHTML(`
        <thead>
          <tr></tr>
        </thead>
        <tbody></tbody>
        `);
    });
  });
});

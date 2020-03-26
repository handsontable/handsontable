describe('NestedHeaders', () => {
  const id = 'testContainer';

  function extractDOMStructure(overlayTHead, overlayTBody) {
    const cloneTHeadOverlay = overlayTHead.find('thead')[0].cloneNode(true);
    const cellsRow = overlayTBody ? overlayTBody.find('tbody tr')[0].cloneNode(true).outerHTML : '';

    Array.from(cloneTHeadOverlay.querySelectorAll('th')).forEach((TH) => {
      // Simplify header content
      TH.innerText = TH.querySelector('.colHeader').innerText;
      TH.removeAttribute('style');
    });

    return `${cloneTHeadOverlay.outerHTML}${cellsRow ? `<tbody>${cellsRow}</tbody>` : ''}`;
  }

  /**
   * @param hot
   * @param row
   */
  function nonHiddenTHs(hot, row) {
    const headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');

    return headerRows[row].querySelectorAll('th:not(.hiddenHeader)');
  }

  /**
   * @param rows
   * @param cols
   * @param obj
   */
  function generateComplexSetup(rows, cols, obj) {
    const data = [];

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!data[i]) {
          data[i] = [];
        }

        if (!obj) {
          data[i][j] = `${i}_${j}`;
          /* eslint-disable no-continue */
          continue;
        }

        if (i === 0 && j % 2 !== 0) {
          data[i][j] = {
            label: `${i}_${j}`,
            colspan: 8
          };
        } else if (i === 1 && (j % 3 === 1 || j % 3 === 2)) {
          data[i][j] = {
            label: `${i}_${j}`,
            colspan: 4
          };
        } else if (i === 2 && (j % 5 === 1 || j % 5 === 2 || j % 5 === 3 || j % 5 === 4)) {
          data[i][j] = {
            label: `${i}_${j}`,
            colspan: 2
          };
        } else {
          data[i][j] = `${i}_${j}`;
        }

      }
    }

    return data;
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

  describe('initialization', () => {
    it('should be possible to initialize the plugin with minimal setup', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
      });

      hot.updateSettings({
        nestedHeaders: [[]],
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should be possible to disable the plugin using the disablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      const plugin = hot.getPlugin('nestedHeaders');

      plugin.disablePlugin();
      hot.render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
            <th class="">C</th>
            <th class="">D</th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">H</th>
            <th class="">I</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should be possible to re-enable the plugin using the enablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      const plugin = hot.getPlugin('nestedHeaders');

      plugin.disablePlugin();
      hot.render();
      plugin.enablePlugin();
      hot.render();

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should be possible to initialize the plugin using the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
      });

      hot.updateSettings({
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class=""></th>
            <th class=""></th>
            <th class=""></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should be possible to disable the plugin using updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      hot.updateSettings({
        nestedHeaders: false,
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
            <th class="">C</th>
            <th class="">D</th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">H</th>
            <th class="">I</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should be possible to update the plugin settings using the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      hot.updateSettings({
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });

    it('should warn the developer when the settings contains overlaping headers', () => {
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c'],
          ['a', { label: 'b', colspan: 3 }, 'c']
        ],
      });

      expect(warnSpy).toHaveBeenCalledWith('Your Nested Headers plugin setup contains overlapping headers. ' +
                                           'This kind of configuration is currently not supported.');
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead></thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
          </tr>
        </tbody>
        `);
      expect(extractDOMStructure(getMaster(), getMaster())).toMatchHTML(`
        <thead></thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
          </tr>
        </tbody>
        `);
    });

    it('should warn the developer when the settings are invalid', () => {
      const warnSpy = spyOn(console, 'warn');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
      });

      hot.updateSettings({
        nestedHeaders: true,
      });

      /* eslint-disable quotes */
      const expectedWarn = `Your Nested Headers plugin configuration is invalid. The ` +
                           `settings has to be passed as an array of arrays e.q. ` +
                           `[['A1', { label: 'A2', colspan: 2 }]]`;
      /* eslint-enable quotes */

      expect(warnSpy).toHaveBeenCalledWith(expectedWarn);
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
            <th class="">C</th>
            <th class="">D</th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">H</th>
            <th class="">I</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hot.updateSettings({
        nestedHeaders: [],
      });

      expect(warnSpy).toHaveBeenCalledWith(expectedWarn);
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
            <th class="">C</th>
            <th class="">D</th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">H</th>
            <th class="">I</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hot.updateSettings({
        nestedHeaders: {},
      });

      expect(warnSpy).toHaveBeenCalledWith(expectedWarn);
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
            <th class="">C</th>
            <th class="">D</th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">H</th>
            <th class="">I</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hot.updateSettings({
        nestedHeaders: '',
      });

      expect(warnSpy).toHaveBeenCalledWith(expectedWarn);
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="">B</th>
            <th class="">C</th>
            <th class="">D</th>
            <th class="">E</th>
            <th class="">F</th>
            <th class="">G</th>
            <th class="">H</th>
            <th class="">I</th>
            <th class="">J</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);
    });
  });

  describe('basic functionality', () => {
    it('should add as many header levels as the \'colHeaders\' property suggests', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', 'b', 'c', 'd'],
          ['a', 'b', 'c', 'd']
        ]
      });

      expect(hot.view.wt.wtTable.THEAD.querySelectorAll('tr').length).toEqual(2);
    });

    it('should adjust headers widths', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c', 'd'],
          ['a', 'Long column header', 'c', 'd']
        ]
      });

      const headers = hot.view.wt.wtTable.THEAD.querySelectorAll('tr:first-of-type th');

      expect(hot.getColWidth(1)).toBeGreaterThan(50);
      expect(headers[1].offsetWidth).toBeGreaterThan(100);
    });
  });

  describe('The \'colspan\' property', () => {
    it('should allow creating a more complex nested setup when fixedColumnsLeft option is enabled', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        fixedColumnsLeft: 2,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2']
        ],
      });

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="">B1</th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="">B2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="">A1</td>
              <td class="">B1</td>
            </tr>
          </tbody>
          `;
        expect(extractDOMStructure(getTopLeftClone(), getLeftClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getLeftClone(), getLeftClone())).toMatchHTML(htmlPattern);
      }

      updateSettings({ fixedColumnsLeft: 3 });

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="2">B1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="2">B2</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="">C1</td>
            </tr>
          </tbody>
          `;
        expect(extractDOMStructure(getTopLeftClone(), getLeftClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getLeftClone(), getLeftClone())).toMatchHTML(htmlPattern);
      }

      updateSettings({ fixedColumnsLeft: 6 });

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="4">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">F1</th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="2">B2</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">D2</th>
              <th class="hiddenHeader"></th>
              <th class="">F2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="">C1</td>
              <td class="">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
          `;
        expect(extractDOMStructure(getTopLeftClone(), getLeftClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getLeftClone(), getLeftClone())).toMatchHTML(htmlPattern);
      }
    });

    it('should return a relevant nested header element in hot.getCell()', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
        viewportColumnRenderingOffset: 15
      });

      const allTHs = function allTHs(row) {
        const headerRows = hot.view.wt.wtTable.THEAD.querySelectorAll('tr');
        return headerRows[row].querySelectorAll('th');
      };
      const levels = [nonHiddenTHs(hot, 0), nonHiddenTHs(hot, 1), nonHiddenTHs(hot, 2), nonHiddenTHs(hot, 3)];

      expect(levels[0][0]).toEqual(getCell(-4, 0));
      expect(levels[0][1]).toEqual(getCell(-4, 1));
      expect(allTHs(0)[2]).toEqual(getCell(-4, 2));
      expect(allTHs(0)[3]).toEqual(getCell(-4, 3));
      expect(levels[0][2]).toEqual(getCell(-4, 9));
      expect(levels[0][3]).toEqual(getCell(-4, 10));
      expect(levels[0][4]).toEqual(getCell(-4, 18));
      expect(levels[0][5]).toEqual(getCell(-4, 19));

      expect(levels[1][0]).toEqual(getCell(-3, 0));
      expect(levels[1][1]).toEqual(getCell(-3, 1));
      expect(levels[1][2]).toEqual(getCell(-3, 5));
      expect(levels[1][3]).toEqual(getCell(-3, 9));

      expect(levels[2][0]).toEqual(getCell(-2, 0));
      expect(levels[2][1]).toEqual(getCell(-2, 1));
      expect(levels[2][2]).toEqual(getCell(-2, 3));
      expect(levels[2][3]).toEqual(getCell(-2, 5));

      expect(levels[3][0]).toEqual(getCell(-1, 0));
      expect(levels[3][1]).toEqual(getCell(-1, 1));
      expect(levels[3][2]).toEqual(getCell(-1, 2));
      expect(levels[3][3]).toEqual(getCell(-1, 3));
    });

    it('should render the setup properly after the table being scrolled', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
        viewportColumnRenderingOffset: 15
      });

      // not scrolled
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">0_0</th>
            <th class="" colspan="8">0_1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_2</th>
            <th class="" colspan="8">0_3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_4</th>
            <th class="" colspan="8">0_5</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">1_0</th>
            <th class="" colspan="4">1_1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">1_2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">1_3</th>
            <th class="" colspan="4">1_4</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">1_5</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">1_6</th>
            <th class="" colspan="4">1_7</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">2_0</th>
            <th class="" colspan="2">2_1</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_2</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_4</th>
            <th class="hiddenHeader"></th>
            <th class="">2_5</th>
            <th class="" colspan="2">2_6</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_7</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_8</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_9</th>
            <th class="hiddenHeader"></th>
            <th class="">2_10</th>
            <th class="" colspan="2">2_11</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_12</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">3_0</th>
            <th class="">3_1</th>
            <th class="">3_2</th>
            <th class="">3_3</th>
            <th class="">3_4</th>
            <th class="">3_5</th>
            <th class="">3_6</th>
            <th class="">3_7</th>
            <th class="">3_8</th>
            <th class="">3_9</th>
            <th class="">3_10</th>
            <th class="">3_11</th>
            <th class="">3_12</th>
            <th class="">3_13</th>
            <th class="">3_14</th>
            <th class="">3_15</th>
            <th class="">3_16</th>
            <th class="">3_17</th>
            <th class="">3_18</th>
            <th class="">3_19</th>
            <th class="">3_20</th>
            <th class="">3_21</th>
            <th class="">3_22</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
            <td class="">K1</td>
            <td class="">L1</td>
            <td class="">M1</td>
            <td class="">N1</td>
            <td class="">O1</td>
            <td class="">P1</td>
            <td class="">Q1</td>
            <td class="">R1</td>
            <td class="">S1</td>
            <td class="">T1</td>
            <td class="">U1</td>
            <td class="">V1</td>
            <td class="">W1</td>
          </tr>
        </tbody>
        `);

      hot.scrollViewportTo(void 0, 40);
      hot.render();

      // scrolled
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" colspan="8">0_5</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_6</th>
            <th class="" colspan="8">0_7</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_8</th>
            <th class="" colspan="8">0_9</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_10</th>
            <th class="" colspan="8">0_11</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_12</th>
            <th class="" colspan="8">0_13</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">0_14</th>
          </tr>
          <tr>
            <th class="" colspan="4">1_7</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">1_8</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">1_9</th>
            <th class="" colspan="4">1_10</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">1_11</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">1_12</th>
            <th class="" colspan="4">1_13</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">1_14</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">1_15</th>
            <th class="" colspan="4">1_16</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">1_17</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">1_18</th>
            <th class="" colspan="4">1_19</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">1_20</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">1_21</th>
          </tr>
          <tr>
            <th class="" colspan="2">2_11</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_12</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_13</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_14</th>
            <th class="hiddenHeader"></th>
            <th class="">2_15</th>
            <th class="" colspan="2">2_16</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_17</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_18</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_19</th>
            <th class="hiddenHeader"></th>
            <th class="">2_20</th>
            <th class="" colspan="2">2_21</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_22</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_23</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_24</th>
            <th class="hiddenHeader"></th>
            <th class="">2_25</th>
            <th class="" colspan="2">2_26</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_27</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_28</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_29</th>
            <th class="hiddenHeader"></th>
            <th class="">2_30</th>
            <th class="" colspan="2">2_31</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_32</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_33</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">2_34</th>
            <th class="hiddenHeader"></th>
            <th class="">2_35</th>
          </tr>
          <tr>
            <th class="">3_19</th>
            <th class="">3_20</th>
            <th class="">3_21</th>
            <th class="">3_22</th>
            <th class="">3_23</th>
            <th class="">3_24</th>
            <th class="">3_25</th>
            <th class="">3_26</th>
            <th class="">3_27</th>
            <th class="">3_28</th>
            <th class="">3_29</th>
            <th class="">3_30</th>
            <th class="">3_31</th>
            <th class="">3_32</th>
            <th class="">3_33</th>
            <th class="">3_34</th>
            <th class="">3_35</th>
            <th class="">3_36</th>
            <th class="">3_37</th>
            <th class="">3_38</th>
            <th class="">3_39</th>
            <th class="">3_40</th>
            <th class="">3_41</th>
            <th class="">3_42</th>
            <th class="">3_43</th>
            <th class="">3_44</th>
            <th class="">3_45</th>
            <th class="">3_46</th>
            <th class="">3_47</th>
            <th class="">3_48</th>
            <th class="">3_49</th>
            <th class="">3_50</th>
            <th class="">3_51</th>
            <th class="">3_52</th>
            <th class="">3_53</th>
            <th class="">3_54</th>
            <th class="">3_55</th>
            <th class="">3_56</th>
            <th class="">3_57</th>
            <th class="">3_58</th>
            <th class="">3_59</th>
            <th class="">3_60</th>
            <th class="">3_61</th>
            <th class="">3_62</th>
            <th class="">3_63</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">T1</td>
            <td class="">U1</td>
            <td class="">V1</td>
            <td class="">W1</td>
            <td class="">X1</td>
            <td class="">Y1</td>
            <td class="">Z1</td>
            <td class="">AA1</td>
            <td class="">AB1</td>
            <td class="">AC1</td>
            <td class="">AD1</td>
            <td class="">AE1</td>
            <td class="">AF1</td>
            <td class="">AG1</td>
            <td class="">AH1</td>
            <td class="">AI1</td>
            <td class="">AJ1</td>
            <td class="">AK1</td>
            <td class="">AL1</td>
            <td class="">AM1</td>
            <td class="">AN1</td>
            <td class="">AO1</td>
            <td class="">AP1</td>
            <td class="">AQ1</td>
            <td class="">AR1</td>
            <td class="">AS1</td>
            <td class="">AT1</td>
            <td class="">AU1</td>
            <td class="">AV1</td>
            <td class="">AW1</td>
            <td class="">AX1</td>
            <td class="">AY1</td>
            <td class="">AZ1</td>
            <td class="">BA1</td>
            <td class="">BB1</td>
            <td class="">BC1</td>
            <td class="">BD1</td>
            <td class="">BE1</td>
            <td class="">BF1</td>
            <td class="">BG1</td>
            <td class="">BH1</td>
            <td class="">BI1</td>
            <td class="">BJ1</td>
            <td class="">BK1</td>
            <td class="">BL1</td>
          </tr>
        </tbody>
        `);
    });
  });

  describe('selection', () => {
    it('should generate class names based on "currentHeaderClassName" and "activeHeaderClassName" settings', function() {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        currentHeaderClassName: 'my-current-header',
        activeHeaderClassName: 'my-active-header',
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="" colspan="8">B</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">C</th>
          </tr>
          <tr>
            <th class="">D</th>
            <th class="" colspan="4">E</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">G</th>
          </tr>
          <tr>
            <th class="">H</th>
            <th class="my-active-header my-current-header" colspan="2">I</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">J</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">L</th>
            <th class="hiddenHeader"></th>
            <th class="">M</th>
          </tr>
          <tr>
            <th class="">N</th>
            <th class="my-active-header my-current-header">O</th>
            <th class="my-active-header my-current-header">P</th>
            <th class="">Q</th>
            <th class="">R</th>
            <th class="">S</th>
            <th class="">T</th>
            <th class="">U</th>
            <th class="">V</th>
            <th class="">W</th>
          </tr>
        </thead>
        `);
    });

    it('should highlight column header for selected cells', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
      });

      selectCells([[0, 1, 0, 1]]); // B1

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="ht__highlight">B3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);

      selectCells([[1, 2, 1, 2]]); // C2

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="ht__highlight" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);

      selectCells([[1, 3, 1, 3]]); // D2

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="ht__highlight" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);

      selectCells([[1, 4, 1, 6]]); // E2 to G2

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="ht__highlight">E3</th>
            <th class="ht__highlight">F3</th>
            <th class="ht__highlight">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);
    });

    it('should highlight column header for selected cells in-between nested headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
      });

      selectCells([[1, 2, 1, 5]]); // C2 to F2

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="ht__highlight" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="ht__highlight">E3</th>
            <th class="ht__highlight">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);

      selectCells([[1, 3, 1, 6]]); // D2 to G2

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="ht__highlight" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="ht__highlight">E3</th>
            <th class="ht__highlight">F3</th>
            <th class="ht__highlight">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);

      selectCells([[1, 0, 1, 2]]); // A2 to C2

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="ht__highlight">A3</th>
            <th class="ht__highlight">B3</th>
            <th class="ht__highlight" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);
    });

    it('should highlight column header for non-contiguous selected cells', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
      });

      selectCells([[1, 1, 1, 1], [1, 3, 1, 3], [1, 5, 1, 5]]); // B2, B4, B6

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="ht__highlight">B3</th>
            <th class="ht__highlight" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="ht__highlight">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);

      selectCells([[1, 1, 1, 2], [2, 3, 2, 4]]); // B3 to C2, D3 to E3

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="ht__highlight">B3</th>
            <th class="ht__highlight" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="ht__highlight">E3</th>
            <th class="">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);
    });

    it('should active highlight column header for selected column headers', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      $(getCell(-2, 1)) // Header "I"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="" colspan="8">B</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">C</th>
          </tr>
          <tr>
            <th class="">D</th>
            <th class="" colspan="4">E</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">G</th>
          </tr>
          <tr>
            <th class="">H</th>
            <th class="ht__active_highlight ht__highlight" colspan="2">I</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">J</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">L</th>
            <th class="hiddenHeader"></th>
            <th class="">M</th>
          </tr>
          <tr>
            <th class="">N</th>
            <th class="ht__active_highlight ht__highlight">O</th>
            <th class="ht__active_highlight ht__highlight">P</th>
            <th class="">Q</th>
            <th class="">R</th>
            <th class="">S</th>
            <th class="">T</th>
            <th class="">U</th>
            <th class="">V</th>
            <th class="">W</th>
          </tr>
        </thead>
        `);

      expect(getSelected()).toEqual([[0, 1, 9, 2]]);

      $(getCell(-3, 1)) // Header "E"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="" colspan="8">B</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">C</th>
          </tr>
          <tr>
            <th class="">D</th>
            <th class="ht__active_highlight ht__highlight" colspan="4">E</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">G</th>
          </tr>
          <tr>
            <th class="">H</th>
            <th class="ht__active_highlight ht__highlight" colspan="2">I</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight ht__highlight" colspan="2">J</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">L</th>
            <th class="hiddenHeader"></th>
            <th class="">M</th>
          </tr>
          <tr>
            <th class="">N</th>
            <th class="ht__active_highlight ht__highlight">O</th>
            <th class="ht__active_highlight ht__highlight">P</th>
            <th class="ht__active_highlight ht__highlight">Q</th>
            <th class="ht__active_highlight ht__highlight">R</th>
            <th class="">S</th>
            <th class="">T</th>
            <th class="">U</th>
            <th class="">V</th>
            <th class="">W</th>
          </tr>
        </thead>
        `);

      expect(getSelected()).toEqual([[0, 1, 9, 4]]);

      $(getCell(-4, 1)) // Header "B"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="ht__highlight ht__active_highlight" colspan="8">B</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">C</th>
          </tr>
          <tr>
            <th class="">D</th>
            <th class="ht__active_highlight ht__highlight" colspan="4">E</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight ht__highlight" colspan="4">F</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">G</th>
          </tr>
          <tr>
            <th class="">H</th>
            <th class="ht__active_highlight ht__highlight" colspan="2">I</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight ht__highlight" colspan="2">J</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight ht__highlight" colspan="2">K</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight ht__highlight" colspan="2">L</th>
            <th class="hiddenHeader"></th>
            <th class="">M</th>
          </tr>
          <tr>
            <th class="">N</th>
            <th class="ht__active_highlight ht__highlight">O</th>
            <th class="ht__active_highlight ht__highlight">P</th>
            <th class="ht__active_highlight ht__highlight">Q</th>
            <th class="ht__active_highlight ht__highlight">R</th>
            <th class="ht__active_highlight ht__highlight">S</th>
            <th class="ht__active_highlight ht__highlight">T</th>
            <th class="ht__active_highlight ht__highlight">U</th>
            <th class="ht__active_highlight ht__highlight">V</th>
            <th class="">W</th>
          </tr>
        </thead>
        `);

      expect(getSelected()).toEqual([[0, 1, 9, 8]]);
    });

    it('should active highlight column header for non-contiguous header selection', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
          ['A4', 'B4', { label: 'C4', colspan: 2 }, 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ],
      });

      $(getCell(-2, 1)) // Header "B2"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="ht__active_highlight ht__highlight">B3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="ht__active_highlight ht__highlight">B4</th>
            <th class="" colspan="2">C4</th>
            <th class="hiddenHeader"></th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        `);

      expect(getSelected()).toEqual([[0, 1, 9, 1]]);

      keyDown('ctrl');

      $(getCell(-3, 5)) // Header "F2"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="ht__highlight ht__active_highlight">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="ht__active_highlight ht__highlight">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="ht__active_highlight ht__highlight">B3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="ht__active_highlight ht__highlight">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="ht__active_highlight ht__highlight">B4</th>
            <th class="" colspan="2">C4</th>
            <th class="hiddenHeader"></th>
            <th class="">E4</th>
            <th class="ht__active_highlight ht__highlight">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        `);

      expect(getSelected()).toEqual([
        [0, 1, 9, 1],
        [0, 5, 9, 5],
      ]);

      $(getCell(-3, 1)) // Header "B2"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="ht__highlight ht__active_highlight">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="ht__active_highlight ht__highlight" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="ht__active_highlight ht__highlight">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="ht__active_highlight ht__highlight">B3</th>
            <th class="ht__active_highlight ht__highlight" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="ht__active_highlight ht__highlight">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="ht__active_highlight ht__highlight">B4</th>
            <th class="ht__active_highlight ht__highlight" colspan="2">C4</th>
            <th class="hiddenHeader"></th>
            <th class="">E4</th>
            <th class="ht__active_highlight ht__highlight">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        `);

      expect(hot.getSelected()).toEqual([
        [0, 1, 9, 1],
        [0, 5, 9, 5],
        [0, 1, 9, 1], // <- This coords shouldn't be here (known issue)
        [0, 1, 9, 3],
      ]);
    });

    it('should select every column header under the nested headers, when changing the selection by dragging the cursor', function() {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)')
        .simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)')
        .simulate('mouseover')
        .simulate('mouseup');

      expect(hot.getSelected()).toEqual([[0, 3, hot.countRows() - 1, 6]]);

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)')
        .simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)')
        .simulate('mouseover')
        .simulate('mouseup');

      expect(hot.getSelected()).toEqual([[0, 4, hot.countRows() - 1, 1]]);

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)').simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)').simulate('mouseup');

      expect(hot.getSelected()).toEqual([[0, 3, hot.countRows() - 1, 6]]);
    });

    it('should add selection borders in the expected positions, when selecting multi-columned headers', function() {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      const $headerLvl3 = this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)');
      const $firstRow = this.$container.find('.ht_master tbody tr:eq(0)');
      const $lastRow = this.$container.find('.ht_master tbody tr:eq(3)');
      const $tbody = this.$container.find('.ht_master tbody');

      const $topBorder = this.$container.find('.wtBorder.area').eq(0);
      const $bottomBorder = this.$container.find('.wtBorder.area').eq(2);
      const $leftBorder = this.$container.find('.wtBorder.area').eq(1);
      const $rightBorder = this.$container.find('.wtBorder.area').eq(3);

      expect($topBorder.offset().top).toEqual($firstRow.offset().top - 1);
      expect($bottomBorder.offset().top).toEqual($lastRow.offset().top + $lastRow.height() - 1);
      expect($topBorder.width()).toEqual($headerLvl3.width());
      expect($bottomBorder.width()).toEqual($headerLvl3.width());

      expect($leftBorder.offset().left).toEqual($headerLvl3.offset().left);
      expect($rightBorder.offset().left).toEqual($headerLvl3.offset().left + $headerLvl3.width());
      expect($leftBorder.height()).toEqual($tbody.height());
      expect($rightBorder.height()).toEqual($tbody.height() + 1);
    });
  });
});

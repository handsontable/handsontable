describe('NestedHeaders', () => {
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

  describe('general functionality', () => {
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

    it('should correctly render headers when loaded dataset is shorter (less columns) than nested headers settings', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 100, true),
        width: 400,
        height: 300,
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="8">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
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

      hot.loadData(Handsontable.helper.createSpreadsheetData(5, 5));

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">E4</th>
          </tr>
        </thead>
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

      hot.loadData(Handsontable.helper.createSpreadsheetData(5, 2));

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="">B1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
          </tr>
        </tbody>
        `);

      hot.loadData(Handsontable.helper.createSpreadsheetData(5, 6));

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="5">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D3</th>
            <th class="hiddenHeader"></th>
            <th class="">F3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">E4</th>
            <th class="">F4</th>
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
        `);
    });

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
            <th class="">A1</th>
            <th class="" colspan="8">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
            <th class="" colspan="8">K1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">S1</th>
            <th class="" colspan="8">T1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
            <th class="" colspan="4">K2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">O2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">S2</th>
            <th class="" colspan="4">T2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
            <th class="" colspan="2">K3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">M3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">O3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">Q3</th>
            <th class="hiddenHeader"></th>
            <th class="">S3</th>
            <th class="" colspan="2">T3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">V3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
            <th class="">K4</th>
            <th class="">L4</th>
            <th class="">M4</th>
            <th class="">N4</th>
            <th class="">O4</th>
            <th class="">P4</th>
            <th class="">Q4</th>
            <th class="">R4</th>
            <th class="">S4</th>
            <th class="">T4</th>
            <th class="">U4</th>
            <th class="">V4</th>
            <th class="">W4</th>
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
            <th class="" colspan="8">T1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AB1</th>
            <th class="" colspan="8">AC1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AK1</th>
            <th class="" colspan="8">AL1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AT1</th>
            <th class="" colspan="8">AU1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BC1</th>
            <th class="" colspan="8">BD1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BL1</th>
            <th class="" colspan="8">BM1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="4">T2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">X2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AB2</th>
            <th class="" colspan="4">AC2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AG2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AK2</th>
            <th class="" colspan="4">AL2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AP2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AT2</th>
            <th class="" colspan="4">AU2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AY2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BC2</th>
            <th class="" colspan="4">BD2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">BH2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">BL2</th>
            <th class="" colspan="4">BM2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="" colspan="2">T3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">V3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">X3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">Z3</th>
            <th class="hiddenHeader"></th>
            <th class="">AB3</th>
            <th class="" colspan="2">AC3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AE3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AG3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AI3</th>
            <th class="hiddenHeader"></th>
            <th class="">AK3</th>
            <th class="" colspan="2">AL3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AN3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AP3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AR3</th>
            <th class="hiddenHeader"></th>
            <th class="">AT3</th>
            <th class="" colspan="2">AU3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AW3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AY3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">BA3</th>
            <th class="hiddenHeader"></th>
            <th class="">BC3</th>
            <th class="" colspan="2">BD3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">BF3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">BH3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">BJ3</th>
            <th class="hiddenHeader"></th>
            <th class="">BL3</th>
            <th class="" colspan="2">BM3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">BO3</th>
          </tr>
          <tr>
            <th class="">T4</th>
            <th class="">U4</th>
            <th class="">V4</th>
            <th class="">W4</th>
            <th class="">X4</th>
            <th class="">Y4</th>
            <th class="">Z4</th>
            <th class="">AA4</th>
            <th class="">AB4</th>
            <th class="">AC4</th>
            <th class="">AD4</th>
            <th class="">AE4</th>
            <th class="">AF4</th>
            <th class="">AG4</th>
            <th class="">AH4</th>
            <th class="">AI4</th>
            <th class="">AJ4</th>
            <th class="">AK4</th>
            <th class="">AL4</th>
            <th class="">AM4</th>
            <th class="">AN4</th>
            <th class="">AO4</th>
            <th class="">AP4</th>
            <th class="">AQ4</th>
            <th class="">AR4</th>
            <th class="">AS4</th>
            <th class="">AT4</th>
            <th class="">AU4</th>
            <th class="">AV4</th>
            <th class="">AW4</th>
            <th class="">AX4</th>
            <th class="">AY4</th>
            <th class="">AZ4</th>
            <th class="">BA4</th>
            <th class="">BB4</th>
            <th class="">BC4</th>
            <th class="">BD4</th>
            <th class="">BE4</th>
            <th class="">BF4</th>
            <th class="">BG4</th>
            <th class="">BH4</th>
            <th class="">BI4</th>
            <th class="">BJ4</th>
            <th class="">BK4</th>
            <th class="">BL4</th>
            <th class="">BM4</th>
            <th class="">BN4</th>
            <th class="">BO4</th>
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
            <td class="">BM1</td>
            <td class="">BN1</td>
            <td class="">BO1</td>
          </tr>
        </tbody>
        `);
    });

    it('should correctly point cell coords for nested corners', () => {
      const afterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');

      handsontable({
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          [''],
          [''],
          [''],
          [''],
        ],
        afterOnCellMouseDown,
      });

      const corner = getCell(-4, -1);

      $(corner).simulate('mousedown');

      expect(afterOnCellMouseDown).toHaveBeenCalled();
      expect(afterOnCellMouseDown.calls.argsFor(0)[0]).toBeInstanceOf(MouseEvent);
      expect(afterOnCellMouseDown.calls.argsFor(0)[1]).toEqual(jasmine.objectContaining({ row: -4, col: -1 }));
      expect(afterOnCellMouseDown.calls.argsFor(0)[2]).toBe(corner);
    });
  });
});

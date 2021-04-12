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
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)') // Select columns from O to P
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
            <th class="my-active-header" colspan="2">I</th>
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
            <th class="my-current-header my-active-header">O</th>
            <th class="my-current-header my-active-header">P</th>
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
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
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
            <th class="ht__active_highlight" colspan="2">I</th>
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
            <th class="ht__highlight ht__active_highlight">O</th>
            <th class="ht__highlight ht__active_highlight">P</th>
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

      expect(getSelected()).toEqual([[-2, 1, 9, 2]]);

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
            <th class="ht__active_highlight" colspan="4">E</th>
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
            <th class="ht__active_highlight" colspan="2">I</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight" colspan="2">J</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">L</th>
            <th class="hiddenHeader"></th>
            <th class="">M</th>
          </tr>
          <tr>
            <th class="">N</th>
            <th class="ht__highlight ht__active_highlight">O</th>
            <th class="ht__highlight ht__active_highlight">P</th>
            <th class="ht__highlight ht__active_highlight">Q</th>
            <th class="ht__highlight ht__active_highlight">R</th>
            <th class="">S</th>
            <th class="">T</th>
            <th class="">U</th>
            <th class="">V</th>
            <th class="">W</th>
          </tr>
        </thead>
        `);

      expect(getSelected()).toEqual([[-3, 1, 9, 4]]);

      $(getCell(-4, 1)) // Header "B"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="ht__active_highlight" colspan="8">B</th>
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
            <th class="ht__active_highlight" colspan="4">E</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight" colspan="4">F</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">G</th>
          </tr>
          <tr>
            <th class="">H</th>
            <th class="ht__active_highlight" colspan="2">I</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight" colspan="2">J</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight" colspan="2">K</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight" colspan="2">L</th>
            <th class="hiddenHeader"></th>
            <th class="">M</th>
          </tr>
          <tr>
            <th class="">N</th>
            <th class="ht__highlight ht__active_highlight">O</th>
            <th class="ht__highlight ht__active_highlight">P</th>
            <th class="ht__highlight ht__active_highlight">Q</th>
            <th class="ht__highlight ht__active_highlight">R</th>
            <th class="ht__highlight ht__active_highlight">S</th>
            <th class="ht__highlight ht__active_highlight">T</th>
            <th class="ht__highlight ht__active_highlight">U</th>
            <th class="ht__highlight ht__active_highlight">V</th>
            <th class="">W</th>
          </tr>
        </thead>
        `);

      expect(getSelected()).toEqual([[-4, 1, 9, 8]]);
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

      $(getCell(-2, 1)) // Header "B3"
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
            <th class="ht__active_highlight">B3</th>
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
            <th class="ht__highlight ht__active_highlight">B4</th>
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

      expect(getSelected()).toEqual([[-2, 1, 9, 1]]);

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
            <th class="ht__active_highlight">F1</th>
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
            <th class="ht__active_highlight">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="ht__active_highlight">B3</th>
            <th class="" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="ht__active_highlight">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="ht__highlight ht__active_highlight">B4</th>
            <th class="" colspan="2">C4</th>
            <th class="hiddenHeader"></th>
            <th class="">E4</th>
            <th class="ht__highlight ht__active_highlight">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        `);

      expect(getSelected()).toEqual([
        [-2, 1, 9, 1],
        [-3, 5, 9, 5],
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
            <th class="ht__active_highlight">F1</th>
            <th class="">G1</th>
            <th class="">H1</th>
            <th class="">I1</th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="ht__active_highlight" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E2</th>
            <th class="ht__active_highlight">F2</th>
            <th class="">G2</th>
            <th class="">H2</th>
            <th class="">I2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="ht__active_highlight">B3</th>
            <th class="ht__active_highlight" colspan="2">C3</th>
            <th class="hiddenHeader"></th>
            <th class="">E3</th>
            <th class="ht__active_highlight">F3</th>
            <th class="">G3</th>
            <th class="">H3</th>
            <th class="">I3</th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="ht__highlight ht__active_highlight">B4</th>
            <th class="ht__highlight ht__active_highlight" colspan="2">C4</th>
            <th class="hiddenHeader"></th>
            <th class="">E4</th>
            <th class="ht__highlight ht__active_highlight">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        `);

      expect(getSelected()).toEqual([
        [-2, 1, 9, 1],
        [-3, 5, 9, 5],
        [-3, 1, 9, 3],
      ]);
    });

    it('should select every column header under the nested headers, when changing the selection by dragging the cursor', function() {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)')
        .simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)')
        .simulate('mouseover')
        .simulate('mouseup');

      expect(hot.getSelected()).toEqual([[-1, 3, hot.countRows() - 1, 6]]);

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)')
        .simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)')
        .simulate('mouseover')
        .simulate('mouseup');

      expect(hot.getSelected()).toEqual([[-1, 4, hot.countRows() - 1, 1]]);

      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)').simulate('mousedown');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(1)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(3)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)').simulate('mouseover');
      this.$container.find('.ht_clone_top thead tr:eq(2) th:eq(5)').simulate('mouseup');

      expect(hot.getSelected()).toEqual([[-1, 3, hot.countRows() - 1, 6]]);
    });

    it('should select all column headers (on all levels) after clicking the corner header', function() {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      const $cornerHeader = this.$container.find('.ht_clone_top_left_corner thead tr:eq(0) th:eq(0)');

      $cornerHeader.simulate('mousedown');
      $cornerHeader.simulate('mouseup');

      expect(
        $('.ht_clone_top thead tr th:not(:first-child)').filter(function() {
          return !$(this).hasClass('hiddenHeader') && !$(this).hasClass('ht__active_highlight');
        }).size()
      ).toEqual(0);
    });

    it('should add selection borders in the expected positions, when selecting multi-columned headers', function() {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
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

      expect($topBorder.offset().top).toEqual($firstRow.offset().top);
      expect($bottomBorder.offset().top).toEqual($lastRow.offset().top + $lastRow.height() - 1);
      expect($topBorder.width()).toEqual($headerLvl3.width() + 1);
      expect($bottomBorder.width()).toEqual($headerLvl3.width() + 1);

      expect($leftBorder.offset().left).toEqual($headerLvl3.offset().left - 1);
      expect($rightBorder.offset().left).toEqual($headerLvl3.offset().left + $headerLvl3.width());
      expect($leftBorder.height()).toEqual($tbody.height() - 1);
      expect($rightBorder.height()).toEqual($tbody.height());
    });
  });
});

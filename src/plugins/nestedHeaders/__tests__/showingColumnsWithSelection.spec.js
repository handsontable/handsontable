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

  describe('showing columns', () => {
    describe('with selection', () => {
      it('should highlight column headers for selected cells', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 13),
          colHeaders: true,
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
            ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
            ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
            ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
              { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ],
        });

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

        hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
        hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
        hot.render();

        selectCells([
          [2, 2, 2, 2], // C3
          [2, 5, 2, 5], // F3
          [2, 11, 2, 11], // L3
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="" colspan="2">B1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="" colspan="2">B2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">B3</th>
              <th class="">F3</th>
            </tr>
            <tr>
              <th class="ht__highlight">B4</th>
              <th class="ht__highlight">F4</th>
            </tr>
          </thead>
          `);

        hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
        hidingMap.setValueAtIndex(11, false); // Show column that contains cells L{n}
        hot.render();

        expect(getSelected()).toEqual([
          [2, 2, 2, 2], // C3
          [2, 5, 2, 5], // F3
          [2, 11, 2, 11], // L3
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="" colspan="3">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">K1</th>
            </tr>
            <tr>
              <th class="" colspan="3">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">K2</th>
            </tr>
            <tr>
              <th class="">B3</th>
              <th class="" colspan="2">F3</th>
              <th class="hiddenHeader"></th>
              <th class="">K3</th>
            </tr>
            <tr>
              <th class="ht__highlight">B4</th>
              <th class="ht__highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight">L4</th>
            </tr>
          </thead>
          `);

        hidingMap.setValueAtIndex(0, false); // Show column that contains cells A{n}
        hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
        hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
        hidingMap.setValueAtIndex(7, false); // Show column that contains cells H{n}
        hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
        hidingMap.setValueAtIndex(11, false); // Show column that contains cells L{n}
        hidingMap.setValueAtIndex(12, false); // Show column that contains cells M{n}
        hot.render();

        expect(getSelected()).toEqual([
          [2, 2, 2, 2], // C3
          [2, 5, 2, 5], // F3
          [2, 11, 2, 11], // L3
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="7">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="7">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="3">B3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="4">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight" colspan="2">B4</th>
              <th class="hiddenHeader"></th>
              <th class="">D4</th>
              <th class="ht__highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">H4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        // Reset map to initial values (all columns hidden)
        hidingMap.setDefaultValues();
        hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
        hot.render();

        expect(getSelected()).toEqual([
          [2, 2, 2, 2], // C3
          [2, 5, 2, 5], // F3
          [2, 11, 2, 11], // L3
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">B1</th>
            </tr>
            <tr>
              <th class="">B2</th>
            </tr>
            <tr>
              <th class="">F3</th>
            </tr>
            <tr>
              <th class="ht__highlight">F4</th>
            </tr>
          </thead>
          `);
      });

      it('should active highlight column headers correctly', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 13),
          colHeaders: true,
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
            ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
            ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
            ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
              { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ],
        });

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

        hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
        hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
        hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
        hidingMap.setValueAtIndex(10, false); // Show column that contains cells K{n}
        hot.render();

        simulateClick(getTopClone().find('thead tr:eq(2) th:eq(2)')); // select column F3
        keyDown('ctrl');
        simulateClick(getTopClone().find('thead tr:eq(1) th:eq(3)')); // select column K2
        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(0)')); // select column B4
        keyUp('ctrl');

        expect(getSelected()).toEqual([
          [-2, 5, 9, 8], // F3 column
          [-3, 10, 9, 12], // K2 column
          [-1, 1, 9, 2], // B4 column
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="" colspan="3">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">K1</th>
            </tr>
            <tr>
              <th class="" colspan="3">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">K2</th>
            </tr>
            <tr>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">F3</th>
              <th class="ht__active_highlight">K3</th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="">D4</th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">K4</th>
            </tr>
          </thead>
          `);

        hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
        hidingMap.setValueAtIndex(11, false); // Show column that contains cells L{n}
        hidingMap.setValueAtIndex(0, false); // Show column that contains cells A{n}
        hot.render();

        expect(getSelected()).toEqual([
          [-2, 5, 9, 8], // F3 column
          [-3, 10, 9, 12], // K2 column
          [-1, 1, 9, 2], // B4 column
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="4">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="4">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="2">F3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="">D4</th>
              <th class="ht__highlight ht__active_highlight">F4</th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">K4</th>
              <th class="ht__highlight ht__active_highlight">L4</th>
            </tr>
          </thead>
          `);

        hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
        hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
        hidingMap.setValueAtIndex(7, false); // Show column that contains cells H{n}
        hidingMap.setValueAtIndex(9, false); // Show column that contains cells J{n}
        hot.render();

        expect(getSelected()).toEqual([
          [-2, 5, 9, 8], // F3 column
          [-3, 10, 9, 12], // K2 column
          [-1, 1, 9, 2], // B4 column
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="7">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="7">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="3">B3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="4">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">B4</th>
              <th class="hiddenHeader"></th>
              <th class="">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight" colspan="2">H4</th>
              <th class="hiddenHeader"></th>
              <th class="">J4</th>
              <th class="ht__highlight ht__active_highlight">K4</th>
              <th class="ht__highlight ht__active_highlight">L4</th>
            </tr>
          </thead>
          `);

        // Reset map to initial values (all columns hidden)
        hidingMap.setDefaultValues();
        hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
        hot.render();

        expect(getSelected()).toEqual([
          [-2, 5, 9, 8], // F3 column
          [-3, 10, 9, 12], // K2 column
          [-1, 1, 9, 2], // B4 column
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="ht__active_highlight">B1</th>
            </tr>
            <tr>
              <th class="ht__active_highlight">B2</th>
            </tr>
            <tr>
              <th class="ht__active_highlight">F3</th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">F4</th>
            </tr>
          </thead>
          `);
      });
    });
  });
});

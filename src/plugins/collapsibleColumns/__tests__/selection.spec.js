describe('CollapsibleColumns', () => {
  const id = 'testContainer';

  function extractDOMStructure(overlayTHead, overlayTBody) {
    const cloneTHeadOverlay = overlayTHead.find('thead')[0].cloneNode(true);
    const cellsRow = overlayTBody ? overlayTBody.find('tbody tr')[0].cloneNode(true).outerHTML : '';

    Array.from(cloneTHeadOverlay.querySelectorAll('th')).forEach((TH) => {
      if (TH.querySelector('.collapsibleIndicator')) {
        TH.classList.add('collapsibleIndicator');
      }
      if (TH.querySelector('.collapsed')) {
        TH.classList.add('collapsed');
      }
      if (TH.querySelector('.expanded')) {
        TH.classList.add('expanded');
      }

      // Simplify header content
      TH.innerText = TH.querySelector('.colHeader').innerText;
      TH.removeAttribute('style');
    });

    return `${cloneTHeadOverlay.outerHTML}${cellsRow ? `<tbody>${cellsRow}</tbody>` : ''}`;
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    if (this.$wrapper) {
      this.$wrapper.remove();
    }
  });

  describe('selection', () => {
    it('should active highlight column header for collapsed column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        nestedHeaders: [
          [{ label: 'A1', colspan: 9 }, 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, { label: 'F3', colspan: 2 }, { label: 'H3', colspan: 2 }, 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ],
        collapsibleColumns: true
      });

      $(getCell(-2, 2)) // Select header "C3"
        .simulate('mousedown')
        .simulate('mouseup');
      $(getCell(-2, 2).querySelector('.collapsibleIndicator')) // Collapse header "C3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="7">A1</th>
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
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="ht__active_highlight collapsibleIndicator collapsed">C3</th>
            <th class="collapsibleIndicator expanded" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="ht__highlight ht__active_highlight">C4</th>
            <th class="">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        `);
      expect(getSelected()).toEqual([[-2, 2, 4, 4]]);
      expect(getSelectedRangeLast().from.toObject()).toEqual({ row: -2, col: 2 });
      expect(getSelectedRangeLast().to.toObject()).toEqual({ row: 4, col: 4 });
      expect(getSelectedRangeLast().highlight.toObject()).toEqual({ row: 0, col: 2 });

      $(getCell(-2, 7).querySelector('.collapsibleIndicator')) // Collapse header "H3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-1, 7)) // Select header "H4"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="6">A1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="3">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="collapsibleIndicator collapsed">C3</th>
            <th class="collapsibleIndicator expanded" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight collapsibleIndicator collapsed">H3</th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">F4</th>
            <th class="">G4</th>
            <th class="ht__highlight ht__active_highlight">H4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        `);
      expect(getSelected()).toEqual([[-1, 7, 4, 7]]);
      expect(getSelectedRangeLast().from.toObject()).toEqual({ row: -1, col: 7 });
      expect(getSelectedRangeLast().to.toObject()).toEqual({ row: 4, col: 7 });
      expect(getSelectedRangeLast().highlight.toObject()).toEqual({ row: 0, col: 7 });

      $(getCell(-2, 5).querySelector('.collapsibleIndicator')) // Collapse header "F3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 5)) // Select header "F3"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="5">A1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F2</th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="collapsibleIndicator collapsed">C3</th>
            <th class="ht__active_highlight collapsibleIndicator collapsed">F3</th>
            <th class="collapsibleIndicator collapsed">H3</th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="ht__highlight ht__active_highlight">F4</th>
            <th class="">H4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        `);
      expect(getSelected()).toEqual([[-2, 5, 4, 6]]);
      expect(getSelectedRangeLast().from.toObject()).toEqual({ row: -2, col: 5 });
      expect(getSelectedRangeLast().to.toObject()).toEqual({ row: 4, col: 6 });
      expect(getSelectedRangeLast().highlight.toObject()).toEqual({ row: 0, col: 5 });

      $(getCell(-3, 5).querySelector('.collapsibleIndicator')) // Collapse header "F2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="4">A1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight collapsibleIndicator collapsed">F2</th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="collapsibleIndicator collapsed">C3</th>
            <th class="ht__active_highlight collapsibleIndicator collapsed">F3</th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="ht__highlight ht__active_highlight">F4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        `);
      expect(getSelected()).toEqual([[-2, 5, 4, 6]]);
      expect(getSelectedRangeLast().from.toObject()).toEqual({ row: -2, col: 5 });
      expect(getSelectedRangeLast().to.toObject()).toEqual({ row: 4, col: 6 });
      expect(getSelectedRangeLast().highlight.toObject()).toEqual({ row: 0, col: 5 });

      $(getCell(-3, 5).querySelector('.collapsibleIndicator')) // Expand header "F2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 5).querySelector('.collapsibleIndicator')) // Expand header "F3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 7).querySelector('.collapsibleIndicator')) // Expand header "H3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="7">A1</th>
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
            <th class="collapsibleIndicator expanded" colspan="2">B2</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
            <th class="collapsibleIndicator collapsed">C3</th>
            <th class="ht__active_highlight collapsibleIndicator expanded" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="ht__highlight ht__active_highlight">F4</th>
            <th class="ht__highlight ht__active_highlight">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        `);
      expect(getSelected()).toEqual([[-2, 5, 4, 6]]);
      expect(getSelectedRangeLast().from.toObject()).toEqual({ row: -2, col: 5 });
      expect(getSelectedRangeLast().to.toObject()).toEqual({ row: 4, col: 6 });
      expect(getSelectedRangeLast().highlight.toObject()).toEqual({ row: 0, col: 5 });
    });

    it('should active highlight column header for non-contiguous selection of the collapsed columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: true
      });

      $(getCell(-2, 7)) // Select header "H4"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 7).querySelector('.collapsibleIndicator')) // Collapse header "H4"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      keyDown('ctrl');

      $(getCell(-1, 5)) // Select header "F5"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // Collapse header "B4"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      $(getCell(-2, 3)) // Select header "D4"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      keyUp('ctrl');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator expanded" colspan="6">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator expanded" colspan="6">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="3">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="3">F3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="ht__active_highlight collapsibleIndicator expanded" colspan="2">D4</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F4</th>
            <th class="hiddenHeader"></th>
            <th class="ht__active_highlight collapsibleIndicator collapsed">H4</th>
            <th class="">J4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="ht__highlight ht__active_highlight">D5</th>
            <th class="ht__highlight ht__active_highlight">E5</th>
            <th class="ht__highlight ht__active_highlight">F5</th>
            <th class="">G5</th>
            <th class="ht__highlight ht__active_highlight">H5</th>
            <th class="">J5</th>
          </tr>
        </thead>
        `);
      expect(getSelected()).toEqual([[-2, 7, 4, 8], [-1, 5, 4, 5], [-2, 3, 4, 4]]);

      $(getCell(-4, 1).querySelector('.collapsibleIndicator')) // Collapse header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="collapsibleIndicator collapsed" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="collapsibleIndicator collapsed" colspan="3">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="collapsibleIndicator expanded" colspan="3">B3</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="collapsibleIndicator collapsed">B4</th>
            <th class="ht__active_highlight collapsibleIndicator expanded" colspan="2">D4</th>
            <th class="hiddenHeader"></th>
            <th class="">J4</th>
          </tr>
          <tr>
            <th class="">A5</th>
            <th class="">B5</th>
            <th class="ht__highlight ht__active_highlight">D5</th>
            <th class="ht__highlight ht__active_highlight">E5</th>
            <th class="">J5</th>
          </tr>
        </thead>
        `);
      expect(getSelected()).toEqual([[-2, 7, 4, 8], [-1, 5, 4, 5], [-2, 3, 4, 4]]);
    });

    it('should active highlight the column header when the header is collpased to the same colspan width as its child', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true
      });

      $(getCell(-1, 0)) // Select header "A3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="10">A1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="ht__active_highlight">A2</th>
            <th class="collapsibleIndicator expanded" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="ht__highlight ht__active_highlight">A3</th>
            <th class="collapsibleIndicator expanded" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);
      expect(getSelected()).toEqual([[-1, 0, 4, 0]]);
      expect(getSelectedRangeLast().from.toObject()).toEqual({ row: -1, col: 0 });
      expect(getSelectedRangeLast().to.toObject()).toEqual({ row: 4, col: 0 });
      expect(getSelectedRangeLast().highlight.toObject()).toEqual({ row: 0, col: 0 });

      $(getCell(-3, 0).querySelector('.collapsibleIndicator')) // Collapse header "A1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="ht__active_highlight collapsibleIndicator collapsed">A1</th>
          </tr>
          <tr>
            <th class="ht__active_highlight">A2</th>
          </tr>
          <tr>
            <th class="ht__highlight ht__active_highlight">A3</th>
          </tr>
        </thead>
        `);
      expect(getSelected()).toEqual([[-1, 0, 4, 0]]);
      expect(getSelectedRangeLast().from.toObject()).toEqual({ row: -1, col: 0 });
      expect(getSelectedRangeLast().to.toObject()).toEqual({ row: 4, col: 0 });
      expect(getSelectedRangeLast().highlight.toObject()).toEqual({ row: 0, col: 0 });

      $(getCell(-3, 0).querySelector('.collapsibleIndicator')) // Expand header "A1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="collapsibleIndicator expanded" colspan="10">A1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="ht__active_highlight">A2</th>
            <th class="collapsibleIndicator expanded" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="4">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="ht__highlight ht__active_highlight">A3</th>
            <th class="collapsibleIndicator expanded" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">D3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="collapsibleIndicator expanded" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
        </thead>
        `);
      expect(getSelected()).toEqual([[-1, 0, 4, 0]]);
      expect(getSelectedRangeLast().from.toObject()).toEqual({ row: -1, col: 0 });
      expect(getSelectedRangeLast().to.toObject()).toEqual({ row: 4, col: 0 });
      expect(getSelectedRangeLast().highlight.toObject()).toEqual({ row: 0, col: 0 });
    });
  });
});

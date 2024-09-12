describe('CollapsibleColumns Hooks', () => {
  beforeEach(function() {
    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class', 'colspan']
      }
    };
  });

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

  it('should set "successfullyCollapsed" argument of "afterColumnCollapse" hook as `false` after trying collapsing already collapsed column', () => {
    const afterColumnCollapse = jasmine.createSpy('afterColumnCollapse');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      nestedHeaders: [
        ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
        ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
      ],
      collapsibleColumns: true,
      afterColumnCollapse,
    });

    const plugin = getPlugin('collapsibleColumns');

    plugin.collapseSection({ row: -2, col: 1 });

    expect(afterColumnCollapse).toHaveBeenCalledWith([], [3, 4], true, true);

    plugin.collapseSection({ row: -2, col: 1 });

    expect(afterColumnCollapse).toHaveBeenCalledWith([3, 4], [3, 4], false, false);
  });

  it('should set "successfullyExpanded" argument of "afterColumnExpand" hook as `false` after trying expanding already expanded column', () => {
    const afterColumnExpand = jasmine.createSpy('afterColumnExpand');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      nestedHeaders: [
        ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
        ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
      ],
      collapsibleColumns: true,
      afterColumnExpand,
    });

    const plugin = getPlugin('collapsibleColumns');

    plugin.collapseAll();

    plugin.expandSection({ row: -2, col: 1 }); // header "B1"

    expect(afterColumnExpand).toHaveBeenCalledWith([2, 3, 4], [2], true, true);

    plugin.expandSection({ row: -2, col: 1 }); // header "B1"

    expect(afterColumnExpand).toHaveBeenCalledWith([2], [2], false, false);
  });

  it('should set "successfullyCollapsed" and "collapsePossible" arguments in hooks as `false` when trying colapse headers ' +
     'without "collapsible" attribute', () => {
    const beforeColumnCollapse = jasmine.createSpy('beforeColumnCollapse');
    const afterColumnCollapse = jasmine.createSpy('afterColumnCollapse');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      nestedHeaders: [
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
          { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ],
      collapsibleColumns: [
        { row: -4, col: 1, collapsible: true },
        { row: -3, col: 1, collapsible: true },
        { row: -2, col: 1, collapsible: true },
        { row: -2, col: 3, collapsible: true }
      ],
      beforeColumnCollapse,
      afterColumnCollapse,
    });

    const plugin = getPlugin('collapsibleColumns');

    plugin.collapseSection({ row: -1, col: 1 });

    expect(beforeColumnCollapse).toHaveBeenCalledWith([], [], false);
    expect(afterColumnCollapse).toHaveBeenCalledWith([], [], false, false);
  });

  it('should set "successfullyExpanded" and "expandPossible" arguments in hooks as `false` when trying expand headers ' +
     'without "collapsible" attribute', () => {
    const beforeColumnExpand = jasmine.createSpy('beforeColumnExpand');
    const afterColumnExpand = jasmine.createSpy('afterColumnExpand');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      nestedHeaders: [
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
          { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ],
      collapsibleColumns: [
        { row: -3, col: 1, collapsible: true },
        { row: -2, col: 1, collapsible: true },
        { row: -2, col: 3, collapsible: true }
      ],
      beforeColumnExpand,
      afterColumnExpand,
    });

    const plugin = getPlugin('collapsibleColumns');

    plugin.collapseAll();

    plugin.expandSection({ row: -4, col: 1 }); // header "B"

    expect(beforeColumnExpand).toHaveBeenCalledWith([2, 3, 4], [2, 3, 4], false);
    expect(afterColumnExpand).toHaveBeenCalledWith([2, 3, 4], [2, 3, 4], false, false);
  });

  it('should not trigger "afterColumnCollapse" hook when "beforeColumnCollapse" returns `false`', () => {
    const afterColumnCollapse = jasmine.createSpy('afterColumnCollapse');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      nestedHeaders: [
        ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
        ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
      ],
      collapsibleColumns: true,
      beforeColumnCollapse: () => false,
      afterColumnCollapse,
    });

    const plugin = getPlugin('collapsibleColumns');

    plugin.collapseSection({ row: -1, col: 1 }); // header "B2"
    plugin.collapseSection({ row: -1, col: 3 }); // header "D2"
    plugin.collapseSection({ row: -2, col: 1 }); // header "B1"

    expect(afterColumnCollapse).not.toHaveBeenCalled();
    expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
      <thead>
        <tr>
          <th class="">A1</th>
          <th class="collapsibleIndicator expanded" colspan="4">B1</th>
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
          <th class="collapsibleIndicator expanded" colspan="2">B2</th>
          <th class="hiddenHeader"></th>
          <th class="collapsibleIndicator expanded" colspan="2">D2</th>
          <th class="hiddenHeader"></th>
          <th class="">F2</th>
          <th class="">G2</th>
          <th class="">H2</th>
          <th class="">I2</th>
          <th class="">J2</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ht__row_odd">
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

  it('should not trigger "afterColumnExpand" hook when "beforeColumnExpand" returns `false`', () => {
    const afterColumnExpand = jasmine.createSpy('afterColumnExpand');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      nestedHeaders: [
        ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
        ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
      ],
      collapsibleColumns: true,
      beforeColumnExpand: () => false,
      afterColumnExpand,
    });

    const plugin = getPlugin('collapsibleColumns');

    plugin.collapseAll();

    plugin.expandSection({ row: -2, col: 1 }); // header "B1"

    expect(afterColumnExpand).not.toHaveBeenCalled();
    expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
      <thead>
        <tr>
          <th class="">A1</th>
          <th class="collapsibleIndicator collapsed">B1</th>
          <th class="">F1</th>
          <th class="">G1</th>
          <th class="">H1</th>
          <th class="">I1</th>
          <th class="">J1</th>
        </tr>
        <tr>
          <th class="">A2</th>
          <th class="collapsibleIndicator collapsed">B2</th>
          <th class="">F2</th>
          <th class="">G2</th>
          <th class="">H2</th>
          <th class="">I2</th>
          <th class="">J2</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ht__row_odd">
          <td class="">A1</td>
          <td class="">B1</td>
          <td class="">F1</td>
          <td class="">G1</td>
          <td class="">H1</td>
          <td class="">I1</td>
          <td class="">J1</td>
        </tr>
      </tbody>
      `);
  });

  it('should block specified column from collapsing using custom logic from the "beforeColumnCollapse" hook', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      nestedHeaders: [
        ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
        ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
      ],
      collapsibleColumns: true,
      beforeColumnCollapse: (currentCollapsedColumns, destinationCollapsedColumns) => {
        if (destinationCollapsedColumns.includes(2)) {
          return false;
        }
      },
    });

    const plugin = getPlugin('collapsibleColumns');

    plugin.collapseSection({ row: -2, col: 1 });

    expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
      <thead>
        <tr>
          <th class="">A1</th>
          <th class="collapsibleIndicator collapsed" colspan="2">B1</th>
          <th class="hiddenHeader"></th>
          <th class="">F1</th>
          <th class="">G1</th>
          <th class="">H1</th>
          <th class="">I1</th>
          <th class="">J1</th>
        </tr>
        <tr>
          <th class="">A2</th>
          <th class="collapsibleIndicator expanded" colspan="2">B2</th>
          <th class="hiddenHeader"></th>
          <th class="">F2</th>
          <th class="">G2</th>
          <th class="">H2</th>
          <th class="">I2</th>
          <th class="">J2</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ht__row_odd">
          <td class="">A1</td>
          <td class="">B1</td>
          <td class="">C1</td>
          <td class="">F1</td>
          <td class="">G1</td>
          <td class="">H1</td>
          <td class="">I1</td>
          <td class="">J1</td>
        </tr>
      </tbody>
      `);

    // This call will be blocked by hook.
    plugin.collapseSection({ row: -1, col: 1 });

    expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
      <thead>
        <tr>
          <th class="">A1</th>
          <th class="collapsibleIndicator collapsed" colspan="2">B1</th>
          <th class="hiddenHeader"></th>
          <th class="">F1</th>
          <th class="">G1</th>
          <th class="">H1</th>
          <th class="">I1</th>
          <th class="">J1</th>
        </tr>
        <tr>
          <th class="">A2</th>
          <th class="collapsibleIndicator expanded" colspan="2">B2</th>
          <th class="hiddenHeader"></th>
          <th class="">F2</th>
          <th class="">G2</th>
          <th class="">H2</th>
          <th class="">I2</th>
          <th class="">J2</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ht__row_odd">
          <td class="">A1</td>
          <td class="">B1</td>
          <td class="">C1</td>
          <td class="">F1</td>
          <td class="">G1</td>
          <td class="">H1</td>
          <td class="">I1</td>
          <td class="">J1</td>
        </tr>
      </tbody>
      `);
  });

  it('should block specified column from expanding using custom logic from the "beforeColumnExpand" hook', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      nestedHeaders: [
        ['A1', { label: 'B1', colspan: 2 }, { label: 'D1', colspan: 2 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
        ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
      ],
      collapsibleColumns: true,
      beforeColumnExpand: (currentExpandedColumns, destinationExpandedColumns) => {
        if (currentExpandedColumns.includes(4) && destinationExpandedColumns.length === 0) {
          return false;
        }
      },
    });

    const plugin = getPlugin('collapsibleColumns');

    plugin.collapseAll();
    plugin.expandSection({ row: -2, col: 1 }); // header "B1"

    expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
      <thead>
        <tr>
          <th class="">A1</th>
          <th class="collapsibleIndicator expanded" colspan="2">B1</th>
          <th class="hiddenHeader"></th>
          <th class="collapsibleIndicator collapsed">D1</th>
          <th class="">F1</th>
          <th class="">G1</th>
          <th class="">H1</th>
          <th class="">I1</th>
          <th class="">J1</th>
        </tr>
        <tr>
          <th class="">A2</th>
          <th class="collapsibleIndicator expanded" colspan="2">B2</th>
          <th class="hiddenHeader"></th>
          <th class="collapsibleIndicator collapsed">D2</th>
          <th class="">F2</th>
          <th class="">G2</th>
          <th class="">H2</th>
          <th class="">I2</th>
          <th class="">J2</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ht__row_odd">
          <td class="">A1</td>
          <td class="">B1</td>
          <td class="">C1</td>
          <td class="">D1</td>
          <td class="">F1</td>
          <td class="">G1</td>
          <td class="">H1</td>
          <td class="">I1</td>
          <td class="">J1</td>
        </tr>
      </tbody>
      `);

    // This call will be blocked by hook.
    plugin.expandSection({ row: -2, col: 3 }); // header "D1"

    expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
      <thead>
        <tr>
          <th class="">A1</th>
          <th class="collapsibleIndicator expanded" colspan="2">B1</th>
          <th class="hiddenHeader"></th>
          <th class="collapsibleIndicator collapsed">D1</th>
          <th class="">F1</th>
          <th class="">G1</th>
          <th class="">H1</th>
          <th class="">I1</th>
          <th class="">J1</th>
        </tr>
        <tr>
          <th class="">A2</th>
          <th class="collapsibleIndicator expanded" colspan="2">B2</th>
          <th class="hiddenHeader"></th>
          <th class="collapsibleIndicator collapsed">D2</th>
          <th class="">F2</th>
          <th class="">G2</th>
          <th class="">H2</th>
          <th class="">I2</th>
          <th class="">J2</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ht__row_odd">
          <td class="">A1</td>
          <td class="">B1</td>
          <td class="">C1</td>
          <td class="">D1</td>
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

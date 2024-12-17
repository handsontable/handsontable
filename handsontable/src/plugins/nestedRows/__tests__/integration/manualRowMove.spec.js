describe('NestedRows cooperation with ManualRowMove plugin', () => {
  const id = 'testContainer';
  const dataInOrder = [
    ['a0', 'b0'],
    ['a0-a0', 'b0-b0'],
    ['a0-a1', 'b0-b1'],
    ['a0-a2', 'b0-b2'],
    ['a0-a2-a0', 'b0-b2-b0'],
    ['a0-a2-a0-a0', 'b0-b2-b0-b0'],
    ['a0-a3', 'b0-b3'],
    ['a1', 'b1'],
    ['a2', 'b2'],
    ['a2-a0', 'b2-b0'],
    ['a2-a1', 'b2-b1'],
    ['a2-a1-a0', 'b2-b1-b0'],
    ['a2-a1-a1', 'b2-b1-b1']
  ];

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should display the right amount of entries when the plugin is enabled', () => {
    const hot = handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true,
      manualRowMove: true
    });

    expect(hot.getData().length).toEqual(13);
  });

  it('should move child which is under a parent to the another position, also under the same parent', () => {
    handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true
    });

    getPlugin('manualRowMove').dragRow(2, 1);

    expect(getDataAtCell(1, 0)).toEqual('a0-a1');
    expect(getDataAtCell(2, 0)).toEqual('a0-a0');

    getPlugin('manualRowMove').dragRow(1, 3);

    expect(getDataAtCell(1, 0)).toEqual('a0-a0');
    expect(getDataAtCell(2, 0)).toEqual('a0-a1');
  });

  it('should not move rows when any of them is a parent, regardless of if it\'s collapsed or not (and not throw any' +
    ' errors in the process)', () => {
    handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true
    });

    let errorCount = 0;

    try {
      getPlugin('manualRowMove').dragRows([0, 1], 2);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').dragRows([1, 0], 2);

      expect(getData()).toEqual(dataInOrder);

    } catch (err) {
      errorCount += 1;
    }

    hot().getPlugin('nestedRows').collapsingUI.collapseChildren(0);
    hot().getPlugin('nestedRows').collapsingUI.collapseChildren(8);

    try {
      getPlugin('manualRowMove').dragRows([1], 2);

    } catch (err) {
      errorCount += 1;
    }

    hot().getPlugin('nestedRows').collapsingUI.expandChildren(0);
    hot().getPlugin('nestedRows').collapsingUI.expandChildren(8);

    expect(getData()).toEqual(dataInOrder);

    expect(errorCount).toEqual(0);
  });

  it('should not move rows when they are on the highest level of nesting (don\'t have a parent)', () => {
    handsontable({
      data: [
        {
          category: 'Best Metal Performance',
          __children: [
            {
              artist: 'Ghost',
            },
            {
              artist: 'Slipknot',
            }
          ]
        },
        {
          category: 'Best Rock Song'
        },
        {
          category: 'test',
          __children: []
        }
      ],
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
      columns: [
        {
          data: 'category'
        },
        {
          data: 'artist'
        }
      ]
    });

    getPlugin('manualRowMove').dragRows([3], 1);
    getPlugin('manualRowMove').dragRows([4], 1);

    expect(getData()).toEqual([
      ['Best Metal Performance', null],
      [null, 'Ghost'],
      [null, 'Slipknot'],
      ['Best Rock Song', null],
      ['test', null],
    ]);
  });

  // Another work than the `ManualRowMove` plugin.
  it('should not move rows when any of them is tried to be moved to the position of moved row', () => {
    handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true
    });

    getPlugin('manualRowMove').dragRows([1, 2], 1);

    expect(getData()).toEqual(dataInOrder);

    getPlugin('manualRowMove').dragRows([2, 1], 1);

    expect(getData()).toEqual(dataInOrder);

    getPlugin('manualRowMove').dragRows([1, 2], 2);

    expect(getData()).toEqual(dataInOrder);

    getPlugin('manualRowMove').dragRows([2, 1], 2);

    expect(getData()).toEqual(dataInOrder);
  });

  it('should move row to the first parent of destination row when there was a try ' +
    'of moving it on the row being a parent #1', () => {
    handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true
    });

    const firstParent = getPlugin('nestedRows').dataManager.getRowParent(12);

    expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(2);

    getPlugin('manualRowMove').dragRow(12, 4);

    // First parent to the primary destination row.
    expect(getDataAtCell(3, 0)).toEqual('a0-a2');
    expect(getPlugin('nestedRows').dataManager.isParent(3)).toBeTruthy();

    expect(getDataAtCell(4, 0)).toEqual('a2-a1-a1');
    expect(getPlugin('nestedRows').dataManager.isParent(4)).toBeFalsy();

    expect(getDataAtCell(5, 0)).toEqual('a0-a2-a0');
    expect(getPlugin('nestedRows').dataManager.isParent(5)).toBeTruthy();

    expect(getDataAtCell(6, 0)).toEqual('a0-a2-a0-a0');
    expect(getPlugin('nestedRows').dataManager.isParent(6)).toBeFalsy();

    // Moved row.
    expect(getDataAtCell(4, 0)).toEqual('a2-a1-a1');

    // Previous parent of moved row.
    expect(getDataAtCell(11, 0)).toEqual('a2-a1');

    expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(1);
  });

  it('should move row to the first parent of destination row when there was a try ' +
    'of moving it on the row being a parent #2', () => {
    handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true
    });

    const firstParent = getPlugin('nestedRows').dataManager.getRowParent(12);

    expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(2);

    getPlugin('manualRowMove').dragRow(12, 10);

    // First parent to the primary destination row.
    expect(getDataAtCell(8, 0)).toEqual('a2');
    expect(getPlugin('nestedRows').dataManager.isParent(8)).toBeTruthy();

    expect(getDataAtCell(9, 0)).toEqual('a2-a0');
    expect(getPlugin('nestedRows').dataManager.isParent(9)).toBeFalsy();

    expect(getDataAtCell(10, 0)).toEqual('a2-a1-a1');
    expect(getPlugin('nestedRows').dataManager.isParent(10)).toBeFalsy();

    // Previous parent of moved row.
    expect(getDataAtCell(11, 0)).toEqual('a2-a1');
    expect(getPlugin('nestedRows').dataManager.isParent(11)).toBeTruthy();
    expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(1);

    expect(getDataAtCell(12, 0)).toEqual('a2-a1-a0');
    expect(getPlugin('nestedRows').dataManager.isParent(12)).toBeFalsy();
  });

  it('should add row to element as child when there is no parent of final destination row', () => {
    const hot = handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true
    });

    expect(getPlugin('nestedRows').dataManager.isParent(8)).toBeTruthy();
    expect(getPlugin('nestedRows').dataManager.isParent(7)).toBeFalsy();

    // Row placed at index 8 is row being a parent.
    getPlugin('manualRowMove').dragRow(1, 8);
    hot.render();

    const finalParent = getPlugin('nestedRows').dataManager.getRowParent(7);

    // Row at index 6 is row which was primary placed at index 7.
    expect(getDataAtCell(6, 0)).toEqual('a1');
    expect(getPlugin('nestedRows').dataManager.isParent(6)).toBeTruthy();
    expect(getPlugin('nestedRows').dataManager.countChildren(finalParent)).toBe(1);

    // Row at index 7 is row which was primary placed at index 8.
    expect(getDataAtCell(7, 0)).toEqual('a0-a0');
  });

  it('should not move any rows, when trying to move a row above a parent, when the parent is the first row in the' +
    ' table', () => {
    handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true
    });

    getPlugin('manualRowMove').dragRow(1, 0);

    expect(getData()).toEqual(dataInOrder);

    getPlugin('manualRowMove').dragRow(11, 0);

    expect(getData()).toEqual(dataInOrder);
  });

  it('should move single row between parents properly (moving from the top to the bottom)', () => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true
    });

    const $targetHeader = spec().$container.find('tbody tr:eq(6) th:eq(0)');

    spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');
    spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseup');
    spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      clientY: $targetHeader.offset().top + $targetHeader.height()
    });

    $targetHeader.simulate('mouseup');

    expect(getDataAtCell(0, 0)).toEqual('Best Rock Performance');
    expect(getDataAtCell(1, 1)).toEqual('Florence & The Machine');
    expect(getDataAtCell(5, 0)).toEqual('Best Metal Performance');
    expect(getDataAtCell(6, 1)).toEqual('Alabama Shakes');
    expect(getSelectedLast()).toEqual([6, 0, 6, 3]);
  });

  it('should move single row between parents properly (moving from the bottom to the top)', () => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
    });

    const $fromHeader = spec().$container.find('tbody tr:eq(7) th:eq(0)');
    const $targetHeader = spec().$container.find('tbody tr:eq(1) th:eq(0)');

    $fromHeader.simulate('mousedown');
    $fromHeader.simulate('mouseup');
    $fromHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      offsetX: 5,
      offsetY: 5,
    });

    $targetHeader.simulate('mouseup');

    expect(getDataAtCell(0, 0)).toEqual('Best Rock Performance');
    expect(getDataAtCell(1, 1)).toEqual('Ghost');
    expect(getDataAtCell(7, 0)).toEqual('Best Metal Performance');
    expect(getDataAtCell(8, 1)).toEqual('August Burns Red');
    expect(getSelectedLast()).toEqual([1, 0, 1, 3]);
  });

  it('should be possible to move multiple rows within one parent and between two parents', () => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
      width: 500,
      height: 1000
    });

    let firstBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(2) th:eq(0)');
    let secondBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(3) th:eq(0)');
    let $targetHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(5) th:eq(0)');

    firstBaseHeader.simulate('mousedown');
    secondBaseHeader.simulate('mouseover');
    secondBaseHeader.simulate('mousemove');
    secondBaseHeader.simulate('mouseup');
    secondBaseHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      offsetX: 5,
      offsetY: 5,
    });

    $targetHeader.simulate('mouseup');

    expect(getDataAtCell(1, 1)).toEqual('Alabama Shakes');
    expect(getDataAtCell(2, 1)).toEqual('Elle King');
    expect(getDataAtCell(3, 1)).toEqual('Florence & The Machine');
    expect(getDataAtCell(4, 1)).toEqual('Foo Fighters');
    expect(getDataAtCell(5, 1)).toEqual('Wolf Alice');

    firstBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(7) th:eq(0)');
    secondBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(9) th:eq(0)');
    $targetHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(5) th:eq(0)');

    firstBaseHeader.simulate('mousedown');
    secondBaseHeader.simulate('mouseover');
    secondBaseHeader.simulate('mousemove');
    secondBaseHeader.simulate('mouseup');
    secondBaseHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      offsetX: 5,
      offsetY: 5,
    });

    $targetHeader.simulate('mouseup');

    expect(getDataAtCell(1, 1)).toEqual('Alabama Shakes');
    expect(getDataAtCell(2, 1)).toEqual('Elle King');
    expect(getDataAtCell(3, 1)).toEqual('Florence & The Machine');
    expect(getDataAtCell(4, 1)).toEqual('Foo Fighters');
    expect(getDataAtCell(5, 1)).toEqual('Ghost');
    expect(getDataAtCell(6, 1)).toEqual('August Burns Red');
    expect(getDataAtCell(7, 1)).toEqual('Lamb Of God');
    expect(getDataAtCell(8, 1)).toEqual('Wolf Alice');

    const dataManager = getPlugin('nestedRows').dataManager;

    expect(dataManager.countChildren(0)).toEqual(8);
    expect(dataManager.countChildren(9)).toEqual(2);
  });

  it('should be possible to move multiple rows between two parents on different levels', () => {
    handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
      width: 500,
      height: 1000
    });

    const firstBaseHeader = spec().$container.find('tbody tr:eq(11) th:eq(0)');
    const secondBaseHeader = spec().$container.find('tbody tr:eq(12) th:eq(0)');
    const $targetHeader = spec().$container.find('tbody tr:eq(5) th:eq(0)');

    firstBaseHeader.simulate('mousedown');
    secondBaseHeader.simulate('mouseover');
    secondBaseHeader.simulate('mousemove');
    secondBaseHeader.simulate('mouseup');
    secondBaseHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      offsetX: 5,
      offsetY: 10,
    });

    $targetHeader.simulate('mouseup');

    expect(getDataAtCell(4, 0)).toEqual('a0-a2-a0');
    expect(getDataAtCell(5, 0)).toEqual('a2-a1-a0');
    expect(getDataAtCell(6, 0)).toEqual('a2-a1-a1');
    expect(getDataAtCell(7, 0)).toEqual('a0-a2-a0-a0');

    const dataManager = getPlugin('nestedRows').dataManager;

    expect(dataManager.countChildren(4)).toEqual(3);
    expect(dataManager.countChildren(12)).toEqual(0);
  });

  it('should be possible to move rows to the last row of the table', () => {
    handsontable({
      data: getMoreComplexNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
      width: 500,
      height: 500
    });

    const firstBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(0)');
    const secondBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(2) th:eq(0)');
    const $targetHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(12) th:eq(0)');

    firstBaseHeader.simulate('mousedown');
    secondBaseHeader.simulate('mouseover');
    secondBaseHeader.simulate('mousemove');
    secondBaseHeader.simulate('mouseup');
    secondBaseHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      clientY: $targetHeader.offset().top + 15
    });

    $targetHeader.simulate('mouseup');

    expect(getDataAtCell(0, 0)).toEqual('a0');
    expect(getDataAtCell(1, 0)).toEqual('a0-a2');
    expect(getDataAtCell(11, 0)).toEqual('a0-a0');
    expect(getDataAtCell(12, 0)).toEqual('a0-a1');

    const dataManager = getPlugin('nestedRows').dataManager;

    expect(dataManager.countChildren(0)).toEqual(4);
    expect(dataManager.countChildren(8)).toEqual(4);
  });

  it('should be possible to move rows after the last child of a parent', () => {
    const hot = handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
      width: 500,
      height: 500
    });

    hot.getPlugin('nestedRows').collapsingUI.collapseChildren(6);

    const firstBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(10) th:eq(0)');
    const secondBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(11) th:eq(0)');
    const $targetHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(6) th:eq(0)');

    firstBaseHeader.simulate('mousedown');
    secondBaseHeader.simulate('mouseover');
    secondBaseHeader.simulate('mousemove');
    secondBaseHeader.simulate('mouseup');
    secondBaseHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      offsetX: 5,
      offsetY: 5,
    });

    $targetHeader.simulate('mouseup');

    expect(getDataAtCell(6, 1)).toEqual('James Bay');
    expect(getDataAtCell(7, 1)).toEqual('Highly Suspect');
    expect(getDataAtCell(11, 1)).toEqual('Elle King');
    expect(getDataAtCell(12, 1)).toEqual('Florence & The Machine');
  });

  it('should be possible to move rows after the last child of a parent along with its meta data', () => {
    const hot = handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
      width: 500,
      height: 500
    });

    hot.setCellMeta(1, 0, 'className', 'htSearchResult');
    hot.setCellMeta(2, 0, 'className', 'htSearchResult');

    const firstBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(0)');
    const secondBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(2) th:eq(0)');
    const $targetHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(6) th:eq(0)');

    firstBaseHeader.simulate('mousedown');
    secondBaseHeader.simulate('mouseover');
    secondBaseHeader.simulate('mousemove');
    secondBaseHeader.simulate('mouseup');
    secondBaseHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      offsetX: 5,
      offsetY: 5,
    });

    $targetHeader.simulate('mouseup');

    expect(hot.getCellMeta(4, 0).className.includes('htSearchResult')).toBe(true);
    expect(hot.getCellMeta(5, 0).className.includes('htSearchResult')).toBe(true);
  });

  it('should be possible to move rows into a collapsed parent (they should be placed as their last child)', () => {
    const hot = handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
      width: 500,
      height: 500
    });

    hot.getPlugin('nestedRows').collapsingUI.collapseChildren(6);

    const firstBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(11) th:eq(0)');
    const secondBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(12) th:eq(0)');
    const $targetHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(6) th:eq(0)');

    firstBaseHeader.simulate('mousedown');
    secondBaseHeader.simulate('mouseover');
    secondBaseHeader.simulate('mousemove');
    secondBaseHeader.simulate('mouseup');
    secondBaseHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      clientY: $targetHeader.offset().top + 15
    });

    $targetHeader.simulate('mouseup');

    expect(getDataAtCell(9, 1)).toEqual('Elle King');
    expect(getDataAtCell(10, 1)).toEqual('James Bay');

    const dataManager = getPlugin('nestedRows').dataManager;

    expect(dataManager.countChildren(6)).toEqual(7);
    expect(dataManager.countChildren(14)).toEqual(3);

    expect(dataManager.getDataObject(6).__children.pop().artist).toEqual('Florence & The Machine');
    expect(dataManager.getDataObject(6).__children.pop().artist).toEqual('Highly Suspect');
  });

  it('should not expand and parents, if they were collapsed at the time of moving rows', () => {
    const hot = handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
      width: 500,
      height: 500
    });

    hot.getPlugin('nestedRows').collapsingUI.collapseChildren(6);
    hot.getPlugin('nestedRows').collapsingUI.collapseChildren(12);

    const firstBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(0)');
    const secondBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(2) th:eq(0)');
    const $targetHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(7) th:eq(0)');

    firstBaseHeader.simulate('mousedown');
    secondBaseHeader.simulate('mouseover');
    secondBaseHeader.simulate('mousemove');
    secondBaseHeader.simulate('mouseup');
    secondBaseHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      clientY: $targetHeader.offset().top + 5
    });

    $targetHeader.simulate('mouseup');

    expect(getDataAtCell(4, 0)).toEqual('Best Metal Performance');
    expect(getDataAtCell(5, 0)).toEqual('Best Rock Song');

    const collapsingUI = getPlugin('nestedRows').collapsingUI;

    expect(collapsingUI.areChildrenCollapsed(4)).toBe(true);
    expect(collapsingUI.areChildrenCollapsed(12)).toBe(true);
  });

  it('should not expand and parents, if they were collapsed at the time of inserting rows', () => {
    const hot = handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
      contextMenu: true,
    });

    const collapsingUI = getPlugin('nestedRows').collapsingUI;

    collapsingUI.collapseChildren(6);
    collapsingUI.collapseChildren(12);

    hot.selectCell(7, 0);

    contextMenu();

    $('.htContextMenu .ht_master .htCore')
      .find('tbody td')
      .not('.htSeparator')
      .eq(3) // Insert row below
      .simulate('mousedown')
      .simulate('mouseup');

    expect(collapsingUI.areChildrenCollapsed(6)).toBe(true);
    expect(collapsingUI.areChildrenCollapsed(12)).toBe(true);
  });

  it('should select the collapsed parent after rows were moved inside of it', () => {
    const hot = handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true,
      width: 500,
      height: 500
    });

    hot.getPlugin('nestedRows').collapsingUI.collapseChildren(6);
    hot.getPlugin('nestedRows').collapsingUI.collapseChildren(12);

    let firstBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(0)');
    let secondBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(2) th:eq(0)');
    let $targetHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(7) th:eq(0)');

    firstBaseHeader.simulate('mousedown');
    secondBaseHeader.simulate('mouseover');
    secondBaseHeader.simulate('mousemove');
    secondBaseHeader.simulate('mouseup');
    secondBaseHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      offsetX: 5,
      offsetY: 5,
    });

    $targetHeader.simulate('mouseup');

    expect(getSelected()[0]).toEqual([4, 0, 4, 3]);

    firstBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(0)');
    secondBaseHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(2) th:eq(0)');
    $targetHeader = spec().$container.find('.ht_clone_inline_start tbody tr:eq(5) th:eq(0)');

    firstBaseHeader.simulate('mousedown');
    secondBaseHeader.simulate('mouseover');
    secondBaseHeader.simulate('mousemove');
    secondBaseHeader.simulate('mouseup');
    secondBaseHeader.simulate('mousedown');

    $targetHeader.simulate('mouseover');
    $targetHeader.simulate('mousemove', {
      clientY: $targetHeader.offset().top + 15
    });

    $targetHeader.simulate('mouseup');

    expect(getSelected()[0]).toEqual([3, 0, 3, 3]);
  });

  it('should not scroll the viewport after row moving (#dev-2103)', () => {
    handsontable({
      data: getSimplerNestedData(),
      width: 300,
      height: 200,
      nestedRows: true,
      manualRowMove: true,
      rowHeaders: true
    });

    getPlugin('manualRowMove').dragRow(2, 4);

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(topOverlay().getScrollPosition()).toBe(0);
  });
});

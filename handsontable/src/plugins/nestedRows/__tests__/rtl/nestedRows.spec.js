describe('NestedRows (RTL)', () => {
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
    $('html').attr('dir', 'rtl');

    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Displaying a nested structure', () => {
    it('should display as many rows as there are overall elements in a nested structure', () => {
      const hot = handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true
      });

      expect(hot.countRows()).toEqual(13);
    });

    it('should display all nested structure elements in correct order (parent, its children, ' +
      'its children children, next parent etc)', () => {
      const hot = handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true
      });

      expect(hot.getData()).toEqual(dataInOrder);
    });
  });

  it('should allow user to detach already added child', () => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      contextMenu: true
    });

    selectCell(0, 0);
    contextMenu();
    $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(0)
      .simulate('mousedown').simulate('mouseup'); // Insert child row.

    selectCell(6, 0);
    contextMenu();
    $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(1)
      .simulate('mousedown').simulate('mouseup'); // Detach from parent.

    expect(getDataAtCell(6, 0)).toEqual('Best Metal Performance');
    expect(getDataAtCell(18, 1)).toEqual(null);

    // Added and then detached child.
    expect(getPlugin('nestedRows').dataManager.isParent(18)).toBeFalsy();
  });

  it('should allow user to insert row below and above the parent', () => {
    handsontable({
      data: getSimplerNestedData(),
      nestedRows: true,
      contextMenu: true
    });

    selectCell(0, 0);
    contextMenu();

    $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2)
      .simulate('mousedown').simulate('mouseup'); // Insert row above.
    expect(getDataAtRow(0)).toEqual([null, null, null, null]);
    expect(getDataAtRow(1)).toEqual(['Best Rock Performance', null, null, null]);
    expect(getDataAtRow(2)).toEqual([null, 'Alabama Shakes', 'Don\'t Wanna Fight', 'ATO Records']);
    expect(getDataAtRow(7)).toEqual(['Best Metal Performance', null, null, null]);

    selectCell(1, 0);
    contextMenu();

    $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3)
      .simulate('mousedown').simulate('mouseup'); // Insert row below.

    expect(getDataAtRow(0)).toEqual([null, null, null, null]);
    expect(getDataAtRow(1)).toEqual(['Best Rock Performance', null, null, null]);
    expect(getDataAtRow(2)).toEqual([null, 'Alabama Shakes', 'Don\'t Wanna Fight', 'ATO Records']);
    expect(getDataAtRow(7)).toEqual([null, null, null, null]);
    expect(getDataAtRow(8)).toEqual(['Best Metal Performance', null, null, null]);
  });

  describe('UI', () => {
    using('configuration object', [
      { htmlDir: 'rtl', layoutDirection: 'inherit' },
      { htmlDir: 'ltr', layoutDirection: 'rtl' },
    ], ({ htmlDir, layoutDirection }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      it.forTheme('classic')('should display indicators properly located', () => {
        const hot = handsontable({
          layoutDirection,
          data: getMoreComplexNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        expect(hot.countRows()).toEqual(13);
        expect(window.getComputedStyle($('.ht_nestingLevel_empty')[0]).float).toEqual('right');
        expect(window.getComputedStyle($('.ht_nestingCollapse')[0]).left).toEqual('-2px');
      });

      it.forTheme('main')('should display indicators properly located', () => {
        const hot = handsontable({
          layoutDirection,
          data: getMoreComplexNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        expect(hot.countRows()).toEqual(13);
        expect(window.getComputedStyle($('.ht_nestingLevel_empty')[0]).order).toEqual('-2');
        expect(window.getComputedStyle($('.ht_nestingCollapse')[0].parentNode).display).toEqual('flex');
      });
    });
  });
});

describe('NestedRows', () => {
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

  describe('Displaying a nested structure', () => {
    it('should display as many rows as there are overall elements in a nested structure', () => {
      const hot = handsontable({
        data: getDataForNestedRows(),
        nestedRows: true
      });

      expect(hot.countRows()).toEqual(13);
    });

    it('should display all nested structure elements in correct order (parent, its children, its children children, next parent etc)', () => {
      const hot = handsontable({
        data: getDataForNestedRows(),
        nestedRows: true
      });

      expect(hot.getData()).toEqual(dataInOrder);
    });
  });

  describe('Cooperation with the `ManualRowMove` plugin', () => {
    it('should display the right amount of entries with the `manualRowMove` plugin enabled', () => {
      const hot = handsontable({
        data: getDataForNestedRows(),
        nestedRows: true,
        manualRowMove: true
      });

      expect(hot.getData().length).toEqual(13);
    });

    it('should move child which is under a parent to the another position, also under the same parent', () => {
      handsontable({
        data: getDataForNestedRows(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      getPlugin('manualRowMove').moveRow(2, 1);

      expect(getDataAtCell(1, 0)).toEqual('a0-a1');
      expect(getDataAtCell(2, 0)).toEqual('a0-a0');

      getPlugin('manualRowMove').moveRow(1, 2);

      expect(getDataAtCell(1, 0)).toEqual('a0-a0');
      expect(getDataAtCell(2, 0)).toEqual('a0-a1');
    });

    it('should not move rows when any of them is a parent', () => {
      handsontable({
        data: getDataForNestedRows(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      getPlugin('manualRowMove').moveRows([0, 1], 2);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').moveRows([1, 0], 2);

      expect(getData()).toEqual(dataInOrder);
    });

    // Another work than the `ManualRowMove` plugin.
    it('should not move rows when any of them is tried to be moved to the position of moved row', () => {
      handsontable({
        data: getDataForNestedRows(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      getPlugin('manualRowMove').moveRows([1, 2], 1);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').moveRows([2, 1], 1);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').moveRows([1, 2], 2);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').moveRows([2, 1], 2);

      expect(getData()).toEqual(dataInOrder);
    });

    it('should move row to the first parent of destination row whether there was a try of moving it on the row being a parent #1', () => {
      handsontable({
        data: getDataForNestedRows(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      const firstParent = getPlugin('nestedRows').dataManager.getRowParent(12);
      expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(2);

      getPlugin('manualRowMove').moveRow(12, 4);

      // First parent to the primary destination row.
      expect(getDataAtCell(3, 0)).toEqual('a0-a2');
      expect(getPlugin('nestedRows').dataManager.isParent(3)).toBeTruthy();

      expect(getDataAtCell(4, 0)).toEqual('a0-a2-a0');
      expect(getPlugin('nestedRows').dataManager.isParent(4)).toBeTruthy();

      expect(getDataAtCell(5, 0)).toEqual('a0-a2-a0-a0');
      expect(getPlugin('nestedRows').dataManager.isParent(5)).toBeFalsy();

      // Moved row.
      expect(getDataAtCell(6, 0)).toEqual('a2-a1-a1');

      // Previous parent of moved row.
      expect(getDataAtCell(11, 0)).toEqual('a2-a1');

      expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(1);
    });

    it('should move row to the first parent of destination row whether there was a try of moving it on the row being a parent #2', () => {
      handsontable({
        data: getDataForNestedRows(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      const firstParent = getPlugin('nestedRows').dataManager.getRowParent(12);
      expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(2);

      getPlugin('manualRowMove').moveRow(12, 10);

      // First parent to the primary destination row.
      expect(getDataAtCell(8, 0)).toEqual('a2');
      expect(getPlugin('nestedRows').dataManager.isParent(8)).toBeTruthy();

      expect(getDataAtCell(9, 0)).toEqual('a2-a0');
      // expect(getPlugin('nestedRows').dataManager.isParent(9)).toBeFalsy(); // TODO: Bug?

      // Previous parent of moved row.
      expect(getDataAtCell(10, 0)).toEqual('a2-a1');

      expect(getPlugin('nestedRows').dataManager.isParent(10)).toBeTruthy();
      expect(getPlugin('nestedRows').dataManager.countChildren(firstParent)).toBe(1);

      expect(getDataAtCell(11, 0)).toEqual('a2-a1-a0');
      // expect(getPlugin('nestedRows').dataManager.isParent(11)).toBeFalsy(); // TODO: Bug?

      // Moved row.
      expect(getDataAtCell(12, 0)).toEqual('a2-a1-a1');

      expect(getPlugin('nestedRows').dataManager.isParent(12)).toBeFalsy();
    });

    it('should not move row whether there was a try of moving it on the row being a parent (and it has no parent)', () => {
      handsontable({
        data: getDataForNestedRows(),
        nestedRows: true,
        manualRowMove: true,
        rowHeaders: true
      });

      getPlugin('manualRowMove').moveRow(1, 0);

      expect(getData()).toEqual(dataInOrder);

      getPlugin('manualRowMove').moveRow(11, 0);

      expect(getData()).toEqual(dataInOrder);
    });
  });
});

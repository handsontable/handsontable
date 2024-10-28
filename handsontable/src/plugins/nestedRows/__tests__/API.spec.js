describe('NestedRows', () => {
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

  describe('API', () => {
    describe('disableCoreAPIModifiers and enableCoreAPIModifiers', () => {
      it('should kill the runtime of the core API modifying hook callbacks - ' +
        'onModifyRowData, onModifySourceLength and onBeforeDataSplice', () => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          manualRowMove: true,
          rowHeaders: true
        });

        const nrPlugin = getPlugin('nestedRows');

        nrPlugin.disableCoreAPIModifiers();

        expect(nrPlugin.onModifyRowData()).toBe(undefined);
        expect(nrPlugin.onModifySourceLength()).toBe(undefined);
        expect(nrPlugin.onBeforeDataSplice(1)).toBe(true);

        nrPlugin.enableCoreAPIModifiers();

        expect(nrPlugin.onModifyRowData()).not.toBe(undefined);
        expect(nrPlugin.onModifySourceLength()).not.toBe(undefined);
        expect(nrPlugin.onBeforeDataSplice(1)).toBe(false);
      });
    });
  });

  describe('Core.loadData', () => {
    it('should recreate the nested structure when updating the data', () => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        contextMenu: true
      });

      setCellMeta(1, 1, 'className', 'red');
      loadData(getMoreComplexNestedData());

      const nrPlugin = getPlugin('nestedRows');

      expect(getCellMeta(1, 1).className).toBeUndefined();
      expect(nrPlugin.dataManager.countAllRows()).toBe(13);
      expect(nrPlugin.dataManager.getRowLevel(5)).toBe(3);
      expect(nrPlugin.dataManager.getRowParent(5).a).toBe('a0-a2-a0');
    });
  });

  describe('Core.updateData', () => {
    it('should recreate the nested structure when updating the data', () => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        contextMenu: true
      });

      setCellMeta(1, 1, 'className', 'red');
      updateData(getMoreComplexNestedData());

      const nrPlugin = getPlugin('nestedRows');

      expect(getCellMeta(1, 1).className).toBe('red');
      expect(nrPlugin.dataManager.countAllRows()).toBe(13);
      expect(nrPlugin.dataManager.getRowLevel(5)).toBe(3);
      expect(nrPlugin.dataManager.getRowParent(5).a).toBe('a0-a2-a0');
    });
  });
});

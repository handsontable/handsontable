describe('ContextMenu', () => {
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

  describe('"Borders" entry', () => {
    it('should be disabled when the single row header is selected', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        customBorders: true,
        navigableHeaders: true,
      });

      await selectCell(1, -1);
      getPlugin('contextMenu').open($(getCell(1, -1)).offset());

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Borders';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be disabled when the single column header is selected', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        customBorders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 1);
      getPlugin('contextMenu').open($(getCell(-1, 1)).offset());

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Borders';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
    });

    it('should be disabled when the single corner is selected', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        customBorders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, -1);
      getPlugin('contextMenu').open($(getCell(-1, -1)).offset());

      const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Borders';
      });

      expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
    });

    it('should resolve `borders` to the plugin-provided submenu when items are passed as an object', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        customBorders: true,
        contextMenu: {
          items: {
            borders: {},
          }
        }
      });

      await selectCell(1, 1);
      await contextMenu();

      const $item = $('.htContextMenu tbody tr td').filter(function() {
        return this.textContent === 'Borders';
      });

      expect($item.length).toBe(1);
      expect($item.hasClass('htDisabled')).toBe(false);

      $item.simulate('mouseover');

      await sleep(350);

      const submenuLabels = $('.htContextMenuSub_Borders tbody tr td')
        .not('.htSeparator')
        .map(function() {
          return this.textContent;
        })
        .get();

      expect(submenuLabels).toContain('Top');
      expect(submenuLabels).toContain('Right');
      expect(submenuLabels).toContain('Bottom');
      expect(submenuLabels).toContain('Left');
    });
  });
});

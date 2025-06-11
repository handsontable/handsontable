describe('Pagination `pageSize` option', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function initHandsontableInFrame(options) {
    const iframe = $('<iframe/>')
      .css({ width: '600px', height: '600px' })
      .appendTo(spec().$container);
    const doc = iframe[0].contentDocument;

    doc.open('text/html', 'replace');
    doc.write(`
      <!doctype html>
      <head>
        <link type="text/css" rel="stylesheet" href="../styles/handsontable.css">
        <link type="text/css" rel="stylesheet" href="../styles/ht-theme-main.css">
      </head>
      <body>
        <div id="root"></div>
      </body>
    `);
    doc.close();

    const container = $(doc.querySelector('#root'));

    return {
      hotInstance: container.handsontable({
        licenseKey: 'non-commercial-and-evaluation',
        themeName: 'ht-theme-main',
        ...options,
      }).handsontable('getInstance'),
      iframe,
    };
  }

  describe('as number', () => {
    it('should have defined default value', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        pagination: true,
      });

      const plugin = getPlugin('pagination');

      expect(plugin.getSetting('pageSize')).toBe(10);
      expect(countVisibleRows()).toBe(10);
    });

    it('should be possible to change value in settings', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        pagination: {
          pageSize: 5,
        },
      });

      const plugin = getPlugin('pagination');

      expect(plugin.getSetting('pageSize')).toBe(5);
      expect(countVisibleRows()).toBe(5);
    });

    it('should be possible to change value via `updateSettings`', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        pagination: true,
      });

      await updateSettings({
        pagination: {
          pageSize: 3,
        },
      });

      const plugin = getPlugin('pagination');

      expect(plugin.getSetting('pageSize')).toBe(3);
      expect(countVisibleRows()).toBe(3);
    });

    it('should throw an error when `pageSize` is `0`', async() => {
      expect(() => {
        handsontable({
          data: createSpreadsheetData(20, 10),
          pagination: {
            pageSize: 0,
          },
        });
      }).toThrowError('The `pageSize` option must be greater than `0`.');
    });

    it('should update UI elements according to the plugins changes', async() => {
      handsontable({
        data: createSpreadsheetData(45, 10),
        pagination: true,
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 10 of 45',
        '|< < Page 1 of 5 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 12,
        },
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 12 of 45',
        '|< < Page 1 of 4 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 40,
        },
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 40 of 45',
        '|< < Page 1 of 2 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 45,
        },
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 45 of 45',
        '|< < Page 1 of 1 > >|',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 50,
        },
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 45 of 45',
        '|< < Page 1 of 1 > >|',
      ]);
    });
  });

  describe('as string ("auto")', () => {
    it('should be possible to change value in settings', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        width: 300,
        height: getDefaultRowHeight() * 5,
        pagination: {
          pageSize: 'auto',
        },
      });

      const plugin = getPlugin('pagination');

      expect(plugin.getSetting('pageSize')).toBe('auto');
      expect(countVisibleRows()).toBe(4);
    });

    it('should be possible to change value via `updateSettings`', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        width: 300,
        height: getDefaultRowHeight() * 5,
        pagination: true,
      });

      await updateSettings({
        pagination: {
          pageSize: 'auto',
        },
      });

      const plugin = getPlugin('pagination');

      expect(plugin.getSetting('pageSize')).toBe('auto');
      expect(countVisibleRows()).toBe(4);
    });

    it('should display at least one row when its size exceeds the table viewport height', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        width: 300,
        height: getDefaultRowHeight() * 5,
        rowHeights: getDefaultRowHeight() * 10,
        pagination: {
          pageSize: 'auto',
        },
      });

      const plugin = getPlugin('pagination');

      expect(plugin.getSetting('pageSize')).toBe('auto');
      expect(countVisibleRows()).toBe(0);
      expect(countRenderedRows()).toBe(1);
    });

    it('should update UI elements after changing the value from "auto" to a number and vice versa (table with defined size)', async() => {
      handsontable({
        data: createSpreadsheetData(45, 10),
        width: 300,
        height: getDefaultRowHeight() * 5,
        pagination: true,
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 10 of 45',
        '|< < Page 1 of 5 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 'auto',
        },
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 4 of 45',
        '|< < Page 1 of 12 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 40,
        },
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 40 of 45',
        '|< < Page 1 of 2 [>] [>|]',
      ]);
    });

    it('should update UI elements after changing the viewport height (table with defined size)', async() => {
      handsontable({
        data: createSpreadsheetData(45, 10),
        width: 300,
        height: getDefaultRowHeight() * 5,
        pagination: {
          pageSize: 'auto',
        },
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 4 of 45',
        '|< < Page 1 of 12 [>] [>|]',
      ]);

      await updateSettings({
        height: getDefaultRowHeight() * 7.5,
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 6 of 45',
        '|< < Page 1 of 8 [>] [>|]',
      ]);

      await updateSettings({
        height: getDefaultRowHeight() * 12,
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 11 of 45',
        '|< < Page 1 of 5 [>] [>|]',
      ]);
    });

    it('should update UI elements after changing the row heights (table with defined size)', async() => {
      handsontable({
        data: createSpreadsheetData(45, 10),
        autoRowSize: true,
        width: 300,
        height: getDefaultRowHeight() * 5,
        // eslint-disable-next-line no-sparse-arrays
        rowHeights: [getDefaultRowHeight() * 5,, getDefaultRowHeight() * 3,,, getDefaultRowHeight() * 2],
        pagination: {
          pageSize: 'auto',
        },
      });

      const plugin = getPlugin('pagination');

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 1 of 45',
        '|< < Page 1 of 13 [>] [>|]',
      ]);

      plugin.setPage(2);

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '2 - 3 of 45',
        '[|<] [<] Page 2 of 13 [>] [>|]',
      ]);

      plugin.setPage(3);

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '4 - 6 of 45',
        '[|<] [<] Page 3 of 13 [>] [>|]',
      ]);

      await setDataAtCell(4, 1, 'This\nis\nmulitline\ncell\nvalue');

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '4 - 4 of 45',
        '[|<] [<] Page 3 of 15 [>] [>|]',
      ]);

      await setDataAtCell(4, 1, 'value');

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '4 - 6 of 45',
        '[|<] [<] Page 3 of 13 [>] [>|]',
      ]);
    });

    it('should update UI elements after changing the value from "auto" to a number and vice versa (table without defined size)', async() => {
      const { hotInstance, iframe } = initHandsontableInFrame({
        data: createSpreadsheetData(100, 10),
        pagination: {
          pageSize: 'auto',
        },
      });

      setCurrentHotInstance(hotInstance);

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 23 of 100',
        '|< < Page 1 of 5 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 13,
        },
      });

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 13 of 100',
        '|< < Page 1 of 8 [>] [>|]',
      ]);

      hotInstance.destroy();
      iframe.remove();
    });

    it('should update UI elements after changing the window height (table without defined size)', async() => {
      const { hotInstance, iframe } = initHandsontableInFrame({
        data: createSpreadsheetData(100, 10),
        pagination: {
          pageSize: 'auto',
        },
      });

      setCurrentHotInstance(hotInstance);

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 23 of 100',
        '|< < Page 1 of 5 [>] [>|]',
      ]);

      iframe.css({ height: '400px' });
      await sleep(100); // wait for the onresize event to trigger a render

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 12 of 100',
        '|< < Page 1 of 9 [>] [>|]',
      ]);

      iframe.css({ height: '200px' });
      await sleep(100); // wait for the onresize event to trigger a render

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 4 of 100',
        '|< < Page 1 of 25 [>] [>|]',
      ]);

      iframe.css({ height: '700px' });
      await sleep(100); // wait for the onresize event to trigger a render

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 22 of 100',
        '|< < Page 1 of 5 [>] [>|]',
      ]);

      hotInstance.destroy();
      iframe.remove();
    });

    it('should update UI elements after changing the row heights (table without defined size)', async() => {
      const { hotInstance, iframe } = initHandsontableInFrame({
        data: createSpreadsheetData(45, 10),
        autoRowSize: true,
        // eslint-disable-next-line no-sparse-arrays
        rowHeights: [getDefaultRowHeight() * 30,,,,, getDefaultRowHeight() * 15,,, getDefaultRowHeight() * 2],
        pagination: {
          pageSize: 'auto',
        },
      });

      setCurrentHotInstance(hotInstance);

      const plugin = getPlugin('pagination');

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '1 - 1 of 45',
        '|< < Page 1 of 4 [>] [>|]',
      ]);

      plugin.setPage(2);
      await sleep(50); // wait for the pagination to update

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '2 - 5 of 45',
        '[|<] [<] Page 2 of 5 [>] [>|]',
      ]);

      plugin.setPage(3);
      await sleep(50); // wait for the pagination to update

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '6 - 8 of 45',
        '[|<] [<] Page 3 of 5 [>] [>|]',
      ]);

      await setDataAtCell(6, 1, 'This\nis\nmulitline\ncell\nvalue\nthat\nmakes\nrow\nmuch\nmuch\nbigger');

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '6 - 6 of 45',
        '[|<] [<] Page 3 of 6 [>] [>|]',
      ]);

      await setDataAtCell(6, 1, 'value');

      expect(visualizePageSections()).toEqual([
        'Page size: [5, 10, 20, 50, 100]',
        '6 - 8 of 45',
        '[|<] [<] Page 3 of 5 [>] [>|]',
      ]);

      hotInstance.destroy();
      iframe.remove();
    });
  });
});

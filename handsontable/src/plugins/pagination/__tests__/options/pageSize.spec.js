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

  async function initHandsontableInFrame(options) {
    const iframe = $('<iframe/>')
      .css({ width: '700px', height: '600px' })
      .appendTo(spec().$container);
    const doc = iframe[0].contentDocument;
    const styles = getE2eThemeStylesheetLinkTagsHtml();

    doc.open('text/html', 'replace');
    doc.write(`
      <!doctype html>
      <head>
        ${styles}
      </head>
      <body>
        <div id="root"></div>
      </body>
    `);
    doc.close();

    const win = iframe[0].contentWindow;
    const {
      promise,
      resolve,
    } = Promise.withResolvers();

    win.onload = () => {
      const container = $(doc.querySelector('#root'));
      const themeName = `ht-theme-${getLoadedTheme()}`;

      if (themeName) {
        options.themeName = themeName;
      }

      resolve({
        hotInstance: container.handsontable({
          licenseKey: 'non-commercial-and-evaluation',
          ...options,
        }).handsontable('getInstance'),
        iframe,
      });
    };

    return promise;
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

    it('should not change the internal pageSize state when the pageSize setting is not provided', async() => {
      handsontable({
        data: createSpreadsheetData(45, 10),
        pagination: {
          pageSize: 12,
        },
      });

      await updateSettings({
        pagination: {
          initialPage: 2,
        },
      });

      const plugin = getPlugin('pagination');

      expect(plugin.getPaginationData().pageSize).toBe(12);
    });

    it('should be possible to change value via `updateSettings` (change from number to number)', async() => {
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

    it('should be possible to change value via `updateSettings` (change from number to "auto")', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        width: 550,
        height: (getDefaultRowHeight() * 5) + getPaginationContainerHeight() + 10, // 10px gap/buffer
        pagination: true,
      });

      await updateSettings({
        pagination: {
          pageSize: 'auto',
        },
      });

      const plugin = getPlugin('pagination');

      expect(plugin.getSetting('pageSize')).toBe('auto');
      expect(countVisibleRows()).toBe(5);
    });

    it('should not be possible to set page size to 0 or lower', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        pagination: {
          pageSize: 0,
        },
      });

      const plugin = getPlugin('pagination');

      expect(plugin.getPaginationData().pageSize).toBe(1);

      await updateSettings({
        pagination: {
          pageSize: -3,
        },
      });

      expect(plugin.getPaginationData().pageSize).toBe(1);
    });

    it('should render elements according to the plugins changes', async() => {
      handsontable({
        data: createSpreadsheetData(45, 10),
        pagination: true,
        renderAllRows: true,
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A10');
      expect(visualizePageSections()).toEqual([
        'Page size: [auto, 5, [10], 20, 50, 100]',
        '1 - 10 of 45',
        '|< < Page 1 of 5 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 12,
        },
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A12');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 12 of 45',
        '|< < Page 1 of 4 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 40,
        },
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A40');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 40 of 45',
        '|< < Page 1 of 2 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 45,
        },
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A45');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 45 of 45',
        '|< < Page 1 of 1 > >|',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 50,
        },
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A45');
      expect(visualizePageSections()).toEqual([
        'Page size: [auto, 5, 10, 20, [50], 100]',
        '1 - 45 of 45',
        '|< < Page 1 of 1 > >|',
      ]);
    });
  });

  describe('as string ("auto")', () => {
    it('should be possible to change value in settings', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        width: 500,
        height: (getDefaultRowHeight() * 5) + getPaginationContainerHeight(),
        pagination: {
          pageSize: 'auto',
        },
      });

      const plugin = getPlugin('pagination');

      expect(plugin.getSetting('pageSize')).toBe('auto');
      expect(countVisibleRows()).toBe(4);
    });

    it('should warn when `autoRowSize` plugin is not enabled', async() => {
      const warnSpy = spyOnConsoleWarn();

      handsontable({
        data: createSpreadsheetData(20, 10),
        pagination: {
          pageSize: 'auto',
        },
      });

      expect(warnSpy).toHaveBeenCalledWith('The `auto` page size setting requires the `autoRowSize` ' +
        'plugin to be enabled. Set the `autoRowSize: true` in the configuration to ensure correct behavior.');
    });

    it('should display at least one row when its size exceeds the table viewport height', async() => {
      handsontable({
        data: createSpreadsheetData(20, 10),
        width: 500,
        height: (getDefaultRowHeight() * 5) + getPaginationContainerHeight(),
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

    it('should render elements after changing the value from "auto" to a number and vice versa (table with defined size)', async() => {
      handsontable({
        data: createSpreadsheetData(45, 10),
        width: 550,
        height: (getDefaultRowHeight() * 5) + getPaginationContainerHeight() + 10, // 10px gap/buffer
        pagination: true,
        renderAllRows: true,
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A10');
      expect(visualizePageSections()).toEqual([
        'Page size: [auto, 5, [10], 20, 50, 100]',
        '1 - 10 of 45',
        '|< < Page 1 of 5 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 'auto',
        },
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A5');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 5 of 45',
        '|< < Page 1 of 9 [>] [>|]',
      ]);

      await updateSettings({
        pagination: {
          pageSize: 40,
        },
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A40');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 40 of 45',
        '|< < Page 1 of 2 [>] [>|]',
      ]);
    });

    it('should render elements after changing the viewport height (table with defined size)', async() => {
      handsontable({
        data: createSpreadsheetData(45, 10),
        width: 550,
        height: (getDefaultRowHeight() * 5) + getPaginationContainerHeight() + 10, // 10px gap/buffer
        pagination: {
          pageSize: 'auto',
        },
        renderAllRows: true,
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A5');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 5 of 45',
        '|< < Page 1 of 9 [>] [>|]',
      ]);

      await updateSettings({
        height: (getDefaultRowHeight() * 8) + getPaginationContainerHeight() + 10, // 10px gap/buffer
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A8');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 8 of 45',
        '|< < Page 1 of 6 [>] [>|]',
      ]);

      await updateSettings({
        height: (getDefaultRowHeight() * 12) + getPaginationContainerHeight() + 10, // 10px gap/buffer
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A12');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 12 of 45',
        '|< < Page 1 of 4 [>] [>|]',
      ]);
    });

    it('should render elements after changing the row heights (table with defined size)', async() => {
      if (getLoadedTheme() !== 'main') {
        return;
      }

      handsontable({
        data: createSpreadsheetData(45, 10),
        autoRowSize: true,
        width: 550,
        height: (getDefaultRowHeight() * 5) + getPaginationContainerHeight(),
        // eslint-disable-next-line no-sparse-arrays
        rowHeights: [getDefaultRowHeight() * 5,, getDefaultRowHeight() * 3,,, getDefaultRowHeight() * 2],
        pagination: {
          pageSize: 'auto',
        },
        renderAllRows: true,
      });

      const plugin = getPlugin('pagination');

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 1 of 45',
        '|< < Page 1 of 11 [>] [>|]',
      ]);

      plugin.setPage(2);

      expect(getHtCore().find('tr:first td:first').text()).toBe('A2');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A4');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '2 - 4 of 45',
        '[|<] [<] Page 2 of 11 [>] [>|]',
      ]);

      plugin.setPage(3);

      expect(getHtCore().find('tr:first td:first').text()).toBe('A5');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A8');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '5 - 8 of 45',
        '[|<] [<] Page 3 of 11 [>] [>|]',
      ]);

      await setDataAtCell(4, 1, 'This\nis\nmulitline\ncell\nvalue\nthat\nmakes\nrow\nmuch\nmuch\nbigger');

      expect(getHtCore().find('tr:first td:first').text()).toBe('A5');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A5');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '5 - 5 of 45',
        '[|<] [<] Page 3 of 12 [>] [>|]',
      ]);

      await setDataAtCell(4, 1, 'value');

      expect(getHtCore().find('tr:first td:first').text()).toBe('A5');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A8');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '5 - 8 of 45',
        '[|<] [<] Page 3 of 11 [>] [>|]',
      ]);
    });

    it('should render elements after changing the value from "auto" to a number and vice versa (table without defined size)', async() => {
      if (getLoadedTheme() !== 'main') {
        return;
      }

      const { hotInstance, iframe } = await initHandsontableInFrame({
        data: createSpreadsheetData(100, 10),
        pagination: {
          pageSize: 'auto',
        },
        renderAllRows: true,
      });

      setCurrentHotInstance(hotInstance);

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A18');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 18 of 100',
        '|< < Page 1 of 6 [>] [>|]',
      ]);

      hotInstance.updateSettings({
        pagination: {
          pageSize: 13,
        },
      });

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A13');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 13 of 100',
        '|< < Page 1 of 8 [>] [>|]',
      ]);

      hotInstance.destroy();
      iframe.remove();
    });

    it('should render elements after changing the window height (table without defined size)', async() => {
      if (getLoadedTheme() !== 'main') {
        return;
      }

      const { hotInstance, iframe } = await initHandsontableInFrame({
        data: createSpreadsheetData(100, 12),
        pagination: {
          pageSize: 'auto',
        },
      });

      setCurrentHotInstance(hotInstance);

      iframe.css({ height: '400px' });
      await waitForNextAnimationFrames(2); // wait for the onresize event to trigger a render

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A11');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 11 of 100',
        '|< < Page 1 of 10 [>] [>|]',
      ]);

      iframe.css({ height: '200px' });
      await waitForNextAnimationFrames(2); // wait for the onresize event to trigger a render

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A4');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 4 of 100',
        '|< < Page 1 of 25 [>] [>|]',
      ]);

      iframe.css({ height: '705px' });
      await waitForNextAnimationFrames(2); // wait for the onresize event to trigger a render

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A22');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 22 of 100',
        '|< < Page 1 of 5 [>] [>|]',
      ]);

      hotInstance.destroy();
      iframe.remove();
    });

    it('should render elements after changing the row heights (table without defined size)', async() => {
      if (getLoadedTheme() !== 'main') {
        return;
      }

      const { hotInstance, iframe } = await initHandsontableInFrame({
        data: createSpreadsheetData(45, 10),
        autoRowSize: true,
        // eslint-disable-next-line no-sparse-arrays
        rowHeights: [getDefaultRowHeight() * 30,,,,, getDefaultRowHeight() * 13,,, getDefaultRowHeight() * 3],
        pagination: {
          pageSize: 'auto',
        },
      });

      setCurrentHotInstance(hotInstance);

      const plugin = hotInstance.getPlugin('pagination');

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 1 of 45',
        '|< < Page 1 of 5 [>] [>|]',
      ]);

      plugin.setPage(2);

      expect(getHtCore().find('tr:first td:first').text()).toBe('A2');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A7');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '2 - 7 of 45',
        '[|<] [<] Page 2 of 5 [>] [>|]',
      ]);

      plugin.setPage(3);

      expect(getHtCore().find('tr:first td:first').text()).toBe('A8');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A23');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '8 - 23 of 45',
        '[|<] [<] Page 3 of 5 [>] [>|]',
      ]);

      const rowToChange = plugin.getPaginationData().firstVisibleRowIndex + 1;

      hotInstance
        .setDataAtCell(rowToChange, 1, 'This\nis\nmulitline\ncell\nvalue\nthat\nmakes\nrow\nmuch\nmuch\nbigger');

      expect(getHtCore().find('tr:first td:first').text()).toBe('A8');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A18');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '8 - 18 of 45',
        '[|<] [<] Page 3 of 5 [>] [>|]',
      ]);

      hotInstance.setDataAtCell(rowToChange, 1, 'value');

      expect(getHtCore().find('tr:first td:first').text()).toBe('A8');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A23');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '8 - 23 of 45',
        '[|<] [<] Page 3 of 5 [>] [>|]',
      ]);

      hotInstance.destroy();
      iframe.remove();
    });

    it('should correctly calculate all pages when rows are rendered with different height', async() => {
      if (getLoadedTheme() !== 'main') {
        return;
      }

      handsontable({
        data: createSpreadsheetData(100, 5).map((row, index) => {
          if (index % 5 === 0) {
            row[1] = 'This\nis\nmulitline\ncell\nvalue';
          }

          return row;
        }),
        width: 500,
        height: (getDefaultRowHeight() * 5) + getPaginationContainerHeight(),
        autoRowSize: true,
        pagination: {
          pageSizeList: ['auto', 10, 20, 50, 100],
        },
        renderAllRows: true,
      });

      const plugin = getPlugin('pagination');

      plugin.setPageSize('auto');

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A2');
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 10, 20, 50, 100]',
        '1 - 2 of 100',
        '|< < Page 1 of 40 [>] [>|]',
      ]);
    });
  });
});

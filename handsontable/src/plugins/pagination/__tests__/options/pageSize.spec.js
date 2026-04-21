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
      let pagData = plugin.getPaginationData();

      // Page 1: row 0 is 5x default height, so only 1 row fits
      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A1');

      const totalPages = pagData.totalPages;

      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 1 of 45',
        `|< < Page 1 of ${totalPages} [>] [>|]`,
      ]);

      plugin.setPage(2);
      pagData = plugin.getPaginationData();

      const p2First = pagData.firstVisibleRowIndex + 1;
      const p2Last = pagData.lastVisibleRowIndex + 1;

      expect(getHtCore().find('tr:first td:first').text()).toBe(`A${p2First}`);
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${p2Last}`);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `${p2First} - ${p2Last} of 45`,
        `[|<] [<] Page 2 of ${totalPages} [>] [>|]`,
      ]);

      plugin.setPage(3);
      pagData = plugin.getPaginationData();

      const p3First = pagData.firstVisibleRowIndex + 1;
      const p3Last = pagData.lastVisibleRowIndex + 1;

      expect(getHtCore().find('tr:first td:first').text()).toBe(`A${p3First}`);
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${p3Last}`);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `${p3First} - ${p3Last} of 45`,
        `[|<] [<] Page 3 of ${totalPages} [>] [>|]`,
      ]);

      // Expanding a row with multiline content should reduce the number of visible rows on this page
      await setDataAtCell(p3First - 1, 1, 'This\nis\nmulitline\ncell\nvalue\nthat\nmakes\nrow\nmuch\nmuch\nbigger');
      pagData = plugin.getPaginationData();

      const p3ExpandedFirst = pagData.firstVisibleRowIndex + 1;
      const p3ExpandedLast = pagData.lastVisibleRowIndex + 1;
      const expandedTotalPages = pagData.totalPages;

      expect(getHtCore().find('tr:first td:first').text()).toBe(`A${p3ExpandedFirst}`);
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${p3ExpandedLast}`);
      expect(p3ExpandedLast).toBeLessThanOrEqual(p3Last);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `${p3ExpandedFirst} - ${p3ExpandedLast} of 45`,
        `[|<] [<] Page 3 of ${expandedTotalPages} [>] [>|]`,
      ]);

      // Restoring the cell value should restore the original row count
      await setDataAtCell(p3First - 1, 1, 'value');
      pagData = plugin.getPaginationData();

      const p3RestoredFirst = pagData.firstVisibleRowIndex + 1;
      const p3RestoredLast = pagData.lastVisibleRowIndex + 1;

      expect(getHtCore().find('tr:first td:first').text()).toBe(`A${p3RestoredFirst}`);
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${p3RestoredLast}`);
      expect(p3RestoredLast).toBe(p3Last);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `${p3RestoredFirst} - ${p3RestoredLast} of 45`,
        `[|<] [<] Page 3 of ${totalPages} [>] [>|]`,
      ]);
    });

    it('should render elements after changing the value from "auto" to a number and vice versa (table without defined size)', async() => {
      const { hotInstance, iframe } = await initHandsontableInFrame({
        data: createSpreadsheetData(100, 10),
        pagination: {
          pageSize: 'auto',
        },
        renderAllRows: true,
      });

      setCurrentHotInstance(hotInstance);

      const autoPageSize = hotInstance.getPlugin('pagination').getPaginationData().pageSize;
      const autoPageCount = Math.ceil(100 / autoPageSize);

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${autoPageSize}`);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `1 - ${autoPageSize} of 100`,
        `|< < Page 1 of ${autoPageCount} [>] [>|]`,
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
      const { hotInstance, iframe } = await initHandsontableInFrame({
        data: createSpreadsheetData(100, 12),
        pagination: {
          pageSize: 'auto',
        },
      });

      setCurrentHotInstance(hotInstance);

      const plugin = hotInstance.getPlugin('pagination');

      iframe.css({ height: '400px' });
      await waitForNextAnimationFrames(2); // wait for the onresize event to trigger a render

      const size400 = plugin.getPaginationData().pageSize;
      const pages400 = Math.ceil(100 / size400);

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${size400}`);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `1 - ${size400} of 100`,
        `|< < Page 1 of ${pages400} [>] [>|]`,
      ]);

      iframe.css({ height: '200px' });
      await waitForNextAnimationFrames(2); // wait for the onresize event to trigger a render

      const size200 = plugin.getPaginationData().pageSize;
      const pages200 = Math.ceil(100 / size200);

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${size200}`);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `1 - ${size200} of 100`,
        `|< < Page 1 of ${pages200} [>] [>|]`,
      ]);

      iframe.css({ height: '705px' });
      await waitForNextAnimationFrames(2); // wait for the onresize event to trigger a render

      const size705 = plugin.getPaginationData().pageSize;
      const pages705 = Math.ceil(100 / size705);

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${size705}`);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `1 - ${size705} of 100`,
        `|< < Page 1 of ${pages705} [>] [>|]`,
      ]);

      // Verify that decreasing height reduces (or keeps equal) the page size and increasing it grows it
      expect(size200).toBeLessThanOrEqual(size400);
      expect(size705).toBeGreaterThan(size400);

      hotInstance.destroy();
      iframe.remove();
    });

    it('should render elements after changing the row heights (table without defined size)', async() => {
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

      // Page 1: row 0 has height 30x default, so only 1 row fits
      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe('A1');

      let pagData = plugin.getPaginationData();
      const totalPages = pagData.totalPages;

      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        '1 - 1 of 45',
        `|< < Page 1 of ${totalPages} [>] [>|]`,
      ]);

      plugin.setPage(2);

      pagData = plugin.getPaginationData();

      const p2First = pagData.firstVisibleRowIndex + 1; // 1-based
      const p2Last = pagData.lastVisibleRowIndex + 1;

      expect(getHtCore().find('tr:first td:first').text()).toBe(`A${p2First}`);
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${p2Last}`);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `${p2First} - ${p2Last} of 45`,
        `[|<] [<] Page 2 of ${totalPages} [>] [>|]`,
      ]);

      plugin.setPage(3);

      pagData = plugin.getPaginationData();

      const p3First = pagData.firstVisibleRowIndex + 1;
      const p3Last = pagData.lastVisibleRowIndex + 1;

      expect(getHtCore().find('tr:first td:first').text()).toBe(`A${p3First}`);
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${p3Last}`);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `${p3First} - ${p3Last} of 45`,
        `[|<] [<] Page 3 of ${totalPages} [>] [>|]`,
      ]);

      const rowToChange = pagData.firstVisibleRowIndex + 1;

      hotInstance
        .setDataAtCell(rowToChange, 1, 'This\nis\nmulitline\ncell\nvalue\nthat\nmakes\nrow\nmuch\nmuch\nbigger');

      pagData = plugin.getPaginationData();

      const p3ExpandedFirst = pagData.firstVisibleRowIndex + 1;
      const p3ExpandedLast = pagData.lastVisibleRowIndex + 1;
      const expandedTotalPages = pagData.totalPages;

      expect(getHtCore().find('tr:first td:first').text()).toBe(`A${p3ExpandedFirst}`);
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${p3ExpandedLast}`);
      expect(p3ExpandedLast).toBeLessThan(p3Last); // fewer rows fit after expansion
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `${p3ExpandedFirst} - ${p3ExpandedLast} of 45`,
        `[|<] [<] Page 3 of ${expandedTotalPages} [>] [>|]`,
      ]);

      hotInstance.setDataAtCell(rowToChange, 1, 'value');

      pagData = plugin.getPaginationData();

      const p3RestoredFirst = pagData.firstVisibleRowIndex + 1;
      const p3RestoredLast = pagData.lastVisibleRowIndex + 1;

      expect(getHtCore().find('tr:first td:first').text()).toBe(`A${p3RestoredFirst}`);
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${p3RestoredLast}`);
      expect(p3RestoredLast).toBe(p3Last); // row count restored after shrinking
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 5, 10, 20, 50, 100]',
        `${p3RestoredFirst} - ${p3RestoredLast} of 45`,
        `[|<] [<] Page 3 of ${totalPages} [>] [>|]`,
      ]);

      hotInstance.destroy();
      iframe.remove();
    });

    it('should correctly calculate all pages when rows are rendered with different height', async() => {
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

      const pagData = plugin.getPaginationData();
      const lastRow = pagData.lastVisibleRowIndex + 1;
      const totalPages = pagData.totalPages;

      expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
      expect(getHtCore().find('tr:last td:first').text()).toBe(`A${lastRow}`);
      expect(visualizePageSections()).toEqual([
        'Page size: [[auto], 10, 20, 50, 100]',
        `1 - ${lastRow} of 100`,
        `|< < Page 1 of ${totalPages} [>] [>|]`,
      ]);
    });
  });
});

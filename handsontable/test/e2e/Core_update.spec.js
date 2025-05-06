describe('Core_updateSettings', () => {
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

  it('should inherit cell type', async() => {
    handsontable({
      data: [[1, 2]],
      columns: [
        {},
        { type: 'checkbox' },
      ],
      cells(row, col) {
        if (row === 0 && col === 0) {
          return {
            type: 'numeric'
          };
        }
      }
    });

    expect(getCellMeta(0, 0).type).toEqual('numeric');
    expect(getCellMeta(0, 1).type).toEqual('checkbox');
  });

  it('should inherit cell type when columns is a function', async() => {
    handsontable({
      data: [[1, 2]],
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = {};

        } else if (column === 1) {
          colMeta = { type: 'checkbox' };
        }

        return colMeta;
      },
      cells(row, col) {
        if (row === 0 && col === 0) {
          return {
            type: 'numeric'
          };
        }
      }
    });

    expect(getCellMeta(0, 0).type).toEqual('numeric');
    expect(getCellMeta(0, 1).type).toEqual('checkbox');
  });

  it('should ignore mixed in properties to the cell array option', async() => {
    /* eslint-disable no-array-constructor */
    /* eslint-disable no-extend-native */
    Array.prototype.willFail = 'BOOM';

    handsontable({
      data: [[1, true]],
      columns: [
        { type: 'numeric' },
        { type: 'checkbox' }
      ]
    });

    expect(() => {
      // eslint-disable-next-line handsontable/require-await
      updateSettings({ cell: new Array() });
    }).not.toThrow();
  });

  it('should ignore mixed in properties to the cell array option when columns is a function', async() => {
    /* eslint-disable no-array-constructor */
    /* eslint-disable no-extend-native */
    Array.prototype.willFail = 'BOOM';

    handsontable({
      data: [[1, true]],
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = { type: 'numeric' };

        } else if (column === 1) {
          colMeta = { type: 'checkbox' };
        }

        return colMeta;
      },
    });

    expect(() => {
      // eslint-disable-next-line handsontable/require-await
      updateSettings({ cell: new Array() });
    }).not.toThrow();
  });

  it('should not reset columns types to text', async() => {
    handsontable({
      data: [[1, true]],
      columns: [
        { type: 'numeric' },
        { type: 'checkbox' }
      ]
    });

    const td = spec().$container.find('td');

    expect(td.eq(0).text()).toEqual('1');
    expect(td.eq(1).text()).toEqual('');

    await updateSettings({});

    expect(td.eq(0).text()).toEqual('1');
    expect(td.eq(1).text()).toEqual('');
  });

  it('should not reset columns types to text when columns is a function', async() => {
    handsontable({
      data: [[1, true]],
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = { type: 'numeric' };

        } else if (column === 1) {
          colMeta = { type: 'checkbox' };
        }

        return colMeta;
      }
    });

    const td = spec().$container.find('td');

    expect(td.eq(0).text()).toEqual('1');
    expect(td.eq(1).text()).toEqual('');

    await updateSettings({});

    expect(td.eq(0).text()).toEqual('1');
    expect(td.eq(1).text()).toEqual('');
  });

  it('should update readOnly global setting', async() => {
    handsontable({
      readOnly: true,
      data: [['foo', 'bar']],
      columns: [
        {},
        {},
      ]
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(true);

    expect(getCellMeta(0, 1).readOnly).toBe(true);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(true);

    await updateSettings({
      readOnly: false
    });

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(false);

    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);
  });

  it('should update readOnly global setting when columns is a function', async() => {
    handsontable({
      readOnly: true,
      data: [['foo', 'bar']],
      columns(column) {
        let colMeta = {};

        if ([0, 1].indexOf(column) < 0) {
          colMeta = null;
        }

        return colMeta;
      }
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(true);

    expect(getCellMeta(0, 1).readOnly).toBe(true);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(true);

    await updateSettings({
      readOnly: false
    });

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(false);

    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);
  });

  it('should update readOnly columns setting', async() => {
    handsontable({
      data: [['foo', true]],
      columns: [
        { type: 'text', readOnly: true },
        { type: 'checkbox' }
      ]
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(true);

    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);

    await updateSettings({
      columns: [
        { type: 'text', readOnly: false },
        { type: 'checkbox' }
      ]
    });

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(false);

    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);
  });

  it('should update readOnly columns setting when columns is a function', async() => {
    handsontable({
      data: [['foo', true]],
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = { type: 'text', readOnly: true };
        } else if (column === 1) {
          colMeta = { type: 'checkbox' };
        }

        return colMeta;
      }
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(true);

    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);

    await updateSettings({
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = { type: 'text', readOnly: false };
        } else if (column === 1) {
          colMeta = { type: 'checkbox' };
        }

        return colMeta;
      }
    });

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(false);

    expect(getCellMeta(0, 1).readOnly).toBe(false);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(false);
  });

  it('should update readOnly columns setting and override global setting', async() => {
    handsontable({
      readOnly: true,
      data: [['foo', true]],
      columns: [
        { type: 'text' },
        { type: 'checkbox' }
      ]
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(true);

    expect(getCellMeta(0, 1).readOnly).toBe(true);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(true);

    await updateSettings({
      columns: [
        { type: 'text', readOnly: false },
        { type: 'checkbox' }
      ]
    });

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(false);

    expect(getCellMeta(0, 1).readOnly).toBe(true);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(true);
  });

  it('should update readOnly columns setting and override global setting when columns is a function', async() => {
    handsontable({
      readOnly: true,
      data: [['foo', true]],
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = { type: 'text' };

        } else if (column === 1) {
          colMeta = { type: 'checkbox' };
        }

        return colMeta;
      }
    });

    expect(getCellMeta(0, 0).readOnly).toBe(true);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(true);

    expect(getCellMeta(0, 1).readOnly).toBe(true);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(true);

    await updateSettings({
      columns(column) {
        let colMeta = null;

        if (column === 0) {
          colMeta = { type: 'text', readOnly: false };

        } else if (column === 1) {
          colMeta = { type: 'checkbox' };
        }

        return colMeta;
      }
    });

    expect(getCellMeta(0, 0).readOnly).toBe(false);
    expect($(getCell(0, 0)).hasClass('htDimmed')).toBe(false);

    expect(getCellMeta(0, 1).readOnly).toBe(true);
    expect($(getCell(0, 1)).hasClass('htDimmed')).toBe(true);
  });

  it('should not alter the columns object during init', async() => {
    const columns = [
      {
        type: 'text'
      }
    ];

    const columnsCopy = JSON.parse(JSON.stringify(columns));

    handsontable({
      columns
    });

    expect(columns).toEqual(columnsCopy);
  });

  it('should update column type', async() => {
    const columns = [
      {
        type: 'text'
      }
    ];

    handsontable({
      columns
    });

    expect(getCellMeta(0, 0).type).toEqual('text');
    expect(getCellRenderer(0, 0)).toBe(Handsontable.renderers.TextRenderer);
    expect(getCellEditor(0, 0)).toBe(Handsontable.editors.TextEditor);

    columns[0].type = 'date';

    await updateSettings({
      columns
    });

    expect(getCellMeta(0, 0).type).toEqual('date');
    expect(getCellRenderer(0, 0)).toBe(Handsontable.renderers.DateRenderer);
    expect(getCellEditor(0, 0)).toEqual(Handsontable.editors.DateEditor);
  });

  it('should update cell type functions, even if new type does not implement all of those functions', async() => {
    const columns = [
      {
        type: 'numeric'
      }
    ];

    handsontable({
      columns
    });

    expect(getCellMeta(0, 0).type).toEqual('numeric');
    expect(getCellRenderer(0, 0)).toBe(Handsontable.renderers.NumericRenderer);
    expect(getCellEditor(0, 0)).toBe(Handsontable.editors.NumericEditor);
    expect(getCellValidator(0, 0)).toBe(Handsontable.cellTypes.numeric.validator);

    columns[0].type = 'text';

    await updateSettings({
      columns
    });

    expect(getCellMeta(0, 0).type).toEqual('text');
    expect(getCellRenderer(0, 0)).toBe(Handsontable.renderers.TextRenderer);
    expect(getCellEditor(0, 0)).toEqual(Handsontable.editors.TextEditor);
    expect(Handsontable.cellTypes.text.validator).toBeUndefined();
    expect(getCellValidator(0, 0)).toBeUndefined();
  });

  it('should change colHeader\'s row height if is needed', async() => {
    handsontable({
      colHeaders: true,
      rowHeaders: true
    });

    const rowHeights = [];

    rowHeights.push(spec().$container.find('.ht_clone_top_inline_start_corner thead th')[0].clientHeight);
    await updateSettings({
      colHeaders: ['A<br/>A']
    });

    rowHeights.push(spec().$container.find('.ht_clone_top_inline_start_corner thead th')[0].clientHeight);

    expect(rowHeights[0]).toBeLessThan(rowHeights[1]);
  });

  it('should not overwrite properties (created by columns defined as function) of cells below the viewport by updateSettings #4029', async() => {
    let rows = 50;
    const columns = 2;

    handsontable({
      data: createSpreadsheetObjectData(columns, rows),
      columns(col) {
        const colProp = {
          data: `prop${col}`,
          readOnly: true
        };

        if (col === 1) {
          colProp.type = 'checkbox';
        }

        return colProp;
      }
    });

    await updateSettings({});
    expect(getCellMeta(rows, 0).readOnly).toEqual(true);
    expect(getCellMeta(rows, 1).type).toEqual('checkbox');

    rows = 100;

    await updateSettings({ data: createSpreadsheetObjectData(columns, rows) });
    expect(getCellMeta(rows, 0).readOnly).toEqual(true);
    expect(getCellMeta(rows, 1).type).toEqual('checkbox');

    await updateSettings({
      columns(col) {
        const colProp = {
          data: `prop${col}`,
          type: 'numeric'
        };

        return colProp;
      }
    });
    expect(getCellMeta(0, 1).type).toEqual('numeric');
    expect(getCellMeta(0, 1).readOnly).toEqual(false);
    expect(getCellMeta(rows, 1).type).toEqual('numeric');
    expect(getCellMeta(rows, 1).readOnly).toEqual(false);
  });

  it('should not overwrite properties (created by columns defined as array) of cells below the viewport by updateSettings #4029', async() => {
    let rows = 50;
    const columns = 2;

    handsontable({
      data: createSpreadsheetObjectData(columns, rows),
      columns: [
        {
          type: 'numeric',
          numericFormat: {
            pattern: '0,0.00 $',
          },
        },
        {
          type: 'text',
          readOnly: true
        }
      ]
    });

    await updateSettings({});
    expect(getCellMeta(rows, 0).type).toEqual('numeric');
    expect(getCellMeta(rows, 1).readOnly).toEqual(true);

    rows = 100;

    await updateSettings({ data: createSpreadsheetObjectData(columns, rows) });
    expect(getCellMeta(rows, 0).type).toEqual('numeric');
    expect(typeof getCellMeta(rows, 0).numericFormat).toEqual('object');
    expect(getCellMeta(rows, 1).readOnly).toEqual(true);

    await updateSettings({
      columns: [
        {
          type: 'text',
          readOnly: true
        },
        {
          type: 'numeric',
          numericFormat: {
            pattern: '0,0.00 $',
          },
        }
      ]
    });
    expect(getCellMeta(0, 0).type).toEqual('text');
    expect(getCellMeta(0, 0).readOnly).toEqual(true);
    expect(getCellMeta(0, 1).type).toEqual('numeric');
    expect(typeof getCellMeta(0, 1).numericFormat).toEqual('object');
    expect(getCellMeta(0, 1).readOnly).toEqual(false);
    expect(getCellMeta(rows, 0).type).toEqual('text');
    expect(getCellMeta(rows, 1).type).toEqual('numeric');
  });

  it('should call `afterUpdateSettings` hook with proper parameter', async() => {
    const afterUpdateSettings = jasmine.createSpy('afterUpdateSettings');

    handsontable({
      data: createSpreadsheetObjectData(10, 10),
      readOnly: true,
      afterUpdateSettings
    });

    const newSettings = { readOnly: false };

    await updateSettings(newSettings);

    expect(afterUpdateSettings)
      .toHaveBeenCalledWith(newSettings);
  });

  it('should not extend parameter passed to `afterUpdateSettings` hook by another properties', async() => {
    const updatedSetting = { fillHandle: true };
    let newSettings;

    handsontable({
      data: createSpreadsheetObjectData(10, 10),
      readOnly: true,
      afterUpdateSettings(settings) {
        newSettings = settings;
      }
    });

    await updateSettings(updatedSetting);

    expect(Object.keys(updatedSetting)).toEqual(Object.keys(newSettings));
  });

  it('should not update cache of index mappers when updating random key', async() => {
    handsontable({
      data: createSpreadsheetObjectData(10, 10),
      columns: [{}, {}, {}]
    });
    const rowCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
    const columnCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

    rowIndexMapper().addLocalHook('cacheUpdated', rowCacheUpdatedCallback);
    columnIndexMapper().addLocalHook('cacheUpdated', columnCacheUpdatedCallback);

    await updateSettings({ a: 'b' });

    expect(rowCacheUpdatedCallback).not.toHaveBeenCalled();
    expect(columnCacheUpdatedCallback).not.toHaveBeenCalled();
  });

  it('should update cache of index mappers only once when updating `data` and `column` properties', async() => {
    handsontable({
      data: createSpreadsheetObjectData(10, 10),
      columns: [{}, {}, {}]
    });
    const rowCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
    const columnCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

    rowIndexMapper().addLocalHook('cacheUpdated', rowCacheUpdatedCallback);
    columnIndexMapper().addLocalHook('cacheUpdated', columnCacheUpdatedCallback);

    await updateSettings({ data: createSpreadsheetObjectData(5, 5), columns: [{}] });

    expect(rowCacheUpdatedCallback.calls.count()).toEqual(1);
    expect(columnCacheUpdatedCallback.calls.count()).toEqual(1);
  });

  it('should pass the `source` argument as "updateSettings" to the `beforeLoadData` and `afterLoadData` hooks', async() => {
    let correctSourceCount = 0;

    handsontable({
      data: [[]],
      beforeLoadData: (data, firstRun, source) => {
        if (source === 'updateSettings') {
          correctSourceCount += 1;
        }
      },
      afterLoadData: (data, firstRun, source) => {
        if (source === 'updateSettings') {
          correctSourceCount += 1;
        }
      }
    });

    await updateSettings({});

    expect(correctSourceCount).toEqual(2);
  });

  it('should adjust column header size if `columns` is included in `updateSettings`', async() => {
    handsontable({
      colHeaders: true,
      data: [{
        brand: 'Mercedes'
      }]
    });

    await updateSettings({
      columns: [{
        data: 'brand'
      }]
    });

    expect($('.ht_master .wtHider')[0].offsetWidth)
      .toEqual($('.ht_master td')[0].offsetWidth);
  });

  describe('theme updating', () => {
    it('should be able to change the themes with the `updateSettings` method', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(15, 15),
      }, true);

      expect(hot.stylesHandler.isClassicTheme()).toBe(true);
      expect(getCurrentThemeName()).toBe(undefined);

      simulateModernThemeStylesheet(spec().$container);

      await updateSettings({
        themeName: 'ht-theme-sth'
      });

      expect(hot.stylesHandler.isClassicTheme()).toBe(false);
      expect(getCurrentThemeName()).toBe('ht-theme-sth');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(true);

      // `updateSettings` calls without `themeName` provided should not change the theme
      await updateSettings({});

      expect(hot.stylesHandler.isClassicTheme()).toBe(false);
      expect(getCurrentThemeName()).toBe('ht-theme-sth');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(true);

      // `updateSettings` calls with the theme name provided as the same that's currently applied should not change the theme
      await updateSettings({
        themeName: 'ht-theme-sth'
      });

      expect(hot.stylesHandler.isClassicTheme()).toBe(false);
      expect(getCurrentThemeName()).toBe('ht-theme-sth');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(true);

      // Calling `updateSettings` with `themeName` defined to `undefined` or `false` should
      // switch HOT back to the classic theme.
      await updateSettings({
        themeName: undefined
      });

      expect(hot.stylesHandler.isClassicTheme()).toBe(true);
      expect(getCurrentThemeName()).toBe(undefined);
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(false);

      await updateSettings({
        themeName: 'ht-theme-sth'
      });
      await updateSettings({
        themeName: false
      });

      expect(hot.stylesHandler.isClassicTheme()).toBe(true);
      expect(getCurrentThemeName()).toBe(undefined);
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(false);
    });

    it('should update the theme based on the `themeName` option, even if a theme class is already applied to the container', async() => {
      simulateModernThemeStylesheet(spec().$container);
      spec().$container.addClass('ht-theme-sth');

      const hot = handsontable({
        data: createSpreadsheetData(15, 15),
      }, true);

      expect(hot.stylesHandler.isClassicTheme()).toBe(false);
      expect(getCurrentThemeName()).toBe('ht-theme-sth');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(true);

      await updateSettings({
        themeName: 'ht-theme-sth-else',
      });

      expect(hot.stylesHandler.isClassicTheme()).toBe(false);
      expect(getCurrentThemeName()).toBe('ht-theme-sth-else');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(false);
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth-else')).toBe(true);
    });

    it('should be possible to disable a "modern" theme by setting the `themeName` to `false` or `undefined`', async() => {
      simulateModernThemeStylesheet(spec().$container);
      spec().$container.addClass('ht-theme-sth');

      const hot = handsontable({
        data: createSpreadsheetData(15, 15),
      }, true);

      expect(hot.stylesHandler.isClassicTheme()).toBe(false);
      expect(getCurrentThemeName()).toBe('ht-theme-sth');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(true);

      await updateSettings({
        themeName: undefined,
      });

      expect(hot.stylesHandler.isClassicTheme()).toBe(true);
      expect(getCurrentThemeName()).toBe(undefined);
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(false);

      spec().$container.addClass('ht-theme-sth');
      hot.useTheme('ht-theme-sth');

      expect(hot.stylesHandler.isClassicTheme()).toBe(false);
      expect(getCurrentThemeName()).toBe('ht-theme-sth');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(true);

      await updateSettings({
        themeName: false,
      });

      expect(hot.stylesHandler.isClassicTheme()).toBe(true);
      expect(getCurrentThemeName()).toBe(undefined);
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(false);
    });
  });
});

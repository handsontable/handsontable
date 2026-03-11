describe('exportExcel', () => {
  const id = 'testContainer';

  function createExceljsMock(buffer = new Uint8Array([1, 2, 3]).buffer) {
    class WorksheetMock {
      rows = [];

      addRow(values) {
        this.rows.push(values);
      }
    }

    class WorkbookMock {
      static lastInstance = null;

      worksheets = [];

      xlsx = {
        writeBuffer: jasmine.createSpy('writeBuffer').and.returnValue(Promise.resolve(buffer)),
      };

      constructor() {
        WorkbookMock.lastInstance = this;
      }

      addWorksheet() {
        const worksheet = new WorksheetMock();

        this.worksheets.push(worksheet);

        return worksheet;
      }
    }

    return {
      Workbook: WorkbookMock,
    };
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should export all visible data by default', async() => {
    const exceljs = createExceljsMock();

    handsontable({
      data: createSpreadsheetData(3, 3),
      hiddenRows: {
        rows: [1],
      },
      hiddenColumns: {
        columns: [0],
      },
      exportExcel: {
        exceljs,
      },
    });

    const plugin = getPlugin('exportExcel');
    const buffer = await plugin.exportAsBuffer();

    expect(buffer instanceof ArrayBuffer).toBe(true);
    expect(exceljs.Workbook.lastInstance.worksheets[0].rows).toEqual([
      ['B1', 'C1'],
      ['B3', 'C3'],
    ]);
  });

  it('should export headers and range', async() => {
    const exceljs = createExceljsMock();

    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: true,
      colHeaders: true,
      exportExcel: {
        exceljs,
      },
    });

    const plugin = getPlugin('exportExcel');

    await plugin.exportAsBuffer({
      rowHeaders: true,
      columnHeaders: true,
      range: [1, 1, 2, 2],
    });

    expect(exceljs.Workbook.lastInstance.worksheets[0].rows).toEqual([
      ['', 'B', 'C'],
      [2, 'B2', 'C2'],
      [3, 'B3', 'C3'],
    ]);
  });

  it('should export selected range when `range` option is not provided', async() => {
    const exceljs = createExceljsMock();

    handsontable({
      data: createSpreadsheetData(4, 4),
      exportExcel: {
        exceljs,
      },
    });

    await selectCell(1, 1, 2, 2);

    const plugin = getPlugin('exportExcel');

    await plugin.exportAsBuffer();

    expect(exceljs.Workbook.lastInstance.worksheets[0].rows).toEqual([
      ['B2', 'C2'],
      ['B3', 'C3'],
    ]);
  });

  it('should export formulas as formulas when enabled', async() => {
    const exceljs = createExceljsMock();

    handsontable({
      data: [['=A1+B1', 'B1']],
      exportExcel: {
        exceljs,
      },
    });

    const plugin = getPlugin('exportExcel');

    await plugin.exportAsBuffer({ formulas: true });

    expect(exceljs.Workbook.lastInstance.worksheets[0].rows).toEqual([
      [{ formula: 'A1+B1' }, 'B1'],
    ]);
  });

  it('should throw an error when exceljs dependency is missing', async() => {
    handsontable();

    const plugin = getPlugin('exportExcel');
    let error = null;

    try {
      await plugin.exportAsBuffer();
    } catch (thrownError) {
      error = thrownError;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('Missing required `exceljs` dependency');
  });
});

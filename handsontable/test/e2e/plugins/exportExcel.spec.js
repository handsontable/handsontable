describe('ExportExcel (e2e)', () => {
  const id = 'testContainer';

  function createExceljsMock(buffer = new Uint8Array([10, 20, 30]).buffer) {
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

  it('should export currently selected cells when no explicit range is passed', async() => {
    const exceljs = createExceljsMock();

    handsontable({
      data: createSpreadsheetData(5, 5),
      exportExcel: {
        exceljs,
      },
    });

    await selectCell(2, 1, 3, 3);

    await getPlugin('exportExcel').exportAsBuffer();

    expect(exceljs.Workbook.lastInstance.worksheets[0].rows).toEqual([
      ['B3', 'C3', 'D3'],
      ['B4', 'C4', 'D4'],
    ]);
  });

  it('should clamp out-of-bounds ranges and include hidden indexes when requested', async() => {
    const exceljs = createExceljsMock();

    handsontable({
      data: createSpreadsheetData(3, 3),
      hiddenRows: {
        rows: [1],
      },
      hiddenColumns: {
        columns: [1],
      },
      rowHeaders: true,
      colHeaders: true,
      exportExcel: {
        exceljs,
      },
    });

    await getPlugin('exportExcel').exportAsBuffer({
      range: [1, 1, 99, 99],
      rowHeaders: true,
      columnHeaders: true,
      exportHiddenRows: true,
      exportHiddenColumns: true,
    });

    expect(exceljs.Workbook.lastInstance.worksheets[0].rows).toEqual([
      ['', 'B', 'C'],
      [2, 'B2', 'C2'],
      [3, 'B3', 'C3'],
    ]);
  });
});

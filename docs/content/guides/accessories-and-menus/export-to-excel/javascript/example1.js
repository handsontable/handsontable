import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

function createExceljsDependency() {
  class WorksheetMock {
    rows = [];

    addRow(values) {
      this.rows.push(values);
    }
  }

  class WorkbookMock {
    worksheets = [];

    xlsx = {
      writeBuffer: async() => {
        const textEncoder = new TextEncoder();

        return textEncoder.encode(JSON.stringify(this.worksheets.map(({ rows }) => rows))).buffer;
      },
    };

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

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', '=SUM(1,1)'],
    ['A2', 'B2', '=SUM(2,2)'],
    ['A3', 'B3', '=SUM(3,3)'],
  ],
  colHeaders: true,
  rowHeaders: true,
  exportExcel: {
    exceljs: createExceljsDependency(),
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const exportPlugin = hot.getPlugin('exportExcel');
const button = document.querySelector('#export-file');

button.addEventListener('click', async() => {
  await exportPlugin.downloadFile({
    filename: 'Handsontable-XLSX-file_[YYYY]-[MM]-[DD]',
    sheetName: 'Report',
    formulas: true,
    columnHeaders: true,
    rowHeaders: true,
  });
});

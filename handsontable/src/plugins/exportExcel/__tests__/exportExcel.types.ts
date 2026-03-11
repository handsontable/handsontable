import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  exportExcel: {
    exceljs: {
      Workbook: class WorkbookMock {
        xlsx = {
          writeBuffer: async() => new ArrayBuffer(0),
        };

        addWorksheet() {
          return {
            addRow() {},
          };
        }
      },
    },
  },
});
const exportExcel = hot.getPlugin('exportExcel');
const options = {
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileExtension: 'xlsx',
  filename: 'report',
  sheetName: 'Data',
  columnHeaders: true,
  rowHeaders: true,
  exportHiddenColumns: true,
  exportHiddenRows: true,
  formulas: true,
  range: [1, 1, 6, 6],
};

const buffer: Promise<ArrayBuffer> = exportExcel.exportAsBuffer();
const bufferWithOptions: Promise<ArrayBuffer> = exportExcel.exportAsBuffer(options);
const blob: Promise<Blob> = exportExcel.exportAsBlob();
const blobWithOptions: Promise<Blob> = exportExcel.exportAsBlob(options);
const result: Promise<void> = exportExcel.downloadFile(options);

void buffer;
void bufferWithOptions;
void blob;
void blobWithOptions;
void result;

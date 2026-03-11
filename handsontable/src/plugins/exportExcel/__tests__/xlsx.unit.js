import Xlsx from '../types/xlsx';

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;

function decodeBytes(value) {
  if (typeof TextDecoder === 'function') {
    return new TextDecoder().decode(value);
  }

  if (typeof Buffer === 'function') {
    return Buffer.from(value).toString('utf-8');
  }

  let output = '';

  for (let i = 0; i < value.length; i += 1) {
    output += String.fromCharCode(value[i]);
  }

  return output;
}

function parseZipEntries(archive) {
  const entries = new Map();
  const archiveView = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  let offset = 0;

  while (offset + 30 <= archive.length && archiveView.getUint32(offset, true) === LOCAL_FILE_HEADER_SIGNATURE) {
    const fileNameLength = archiveView.getUint16(offset + 26, true);
    const extraFieldLength = archiveView.getUint16(offset + 28, true);
    const compressedSize = archiveView.getUint32(offset + 18, true);
    const fileNameStart = offset + 30;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileDataStart = fileNameEnd + extraFieldLength;
    const fileDataEnd = fileDataStart + compressedSize;
    const fileName = decodeBytes(archive.slice(fileNameStart, fileNameEnd));

    entries.set(fileName, archive.slice(fileDataStart, fileDataEnd));
    offset = fileDataEnd;
  }

  return entries;
}

describe('exportExcel XLSX type', () => {
  it('should generate OOXML workbook with worksheet data', () => {
    const dataProvider = {
      setOptions() {},
      getCells() {
        return [[
          { type: 'number', value: 42 },
          { type: 'boolean', value: true },
          { type: 'formula', value: 'A1*2' },
        ]];
      },
      getRowHeaders() {
        return ['1'];
      },
      getColumnHeaders() {
        return ['A', 'B', 'C'];
      },
    };
    const exporter = new Xlsx(dataProvider, {
      rowHeaders: true,
      columnHeaders: true,
      sheetName: 'Sales/2026',
    });
    const entries = parseZipEntries(exporter.export());

    expect(entries.has('xl/workbook.xml')).toBe(true);
    expect(entries.has('xl/worksheets/sheet1.xml')).toBe(true);
    expect(decodeBytes(entries.get('xl/workbook.xml'))).toContain('Sales 2026');
    expect(decodeBytes(entries.get('xl/worksheets/sheet1.xml'))).toContain('<f>A1*2</f>');
    expect(decodeBytes(entries.get('xl/worksheets/sheet1.xml'))).toContain('<v>42</v>');
    expect(decodeBytes(entries.get('xl/worksheets/sheet1.xml'))).toContain('<v>1</v>');
  });
});

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

function getZipEntryAsText(entries, entryName) {
  if (!entries.has(entryName)) {
    return '';
  }

  return decodeBytes(entries.get(entryName));
}

describe('exportExcel XLSX type', () => {
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

  it('should export worksheet and workbook OOXML files', async() => {
    handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
    });

    const blob = getPlugin('exportExcel').exportAsBlob();
    const archive = new Uint8Array(await blob.arrayBuffer());
    const entries = parseZipEntries(archive);

    expect(entries.has('[Content_Types].xml')).toBe(true);
    expect(entries.has('xl/workbook.xml')).toBe(true);
    expect(entries.has('xl/worksheets/sheet1.xml')).toBe(true);
    expect(getZipEntryAsText(entries, 'xl/worksheets/sheet1.xml')).toContain('A1');
    expect(getZipEntryAsText(entries, 'xl/worksheets/sheet1.xml')).toContain('B2');
  });

  it('should export row and column headers when enabled', async() => {
    handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      colHeaders: true,
      rowHeaders: true,
    });

    const blob = getPlugin('exportExcel').exportAsBlob({
      columnHeaders: true,
      rowHeaders: true,
    });
    const archive = new Uint8Array(await blob.arrayBuffer());
    const entries = parseZipEntries(archive);
    const sheetXml = getZipEntryAsText(entries, 'xl/worksheets/sheet1.xml');

    expect(sheetXml).toContain('>A<');
    expect(sheetXml).toContain('>B<');
    expect(sheetXml).toContain('>1<');
    expect(sheetXml).toContain('>2<');
  });

  it('should skip hidden rows and columns by default', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      hiddenRows: {
        rows: [1],
        indicators: true,
      },
      hiddenColumns: {
        columns: [1],
        indicators: true,
      },
    });

    const blob = getPlugin('exportExcel').exportAsBlob();
    const archive = new Uint8Array(await blob.arrayBuffer());
    const entries = parseZipEntries(archive);
    const sheetXml = getZipEntryAsText(entries, 'xl/worksheets/sheet1.xml');

    expect(sheetXml).toContain('>A1<');
    expect(sheetXml).toContain('>C1<');
    expect(sheetXml).toContain('>A3<');
    expect(sheetXml).toContain('>C3<');
    expect(sheetXml).not.toContain('>A2<');
    expect(sheetXml).not.toContain('>B1<');
  });

  it('should export formulas when enabled', async() => {
    handsontable({
      data: [[1, 2, '=A1+B1']],
    });

    const blob = getPlugin('exportExcel').exportAsBlob({ formulas: true });
    const archive = new Uint8Array(await blob.arrayBuffer());
    const entries = parseZipEntries(archive);
    const sheetXml = getZipEntryAsText(entries, 'xl/worksheets/sheet1.xml');

    expect(sheetXml).toContain('<f>A1+B1</f>');
    expect(sheetXml).not.toContain('=A1+B1');
  });

  it('should export selected range when range option is set', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    const blob = getPlugin('exportExcel').exportAsBlob({ range: [1, 1, 2, 2] });
    const archive = new Uint8Array(await blob.arrayBuffer());
    const entries = parseZipEntries(archive);
    const sheetXml = getZipEntryAsText(entries, 'xl/worksheets/sheet1.xml');

    expect(sheetXml).toContain('>B2<');
    expect(sheetXml).toContain('>C3<');
    expect(sheetXml).not.toContain('>A1<');
    expect(sheetXml).not.toContain('>E5<');
  });
});

import ExcelJS from 'exceljs';

describe('ExportFile `downloadFileAsync` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function stubDownload(hotInstance) {
    spyOn(hotInstance.rootWindow.URL, 'createObjectURL').and.returnValue('blob:mock');
    spyOn(hotInstance.rootWindow.URL, 'revokeObjectURL');

    const origCreateElement = hotInstance.rootDocument.createElement.bind(hotInstance.rootDocument);

    spyOn(hotInstance.rootDocument, 'createElement').and.callFake((tag) => {
      const el = origCreateElement(tag);

      if (tag === 'a') {
        spyOn(el, 'dispatchEvent');
      }

      return el;
    });
  }

  it('should return a Promise for an xlsx format', async() => {
    handsontable({
      data: [['A1']],
      exportFile: { engines: { xlsx: ExcelJS } },
    });

    stubDownload(hot());

    const result = getPlugin('exportFile').downloadFileAsync('xlsx');

    expect(result instanceof Promise).toBe(true);

    await result;
  });

  it('should return a Promise for a csv format', async() => {
    handsontable({
      data: [['A1']],
      exportFile: { engines: { xlsx: ExcelJS } },
    });

    stubDownload(hot());

    const result = getPlugin('exportFile').downloadFileAsync('csv');

    expect(result instanceof Promise).toBe(true);

    await result;
  });

  it('should trigger a download for xlsx format', async() => {
    handsontable({
      data: [['A1']],
      exportFile: { engines: { xlsx: ExcelJS } },
    });

    const hotInstance = hot();

    stubDownload(hotInstance);

    await getPlugin('exportFile').downloadFileAsync('xlsx', { filename: 'test' });

    expect(hotInstance.rootWindow.URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('should trigger a download for csv format', async() => {
    handsontable({
      data: [['A1']],
      exportFile: { engines: { xlsx: ExcelJS } },
    });

    const hotInstance = hot();

    stubDownload(hotInstance);

    await getPlugin('exportFile').downloadFileAsync('csv', { filename: 'test' });

    expect(hotInstance.rootWindow.URL.createObjectURL).toHaveBeenCalledTimes(1);
  });
});

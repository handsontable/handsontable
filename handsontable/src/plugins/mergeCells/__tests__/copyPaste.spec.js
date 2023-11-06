describe('MergeCells copy and paste', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    spyOn(document, 'execCommand');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should properly copy single merged cell', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectCell(1, 1);

    plugin.copy();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    expect(copyEvent.clipboardData.getData('text/plain')).toEqual('B2\t\n\t');
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<tbody>',
          '<tr>',
            '<td rowspan="2" colspan="2">B2</td>',
          '</tr>',
          '<tr>',
          '</tr>',
        '</tbody>',
      '<!--EndFragment-->',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });

  it('should call `afterCopy` hook with proper object when some elements are removed from the copied data', () => {
    const afterCopySpy = jasmine.createSpy('afterCopy');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
      ],
      beforeCopy(clipboardData) {
        clipboardData.removeColumns([2]);
      },
      afterCopy: afterCopySpy
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copyWithColumnHeaders();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    expect(afterCopySpy.calls.argsFor(0)[0].getData()).toEqual([
      ['A', 'B', 'D'],
      ['A1', 'B1', 'D1'],
      ['A2', 'B2', 'D2'],
      ['A3', null, 'D3'],
      ['A4', 'B4', 'D4']
    ]);
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toBe([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<thead>',
          '<tr>',
            '<th>A</th>',
            '<th>B</th>',
            '<th>D</th>',
          '</tr>',
        '</thead>',
        '<tbody>',
          '<tr>',
            '<td>A1</td>',
            '<td>B1</td>',
            '<td>D1</td>',
          '</tr>',
          '<tr>',
            '<td>A2</td>',
            '<td rowspan="2">B2</td>',
            '<td>D2</td>',
          '</tr>',
          '<tr>',
            '<td>A3</td>',
            '<td>D3</td>',
          '</tr>',
          '<tr>',
            '<td>A4</td>',
            '<td>B4</td>',
            '<td>D4</td>',
          '</tr>',
        '</tbody>',
      '<!--EndFragment-->',
      '</table>'
    ].join(''));
    /* eslint-enable */
    expect(afterCopySpy.calls.argsFor(0)[0].getMetaInfo()).toEqual({
      colHeaders: ['A', 'B', 'D'],
      mergeCells: [{ col: 1, row: 1, rowspan: 2, colspan: 1 }],
      data: [['A1', 'B1', 'D1'], ['A2', 'B2', 'D2'], ['A3', null, 'D3'], ['A4', 'B4', 'D4']],
    });
  });

  it('should call `afterPaste` hook with proper object when some elements are removed from the pasted data', () => {
    const afterPasteSpy = jasmine.createSpy('afterPaste');

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
      ],
      beforePaste(clipboardData) {
        clipboardData.removeColumns([2]);
      },
      afterPaste: afterPasteSpy
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copyWithColumnHeaders();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    selectCell(0, 0);

    plugin.onPaste(copyEvent);

    expect(afterPasteSpy.calls.argsFor(0)[0].getData()).toEqual([
      ['A', 'B', 'D'],
      ['A1', 'B1', 'D1'],
      ['A2', 'B2', 'D2'],
      ['A3', null, 'D3'],
      ['A4', 'B4', 'D4']
    ]);
    expect(afterPasteSpy.calls.argsFor(0)[0].getMetaInfo()).toEqual({
      colHeaders: ['A', 'B', 'D'],
      mergeCells: [{ col: 1, row: 1, rowspan: 2, colspan: 1 }],
      data: [['A1', 'B1', 'D1'], ['A2', 'B2', 'D2'], ['A3', null, 'D3'], ['A4', 'B4', 'D4']],
    });
  });

  it('should properly change copied values using `beforeCopy` hook (removing first row of merged area)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
      beforeCopy(clipboardData) {
        clipboardData.removeRows([1]);
      }
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copy();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable no-tabs */
    expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A1	B1	C1	D1	E1	F1	G1	H1\n' +
      'A3			D3	E3	F3	G3	H3\n' +
      'A4	B4	C4	D4			G4	H4\n' +
      'A5	B5	C5				G5	H5\n' +
      'A6	B6	C6				G6	H6\n' +
      'A7	B7	C7	D7	E7	F7	G7	H7\n' +
      'A8	B8	C8	D8	E8	F8	G8	H8'
    );
    /* eslint-enable */
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<tbody>',
          '<tr>',
            '<td>A1</td>',
            '<td>B1</td>',
            '<td>C1</td>',
            '<td>D1</td>',
            '<td>E1</td>',
            '<td>F1</td>',
            '<td>G1</td>',
            '<td>H1</td>',
          '</tr>',
          '<tr>',
            '<td>A3</td>',
            '<td colspan="2"></td>',
            '<td>D3</td>',
            '<td>E3</td>',
            '<td>F3</td>',
            '<td>G3</td>',
            '<td>H3</td>',
          '</tr>',
          '<tr>',
            '<td>A4</td>',
            '<td>B4</td>',
            '<td>C4</td>',
            '<td rowspan="3" colspan="3">D4</td>',
            '<td>G4</td>',
            '<td>H4</td>',
          '</tr>',
          '<tr>',
            '<td>A5</td>',
            '<td>B5</td>',
            '<td>C5</td>',
            '<td>G5</td>',
            '<td>H5</td>',
          '</tr>',
          '<tr>',
            '<td>A6</td>',
            '<td>B6</td>',
            '<td>C6</td>',
            '<td>G6</td>',
            '<td>H6</td>',
          '</tr>',
          '<tr>',
            '<td>A7</td>',
            '<td>B7</td>',
            '<td>C7</td>',
            '<td>D7</td>',
            '<td>E7</td>',
            '<td>F7</td>',
            '<td>G7</td>',
            '<td>H7</td>',
          '</tr>',
          '<tr>',
            '<td>A8</td>',
            '<td>B8</td>',
            '<td>C8</td>',
            '<td>D8</td>',
            '<td>E8</td>',
            '<td>F8</td>',
            '<td>G8</td>',
            '<td>H8</td>',
          '</tr>',
        '</tbody>',
      '<!--EndFragment-->',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });

  it('should properly change copied values using `beforeCopy` hook (removing a part of merge areas one by one)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
      beforeCopy(clipboardData) {
        clipboardData.removeRows([2]);
        clipboardData.removeColumns([4]);
      }
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copy();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable no-tabs */
    expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A1	B1	C1	D1	F1	G1	H1\n' +
      'A2	B2		D2	F2	G2	H2\n' +
      'A4	B4	C4	D4		G4	H4\n' +
      'A5	B5	C5			G5	H5\n' +
      'A6	B6	C6			G6	H6\n' +
      'A7	B7	C7	D7	F7	G7	H7\n' +
      'A8	B8	C8	D8	F8	G8	H8'
    );
    /* eslint-enable */
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<tbody>',
          '<tr>',
            '<td>A1</td>',
            '<td>B1</td>',
            '<td>C1</td>',
            '<td>D1</td>',
            '<td>F1</td>',
            '<td>G1</td>',
            '<td>H1</td>',
          '</tr>',
          '<tr>',
            '<td>A2</td>',
            '<td colspan="2">B2</td>',
            '<td>D2</td>',
            '<td>F2</td>',
            '<td>G2</td>',
            '<td>H2</td>',
          '</tr>',
          '<tr>',
            '<td>A4</td>',
            '<td>B4</td>',
            '<td>C4</td>',
            '<td rowspan="3" colspan="2">D4</td>',
            '<td>G4</td>',
            '<td>H4</td>',
          '</tr>',
          '<tr>',
            '<td>A5</td>',
            '<td>B5</td>',
            '<td>C5</td>',
            '<td>G5</td>',
            '<td>H5</td>',
          '</tr>',
          '<tr>',
            '<td>A6</td>',
            '<td>B6</td>',
            '<td>C6</td>',
            '<td>G6</td>',
            '<td>H6</td>',
          '</tr>',
          '<tr>',
            '<td>A7</td>',
            '<td>B7</td>',
            '<td>C7</td>',
            '<td>D7</td>',
            '<td>F7</td>',
            '<td>G7</td>',
            '<td>H7</td>',
          '</tr>',
          '<tr>',
            '<td>A8</td>',
            '<td>B8</td>',
            '<td>C8</td>',
            '<td>D8</td>',
            '<td>F8</td>',
            '<td>G8</td>',
            '<td>H8</td>',
          '</tr>',
        '</tbody>',
      '<!--EndFragment-->',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });

  it('should properly change copied values using `beforeCopy` hook (removing a part of merge areas at once)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
      beforeCopy(clipboardData) {
        clipboardData.removeRows([2]);
        clipboardData.removeColumns([4]);
      }
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copy();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable no-tabs */
    expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A1	B1	C1	D1	F1	G1	H1\n' +
      'A2	B2		D2	F2	G2	H2\n' +
      'A4	B4	C4	D4		G4	H4\n' +
      'A5	B5	C5			G5	H5\n' +
      'A6	B6	C6			G6	H6\n' +
      'A7	B7	C7	D7	F7	G7	H7\n' +
      'A8	B8	C8	D8	F8	G8	H8'
    );
    /* eslint-enable */
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<tbody>',
          '<tr>',
            '<td>A1</td>',
            '<td>B1</td>',
            '<td>C1</td>',
            '<td>D1</td>',
            '<td>F1</td>',
            '<td>G1</td>',
            '<td>H1</td>',
          '</tr>',
          '<tr>',
            '<td>A2</td>',
            '<td colspan="2">B2</td>',
            '<td>D2</td>',
            '<td>F2</td>',
            '<td>G2</td>',
            '<td>H2</td>',
          '</tr>',
          '<tr>',
            '<td>A4</td>',
            '<td>B4</td>',
            '<td>C4</td>',
            '<td rowspan="3" colspan="2">D4</td>',
            '<td>G4</td>',
            '<td>H4</td>',
          '</tr>',
          '<tr>',
            '<td>A5</td>',
            '<td>B5</td>',
            '<td>C5</td>',
            '<td>G5</td>',
            '<td>H5</td>',
          '</tr>',
          '<tr>',
            '<td>A6</td>',
            '<td>B6</td>',
            '<td>C6</td>',
            '<td>G6</td>',
            '<td>H6</td>',
          '</tr>',
          '<tr>',
            '<td>A7</td>',
            '<td>B7</td>',
            '<td>C7</td>',
            '<td>D7</td>',
            '<td>F7</td>',
            '<td>G7</td>',
            '<td>H7</td>',
          '</tr>',
          '<tr>',
            '<td>A8</td>',
            '<td>B8</td>',
            '<td>C8</td>',
            '<td>D8</td>',
            '<td>F8</td>',
            '<td>G8</td>',
            '<td>H8</td>',
          '</tr>',
        '</tbody>',
      '<!--EndFragment-->',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });

  it('should properly change copied values using `beforeCopy` hook (removing the entire range of merge areas one by one)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
      beforeCopy(clipboardData) {
        clipboardData.removeRows([1]);
        clipboardData.removeRows([1]);
        clipboardData.removeColumns([3, 4]);
        clipboardData.removeColumns([3]);
      }
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copy();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable no-tabs */
    expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
      'A1	B1	C1	G1	H1\n' +
      'A4	B4	C4	G4	H4\n' +
      'A5	B5	C5	G5	H5\n' +
      'A6	B6	C6	G6	H6\n' +
      'A7	B7	C7	G7	H7\n' +
      'A8	B8	C8	G8	H8'
    );
    /* eslint-enable */
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<tbody>',
          '<tr>',
            '<td>A1</td>',
            '<td>B1</td>',
            '<td>C1</td>',
            '<td>G1</td>',
            '<td>H1</td>',
          '</tr>',
          '<tr>',
            '<td>A4</td>',
            '<td>B4</td>',
            '<td>C4</td>',
            '<td>G4</td>',
            '<td>H4</td>',
          '</tr>',
          '<tr>',
            '<td>A5</td>',
            '<td>B5</td>',
            '<td>C5</td>',
            '<td>G5</td>',
            '<td>H5</td>',
          '</tr>',
          '<tr>',
            '<td>A6</td>',
            '<td>B6</td>',
            '<td>C6</td>',
            '<td>G6</td>',
            '<td>H6</td>',
          '</tr>',
          '<tr>',
            '<td>A7</td>',
            '<td>B7</td>',
            '<td>C7</td>',
            '<td>G7</td>',
            '<td>H7</td>',
          '</tr>',
          '<tr>',
            '<td>A8</td>',
            '<td>B8</td>',
            '<td>C8</td>',
            '<td>G8</td>',
            '<td>H8</td>',
          '</tr>',
        '</tbody>',
      '<!--EndFragment-->',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });

  it('should properly change copied values using `beforeCopy` hook (removing the entire range of merge areas at once)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
      beforeCopy(clipboardData) {
        clipboardData.removeRows([1, 2]);
        clipboardData.removeColumns([3, 4, 5]);
      }
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copy();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable no-tabs */
    expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
      'A1	B1	C1	G1	H1\n' +
      'A4	B4	C4	G4	H4\n' +
      'A5	B5	C5	G5	H5\n' +
      'A6	B6	C6	G6	H6\n' +
      'A7	B7	C7	G7	H7\n' +
      'A8	B8	C8	G8	H8'
    );
    /* eslint-enable */
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<tbody>',
          '<tr>',
            '<td>A1</td>',
            '<td>B1</td>',
            '<td>C1</td>',
            '<td>G1</td>',
            '<td>H1</td>',
          '</tr>',
          '<tr>',
            '<td>A4</td>',
            '<td>B4</td>',
            '<td>C4</td>',
            '<td>G4</td>',
            '<td>H4</td>',
          '</tr>',
          '<tr>',
            '<td>A5</td>',
            '<td>B5</td>',
            '<td>C5</td>',
            '<td>G5</td>',
            '<td>H5</td>',
          '</tr>',
          '<tr>',
            '<td>A6</td>',
            '<td>B6</td>',
            '<td>C6</td>',
            '<td>G6</td>',
            '<td>H6</td>',
          '</tr>',
          '<tr>',
            '<td>A7</td>',
            '<td>B7</td>',
            '<td>C7</td>',
            '<td>G7</td>',
            '<td>H7</td>',
          '</tr>',
          '<tr>',
            '<td>A8</td>',
            '<td>B8</td>',
            '<td>C8</td>',
            '<td>G8</td>',
            '<td>H8</td>',
          '</tr>',
        '</tbody>',
      '<!--EndFragment-->',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });

  it('should properly change copied values using `beforeCopy` hook (inserting row to a merge area)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
      beforeCopy(clipboardData) {
        clipboardData.insertAtRow(2, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
      }
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copy();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable no-tabs */
    expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
      'A1	B1	C1	D1	E1	F1	G1	H1\n' +
      'A2	B2		D2	E2	F2	G2	H2\n' +
      'a			d	e	f	g	h\n' +
      'A3			D3	E3	F3	G3	H3\n' +
      'A4	B4	C4	D4			G4	H4\n' +
      'A5	B5	C5				G5	H5\n' +
      'A6	B6	C6				G6	H6\n' +
      'A7	B7	C7	D7	E7	F7	G7	H7\n' +
      'A8	B8	C8	D8	E8	F8	G8	H8'
    );
    /* eslint-enable */
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<tbody>',
          '<tr>',
            '<td>A1</td>',
            '<td>B1</td>',
            '<td>C1</td>',
            '<td>D1</td>',
            '<td>E1</td>',
            '<td>F1</td>',
            '<td>G1</td>',
            '<td>H1</td>',
          '</tr>',
          '<tr>',
            '<td>A2</td>',
            '<td rowspan="3" colspan="2">B2</td>',
            '<td>D2</td>',
            '<td>E2</td>',
            '<td>F2</td>',
            '<td>G2</td>',
            '<td>H2</td>',
          '</tr>',
          '<tr>',
            '<td>a</td>',
            '<td>d</td>',
            '<td>e</td>',
            '<td>f</td>',
            '<td>g</td>',
            '<td>h</td>',
          '</tr>',
          '<tr>',
            '<td>A3</td>',
            '<td>D3</td>',
            '<td>E3</td>',
            '<td>F3</td>',
            '<td>G3</td>',
            '<td>H3</td>',
          '</tr>',
          '<tr>',
            '<td>A4</td>',
            '<td>B4</td>',
            '<td>C4</td>',
            '<td rowspan="3" colspan="3">D4</td>',
            '<td>G4</td>',
            '<td>H4</td>',
          '</tr>',
          '<tr>',
            '<td>A5</td>',
            '<td>B5</td>',
            '<td>C5</td>',
            '<td>G5</td>',
            '<td>H5</td>',
          '</tr>',
          '<tr>',
            '<td>A6</td>',
            '<td>B6</td>',
            '<td>C6</td>',
            '<td>G6</td>',
            '<td>H6</td>',
          '</tr>',
          '<tr>',
            '<td>A7</td>',
            '<td>B7</td>',
            '<td>C7</td>',
            '<td>D7</td>',
            '<td>E7</td>',
            '<td>F7</td>',
            '<td>G7</td>',
            '<td>H7</td>',
          '</tr>',
          '<tr>',
            '<td>A8</td>',
            '<td>B8</td>',
            '<td>C8</td>',
            '<td>D8</td>',
            '<td>E8</td>',
            '<td>F8</td>',
            '<td>G8</td>',
            '<td>H8</td>',
          '</tr>',
        '</tbody>',
      '<!--EndFragment-->',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });

  it('should properly change copied values using `beforeCopy` hook (inserting column to a merge area) - only cells', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
      beforeCopy(clipboardData) {
        clipboardData.insertAtColumn(2, [1, 2, 3, 4, 5, 6, 7, 8]);
      }
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copy();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable no-tabs */
    expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
      'A1	B1	1	C1	D1	E1	F1	G1	H1\n' +
      'A2	B2			D2	E2	F2	G2	H2\n' +
      'A3				D3	E3	F3	G3	H3\n' +
      'A4	B4	4	C4	D4			G4	H4\n' +
      'A5	B5	5	C5				G5	H5\n' +
      'A6	B6	6	C6				G6	H6\n' +
      'A7	B7	7	C7	D7	E7	F7	G7	H7\n' +
      'A8	B8	8	C8	D8	E8	F8	G8	H8'
    );
    /* eslint-enable */
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<tbody>',
          '<tr>',
            '<td>A1</td>',
            '<td>B1</td>',
            '<td>1</td>',
            '<td>C1</td>',
            '<td>D1</td>',
            '<td>E1</td>',
            '<td>F1</td>',
            '<td>G1</td>',
            '<td>H1</td>',
          '</tr>',
          '<tr>',
            '<td>A2</td>',
            '<td rowspan="2" colspan="3">B2</td>',
            '<td>D2</td>',
            '<td>E2</td>',
            '<td>F2</td>',
            '<td>G2</td>',
            '<td>H2</td>',
          '</tr>',
          '<tr>',
            '<td>A3</td>',
            '<td>D3</td>',
            '<td>E3</td>',
            '<td>F3</td>',
            '<td>G3</td>',
            '<td>H3</td>',
          '</tr>',
          '<tr>',
            '<td>A4</td>',
            '<td>B4</td>',
            '<td>4</td>',
            '<td>C4</td>',
            '<td rowspan="3" colspan="3">D4</td>',
            '<td>G4</td>',
            '<td>H4</td>',
          '</tr>',
          '<tr>',
            '<td>A5</td>',
            '<td>B5</td>',
            '<td>5</td>',
            '<td>C5</td>',
            '<td>G5</td>',
            '<td>H5</td>',
          '</tr>',
          '<tr>',
            '<td>A6</td>',
            '<td>B6</td>',
            '<td>6</td>',
            '<td>C6</td>',
            '<td>G6</td>',
            '<td>H6</td>',
          '</tr>',
          '<tr>',
            '<td>A7</td>',
            '<td>B7</td>',
            '<td>7</td>',
            '<td>C7</td>',
            '<td>D7</td>',
            '<td>E7</td>',
            '<td>F7</td>',
            '<td>G7</td>',
            '<td>H7</td>',
          '</tr>',
          '<tr>',
            '<td>A8</td>',
            '<td>B8</td>',
            '<td>8</td>',
            '<td>C8</td>',
            '<td>D8</td>',
            '<td>E8</td>',
            '<td>F8</td>',
            '<td>G8</td>',
            '<td>H8</td>',
          '</tr>',
        '</tbody>',
      '<!--EndFragment-->',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });

  it('should properly change copied values using `beforeCopy` hook (inserting column to a merge area) - cells and headers', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
      beforeCopy(clipboardData) {
        clipboardData.insertAtColumn(2, ['header', 1, 2, 3, 4, 5, 6, 7, 8]);
      }
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copyWithColumnHeaders();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable no-tabs */
    expect(copyEvent.clipboardData.getData('text/plain')).toEqual(
      'A	B	header	C	D	E	F	G	H\n' +
      'A1	B1	1	C1	D1	E1	F1	G1	H1\n' +
      'A2	B2			D2	E2	F2	G2	H2\n' +
      'A3				D3	E3	F3	G3	H3\n' +
      'A4	B4	4	C4	D4			G4	H4\n' +
      'A5	B5	5	C5				G5	H5\n' +
      'A6	B6	6	C6				G6	H6\n' +
      'A7	B7	7	C7	D7	E7	F7	G7	H7\n' +
      'A8	B8	8	C8	D8	E8	F8	G8	H8'
    );
    /* eslint-enable */
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<thead>',
          '<tr>',
            '<th>A</th>',
            '<th>B</th>',
            '<th>header</th>',
            '<th>C</th>',
            '<th>D</th>',
            '<th>E</th>',
            '<th>F</th>',
            '<th>G</th>',
            '<th>H</th>',
          '</tr>',
        '</thead>',
        '<tbody>',
          '<tr>',
            '<td>A1</td>',
            '<td>B1</td>',
            '<td>1</td>',
            '<td>C1</td>',
            '<td>D1</td>',
            '<td>E1</td>',
            '<td>F1</td>',
            '<td>G1</td>',
            '<td>H1</td>',
          '</tr>',
          '<tr>',
            '<td>A2</td>',
            '<td rowspan="2" colspan="3">B2</td>',
            '<td>D2</td>',
            '<td>E2</td>',
            '<td>F2</td>',
            '<td>G2</td>',
            '<td>H2</td>',
          '</tr>',
          '<tr>',
            '<td>A3</td>',
            '<td>D3</td>',
            '<td>E3</td>',
            '<td>F3</td>',
            '<td>G3</td>',
            '<td>H3</td>',
          '</tr>',
          '<tr>',
            '<td>A4</td>',
            '<td>B4</td>',
            '<td>4</td>',
            '<td>C4</td>',
            '<td rowspan="3" colspan="3">D4</td>',
            '<td>G4</td>',
            '<td>H4</td>',
          '</tr>',
          '<tr>',
            '<td>A5</td>',
            '<td>B5</td>',
            '<td>5</td>',
            '<td>C5</td>',
            '<td>G5</td>',
            '<td>H5</td>',
          '</tr>',
          '<tr>',
            '<td>A6</td>',
            '<td>B6</td>',
            '<td>6</td>',
            '<td>C6</td>',
            '<td>G6</td>',
            '<td>H6</td>',
          '</tr>',
          '<tr>',
            '<td>A7</td>',
            '<td>B7</td>',
            '<td>7</td>',
            '<td>C7</td>',
            '<td>D7</td>',
            '<td>E7</td>',
            '<td>F7</td>',
            '<td>G7</td>',
            '<td>H7</td>',
          '</tr>',
          '<tr>',
            '<td>A8</td>',
            '<td>B8</td>',
            '<td>8</td>',
            '<td>C8</td>',
            '<td>D8</td>',
            '<td>E8</td>',
            '<td>F8</td>',
            '<td>G8</td>',
            '<td>H8</td>',
          '</tr>',
        '</tbody>',
      '<!--EndFragment-->',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });

  it('should properly change copied values using `beforeCopy` hook (inserting column to a merge area) - only headers', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
      beforeCopy(clipboardData) {
        clipboardData.insertAtColumn(2, ['header']);
      }
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copyColumnHeadersOnly();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable no-tabs */
    expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A	B	header	C	D	E	F	G	H');
    /* eslint-enable */
    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
      '<!--StartFragment-->',
        '<thead>',
          '<tr>',
            '<th>A</th>',
            '<th>B</th>',
            '<th>header</th>',
            '<th>C</th>',
            '<th>D</th>',
            '<th>E</th>',
            '<th>F</th>',
            '<th>G</th>',
            '<th>H</th>',
          '</tr>',
        '</thead>',
      '<!--EndFragment-->',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });
});

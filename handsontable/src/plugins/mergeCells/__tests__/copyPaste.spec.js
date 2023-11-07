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
        '<tbody>',
          '<tr>',
            '<td rowspan="2" colspan="2">B2</td>',
          '</tr>',
          '<tr>',
          '</tr>',
        '</tbody>',
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
      '</table>',
    ].join(''));
    /* eslint-enable */
  });

  it('should properly paste single cell data to a merged cell', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody><tr><td>A1</td></tr></tbody></table>'
    ].join('\r\n'));

    selectCell(1, 1);
    copyPastePlugin.onPaste(clipboardEvent);

    expect(getDataAtCell(1, 1)).toEqual('A1');
    expect(`
      |   ║   : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   |
      | - ║   : # :   :   :   :   :   :   |
      | - ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    const mergeCellsPlugin = getPlugin('mergeCells');

    expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(2);
  });

  it('should properly paste single cell data to selection containing merged cell', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody><tr><td>A1</td></tr></tbody></table>'
    ].join('\r\n'));

    selectCell(0, 1, 3, 2);
    copyPastePlugin.onPaste(clipboardEvent);

    expect(getDataAtCell(1, 1)).toEqual('A1');
    expect(getDataAtCell(1, 2)).toEqual('A1');
    expect(getDataAtCell(2, 1)).toEqual('A1');
    expect(getDataAtCell(2, 2)).toEqual('A1');
    expect(getDataAtCell(3, 1)).toEqual('A1');
    expect(getDataAtCell(3, 2)).toEqual('A1');
    expect(`
        |   ║   : - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        | - ║   : A : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    const mergeCellsPlugin = getPlugin('mergeCells');

    expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
  });

  describe('pasting multiple cells data to selection containing', () => {
    it('only merged area', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 3, rowspan: 3, colspan: 3 }
        ],
      });

      const clipboardEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(1, 1);
      copyPastePlugin.onPaste(clipboardEvent);

      expect(getDataAtCell(1, 1)).toEqual('A1');
      expect(getDataAtCell(1, 2)).toEqual('B1');
      expect(getDataAtCell(2, 1)).toEqual('A1');
      expect(getDataAtCell(2, 2)).toEqual('B1');
      expect(`
        |   ║   : - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        | - ║   : A : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

      const mergeCellsPlugin = getPlugin('mergeCells');

      expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
    });

    it('merged area and some cells above it', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 3, rowspan: 3, colspan: 3 }
        ],
      });

      const clipboardEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(0, 1, 2, 2);
      copyPastePlugin.onPaste(clipboardEvent);

      expect(getDataAtCell(0, 1)).toEqual('A1');
      expect(getDataAtCell(0, 2)).toEqual('B1');
      expect(getDataAtCell(1, 1)).toEqual('A1');
      expect(getDataAtCell(1, 2)).toEqual('B1');
      expect(getDataAtCell(2, 1)).toEqual('A1');
      expect(getDataAtCell(2, 2)).toEqual('B1');
      expect(`
        |   ║   : - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        | - ║   : A : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

      const mergeCellsPlugin = getPlugin('mergeCells');

      expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
    });

    it('merged area and some cells below it', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 3, rowspan: 3, colspan: 3 }
        ],
      });

      const clipboardEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(1, 1, 3, 2);
      copyPastePlugin.onPaste(clipboardEvent);

      expect(getDataAtCell(1, 1)).toEqual('A1');
      expect(getDataAtCell(1, 2)).toEqual('B1');
      expect(getDataAtCell(2, 1)).toEqual('A1');
      expect(getDataAtCell(2, 2)).toEqual('B1');
      expect(getDataAtCell(3, 1)).toEqual('A1');
      expect(getDataAtCell(3, 2)).toEqual('B1');
      expect(`
        |   ║   : - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        | - ║   : A : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

      const mergeCellsPlugin = getPlugin('mergeCells');

      expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
    });

    it('merged area and some cells below and after it', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 3, rowspan: 3, colspan: 3 }
        ],
      });

      const clipboardEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('CopyPaste');

      clipboardEvent.clipboardData.setData('text/html', [
        '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
      ].join('\r\n'));

      selectCell(0, 1, 3, 2);
      copyPastePlugin.onPaste(clipboardEvent);

      expect(getDataAtCell(1, 1)).toEqual('A1');
      expect(getDataAtCell(1, 2)).toEqual('B1');
      expect(getDataAtCell(2, 1)).toEqual('A1');
      expect(getDataAtCell(2, 2)).toEqual('B1');
      expect(getDataAtCell(3, 1)).toEqual('A1');
      expect(getDataAtCell(3, 2)).toEqual('B1');
      expect(`
        |   ║   : - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        | - ║   : A : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

      const mergeCellsPlugin = getPlugin('mergeCells');

      expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
    });
  });

  it('should properly paste data right after merged cells', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody>' +
      '<tr><td>G3</td><td>H3</td></tr>' +
      '<tr><td>G4</td><td>H4</td></tr>' +
      '<tr><td>G5</td><td>H5</td></tr>' +
      '<tr><td>G6</td><td>H6</td></tr>' +
      '</tbody></table>'
    ].join('\r\n'));

    selectCell(0, 2);
    copyPastePlugin.onPaste(clipboardEvent);

    expect(getData()).toEqual([
      ['A1', 'B1', 'G3', 'H3', 'E1', 'F1', 'G1', 'H1'],
      ['A2', 'B2', 'G4', 'H4', 'E2', 'F2', 'G2', 'H2'],
      ['A3', null, 'G5', 'H5', 'E3', 'F3', 'G3', 'H3'],
      ['A4', 'B4', 'G6', 'H6', null, null, 'G4', 'H4'],
      ['A5', 'B5', 'C5', null, null, null, 'G5', 'H5'],
      ['A6', 'B6', 'C6', null, null, null, 'G6', 'H6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8'],
    ]);
    expect(`
      |   ║   : - : - : - : - : - :   :   |
      |===:===:===:===:===:===:===:===:===|
      | - ║   : A : 0 : 0 : 0 : 0 :   :   |
      | - ║   : 0 : 0 : 0 : 0 : 0 :   :   |
      | - ║   : 0 : 0 : 0 : 0 : 0 :   :   |
      | - ║   : 0 : 0 : 0 : 0 : 0 :   :   |
      | - ║   : 0 : 0 : 0 : 0 : 0 :   :   |
      | - ║   : 0 : 0 : 0 : 0 : 0 :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    const mergeCellsPlugin = getPlugin('mergeCells');

    expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(0);
  });

  it('should unmerge only one cell when selection contains two merged areas, but pasted data fills out one area', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
    ].join('\r\n'));

    selectCell(1, 1, 5, 5);
    copyPastePlugin.onPaste(clipboardEvent);

    expect(getData()).toEqual([
      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'],
      ['A2', 'A1', 'B1', 'D2', 'E2', 'F2', 'G2', 'H2'],
      ['A3', null, null, 'D3', 'E3', 'F3', 'G3', 'H3'],
      ['A4', 'B4', 'C4', 'D4', null, null, 'G4', 'H4'],
      ['A5', 'B5', 'C5', null, null, null, 'G5', 'H5'],
      ['A6', 'B6', 'C6', null, null, null, 'G6', 'H6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8']
    ]);
    expect(`
      |   ║   : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   |
      | - ║   : A : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    const mergeCellsPlugin = getPlugin('mergeCells');

    expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(1);
  });

  it('should not unmerge cell when selection contains two merged areas, but pasted data fills out unmerged area', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
    ].join('\r\n'));

    selectCell(0, 1, 5, 5);
    copyPastePlugin.onPaste(clipboardEvent);

    expect(getData()).toEqual([
      ['A1', 'A1', 'B1', 'D1', 'E1', 'F1', 'G1', 'H1'],
      ['A2', 'B2', null, 'D2', 'E2', 'F2', 'G2', 'H2'],
      ['A3', null, null, 'D3', 'E3', 'F3', 'G3', 'H3'],
      ['A4', 'B4', 'C4', 'D4', null, null, 'G4', 'H4'],
      ['A5', 'B5', 'C5', null, null, null, 'G5', 'H5'],
      ['A6', 'B6', 'C6', null, null, null, 'G6', 'H6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8']
    ]);
    expect(`
      |   ║   : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===|
      | - ║   : A : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    const mergeCellsPlugin = getPlugin('mergeCells');

    expect(mergeCellsPlugin.mergedCellsCollection.mergedCells.length).toEqual(2);
  });

  it('should restore a merge area after performing undo for paste action which already unmerged the area', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const clipboardEvent = getClipboardEvent();
    const copyPastePlugin = getPlugin('CopyPaste');

    clipboardEvent.clipboardData.setData('text/html', [
      '<table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>'
    ].join('\r\n'));

    selectCell(1, 1);

    copyPastePlugin.onPaste(clipboardEvent);

    hot.undo();

    // TODO: It should be fixed (actions of changing values and toggling a merge state should be batched)
    // expect(getCell(1, 1).rowSpan).toBe(2);
    // expect(getCell(1, 1).colSpan).toBe(2);

    expect(getData()).toEqual([
      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'],
      ['A2', 'B2', null, 'D2', 'E2', 'F2', 'G2', 'H2'],
      ['A3', null, null, 'D3', 'E3', 'F3', 'G3', 'H3'],
      ['A4', 'B4', 'C4', 'D4', null, null, 'G4', 'H4'],
      ['A5', 'B5', 'C5', null, null, null, 'G5', 'H5'],
      ['A6', 'B6', 'C6', null, null, null, 'G6', 'H6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8']
    ]);

    hot.redo();

    expect(getCell(1, 1).rowSpan).toBe(1);
    expect(getCell(1, 1).colSpan).toBe(1);

    expect(getData()).toEqual([
      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'],
      ['A2', 'A1', 'B1', 'D2', 'E2', 'F2', 'G2', 'H2'],
      ['A3', 'A1', 'B1', 'D3', 'E3', 'F3', 'G3', 'H3'],
      ['A4', 'B4', 'C4', 'D4', null, null, 'G4', 'H4'],
      ['A5', 'B5', 'C5', null, null, null, 'G5', 'H5'],
      ['A6', 'B6', 'C6', null, null, null, 'G6', 'H6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'],
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8']
    ]);
  });
});

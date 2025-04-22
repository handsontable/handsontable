describe('Core.setDataAtRowProp', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    this.datasetAoO = [
      { a: 1, b: 2, c: 3, d: { e: 'nested1', f: 'nested2_1' } },
      { a: 4, b: 5, c: 6, d: { e: 'nested2', f: 'nested2_2' } },
      { a: 7, b: 8, c: 9, d: { e: 'nested3', f: 'nested2_3' } }
    ];
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
      this.datasetAoO = null;
    }
  });

  it('should apply the content to the provided visual row and (physical) prop arguments', () => {
    handsontable({
      data: spec().datasetAoO,
    });

    setDataAtRowProp(0, 'a', 'changed!');

    expect(getDataAtCell(0, 0)).toEqual('changed!');

    updateSettings({
      manualRowMove: [1, 0, 2]
    });

    setDataAtRowProp(0, 'a', 'changed again!');

    expect(getDataAtCell(0, 0)).toEqual('changed again!');
  });

  it('should apply the content to the provided visual row and (physical) prop arguments by passing' +
  'an array of changes to the method', () => {
    handsontable({
      data: spec().datasetAoO,
    });

    setDataAtRowProp([
      [0, 'a', 'changed!'],
      [0, 'b', 'changed too!']
    ]);

    expect(getDataAtCell(0, 0)).toEqual('changed!');
    expect(getDataAtCell(0, 1)).toEqual('changed too!');

    updateSettings({
      manualRowMove: [1, 0, 2]
    });

    setDataAtRowProp([
      [0, 'a', 'changed again!'],
      [0, 'b', 'changed again too!']
    ]);

    expect(getDataAtCell(0, 0)).toEqual('changed again!');
    expect(getDataAtCell(0, 1)).toEqual('changed again too!');
  });

  it('should allow setting content to the trimmed columns', () => {
    handsontable({
      data: spec().datasetAoO,
      columns: [
        { data: 'a' },
      ]
    });

    setDataAtRowProp(0, 'b', 'changed!');

    expect(getSourceDataAtCell(0, 'b')).toEqual('changed!');
  });

  it('should allow setting content to the trimmed columns by passing an array of changes to the method', () => {
    handsontable({
      data: spec().datasetAoO,
      columns: [
        { data: 'a' },
      ]
    });

    setDataAtRowProp([
      [0, 'a', 'changed!'],
      [0, 'b', 'changed too!']
    ]);

    expect(getSourceDataAtCell(0, 'a')).toEqual('changed!');
    expect(getSourceDataAtCell(0, 'b')).toEqual('changed too!');
  });

  it('should be possible to prevent setting of content into a cell if the cell type is defined globally, as well as' +
  'allowInvalid is set to `false`', async() => {
    handsontable({
      data: spec().datasetAoO,
      columns: [
        { data: 'a' },
      ],
      type: 'numeric',
      allowInvalid: false,
    });

    setDataAtRowProp([
      [0, 'a', 'changed!'],
      [0, 'b', 'changed too!'],
      [1, 'a', 777],
      [1, 'b', 'changed too!'],
      [2, 'a', 'changed'],
      [2, 'b', 777],
    ]);

    await sleep(100);

    expect(getSourceDataAtCell(0, 'a')).toEqual(1);
    expect(getSourceDataAtCell(0, 'b')).toEqual(2);
    expect(getSourceDataAtCell(1, 'a')).toEqual(777);
    expect(getSourceDataAtCell(1, 'b')).toEqual(5);
    expect(getSourceDataAtCell(2, 'a')).toEqual(7);
    expect(getSourceDataAtCell(2, 'b')).toEqual(777);
  });
});

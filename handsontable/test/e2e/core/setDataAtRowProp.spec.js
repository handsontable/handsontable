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

  it('should apply the content to the provided visual row and (physical) prop arguments', async() => {
    handsontable({
      data: spec().datasetAoO,
    });

    await setDataAtRowProp(0, 'a', 'changed!');

    expect(getDataAtCell(0, 0)).toEqual('changed!');

    await updateSettings({
      manualRowMove: [1, 0, 2]
    });

    await setDataAtRowProp(0, 'a', 'changed again!');

    expect(getDataAtCell(0, 0)).toEqual('changed again!');
  });

  it('should apply the content to the provided visual row and (physical) prop arguments by passing' +
  'an array of changes to the method', async() => {
    handsontable({
      data: spec().datasetAoO,
    });

    await setDataAtRowProp([
      [0, 'a', 'changed!'],
      [0, 'b', 'changed too!']
    ]);

    expect(getDataAtCell(0, 0)).toEqual('changed!');
    expect(getDataAtCell(0, 1)).toEqual('changed too!');

    await updateSettings({
      manualRowMove: [1, 0, 2]
    });

    await setDataAtRowProp([
      [0, 'a', 'changed again!'],
      [0, 'b', 'changed again too!']
    ]);

    expect(getDataAtCell(0, 0)).toEqual('changed again!');
    expect(getDataAtCell(0, 1)).toEqual('changed again too!');
  });

  it('should allow setting content to the trimmed columns', async() => {
    handsontable({
      data: spec().datasetAoO,
      columns: [
        { data: 'a' },
      ]
    });

    await setDataAtRowProp(0, 'b', 'changed!');

    expect(getSourceDataAtCell(0, 'b')).toEqual('changed!');
  });

  it('should allow setting content to the trimmed columns by passing an array of changes to the method', async() => {
    handsontable({
      data: spec().datasetAoO,
      columns: [
        { data: 'a' },
      ]
    });

    await setDataAtRowProp([
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

    await setDataAtRowProp([
      [0, 'a', 'changed!'],
      [0, 'b', 'changed too!'],
      [1, 'a', 777],
      [1, 'b', 'changed too!'],
      [2, 'a', 'changed'],
      [2, 'b', 777],
    ]);

    await waitForNextAnimationFrames(2);

    expect(getSourceDataAtCell(0, 'a')).toEqual(1);
    expect(getSourceDataAtCell(0, 'b')).toEqual(2);
    expect(getSourceDataAtCell(1, 'a')).toEqual(777);
    expect(getSourceDataAtCell(1, 'b')).toEqual(5);
    expect(getSourceDataAtCell(2, 'a')).toEqual(7);
    expect(getSourceDataAtCell(2, 'b')).toEqual(777);
  });

  it('should keep an edited value when changing a different prop in the same row', async() => {
    handsontable({
      data: [
        { a: 'A1', b: 'B1' },
        { a: 'A2', b: 'B2' },
      ],
      columns: [
        { data: 'a' },
        { data: 'b' },
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    getActiveEditor().setValue('typed value');

    await setDataAtRowProp(0, 'b', 'updated by api');

    expect(getActiveEditor().isOpened()).toBe(true);
    expect(getActiveEditor().getValue()).toBe('typed value');

    await keyDownUp('enter');

    expect(getDataAtRowProp(0, 'a')).toBe('typed value');
    expect(getDataAtRowProp(0, 'b')).toBe('updated by api');
  });

  it('should close the editor when a programmatic change targets the currently edited cell', async() => {
    handsontable({
      data: [
        { a: 'A1', b: 'B1' },
      ],
      columns: [
        { data: 'a' },
        { data: 'b' },
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    expect(getActiveEditor().isOpened()).toBe(true);

    await setDataAtRowProp(0, 'a', 'updated by api');

    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should keep an active editor open when async validation passes for a different prop in the same row', async() => {
    handsontable({
      data: [
        { a: 'A1', b: 1 },
      ],
      columns: [
        { data: 'a' },
        { data: 'b', type: 'numeric' },
      ]
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    getActiveEditor().setValue('typed value');

    await setDataAtRowProp(0, 'b', 42);

    await sleep(100); // wait for async validation microtask to complete

    expect(getActiveEditor().isOpened()).toBe(true);
    expect(getActiveEditor().getValue()).toBe('typed value');
    expect(getDataAtRowProp(0, 'b')).toBe(42);
  });

  it('should pass the source argument to the `beforeChange` and `afterChange` hooks when called with' +
  ' a single change', async() => {
    const beforeChange = jasmine.createSpy('beforeChange');
    const afterChange = jasmine.createSpy('afterChange');

    handsontable({
      data: spec().datasetAoO,
      beforeChange,
      afterChange,
    });

    beforeChange.calls.reset();
    afterChange.calls.reset();

    await setDataAtRowProp(0, 'a', 'changed!', 'my-source');

    expect(beforeChange).toHaveBeenCalledWith([[0, 'a', 1, 'changed!']], 'my-source');
    expect(afterChange).toHaveBeenCalledWith([[0, 'a', 1, 'changed!']], 'my-source');
  });

  it('should pass the source argument to the `beforeChange` and `afterChange` hooks when called with' +
  ' an array of changes', async() => {
    const beforeChange = jasmine.createSpy('beforeChange');
    const afterChange = jasmine.createSpy('afterChange');

    handsontable({
      data: spec().datasetAoO,
      beforeChange,
      afterChange,
    });

    beforeChange.calls.reset();
    afterChange.calls.reset();

    await setDataAtRowProp([
      [0, 'a', 'changed!'],
      [0, 'b', 'changed too!']
    ], 'my-source');

    expect(beforeChange).toHaveBeenCalledWith([
      [0, 'a', 1, 'changed!'],
      [0, 'b', 2, 'changed too!']
    ], 'my-source');
    expect(afterChange).toHaveBeenCalledWith([
      [0, 'a', 1, 'changed!'],
      [0, 'b', 2, 'changed too!']
    ], 'my-source');
  });
});

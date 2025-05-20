describe('Core_datachange', () => {
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

  it('should call afterChange callback', async() => {
    let output = null;

    handsontable({
      afterChange(changes) {
        output = changes;
      }
    });
    await setDataAtCell(1, 2, 'test');

    expect(output[0][0]).toEqual(1);
    expect(output[0][1]).toEqual(2);
    expect(output[0][2]).toEqual(null);
    expect(output[0][3]).toEqual('test');
  });

  it('should use custom source for datachange', async() => {
    let output = null;
    let src = null;

    handsontable({
      afterChange(changes, source) {
        output = changes;
        src = source;
      }
    });
    await setDataAtCell(1, 2, 'abc', 'test');

    expect(output[0][3]).toEqual('abc');
    expect(src).toEqual('test');
  });

  it('should use custom source for datachange with array', async() => {
    let output = null;
    let src = null;

    handsontable({
      afterChange(changes, source) {
        output = changes;
        src = source;
      }
    });
    await setDataAtCell([[1, 2, 'abc']], 'test');

    expect(output[0][3]).toEqual('abc');
    expect(src).toEqual('test');
  });

  it('should trigger datachange event', async() => {
    let output = null;

    handsontable();
    Handsontable.hooks.add('afterChange', (changes) => {
      output = changes;
    });
    await setDataAtCell(1, 2, 'test');

    expect(output[0][0]).toEqual(1);
    expect(output[0][1]).toEqual(2);
    expect(output[0][2]).toEqual(null);
    expect(output[0][3]).toEqual('test');
  });

  it('this.rootWrapperElement should be placed in the container div provided by the user', async() => {
    let rootWrapperElement = null;

    handsontable({
      afterChange() {
        rootWrapperElement = this.rootWrapperElement;
      }
    });
    await setDataAtCell(0, 0, 'test');

    expect(spec().$container[0].contains(rootWrapperElement)).toBeTrue();
  });

  it('this.rootElement should be placed in the container div provided by the user', async() => {
    let rootElement = null;

    handsontable({
      afterChange() {
        rootElement = this.rootElement;
      }
    });
    await setDataAtCell(0, 0, 'test');

    expect(spec().$container[0].contains(rootElement)).toBeTrue();
  });

  it('this.rootElement should be placed in the this.rootWrapperElement', async() => {
    let rootWrapperElement = null;
    let rootElement = null;

    handsontable({
      afterChange() {
        rootWrapperElement = this.rootWrapperElement;
        rootElement = this.rootElement;
      }
    });
    await setDataAtCell(0, 0, 'test');

    expect(rootWrapperElement.contains(rootElement)).toBeTrue();
  });

  it('afterChange should be triggered after data is rendered to DOM (init)', async() => {
    const $container = spec().$container;
    let output = null;

    handsontable({
      data: [
        ['Joe Red']
      ],
      afterChange(changes, source) {
        if (source === 'loadData') {
          output = $container.find('table.htCore tbody td:first').html();
        }
      }
    });

    expect(output).toEqual('Joe Red');
  });

  it('afterChange should be triggered after data is rendered to DOM (setDataAtCell)', async() => {
    const $container = spec().$container;
    let output = null;

    handsontable({
      data: [
        ['Joe Red']
      ],
      afterChange(changes, source) {
        if (source === 'edit') {
          output = $container.find('table.htCore tbody td:first').html();
        }
      }
    });
    await setDataAtCell(0, 0, 'Alice Red');

    expect(output).toEqual('Alice Red');
  });

  it('afterChange event object should contain documented keys and values when triggered by edit', async() => {
    const sampleData = [
      {
        col1: 'a',
        col2: 'b',
        col3: 'c'
      }
    ];
    let event = null;

    handsontable({
      data: sampleData,
      afterChange(changes, source) {
        if (source === 'edit') {
          event = changes.shift();
        }
      }
    });
    await setDataAtCell(0, 0, 'test');

    expect(event[0]).toEqual(0);
    expect(event[1]).toEqual('col1');
    expect(event[2]).toEqual('a');
    expect(event[3]).toEqual('test');
  });

  it('source parameter should be `edit` when cell value is changed through editor', async() => {
    const sources = [];

    handsontable({
      data: [
        ['Joe Red']
      ],
      afterChange(changes, source) {
        sources.push(source);
      }
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    document.activeElement.value = 'Ted';

    await keyDownUp('enter');

    expect(sources).toEqual(['loadData', 'edit']); // loadData is always the first source
  });

});

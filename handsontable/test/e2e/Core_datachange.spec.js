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

  it('should call onChange callback', () => {
    let output = null;

    handsontable({
      afterChange(changes) {
        output = changes;
      }
    });
    setDataAtCell(1, 2, 'test');

    expect(output[0][0]).toEqual(1);
    expect(output[0][1]).toEqual(2);
    expect(output[0][2]).toEqual(null);
    expect(output[0][3]).toEqual('test');
  });

  it('should use custom source for datachange', () => {
    let output = null;
    let src = null;

    handsontable({
      afterChange(changes, source) {
        output = changes;
        src = source;
      }
    });
    setDataAtCell(1, 2, 'abc', 'test');

    expect(output[0][3]).toEqual('abc');
    expect(src).toEqual('test');
  });

  it('should use custom source for datachange with array', () => {
    let output = null;
    let src = null;

    handsontable({
      afterChange(changes, source) {
        output = changes;
        src = source;
      }
    });
    setDataAtCell([[1, 2, 'abc']], 'test');

    expect(output[0][3]).toEqual('abc');
    expect(src).toEqual('test');
  });

  it('should trigger datachange event', () => {
    let output = null;

    handsontable();
    Handsontable.hooks.add('afterChange', (changes) => {
      output = changes;
    });
    setDataAtCell(1, 2, 'test');

    expect(output[0][0]).toEqual(1);
    expect(output[0][1]).toEqual(2);
    expect(output[0][2]).toEqual(null);
    expect(output[0][3]).toEqual('test');
  });

  it('this.rootElement should point to handsontable rootElement', () => {
    const $container = spec().$container;
    let output = null;

    handsontable({
      afterChange() {
        output = this.rootElement;
      }
    });
    setDataAtCell(0, 0, 'test');

    expect(output).toEqual($container[0]);
  });

  it('onChange should be triggered after data is rendered to DOM (init)', () => {
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

  it('onChange should be triggered after data is rendered to DOM (setDataAtCell)', () => {
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
    setDataAtCell(0, 0, 'Alice Red');

    expect(output).toEqual('Alice Red');
  });

  it('onChange event object should contain documented keys and values when triggered by edit', () => {
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
    setDataAtCell(0, 0, 'test');

    expect(event[0]).toEqual(0);
    expect(event[1]).toEqual('col1');
    expect(event[2]).toEqual('a');
    expect(event[3]).toEqual('test');
  });

  it('source parameter should be `edit` when cell value is changed through editor', () => {
    const sources = [];

    handsontable({
      data: [
        ['Joe Red']
      ],
      afterChange(changes, source) {
        sources.push(source);
      }
    });
    selectCell(0, 0);

    keyDown('enter');
    document.activeElement.value = 'Ted';
    keyDown('enter');

    expect(sources).toEqual(['loadData', 'edit']); // loadData is always the first source
  });

});

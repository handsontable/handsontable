describe('Core.getSourceDataArray', () => {
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

  it('should return data as an array when provided data was an array of arrays', () => {
    handsontable({
      data: [[1, 2, 3], ['a', 'b', 'c']],
      copyable: true
    });

    expect(getSourceDataArray()).toEqual([[1, 2, 3], ['a', 'b', 'c']]);
    expect(getSourceDataArray(0, 1, 1, 2)).toEqual([[2, 3], ['b', 'c']]);
  });

  it('should return data as an array when provided data was an array of objects', () => {
    handsontable({
      data: [{ a: 1, b: 2, c: 3 }, { a: 'a', b: 'b', c: 'c' }],
      copyable: true
    });

    expect(getSourceDataArray()).toEqual([[1, 2, 3], ['a', 'b', 'c']]);
    expect(getSourceDataArray(0, 1, 1, 2)).toEqual([[2, 3], ['b', 'c']]);
  });
});

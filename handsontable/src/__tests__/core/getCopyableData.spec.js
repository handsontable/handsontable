describe('Core.getCopyableData', () => {
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

  it('should return copyable data when `copyable` option is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      copyable: true
    });

    expect(getCopyableData(0, 0)).toBe('A1');
    expect(getCopyableData(1, 1)).toBe('B2');
    expect(getCopyableData(5, 1)).toBe('B6');
    expect(getCopyableData(8, 9)).toBe('J9');
  });

  it('should return empty string as copyable data when `copyable` option is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      copyable: false
    });

    expect(getCopyableData(0, 0)).toBe('');
    expect(getCopyableData(1, 1)).toBe('');
    expect(getCopyableData(5, 1)).toBe('');
    expect(getCopyableData(8, 9)).toBe('');
  });

  it('should return a string for every cell data type', async() => {
    handsontable({
      data: [
        { id: 1, name: 'Ann', active: true, score: 12.5, note: null, extra: undefined, pets: ['cat', 'dog'], map: {} },
      ],
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'active', type: 'checkbox' },
        { data: 'score' },
        { data: 'note' },
        { data: 'extra' },
        { data: 'pets' },
        { data: 'map' },
      ],
      copyable: true
    });

    expect(getCopyableData(0, 0)).toBe('1');
    expect(getCopyableData(0, 1)).toBe('Ann');
    expect(getCopyableData(0, 2)).toBe('true');
    expect(getCopyableData(0, 3)).toBe('12.5');
    expect(getCopyableData(0, 4)).toBe('');
    expect(getCopyableData(0, 5)).toBe('');
    expect(getCopyableData(0, 6)).toBe('cat,dog');
    expect(getCopyableData(0, 7)).toBe('[object Object]');
  });

  it('should return an empty string for a row outside the data range', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      copyable: true
    });

    expect(getCopyableData(99, 0)).toBe('');
  });
});

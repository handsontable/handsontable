describe('Core.getCopyableSourceData', () => {
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
      data: [
        [{ id: 123, name: 'John' }],
        [{ id: 456, name: 'Mark' }],
      ],
      copyable: true,
      valueGetter: value => value?.name ?? value,
    });

    expect(getCopyableSourceData(0, 0)).toEqual({ id: 123, name: 'John' });
    expect(getCopyableSourceData(1, 0)).toEqual({ id: 456, name: 'Mark' });
  });

  it('should return non-string source values without converting them', async() => {
    handsontable({
      data: [
        { id: 1, active: true, note: null },
      ],
      columns: [
        { data: 'id' },
        { data: 'active', type: 'checkbox' },
        { data: 'note' },
      ],
      copyable: true
    });

    // Unlike `getCopyableData()`, this method hands back the source value as it is stored, so the
    // CopyPaste plugin can serialize nested objects to JSON.
    expect(getCopyableSourceData(0, 0)).toBe(1);
    expect(getCopyableSourceData(0, 1)).toBe(true);
    expect(getCopyableSourceData(0, 2)).toBe(null);
  });

  it('should return empty string as copyable data when `copyable` option is disabled', async() => {
    handsontable({
      data: [
        [{ id: 123, name: 'John' }],
        [{ id: 456, name: 'Mark' }],
      ],
      copyable: false
    });

    expect(getCopyableSourceData(0, 0)).toEqual('');
    expect(getCopyableSourceData(1, 0)).toEqual('');
  });
});

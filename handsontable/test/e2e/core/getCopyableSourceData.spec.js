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

describe('checkboxRenderer cooperation with AutoColumnSize', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return an empty string as seed when the label is not used', async() => {
    const modifyAutoColumnSizeSeed = jasmine.createSpy('modifyAutoColumnSizeSeed');

    handsontable({
      data: [
        { value: true },
        { value: false },
        { value: true },
      ],
      columns: [{
        data: 'value',
        type: 'checkbox',
      }],
      modifyAutoColumnSizeSeed,
    });

    expect(modifyAutoColumnSizeSeed.calls.count()).toBe(3);
    expect(modifyAutoColumnSizeSeed).toHaveBeenCalledWith('', jasmine.any(Object), true);
    expect(modifyAutoColumnSizeSeed).toHaveBeenCalledWith('', jasmine.any(Object), false);
    expect(modifyAutoColumnSizeSeed).toHaveBeenCalledWith('', jasmine.any(Object), true);
  });

  it('should return the seed as a string length when the label is used', async() => {
    const modifyAutoColumnSizeSeed = jasmine.createSpy('modifyAutoColumnSizeSeed');

    handsontable({
      data: [
        { value: true, label: 'test' },
        { value: false, label: 'longer text' },
        { value: true, label: 'foo1' },
      ],
      columns: [{
        data: 'value',
        type: 'checkbox',
        label: {
          property: 'label',
        },
      }],
      modifyAutoColumnSizeSeed,
    });

    expect(modifyAutoColumnSizeSeed.calls.count()).toBe(3);
    expect(modifyAutoColumnSizeSeed).toHaveBeenCalledWith('4', jasmine.any(Object), true);
    expect(modifyAutoColumnSizeSeed).toHaveBeenCalledWith('11', jasmine.any(Object), false);
    expect(modifyAutoColumnSizeSeed).toHaveBeenCalledWith('4', jasmine.any(Object), true);
  });
});

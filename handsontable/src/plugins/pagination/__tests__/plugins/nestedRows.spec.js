describe('Pagination integration with NestedRows', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not be possible to enable the pagination', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: [
        {
          category: 'Best Rock Performance',
          artist: null,
          __children: [
            {
              artist: 'Alabama Shakes',
            },
          ],
        },
      ],
      rowHeaders: true,
      nestedRows: true,
      pagination: true,
    });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith('The `pagination` plugin cannot be used with ' +
      'the `nestedRows` option. This combination is not supported. The plugin will remain disabled.');
    expect(getSettings().pagination).toBe(false);
    expect(getPlugin('pagination').isEnabled()).toBe(false);
  });
});

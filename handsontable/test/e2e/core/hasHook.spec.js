describe('Core.hasHook', () => {
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

  it('should return `true` for existed local and global hooks', async() => {
    const hot = handsontable();

    hot.addHook('myHook', async() => {});

    expect(hot.hasHook('myHook')).toBe(true);
    expect(hot.hasHook('myGlobalHook')).toBe(false);

    Handsontable.hooks.add('myGlobalHook', async() => {});

    expect(hot.hasHook('myHook')).toBe(true);
    expect(hot.hasHook('myGlobalHook')).toBe(true);
  });
});

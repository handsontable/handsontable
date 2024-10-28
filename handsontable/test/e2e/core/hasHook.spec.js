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

  it('should return `true` for existed local and global hooks', () => {
    const hot = handsontable();

    hot.addHook('myHook', () => {});

    expect(hot.hasHook('myHook')).toBe(true);
    expect(hot.hasHook('myGlobalHook')).toBe(false);

    Handsontable.hooks.add('myGlobalHook', () => {});

    expect(hot.hasHook('myHook')).toBe(true);
    expect(hot.hasHook('myGlobalHook')).toBe(true);
  });
});

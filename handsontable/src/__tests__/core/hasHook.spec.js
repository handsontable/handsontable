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
    handsontable();

    await addHook('myHook', async() => {});

    expect(hasHook('myHook')).toBe(true);
    expect(hasHook('myGlobalHook')).toBe(false);

    Handsontable.hooks.add('myGlobalHook', async() => {});

    expect(hasHook('myHook')).toBe(true);
    expect(hasHook('myGlobalHook')).toBe(true);
  });
});

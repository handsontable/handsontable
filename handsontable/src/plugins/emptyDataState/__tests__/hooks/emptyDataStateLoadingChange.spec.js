describe('EmptyDataState `emptyDataStateLoadingChange` hook', () => {
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

  it('should show the loading overlay when the hook is true even if the grid has data', async() => {
    handsontable({
      data: [['cell']],
      columns: [{ data: 0 }],
      emptyDataState: true,
    });

    await sleep(0);

    runHooks('emptyDataStateLoadingChange', true);

    await sleep(0);

    const root = getEmptyDataStateContainerElement();

    expect(root.style.display).not.toBe('none');
    expect(root.classList.contains('ht-empty-data-state--loading')).toBe(true);
  });

  it('should hide the overlay when the hook is false and the grid has data', async() => {
    handsontable({
      data: [['cell']],
      columns: [{ data: 0 }],
      emptyDataState: true,
    });

    await sleep(0);

    runHooks('emptyDataStateLoadingChange', true);

    await sleep(0);

    runHooks('emptyDataStateLoadingChange', false);

    await sleep(0);

    const root = getEmptyDataStateContainerElement();

    expect(root.style.display).toBe('none');
  });
});

describe('Core.suspendRender', () => {
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

  it('should suspend the table rendering process and mark that the slow redraw was used', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    spyOn(hot.view._wt, 'draw');
    spyOn(hot.view._wt.wtOverlays, 'adjustElementsSize');

    const beforeRender = jasmine.createSpy('beforeRender');
    const afterRender = jasmine.createSpy('afterRender');
    const beforeViewRender = jasmine.createSpy('beforeViewRender');
    const afterViewRender = jasmine.createSpy('afterViewRender');

    addHook('beforeRender', beforeRender);
    addHook('afterRender', afterRender);
    addHook('beforeViewRender', beforeViewRender);
    addHook('afterViewRender', afterViewRender);

    expect(hot.renderSuspendedCounter).toBe(0);

    await suspendRender();
    await render();
    await render();
    await render();

    expect(hot.renderSuspendedCounter).toBe(1);
    expect(hot.forceFullRender).toBe(true);
    expect(hot.view._wt.draw).not.toHaveBeenCalled();
    expect(hot.view._wt.wtOverlays.adjustElementsSize).not.toHaveBeenCalled();
    expect(beforeRender).not.toHaveBeenCalled();
    expect(afterRender).not.toHaveBeenCalled();
    expect(beforeViewRender).not.toHaveBeenCalled();
    expect(afterViewRender).not.toHaveBeenCalled();
  });

  it('should suspend the table rendering process and mark that the fast redraw was used', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    spyOn(hot.view._wt, 'draw');
    spyOn(hot.view._wt.wtOverlays, 'adjustElementsSize');

    const beforeRender = jasmine.createSpy('beforeRender');
    const afterRender = jasmine.createSpy('afterRender');
    const beforeViewRender = jasmine.createSpy('beforeViewRender');
    const afterViewRender = jasmine.createSpy('afterViewRender');

    addHook('beforeRender', beforeRender);
    addHook('afterRender', afterRender);
    addHook('beforeViewRender', beforeViewRender);
    addHook('afterViewRender', afterViewRender);

    expect(hot.renderSuspendedCounter).toBe(0);

    await suspendRender();
    await selectCell(1, 1);

    expect(hot.renderSuspendedCounter).toBe(1);
    expect(hot.forceFullRender).toBe(false);
    expect(hot.view._wt.draw).not.toHaveBeenCalled();
    expect(hot.view._wt.wtOverlays.adjustElementsSize).not.toHaveBeenCalled();
    expect(beforeRender).not.toHaveBeenCalled();
    expect(afterRender).not.toHaveBeenCalled();
    expect(beforeViewRender).not.toHaveBeenCalled();
    expect(afterViewRender).not.toHaveBeenCalled();
  });

  it('should wrap multiple calls of the table suspend rendering', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    spyOn(hot.view._wt, 'draw');
    spyOn(hot.view._wt.wtOverlays, 'adjustElementsSize');

    const beforeRender = jasmine.createSpy('beforeRender');
    const afterRender = jasmine.createSpy('afterRender');
    const beforeViewRender = jasmine.createSpy('beforeViewRender');
    const afterViewRender = jasmine.createSpy('afterViewRender');

    addHook('beforeRender', beforeRender);
    addHook('afterRender', afterRender);
    addHook('beforeViewRender', beforeViewRender);
    addHook('afterViewRender', afterViewRender);

    expect(hot.renderSuspendedCounter).toBe(0);

    await suspendRender();
    await render();
    await suspendRender();
    await render();
    await suspendRender();
    await suspendRender();
    await selectCell(1, 1);
    await suspendRender();
    await render();
    await selectCell(1, 1);

    expect(hot.renderSuspendedCounter).toBe(5);
    expect(hot.view._wt.draw).not.toHaveBeenCalled();
    expect(hot.view._wt.wtOverlays.adjustElementsSize).not.toHaveBeenCalled();
    expect(beforeRender).not.toHaveBeenCalled();
    expect(afterRender).not.toHaveBeenCalled();
    expect(beforeViewRender).not.toHaveBeenCalled();
    expect(afterViewRender).not.toHaveBeenCalled();
  });
});

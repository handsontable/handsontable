describe('Core.resumeRender', () => {
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

  it('should resume the table rendering process and render the table using slow redrawing ' +
     '(the same redrawing, which was postponed)', async() => {
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

    await suspendRender();
    await render();
    await render();
    await render();
    await resumeRender();

    expect(hot.renderSuspendedCounter).toBe(0);
    expect(hot.view._wt.draw).toHaveBeenCalledOnceWith(false); // slow redraw
    expect(hot.view._wt.wtOverlays.adjustElementsSize).toHaveBeenCalledTimes(0);
    expect(beforeRender).toHaveBeenCalledTimes(1);
    expect(afterRender).toHaveBeenCalledTimes(1);
    // Walkontable calculators decide that the slow render path is not necessary,
    // so the `beforeViewRender` and `afterViewRender` hooks are not triggered.
    expect(beforeViewRender).toHaveBeenCalledTimes(0);
    expect(afterViewRender).toHaveBeenCalledTimes(0);
  });

  it('should resume the table rendering process and render the table using fast redrawing ' +
     '(the same redrawing, which was postponed)', async() => {
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

    await suspendRender();
    await selectCell(0, 0);
    await selectCell(1, 1);
    await selectCell(2, 2);
    await resumeRender();

    expect(hot.renderSuspendedCounter).toBe(0);
    expect(hot.view._wt.draw).toHaveBeenCalledOnceWith(true); // fast redraw
    expect(hot.view._wt.wtOverlays.adjustElementsSize).toHaveBeenCalledTimes(0);
    expect(beforeRender).toHaveBeenCalledTimes(1);
    expect(afterRender).toHaveBeenCalledTimes(1);
    // The view render hooks are not triggered when the fast render path is used.
    expect(beforeViewRender).toHaveBeenCalledTimes(0);
    expect(afterViewRender).toHaveBeenCalledTimes(0);
  });

  it('should resume the table rendering process and adjust the overlays\' sizes', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    spyOn(hot.view._wt, 'draw');
    spyOn(hot.view._wt.wtOverlays, 'adjustElementsSize');

    await suspendRender();

    tableView().adjustElementsSize();
    tableView().adjustElementsSize();
    tableView().adjustElementsSize();

    await resumeRender();

    expect(hot.renderSuspendedCounter).toBe(0);
    expect(hot.view._wt.draw).toHaveBeenCalledOnceWith(true); // fast redraw
    expect(hot.view._wt.wtOverlays.adjustElementsSize).toHaveBeenCalledTimes(1);
  });

  it('should render the table only on the last resume call (a call that resets the counter of nested suspend calls)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    spyOn(hot.view._wt, 'draw');
    spyOn(hot.view._wt.wtOverlays, 'adjustElementsSize');

    await suspendRender();
    await suspendRender();
    await suspendRender();

    // fast render
    await selectCell(1, 1);
    await resumeRender();

    expect(hot.renderSuspendedCounter).toBe(2);

    // slow render
    await render();
    await resumeRender();

    expect(hot.renderSuspendedCounter).toBe(1);

    // fast render
    await selectCell(2, 2);

    tableView().adjustElementsSize();

    await resumeRender(); // Counter is now equals to 0, it calls render.
    await resumeRender();
    await resumeRender();
    await resumeRender();

    expect(hot.renderSuspendedCounter).toBe(0);
    expect(hot.view._wt.draw).toHaveBeenCalledOnceWith(false); // slow redraw
    expect(hot.view._wt.wtOverlays.adjustElementsSize).toHaveBeenCalledTimes(1);
  });
});

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

  it('should suspend the table rendering process and mark that the slow redraw was used', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    spyOn(hot.view.wt, 'draw');
    spyOn(hot.view.wt.wtOverlays, 'adjustElementsSize');

    const beforeRender = jasmine.createSpy('beforeRender');
    const afterRender = jasmine.createSpy('afterRender');
    const beforeViewRender = jasmine.createSpy('beforeViewRender');
    const afterViewRender = jasmine.createSpy('afterViewRender');

    addHook('beforeRender', beforeRender);
    addHook('afterRender', afterRender);
    addHook('beforeViewRender', beforeViewRender);
    addHook('afterViewRender', afterViewRender);

    expect(hot.renderSuspendedCounter).toBe(0);

    hot.suspendRender();
    hot.render();
    hot.render();
    hot.render();

    expect(hot.renderSuspendedCounter).toBe(1);
    expect(hot.renderCall).toBe(true);
    expect(hot.forceFullRender).toBe(true);
    expect(hot.view.wt.draw).not.toHaveBeenCalled();
    expect(hot.view.wt.wtOverlays.adjustElementsSize).not.toHaveBeenCalled();
    expect(beforeRender).not.toHaveBeenCalled();
    expect(afterRender).not.toHaveBeenCalled();
    expect(beforeViewRender).not.toHaveBeenCalled();
    expect(afterViewRender).not.toHaveBeenCalled();
  });

  it('should suspend the table rendering process and mark that the fast redraw was used', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    spyOn(hot.view.wt, 'draw');
    spyOn(hot.view.wt.wtOverlays, 'adjustElementsSize');

    const beforeRender = jasmine.createSpy('beforeRender');
    const afterRender = jasmine.createSpy('afterRender');
    const beforeViewRender = jasmine.createSpy('beforeViewRender');
    const afterViewRender = jasmine.createSpy('afterViewRender');

    addHook('beforeRender', beforeRender);
    addHook('afterRender', afterRender);
    addHook('beforeViewRender', beforeViewRender);
    addHook('afterViewRender', afterViewRender);

    expect(hot.renderSuspendedCounter).toBe(0);

    hot.suspendRender();
    hot.selectCell(1, 1);

    expect(hot.renderSuspendedCounter).toBe(1);
    expect(hot.renderCall).toBe(false);
    expect(hot.forceFullRender).toBe(false);
    expect(hot.view.wt.draw).not.toHaveBeenCalled();
    expect(hot.view.wt.wtOverlays.adjustElementsSize).not.toHaveBeenCalled();
    expect(beforeRender).not.toHaveBeenCalled();
    expect(afterRender).not.toHaveBeenCalled();
    expect(beforeViewRender).not.toHaveBeenCalled();
    expect(afterViewRender).not.toHaveBeenCalled();
  });

  it('should wrap multiple calls of the table suspend rendering', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    spyOn(hot.view.wt, 'draw');
    spyOn(hot.view.wt.wtOverlays, 'adjustElementsSize');

    const beforeRender = jasmine.createSpy('beforeRender');
    const afterRender = jasmine.createSpy('afterRender');
    const beforeViewRender = jasmine.createSpy('beforeViewRender');
    const afterViewRender = jasmine.createSpy('afterViewRender');

    addHook('beforeRender', beforeRender);
    addHook('afterRender', afterRender);
    addHook('beforeViewRender', beforeViewRender);
    addHook('afterViewRender', afterViewRender);

    expect(hot.renderSuspendedCounter).toBe(0);

    hot.suspendRender();
    hot.render();
    hot.suspendRender();
    hot.render();
    hot.suspendRender();
    hot.suspendRender();
    hot.selectCell(1, 1);
    hot.suspendRender();
    hot.render();
    hot.selectCell(1, 1);

    expect(hot.renderSuspendedCounter).toBe(5);
    expect(hot.view.wt.draw).not.toHaveBeenCalled();
    expect(hot.view.wt.wtOverlays.adjustElementsSize).not.toHaveBeenCalled();
    expect(beforeRender).not.toHaveBeenCalled();
    expect(afterRender).not.toHaveBeenCalled();
    expect(beforeViewRender).not.toHaveBeenCalled();
    expect(afterViewRender).not.toHaveBeenCalled();
  });
});

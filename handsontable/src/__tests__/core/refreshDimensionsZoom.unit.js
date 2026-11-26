import Core from 'handsontable/core';
import { registerCellType } from '../../cellTypes/registry';
import { TextCellType } from '../../cellTypes/textType/textType';
import { baseRenderer } from '../../renderers/baseRenderer/baseRenderer';
import { registerRenderer } from '../../renderers/registry';
import { textRenderer } from '../../renderers/textRenderer/textRenderer';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

describe('Core#refreshDimensions() and a change of the browser zoom', () => {
  let container;
  let core;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    core = new Core(container, {
      theme: 'ht-theme-main',
      data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
      width: 300,
      height: 200,
      licenseKey: TEST_LICENSE_KEY,
    });
    core.init();
    // A first call settles the size the next one compares with, so a call that follows renders only for
    // the reason the test gives it.
    core.refreshDimensions();
  });

  afterEach(() => {
    core.destroy();
    core = null;
    container.remove();
  });

  it('should not render when neither the size nor the zoom changed', () => {
    spyOn(core.view, 'refreshZoomDependentSizes').and.returnValue(false);
    spyOn(core, 'render');

    core.refreshDimensions();

    expect(core.render).not.toHaveBeenCalled();
  });

  it('should render once when only the zoom moved the cell border, though the container kept its size', () => {
    const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

    core.addHook('afterRefreshDimensions', afterRefreshDimensions);
    spyOn(core.view, 'refreshZoomDependentSizes').and.returnValue(true);
    spyOn(core, 'render');

    core.refreshDimensions();

    expect(core.render).toHaveBeenCalledTimes(1);
    // The container did not change, so the hook still says so.
    expect(afterRefreshDimensions.calls.mostRecent().args[2]).toBe(false);
  });

  it('should not look at the zoom when a `beforeRefreshDimensions` listener blocks the resize', () => {
    core.addHook('beforeRefreshDimensions', () => false);
    spyOn(core.view, 'refreshZoomDependentSizes').and.returnValue(true);
    spyOn(core, 'render');

    core.refreshDimensions();

    expect(core.view.refreshZoomDependentSizes).not.toHaveBeenCalled();
    expect(core.render).not.toHaveBeenCalled();
  });

  it('should still refresh on the next call once the listener lets the resize through', () => {
    let blocked = true;

    core.addHook('beforeRefreshDimensions', () => !blocked);
    spyOn(core.view, 'refreshZoomDependentSizes').and.returnValue(true);
    spyOn(core, 'render');

    core.refreshDimensions();
    blocked = false;
    core.refreshDimensions();

    expect(core.render).toHaveBeenCalledTimes(1);
  });
});

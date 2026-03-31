import HeadersUI from 'handsontable/plugins/nestedRows/ui/headers';

describe('NestedRows headers UI', () => {
  it('should recalculate overlays when row header width changes', () => {
    const adjustElementsSize = jasmine.createSpy('adjustElementsSize');
    const requestAnimationFrame = jasmine.createSpy('requestAnimationFrame').and.callFake((callback) => {
      callback();

      return 0;
    });
    const render = jasmine.createSpy('render');
    const hotMock = {
      view: {
        adjustElementsSize,
      },
      rootWindow: {
        requestAnimationFrame,
      },
      stylesHandler: {
        getCSSVariableValue() {
          return 8;
        },
      },
      isDestroyed: false,
      render,
    };
    const pluginMock = {
      dataManager: {
        cache: {
          levelCount: 3,
        },
      },
      collapsingUI: null,
    };
    const headersUI = new HeadersUI(pluginMock, hotMock);

    headersUI.updateRowHeaderWidth();

    expect(render).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(adjustElementsSize).toHaveBeenCalledWith(true);
  });

  it('should not recalculate overlays when row header width does not change', () => {
    const adjustElementsSize = jasmine.createSpy('adjustElementsSize');
    const requestAnimationFrame = jasmine.createSpy('requestAnimationFrame');
    const render = jasmine.createSpy('render');
    const hotMock = {
      view: {
        adjustElementsSize,
      },
      rootWindow: {
        requestAnimationFrame,
      },
      stylesHandler: {
        getCSSVariableValue() {
          return 8;
        },
      },
      isDestroyed: false,
      render,
    };
    const pluginMock = {
      dataManager: {
        cache: {
          levelCount: 3,
        },
      },
      collapsingUI: null,
    };
    const headersUI = new HeadersUI(pluginMock, hotMock);

    headersUI.updateRowHeaderWidth();
    requestAnimationFrame.calls.reset();
    adjustElementsSize.calls.reset();

    headersUI.updateRowHeaderWidth();

    expect(render).toHaveBeenCalledTimes(2);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(adjustElementsSize).not.toHaveBeenCalled();
  });
});

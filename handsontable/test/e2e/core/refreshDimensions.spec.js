describe('Core.await refreshDimensions()', () => {
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

  it('should trigger `beforeRefreshDimensions` and `afterRefreshDimensions` hooks internally', async() => {
    const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');
    const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

    handsontable({
      data: createSpreadsheetData(5, 5),
      beforeRefreshDimensions,
      afterRefreshDimensions,
    });

    await refreshDimensions();

    expect(beforeRefreshDimensions).forThemes(({ classic, main, horizon }) => {
      classic.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 131 },
        true,
      );
      main.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 146 },
        true,
      );
      horizon.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 186 },
        true,
      );
    });
    expect(afterRefreshDimensions).forThemes(({ classic, main, horizon }) => {
      classic.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 131 },
        true,
      );
      main.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 146 },
        true,
      );
      horizon.toHaveBeenCalledOnceWith(
        { width: 1265, height: 0 },
        { width: 1265, height: 186 },
        true,
      );
    });
  });

  it('should trigger `render` and `adjustElementsSize` methods internally if the root element size is changed between calls', async() => {
    spec().$container.css('height', 100).css('overflow', 'hidden');

    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await refreshDimensions();

    spec().$container.css('height', 200);

    spyOn(hot, 'render');
    spyOn(hot.view, 'adjustElementsSize');

    await refreshDimensions();

    expect(hot.render).toHaveBeenCalledTimes(1);
    expect(hot.view.adjustElementsSize).toHaveBeenCalledBefore(hot.render);
    expect(hot.view.adjustElementsSize).toHaveBeenCalledTimes(1);
  });

  it('should trigger `render` and `adjustElementsSize` methods internally (#dev-1876)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
    });

    spyOn(hot, 'render');
    spyOn(hot.view, 'adjustElementsSize');

    await refreshDimensions();

    expect(hot.render).toHaveBeenCalledTimes(1);
    expect(hot.view.adjustElementsSize).toHaveBeenCalledBefore(hot.render);
    expect(hot.view.adjustElementsSize).toHaveBeenCalledTimes(1);
  });

  it('should refresh dimensions after `visualViewport` resize', async() => {
    if (!window.visualViewport) {
      return;
    }

    let visualViewportScale = window.visualViewport.scale;

    spyOnProperty(window.visualViewport, 'scale', 'get').and.callFake(() => visualViewportScale);

    const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');

    handsontable({
      data: createSpreadsheetData(50, 5),
      width: 320,
      height: 200,
      beforeRefreshDimensions,
    });

    await sleep(50);

    const callsBeforeResize = beforeRefreshDimensions.calls.count();

    visualViewportScale += 0.1;
    window.visualViewport.dispatchEvent(new Event('resize'));
    await sleep(50);

    expect(beforeRefreshDimensions.calls.count()).toBe(callsBeforeResize + 1);
  });

  it('should refresh dimensions after `visualViewport` resize when running inside an iframe', async() => {
    const iframe = $('<iframe/>').appendTo(spec().$container);
    const iframeWindow = iframe[0].contentWindow;
    const iframeDoc = iframe[0].contentDocument;

    if (!iframeWindow.visualViewport) {
      return;
    }

    iframeDoc.open('text/html', 'replace');
    iframeDoc.write(`
      <!doctype html>
      <head>
        <link type="text/css" rel="stylesheet" href="../styles/ht-theme-classic.css">
        <link type="text/css" rel="stylesheet" href="../styles/ht-theme-main.css">
        <link type="text/css" rel="stylesheet" href="../styles/ht-theme-horizon.css">
      </head>
      <body><div id="hot-in-iframe"></div></body>`);
    iframeDoc.close();

    let visualViewportScale = iframeWindow.visualViewport.scale;

    spyOnProperty(iframeWindow.visualViewport, 'scale', 'get').and.callFake(() => visualViewportScale);

    const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');
    const container = iframeDoc.getElementById('hot-in-iframe');
    const hot = new Handsontable(container, {
      data: createSpreadsheetData(50, 5),
      width: 320,
      height: 200,
      beforeRefreshDimensions,
    });

    await sleep(50);

    expect(iframeWindow.top).not.toBe(iframeWindow);

    const callsBeforeResize = beforeRefreshDimensions.calls.count();

    visualViewportScale += 0.1;
    iframeWindow.visualViewport.dispatchEvent(new Event('resize'));
    await sleep(50);

    expect(beforeRefreshDimensions.calls.count()).toBe(callsBeforeResize + 1);

    hot.destroy();
  });
});

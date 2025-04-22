describe('Core_listen', () => {
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

  it('should not listen by default after initialization', async() => {
    handsontable();

    expect(isListening()).toBe(false);
  });

  it('should listen to changes when cell is selected', async() => {
    handsontable();

    await selectCell(0, 0);

    expect(isListening()).toBe(true);
  });

  it('should listen to changes when the dataset is empty and the corner is clicked', async() => {
    handsontable({
      data: [],
      rowHeaders: true,
      colHeaders: true,
    });

    spec().$container.find('.ht_clone_top_inline_start_corner thead tr:eq(0) th:eq(0)')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    expect(isListening()).toBe(true);
  });

  it('should\'t listen to changes when cell is selected via `selectCell` when `changeListener` argument is `false`', async() => {
    handsontable();

    await unlisten();

    expect(isListening()).toBe(false);

    await selectCell(0, 0, undefined, undefined, true, false);

    expect(isListening()).toBe(false);
  });

  it('should unlisten changes', async() => {
    handsontable();

    await selectCell(0, 0);

    expect(isListening()).toBe(true);

    await unlisten();

    expect(isListening()).toBe(false);
  });

  it('should listen to changes, when called after unlisten', async() => {
    handsontable();

    await selectCell(0, 0);
    await unlisten();
    await listen();

    expect(isListening()).toBe(true);
  });

  // We have no idea why listen should change focus (behavior up to Handsontable 8.0).
  it('should not change focus on active element, when listen was called', async() => {
    handsontable();
    const input = document.createElement('input');

    document.body.appendChild(input);

    await selectCell(0, 0);
    input.focus();
    await listen();

    expect(isListening()).toBe(true);
    expect(document.activeElement).toBe(input);

    document.body.removeChild(input);
  });

  it('when second instance is created, first should unlisten automatically', async() => {
    const $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable();

    $container1.handsontable('selectCell', 0, 0);
    const $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable();

    $container2.handsontable('selectCell', 0, 0);

    expect($container1.handsontable('isListening')).toBe(false);
    expect($container2.handsontable('isListening')).toBe(true);

    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('when listen is called on first instance, second should unlisten automatically', async() => {
    const $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable();

    $container1.handsontable('selectCell', 0, 0);
    const $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable();

    $container2.handsontable('selectCell', 0, 0);

    $container1.handsontable('listen');
    expect($container1.handsontable('isListening')).toBe(true);
    expect($container2.handsontable('isListening')).toBe(false);

    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('should unlisten after click outside an iframe', async() => {
    const $iframe = $('<iframe width="500px" height="300px"/>').appendTo(spec().$container);
    const doc = $iframe[0].contentDocument;

    doc.open('text/html', 'replace');
    doc.write(`
      <!doctype html>
      <head>
        <link type="text/css" rel="stylesheet" href="../dist/handsontable.css">
      </head>
    `);
    doc.close();

    const $iframeContainer = $('<div/>').appendTo(doc.body);
    const $input = $('<input id="text"/>').appendTo(spec().$container);
    const afterUnlisten = jasmine.createSpy('afterUnlisten');

    $iframeContainer.handsontable({
      afterUnlisten,
    });

    setCurrentHotInstance($iframeContainer.handsontable('getInstance'));

    await simulateClick($iframeContainer.find('tr:eq(0) td:eq(0)'));
    await simulateClick(spec().$container.find('#text'));

    expect(afterUnlisten).toHaveBeenCalledOnceWith();

    $iframeContainer.handsontable('destroy');
    $iframe.remove();
    $input.remove();
  });

  describe('hooks', () => {
    it('should call `afterListen` after set listen on instance', async() => {
      const afterListenCallback = jasmine.createSpy('afterListenCallback');

      handsontable({
        afterListen: afterListenCallback
      });

      expect(afterListenCallback.calls.count()).toBe(0);

      spec().$container.handsontable('listen');

      expect(afterListenCallback.calls.count()).toBe(1);
    });

    it('should call `afterUnlisten` after unset listen on instance', async() => {
      const afterUnlistenCallback = jasmine.createSpy('afterListenCallback');

      handsontable({
        afterUnlisten: afterUnlistenCallback
      });

      spec().$container.handsontable('listen');

      expect(afterUnlistenCallback.calls.count()).toBe(0);

      spec().$container.handsontable('unlisten');

      expect(afterUnlistenCallback.calls.count()).toBe(1);
    });
  });
});

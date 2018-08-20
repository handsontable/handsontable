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

  it('should listen to changes when cell is selected', () => {
    const hot = handsontable();
    hot.selectCell(0, 0);
    expect(hot.isListening()).toEqual(true);
  });

  it('should\'t listen to changes when cell is selected via `selectCell` when `changeListener` argument is `false`', () => {
    const hot = handsontable();

    hot.unlisten();

    expect(hot.isListening()).toEqual(false);

    hot.selectCell(0, 0, undefined, undefined, true, false);

    expect(hot.isListening()).toEqual(false);
  });

  it('should unlisten changes', () => {
    const hot = handsontable();
    hot.selectCell(0, 0);
    expect(hot.isListening()).toEqual(true);
    hot.unlisten();
    expect(hot.isListening()).toEqual(false);
  });

  it('should listen to changes, when called after unlisten', () => {
    const hot = handsontable();
    hot.selectCell(0, 0);
    hot.unlisten();
    hot.listen();
    expect(hot.isListening()).toEqual(true);
  });

  it('should change focus on active element, when listen without arguments was called', () => {
    const hot = handsontable();
    const input = document.createElement('input');

    document.body.appendChild(input);

    hot.selectCell(0, 0);
    input.focus();
    hot.listen();

    expect(hot.isListening()).toEqual(true);
    expect(document.activeElement).not.toBe(input);
    expect(document.activeElement).toBe(document.body);

    document.body.removeChild(input);
  });

  it('should not change focus on active element, when listen with first argument as `false` was called', () => {
    const hot = handsontable();
    const input = document.createElement('input');

    document.body.appendChild(input);

    hot.selectCell(0, 0);
    input.focus();
    hot.listen(false);

    expect(hot.isListening()).toEqual(true);
    expect(document.activeElement).toBe(input);

    document.body.removeChild(input);
  });

  it('when second instance is created, first should unlisten automatically', () => {
    const $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable();
    $container1.handsontable('selectCell', 0, 0);
    const $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable();
    $container2.handsontable('selectCell', 0, 0);

    expect($container1.handsontable('isListening')).toEqual(false);
    expect($container2.handsontable('isListening')).toEqual(true);

    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('when listen is called on first instance, second should unlisten automatically', () => {
    const $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable();
    $container1.handsontable('selectCell', 0, 0);
    const $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable();
    $container2.handsontable('selectCell', 0, 0);

    $container1.handsontable('listen');
    expect($container1.handsontable('isListening')).toEqual(true);
    expect($container2.handsontable('isListening')).toEqual(false);

    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  describe('hooks', () => {
    it('should call `afterListen` after set listen on instance', () => {
      const afterListenCallback = jasmine.createSpy('afterListenCallback');

      handsontable({
        afterListen: afterListenCallback
      });

      expect(afterListenCallback.calls.count()).toBe(0);

      spec().$container.handsontable('listen');

      expect(afterListenCallback.calls.count()).toBe(1);
    });

    it('should call `afterUnlisten` after unset listen on instance', () => {
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

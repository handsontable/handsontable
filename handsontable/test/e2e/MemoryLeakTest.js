// this file is called MemoryLeakTest.js (not MemoryLeak.spec.js) to make sure it is manually executed as the last suite
describe('MemoryLeakTest', () => {
  it('after all Handsontable instances are destroy()\'d, there should be no more active listeners', () => {
    expect(Handsontable._getListenersCounter()).toBe(0);
  });

  it('after all Handsontable instances are destroy()\'d, there should be no more registered maps for index mappers', () => {
    expect(Handsontable._getRegisteredMapsCounter()).toBe(0);
  });

  it('should not leave any `testContainer`s (created in `beforeEach`) after all the tests have finished', () => {
    expect(document.querySelectorAll('#testContainer').length).toBe(0);
  });

  it('should not leave any any DOM containers, except for those created by Jasmine', () => {
    let leftoverNodesCount = 0;

    Array.from(document.body.children).forEach((child) => {
      if (child.nodeName !== 'SCRIPT' && !child.className.includes('jasmine')) {
        leftoverNodesCount += 1;
      }
    });

    expect(leftoverNodesCount).toBe(0);
  });

  describe('Event Listeners', () => {
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

    // Currently it's not possible to run it in the browser.
    // `getEventListeners` is a non-standard function available only in Chrome DevTools and in the current Puppeteer setup.
    if (typeof getEventListeners === 'undefined') {
      xit('Available in command-line: "should not leave any event listeners attached to the HTML element after being destroyed"', () => { });

    } else {
      it('should not leave any event listeners attached to the HTML element after being destroyed', async() => {
        const htmlListenersBefore = await getEventListeners('html');
        const bodyListenersBefore = await getEventListeners('body');
        const countListenersOfType = (listeners, type) =>
          (listeners.filter(listener => listener.type === type) || []).length;

        const hot = handsontable({
          data: [['a', 'b'], ['c', 'd']],
          columns: [
            {
              type: 'autocomplete',
              source: [''],
              strict: false
            },
          ],
        });

        selectCell(0, 0);
        keyDownUp('enter');
        keyDownUp('enter');

        hot.destroy();

        const htmlListenersAfter = await getEventListeners('html');
        const bodyListenersAfter = await getEventListeners('body');

        expect(countListenersOfType(htmlListenersBefore.listeners, 'keydown'))
          .toEqual(countListenersOfType(htmlListenersAfter.listeners, 'keydown'));
        expect(countListenersOfType(htmlListenersBefore.listeners, 'keyup'))
          .toEqual(countListenersOfType(htmlListenersAfter.listeners, 'keyup'));
        expect(countListenersOfType(htmlListenersBefore.listeners, 'mousedown'))
          .toEqual(countListenersOfType(htmlListenersAfter.listeners, 'mousedown'));
        expect(countListenersOfType(htmlListenersBefore.listeners, 'mouseup'))
          .toEqual(countListenersOfType(htmlListenersAfter.listeners, 'mouseup'));
        expect(countListenersOfType(htmlListenersBefore.listeners, 'focus'))
          .toEqual(countListenersOfType(htmlListenersAfter.listeners, 'focus'));
        expect(countListenersOfType(htmlListenersBefore.listeners, 'blur'))
          .toEqual(countListenersOfType(htmlListenersAfter.listeners, 'blur'));
        expect(countListenersOfType(htmlListenersBefore.listeners, 'click'))
          .toEqual(countListenersOfType(htmlListenersAfter.listeners, 'click'));

        expect(countListenersOfType(bodyListenersBefore.listeners, 'keydown'))
          .toEqual(countListenersOfType(bodyListenersAfter.listeners, 'keydown'));
        expect(countListenersOfType(bodyListenersBefore.listeners, 'keyup'))
          .toEqual(countListenersOfType(bodyListenersAfter.listeners, 'keyup'));
        expect(countListenersOfType(bodyListenersBefore.listeners, 'mousedown'))
          .toEqual(countListenersOfType(bodyListenersAfter.listeners, 'mousedown'));
        expect(countListenersOfType(bodyListenersBefore.listeners, 'mouseup'))
          .toEqual(countListenersOfType(bodyListenersAfter.listeners, 'mouseup'));
        expect(countListenersOfType(bodyListenersBefore.listeners, 'focus'))
          .toEqual(countListenersOfType(bodyListenersAfter.listeners, 'focus'));
        expect(countListenersOfType(bodyListenersBefore.listeners, 'blur'))
          .toEqual(countListenersOfType(bodyListenersAfter.listeners, 'blur'));
        expect(countListenersOfType(bodyListenersBefore.listeners, 'click'))
          .toEqual(countListenersOfType(bodyListenersAfter.listeners, 'click'));
      });
    }
  });
});

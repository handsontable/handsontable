describe('DOM helpers', () => {
  describe('observeVisibilityChangeOnce', () => {
    it('should recognize when an element becomes visible (once) and trigger the provided callback when that happens', async() => {
      const observeVisibilityChangeOnce = Handsontable.dom.observeVisibilityChangeOnce;
      const element = document.createElement('div');
      const callbackSpy = jasmine.createSpy('callbackSpy');

      element.style.display = 'none';

      document.body.appendChild(element);

      observeVisibilityChangeOnce(element, callbackSpy);

      element.style.display = 'block';
      element.style.display = 'none';
      element.style.display = 'block';

      await sleep(100);

      expect(callbackSpy).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });
  });

  describe('isThisHotChild', () => {
    it('should recognize if the provided element is a child of the container of the Handsontable container provided' +
      ' as the second argument', () => {
      const createDivWithId = (id) => {
        const element = document.createElement('DIV');

        element.id = id;

        return element;
      };
      const hotContainer = createDivWithId('hot');

      document.body.appendChild(hotContainer);

      const hot = new Handsontable(hotContainer, {
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        fixedRowsTop: 3,
        fixedColumnsStart: 3
      });
      const { rootElement } = hot;
      const isThisHotChild = Handsontable.dom.isThisHotChild;

      hot.selectCell(0, 0);

      keyDownUp('enter');

      rootElement.parentNode.appendChild(createDivWithId('rootSibling'));
      rootElement.appendChild(createDivWithId('rootChild'));

      // Overlay elements
      const topOverlayTableElement = hot.view._wt.wtOverlays.topOverlay.clone.wtTable.TABLE;

      expect(isThisHotChild(topOverlayTableElement, rootElement)).toBe(true);
      expect(isThisHotChild(topOverlayTableElement.parentNode, rootElement)).toBe(true);
      expect(isThisHotChild(topOverlayTableElement.parentNode.parentNode, rootElement)).toBe(true);
      expect(isThisHotChild(topOverlayTableElement.parentNode.parentNode.parentNode, rootElement)).toBe(true);

      const mainOverlayTableElement = hot.view._wt.wtOverlays.wtTable.TABLE;

      expect(isThisHotChild(mainOverlayTableElement, rootElement)).toBe(true);
      expect(isThisHotChild(mainOverlayTableElement.parentNode, rootElement)).toBe(true);
      expect(isThisHotChild(mainOverlayTableElement.parentNode.parentNode, rootElement)).toBe(true);
      expect(isThisHotChild(mainOverlayTableElement.parentNode.parentNode.parentNode, rootElement)).toBe(true);

      // Cell elements
      expect(isThisHotChild(hot.getCell(0, 0, true), rootElement)).toBe(true);
      expect(isThisHotChild(hot.getCell(3, 3, true), rootElement)).toBe(true);
      expect(isThisHotChild(hot.getCell(9, 9, true), rootElement)).toBe(true);

      // Misc
      expect(isThisHotChild(document.querySelector('.htFocusCatcher'), rootElement)).toBe(true);
      expect(isThisHotChild(document.querySelector('.handsontableInputHolder'), rootElement)).toBe(true);
      expect(isThisHotChild(document.querySelector('#rootChild'), rootElement)).toBe(true);

      expect(isThisHotChild(document.querySelector('#rootSibling'), rootElement)).toBe(false);
      expect(isThisHotChild(document.body, rootElement)).toBe(false);

      hot.destroy();
      document.body.removeChild(document.querySelector('#rootSibling'));
      document.body.removeChild(hotContainer);
    });
  });

  describe('offset', () => {
    it('should return correct offset for elements inside a foreign object', () => {
      const wrapper = document.createElement('div');

      wrapper.innerHTML = /* html */`
        <svg xmlns="http://www.w3.org/2000/svg">
          <foreignObject width="50" height="50">
            <div xmlns="http://www.w3.org/1999/xhtml">test</div>
          </foreignObject>
        </svg>
      `;

      document.body.appendChild(wrapper);

      const element = wrapper.querySelector('div');
      const elementOffset = Handsontable.dom.offset(element);

      expect(Number.isFinite(elementOffset.top)).toBe(true);
      expect(Number.isFinite(elementOffset.left)).toBe(true);

      document.body.removeChild(wrapper);
    });
  });

  describe('hasVerticalScrollbar', () => {
    it('should return `true` if the provided HTML element has a vertical scrollbar', () => {
      const element = document.createElement('div');

      document.body.appendChild(element);

      element.innerText = new Array(50)
        .fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ');

      element.style.width = '100px';
      element.style.height = '100px';
      element.style.overflow = 'auto';

      expect(Handsontable.dom.hasVerticalScrollbar(element)).toBe(true);

      element.style.overflow = 'scroll';

      expect(Handsontable.dom.hasVerticalScrollbar(element)).toBe(true);

      element.style.overflow = '';
      element.style.overflowY = 'auto';
      element.style.overflowX = 'hidden';

      expect(Handsontable.dom.hasVerticalScrollbar(element)).toBe(true);

      document.body.removeChild(element);
    });

    it('should return `false` if the provided HTML element doesn\'t have a vertical scrollbar', () => {
      const element = document.createElement('div');

      document.body.appendChild(element);

      element.innerText = new Array(50)
        .fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ');

      element.style.width = '100px';
      element.style.height = '100px';

      element.style.overflowY = 'hidden';
      element.style.overflowX = 'auto';

      expect(Handsontable.dom.hasVerticalScrollbar(element)).toBe(false);

      element.style.overflowY = '';
      element.style.overflowX = '';
      element.style.overflow = 'hidden';

      expect(Handsontable.dom.hasVerticalScrollbar(element)).toBe(false);

      document.body.removeChild(element);
    });

    it('should return `true` if the provided Window element has a vertical scrollbar', () => {
      const element = document.createElement('div');

      document.body.appendChild(element);

      element.innerText = new Array(1000)
        .fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ');

      expect(Handsontable.dom.hasVerticalScrollbar(window)).toBe(true);

      document.body.removeChild(element);
    });

    it('should return `false` if the provided Window element doesn\'t have a vertical scrollbar', () => {
      expect(Handsontable.dom.hasVerticalScrollbar(window)).toBe(false);
    });
  });

  describe('hasHorizontalScrollbar', () => {
    it('should return `true` if the provided HTML element has a vertical scrollbar', () => {
      const element = document.createElement('div');

      document.body.appendChild(element);

      element.innerText = new Array(50)
        .fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ');

      element.style.width = '100px';
      element.style.height = '100px';

      element.style.overflow = 'scroll';

      expect(Handsontable.dom.hasHorizontalScrollbar(element)).toBe(true);

      element.style.overflow = '';
      element.style.overflowY = 'hidden';
      element.style.overflowX = 'scroll';

      expect(Handsontable.dom.hasHorizontalScrollbar(element)).toBe(true);

      document.body.removeChild(element);
    });

    it('should return `false` if the provided HTML element doesn\'t have a vertical scrollbar', () => {
      const element = document.createElement('div');

      document.body.appendChild(element);

      element.innerText = new Array(50)
        .fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ');

      element.style.width = '100px';
      element.style.height = '100px';

      element.style.overflowY = 'auto';
      element.style.overflowX = 'hidden';

      expect(Handsontable.dom.hasHorizontalScrollbar(element)).toBe(false);

      element.style.overflowY = '';
      element.style.overflowX = '';
      element.style.overflow = 'hidden';

      expect(Handsontable.dom.hasHorizontalScrollbar(element)).toBe(false);

      document.body.removeChild(element);
    });

    it('should return `true` if the provided Window element has a vertical scrollbar', () => {
      const element = document.createElement('div');

      element.style.height = '100%';
      element.style.width = '500%';

      document.body.appendChild(element);

      element.innerText = new Array(1000)
        .fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ');

      expect(Handsontable.dom.hasHorizontalScrollbar(window)).toBe(true);

      document.body.removeChild(element);
    });

    it('should return `false` if the provided Window element doesn\'t have a vertical scrollbar', () => {
      expect(Handsontable.dom.hasHorizontalScrollbar(window)).toBe(false);
    });
  });
});

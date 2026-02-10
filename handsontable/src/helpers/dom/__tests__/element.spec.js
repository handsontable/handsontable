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

  describe('isInternalElement', () => {
    it('should recognize if the provided element is a child of the container of the Handsontable container provided' +
      ' as the second argument', async() => {
      const createDivWithId = (id) => {
        const element = document.createElement('DIV');

        element.id = id;

        return element;
      };
      const hotContainer = createDivWithId('hot');

      document.body.appendChild(hotContainer);

      const hot = new Handsontable(hotContainer, {
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        rowHeaders: true,
        fixedRowsTop: 3,
        fixedColumnsStart: 3,
        themeName: spec()?.loadedTheme || 'ht-theme-classic',
      });
      const { rootElement } = hot;
      const isInternalElement = Handsontable.dom.isInternalElement;

      hot.selectCell(0, 0);

      await keyDownUp('enter');

      rootElement.parentNode.parentNode.parentNode.parentNode.appendChild(createDivWithId('rootSibling'));
      rootElement.appendChild(createDivWithId('rootChild'));

      // Overlay elements
      const topOverlayTableElement = hot.view._wt.wtOverlays.topOverlay.clone.wtTable.TABLE;

      expect(isInternalElement(topOverlayTableElement, rootElement)).toBe(true);
      expect(isInternalElement(topOverlayTableElement.parentNode, rootElement)).toBe(true);
      expect(isInternalElement(topOverlayTableElement.parentNode.parentNode, rootElement)).toBe(true);
      expect(isInternalElement(topOverlayTableElement.parentNode.parentNode.parentNode, rootElement)).toBe(true);

      const mainOverlayTableElement = hot.view._wt.wtOverlays.wtTable.TABLE;

      expect(isInternalElement(mainOverlayTableElement, rootElement)).toBe(true);
      expect(isInternalElement(mainOverlayTableElement.parentNode, rootElement)).toBe(true);
      expect(isInternalElement(mainOverlayTableElement.parentNode.parentNode, rootElement)).toBe(true);
      expect(isInternalElement(mainOverlayTableElement.parentNode.parentNode.parentNode, rootElement)).toBe(true);

      // Cell elements
      expect(isInternalElement(hot.getCell(0, 0, true), rootElement)).toBe(true);
      expect(isInternalElement(hot.getCell(3, 3, true), rootElement)).toBe(true);
      expect(isInternalElement(hot.getCell(9, 9, true), rootElement)).toBe(true);

      // Misc
      expect(isInternalElement(document.querySelector('.htFocusCatcher'), rootElement)).toBe(false);
      expect(isInternalElement(document.querySelector('.handsontableInputHolder'), rootElement)).toBe(true);
      expect(isInternalElement(document.querySelector('#rootChild'), rootElement)).toBe(true);

      expect(isInternalElement(document.querySelector('#rootSibling'), rootElement)).toBe(false);
      expect(isInternalElement(document.body, rootElement)).toBe(false);

      hot.destroy();

      document.body.removeChild(document.querySelector('#rootSibling'));
      document.body.removeChild(hotContainer);
    });
  });

  describe('offset', () => {
    it('should return correct offset for elements inside a foreign object', async() => {
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
    it('should return `true` if the provided HTML element has a vertical scrollbar', async() => {
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

    it('should return `false` if the provided HTML element doesn\'t have a vertical scrollbar', async() => {
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

    it('should return `true` if the provided Window element has a vertical scrollbar', async() => {
      const element = document.createElement('div');

      document.body.appendChild(element);

      element.innerText = new Array(1000)
        .fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ');

      expect(Handsontable.dom.hasVerticalScrollbar(window)).toBe(true);

      document.body.removeChild(element);
    });

    it('should return `false` if the provided Window element doesn\'t have a vertical scrollbar', async() => {
      expect(Handsontable.dom.hasVerticalScrollbar(window)).toBe(false);
    });
  });

  describe('hasHorizontalScrollbar', () => {
    it('should return `true` if the provided HTML element has a vertical scrollbar', async() => {
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

    it('should return `false` if the provided HTML element doesn\'t have a vertical scrollbar', async() => {
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

    it('should return `true` if the provided Window element has a vertical scrollbar', async() => {
      const element = document.createElement('div');

      element.style.height = '100%';
      element.style.width = '500%';

      document.body.appendChild(element);

      element.innerText = new Array(1000)
        .fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ');

      expect(Handsontable.dom.hasHorizontalScrollbar(window)).toBe(true);

      document.body.removeChild(element);
    });

    it('should return `false` if the provided Window element doesn\'t have a vertical scrollbar', async() => {
      expect(Handsontable.dom.hasHorizontalScrollbar(window)).toBe(false);
    });
  });

  describe('hasZeroHeight', () => {
    it('should return `true` if the element or any of its parents has the height set to `0px` or 0 and overflow is set to `hidden`', async() => {
      const element = document.createElement('div');

      element.style.height = '0px';
      element.style.overflow = 'hidden';

      document.body.appendChild(element);

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(true);

      element.style.height = '0';

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(true);

      element.style.height = '';
      element.style.overflow = '';

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(false);

      const parent = document.createElement('div');

      parent.style.height = '0px';
      parent.style.overflow = 'hidden';

      parent.appendChild(element);
      document.body.appendChild(parent);

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(true);

      parent.style.height = '0';

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(true);

      parent.style.height = '';
      parent.style.overflow = '';

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(false);

      document.body.removeChild(parent);
    });

    it('should return `true` if the element or any of its parents has the height set to `0px` or 0 and overflow is set to `clip`', async() => {
      const element = document.createElement('div');

      element.style.height = '0px';
      element.style.overflow = 'clip';

      document.body.appendChild(element);

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(true);

      element.style.height = '0';

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(true);

      element.style.height = '';
      element.style.overflow = '';

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(false);

      const parent = document.createElement('div');

      parent.style.height = '0px';
      parent.style.overflow = 'clip';

      parent.appendChild(element);
      document.body.appendChild(parent);

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(true);

      parent.style.height = '0';

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(true);

      parent.style.height = '';
      parent.style.overflow = '';

      expect(Handsontable.dom.hasZeroHeight(element)).toBe(false);

      document.body.removeChild(parent);
    });
  });
});

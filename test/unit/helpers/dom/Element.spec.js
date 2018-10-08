import {
  addClass,
  closestDown,
  getParent,
  hasClass,
  isInput,
  removeClass,
} from 'handsontable/helpers/dom/element';

describe('DomElement helper', () => {
  //
  // Handsontable.helper.isInput
  //
  describe('isInput', () => {
    it('should return true for inputs, selects, and textareas', () => {
      expect(isInput(document.createElement('input'))).toBe(true);
      expect(isInput(document.createElement('select'))).toBe(true);
      expect(isInput(document.createElement('textarea'))).toBe(true);
    });

    it('should return true for contentEditable elements', () => {
      const div = document.createElement('div');

      div.contentEditable = 'true';

      expect(isInput(div)).toBe(true);
    });
  });

  //
  // Handsontable.helper.closestDown
  //
  describe('closestDown', () => {
    const test1 = '<div class="wrapper1"><table><tbody><tr><td class="test1">test1</td></tr></tbody></table></div>';
    const test2 = `<div class="wrapper2"><table><tbody><tr><td class="test2">test2${test1}</td></tr></tbody></table></div>`;

    it('should return last TD element (starting from last child element)', () => {
      const wrapper = document.createElement('div');

      wrapper.innerHTML = test2;
      const td1 = wrapper.querySelector('.test1');
      const td2 = wrapper.querySelector('.test2');

      expect(closestDown(td1, ['TD'])).toBe(td2);
    });

    it('should return proper value depends on passed `until` element', () => {
      const td = document.createElement('td');

      td.innerHTML = test2;
      const wrapper2 = td.querySelector('.wrapper2');

      expect(closestDown(wrapper2, ['TD'])).toBe(td);
      expect(closestDown(wrapper2, ['TD'], wrapper2.firstChild)).toBe(null);
    });
  });

  //
  // Handsontable.helper.getParent
  //
  describe('getParent', () => {
    let element = null;

    beforeEach(() => {
      element = document.createElement('div');
      element.innerHTML = '<div id="a1"><ul id="a2"></ul><ul id="b2"><li id="a3"><span id="a4">HELLO</span></li></ul></div>';
    });

    afterEach(() => {
      element = null;
    });

    it('should return the node parent only from the one level deep', () => {
      expect(getParent(element.querySelector('#a4'))).toBe(element.querySelector('#a3'));
      expect(getParent(element.querySelector('#a1'))).toBe(element);
    });

    it('should return the node parent from the defined level deep', () => {
      expect(getParent(element.querySelector('#a4'), 0)).toBe(element.querySelector('#a3'));
      expect(getParent(element.querySelector('#a4'), 1)).toBe(element.querySelector('#b2'));
      expect(getParent(element.querySelector('#a4'), 2)).toBe(element.querySelector('#a1'));
      expect(getParent(element.querySelector('#a4'), 3)).toBe(element);
      expect(getParent(element.querySelector('#a4'), 4)).toBe(null);
      expect(getParent(element.querySelector('#a4'), 5)).toBe(null);
      expect(getParent(element.querySelector('#a2'), 0)).toBe(element.querySelector('#a1'));
      expect(getParent(element.querySelector('#a2'), 1)).toBe(element);
    });
  });

  /**
   * Handsontable.helper.hasClass
   */
  describe('hasClass', () => {
    let element = null;

    beforeEach(() => {
      element = document.createElement('div');
      element.className = 'test1';
    });

    afterEach(() => {
      element = null;
    });

    it('should not throw an error when checked the element has not classList property', () => {
      expect(() => { hasClass(document, 'test2'); }).not.toThrow();
    });

    it('should return true if element has className', () => {
      expect(hasClass(element, 'test1')).toBeTruthy();
    });

    it('should return false if element has not className', () => {
      expect(hasClass(element, 'test2')).toBeFalsy();
    });

    it('should not touch the DOM element when the passed argument is empty', () => {
      const elementMock = {
        classList: {
          contains: jasmine.createSpy('classList'),
        }
      };
      hasClass(elementMock);

      expect(elementMock.classList.contains).not.toHaveBeenCalled();

      elementMock.classList.contains.calls.reset();
      hasClass(elementMock, '');

      expect(elementMock.classList.contains).not.toHaveBeenCalled();

      elementMock.classList.contains.calls.reset();
      hasClass(elementMock, []);

      expect(elementMock.classList.contains).not.toHaveBeenCalled();

      elementMock.classList.contains.calls.reset();
      hasClass(elementMock, ['']);

      expect(elementMock.classList.contains).not.toHaveBeenCalled();
    });
  });

  /**
   * Handsontable.helper.addClass
   */
  describe('addClass', () => {
    let element = null;

    beforeEach(() => {
      element = document.createElement('div');
      element.className = 'test1';
    });

    afterEach(() => {
      element = null;
    });

    it('should add CSS class without removing old one', () => {
      addClass(element, 'test2');

      expect(element.className).toBe('test1 test2');
    });

    it('should add multiple CSS classes without removing old one (delimited by an empty space)', () => {
      addClass(element, 'test2 test4 test3');

      expect(element.className).toBe('test1 test2 test4 test3');
    });

    it('should add multiple CSS classes without removing old one (passed as an array)', () => {
      addClass(element, ['test2', 'test4', 'test3']);

      expect(element.className).toBe('test1 test2 test4 test3');
    });

    it('should not touch the DOM element when the passed argument is empty', () => {
      const elementMock = {
        classList: {
          add: jasmine.createSpy('classList'),
        }
      };
      addClass(elementMock);

      expect(elementMock.classList.add).not.toHaveBeenCalled();

      elementMock.classList.add.calls.reset();
      addClass(elementMock, '');

      expect(elementMock.classList.add).not.toHaveBeenCalled();

      elementMock.classList.add.calls.reset();
      addClass(elementMock, []);

      expect(elementMock.classList.add).not.toHaveBeenCalled();

      elementMock.classList.add.calls.reset();
      addClass(elementMock, ['']);

      expect(elementMock.classList.add).not.toHaveBeenCalled();
    });
  });

  /**
   * Handsontable.helper.removeClass
   */
  describe('removeClass', () => {
    let element = null;

    beforeEach(() => {
      element = document.createElement('div');
      element.className = 'test1 test3';
    });

    afterEach(() => {
      element = null;
    });

    it('should remove CSS class without removing rest CSS classes', () => {
      removeClass(element, 'test1');

      expect(element.className).toBe('test3');
    });

    it('should remove multiple CSS classes (delimited by an empty space)', () => {
      removeClass(element, 'test2 test3 test1');

      expect(element.className).toBe('');
    });

    it('should remove CSS multiple classes (passed as an array)', () => {
      removeClass(element, ['test2', 'test3', 'test1']);

      expect(element.className).toBe('');
    });

    it('should not touch the DOM element when the passed argument is empty', () => {
      const elementMock = {
        classList: {
          remove: jasmine.createSpy('classList'),
        }
      };
      removeClass(elementMock);

      expect(elementMock.classList.remove).not.toHaveBeenCalled();

      elementMock.classList.remove.calls.reset();
      removeClass(elementMock, '');

      expect(elementMock.classList.remove).not.toHaveBeenCalled();

      elementMock.classList.remove.calls.reset();
      removeClass(elementMock, []);

      expect(elementMock.classList.remove).not.toHaveBeenCalled();

      elementMock.classList.remove.calls.reset();
      removeClass(elementMock, ['']);

      expect(elementMock.classList.remove).not.toHaveBeenCalled();
    });
  });
});

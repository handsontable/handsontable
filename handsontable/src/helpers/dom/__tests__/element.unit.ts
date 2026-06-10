import {
  addClass,
  closest,
  closestDown,
  getParent,
  getScrollbarWidth,
  getFractionalScalingCompensation,
  hasClass,
  isInput,
  isBottomMostColumnHeader,
  removeAttribute,
  removeClass,
  selectElementIfAllowed,
  setAttribute,
  fastInnerHTML,
  isVisible,
  findFirstParentWithClass,
  isHTMLElement,
  isHTMLInputElement,
  isShadowRoot,
  outerHeight,
  outerWidth,
} from 'handsontable/helpers/dom/element';
import { setPlatformMeta } from 'handsontable/helpers/browser';

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

  describe('isBottomMostColumnHeader', () => {
    it('should return true for header spanning to the bottom-most row', () => {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const firstRow = document.createElement('tr');
      const secondRow = document.createElement('tr');
      const rowspannedHeader = document.createElement('th');

      rowspannedHeader.setAttribute('rowspan', '2');
      firstRow.appendChild(rowspannedHeader);
      secondRow.appendChild(document.createElement('th'));
      thead.appendChild(firstRow);
      thead.appendChild(secondRow);
      table.appendChild(thead);

      expect(isBottomMostColumnHeader(rowspannedHeader)).toBe(true);
    });

    it('should return false for hidden or missing header elements', () => {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const row = document.createElement('tr');
      const hiddenHeader = document.createElement('th');
      const hiddenByDisplayHeader = document.createElement('th');

      hiddenHeader.classList.add('hiddenHeader');
      hiddenByDisplayHeader.style.display = 'none';
      row.appendChild(hiddenHeader);
      row.appendChild(hiddenByDisplayHeader);
      thead.appendChild(row);
      table.appendChild(thead);

      expect(isBottomMostColumnHeader(hiddenHeader)).toBe(false);
      expect(isBottomMostColumnHeader(hiddenByDisplayHeader)).toBe(false);
      expect(isBottomMostColumnHeader(null)).toBe(false);
    });
  });

  //
  // Handsontable.helper.closest
  //
  describe('closest', () => {
    describe('catching errors', () => {
      it('should return null if element is falsy (null, undefined)', () => {
        expect(closest()).toBe(null);
        expect(closest(null)).toBe(null);
      });

      it('should return null if element is not valid', () => {
        expect(closest(123)).toBe(null);
        expect(closest('123')).toBe(null);
        expect(closest(true)).toBe(null);
        expect(closest({})).toBe(null);
      });
    });

    describe('lookup for the closest element', () => {
      let wrapper = null;

      beforeEach(() => {
        wrapper = document.createElement('div');
      });

      afterEach(() => {
        wrapper = null;
      });

      it('should return element itself if the searched elment is the same one', () => {
        wrapper.innerHTML = '<a><b><c></c></b></a>';

        const element = wrapper.querySelector('c');

        expect(closest(element, [element])).toBe(element);
        expect(closest(element, ['C'])).toBe(element);
      });

      it('should return element declared in nodes as string', () => {
        wrapper.innerHTML = '<a><b><c></c></b></a>';

        const element = wrapper.querySelector('c');

        expect(closest(element, ['B'])).toBe(wrapper.querySelector('b'));
      });

      it('should return null if declared nodes are passed as lowercase string', () => {
        wrapper.innerHTML = '<a><b><c></c></b></a>';

        const element = wrapper.querySelector('c');

        expect(closest(element, ['b'])).toBe(null);
      });

      it('should return null if the searched element is also an until element', () => {
        wrapper.innerHTML = '<a><b><c></c></b></a>';

        const element = wrapper.querySelector('c');
        const nodes = ['a', 'b'];
        const until = element;

        expect(closest(element, nodes, until)).toBe(null);
      });

      it('should return null if doesn\'t find any element fitting to the nodes\' list', () => {
        wrapper.innerHTML = '<a><b><c></c></b></a>';

        const element = wrapper.querySelector('c');
        const nodes = ['x', 'y', 'z'];

        expect(closest(element, nodes)).toBe(null);
      });

      it('should return null if the searched element lies over until element', () => {
        wrapper.innerHTML = '<a><b><c></c></b></a>';

        const element = wrapper.querySelector('c');
        const nodes = ['A'];
        const until = wrapper.querySelector('b');

        expect(closest(element, nodes, until)).toBe(null);
      });

      it('should return the closest parent from the starting element', () => {
        wrapper.innerHTML = '<a><b><c></c></b></a>';

        const parentA = wrapper.querySelector('a');
        const parentB = wrapper.querySelector('b');
        const element = wrapper.querySelector('c');
        const nodes = [parentA, parentB];

        expect(closest(element, nodes)).toBe(parentB);
      });

      it('should not throw an error if window is starting element', () => {
        wrapper.innerHTML = '<a><b><c></c></b></a>';

        const element = window;
        const nodes = ['A'];
        const until = wrapper.querySelector('b');

        expect(closest(element, nodes, until)).toBe(null);
      });
    });
  });

  //
  // Handsontable.helper.closestDown
  //
  describe('findFirstParentWithClass', () => {
    const test1 = '<div class="wrapper1"><table><tbody><tr class="ht-test-sth">' +
      '<td>test1</td></tr></tbody></table></div>';
    const test2 = `<div><table class="test2 test2-2"><tbody class="ht-test-sth ht-test-sth2"><tr>' +
      '<td>test2${test1}</td></tr></tbody></table></div>`;

    it('should return the closest parent with the provided class', () => {
      const wrapper1 = document.createElement('div');
      const wrapper2 = document.createElement('div');

      wrapper1.innerHTML = test1;
      wrapper2.innerHTML = test2;

      const td1 = wrapper1.querySelector('td');
      const td2 = wrapper2.querySelector('td');

      expect(findFirstParentWithClass(td1, 'ht-test-sth').element).toBe(wrapper1.querySelector('.ht-test-sth'));
      expect(findFirstParentWithClass(td1, 'ht-test-sth').classNames).toEqual(['ht-test-sth']);
      expect(findFirstParentWithClass(td1, 'wrapper1').element).toBe(wrapper1.querySelector('.wrapper1'));
      expect(findFirstParentWithClass(td1, 'wrapper1').classNames).toEqual(['wrapper1']);

      expect(findFirstParentWithClass(td2, 'ht-test-sth').element).toBe(wrapper2.querySelector('.ht-test-sth'));
      expect(findFirstParentWithClass(td2, 'ht-test-sth').classNames).toEqual(['ht-test-sth']);
      expect(findFirstParentWithClass(td2, 'test2').element).toBe(wrapper2.querySelector('.test2'));
      expect(findFirstParentWithClass(td2, 'test2').classNames).toEqual(['test2']);
    });

    it('should return the closest parent with a class that matches the provided regex', () => {
      const wrapper1 = document.createElement('div');
      const wrapper2 = document.createElement('div');

      wrapper1.innerHTML = test1;
      wrapper2.innerHTML = test2;

      const td1 = wrapper1.querySelector('td');
      const td2 = wrapper2.querySelector('td');

      expect(findFirstParentWithClass(td1, /xt-test-(.*)/).element).toBe(undefined);
      expect(findFirstParentWithClass(td1, /xt-test-(.*)/).classNames).toEqual([]);
      expect(findFirstParentWithClass(td1, /vrapper(.*)/).element).toBe(undefined);
      expect(findFirstParentWithClass(td1, /vrapper(.*)/).classNames).toEqual([]);

      expect(findFirstParentWithClass(td2, /xt-test-(.*)/).element).toBe(undefined);
      expect(findFirstParentWithClass(td2, /xt-test-(.*)/).classNames).toEqual([]);
      expect(findFirstParentWithClass(td2, /xtest2(.*)/).element).toBe(undefined);
      expect(findFirstParentWithClass(td2, /xtest2(.*)/).classNames).toEqual([]);
    });

    it('should return `undefined` as the element and an empty array as the class list array if no elements were found', () => {
      const wrapper1 = document.createElement('div');
      const wrapper2 = document.createElement('div');

      wrapper1.innerHTML = test1;
      wrapper2.innerHTML = test2;

      const td1 = wrapper1.querySelector('td');
      const td2 = wrapper2.querySelector('td');

      expect(findFirstParentWithClass(td1, /ht-test-(.*)/).element).toBe(wrapper1.querySelector('.ht-test-sth'));
      expect(findFirstParentWithClass(td1, /ht-test-(.*)/).classNames).toEqual(['ht-test-sth']);
      expect(findFirstParentWithClass(td1, /wrapper(.*)/).element).toBe(wrapper1.querySelector('.wrapper1'));
      expect(findFirstParentWithClass(td1, /wrapper(.*)/).classNames).toEqual(['wrapper1']);

      expect(findFirstParentWithClass(td2, /ht-test-(.*)/).element).toBe(wrapper2.querySelector('.ht-test-sth'));
      expect(findFirstParentWithClass(td2, /ht-test-(.*)/).classNames).toEqual(['ht-test-sth', 'ht-test-sth2']);
      expect(findFirstParentWithClass(td2, /test2(.*)/).element).toBe(wrapper2.querySelector('.test2'));
      expect(findFirstParentWithClass(td2, /test2(.*)/).classNames).toEqual(['test2', 'test2-2']);
    });
  });

  //
  // Handsontable.helper.closestDown
  //
  describe('closestDown', () => {
    const test1 = '<div class="wrapper1"><table><tbody><tr>' +
      '<td class="test1">test1</td></tr></tbody></table></div>';
    const test2 = `<div class="wrapper2"><table><tbody><tr>' +
      '<td class="test2">test2${test1}</td></tr></tbody></table></div>`;

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
      element.innerHTML = '<div id="a1"><ul id="a2"></ul><ul id="b2"><li id="a3">' +
        '<span id="a4">HELLO</span></li></ul></div>';
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

    it('should add all CSS classes without removing old one (passed as an array)', () => {
      addClass(element, ['test2', 'test4', '', 'test3']);

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

    it('should filter empty and falsy classNames', () => {
      addClass(element, [undefined, null, '', false, 'false']); // only the last one is not filtered

      expect(element.className).toBe('test1 false');
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

    it('should remove CSS class passed as a RegExp without removing rest CSS classes', () => {
      removeClass(element, /(.*)1/);

      expect(element.className).toBe('test3');
    });

    it('should remove multiple CSS classes (delimited by an empty space)', () => {
      removeClass(element, 'test2 test3 test1');

      expect(element.className).toBe('');
    });

    it('should remove multiple CSS classes (passed as an array)', () => {
      removeClass(element, ['test2', 'test3', 'test1']);

      expect(element.className).toBe('');
    });

    it('should remove multiple CSS classes passed as regexes (in an array)', () => {
      element.className = 'test1 test2 test3 test4';

      removeClass(element, [/(.*)1/, /(.*)3/, /(.*)4/]);

      expect(element.className).toBe('test2');
    });

    it('should remove CSS multiple classes passed as a mix of regexes and strings (in an array)', () => {
      element.className = 'test1 test2 test3 test4';

      removeClass(element, [/(.*)1/, 'test3', /(.*)4/]);

      expect(element.className).toBe('test2');
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

  /**
   * Handsontable.helper.setAttribute
   */
  describe('setAttribute', () => {
    let element = null;

    beforeEach(() => {
      element = document.createElement('div');
      element.setAttribute('test1', 'test1-value');
    });

    afterEach(() => {
      element = null;
    });

    it('should add a single attribute', () => {
      setAttribute(element, 'test2', 'test2-value');

      expect(element.attributes.length).toBe(2);
      expect(element.attributes.test1.value).toBe('test1-value');
      expect(element.attributes.test2.value).toBe('test2-value');
    });

    it('should add multiple attributes without removing old ones (passed as an array)', () => {
      setAttribute(element, [
        ['test2', 'test2-value'],
        ['test4', 'test4-value'],
        ['test3', 'test3-value'],
      ]);

      expect(element.attributes.length).toBe(4);
      expect(element.attributes.test1.value).toBe('test1-value');
      expect(element.attributes.test2.value).toBe('test2-value');
      expect(element.attributes.test3.value).toBe('test3-value');
      expect(element.attributes.test4.value).toBe('test4-value');
    });

    it('should not touch the DOM element when the passed argument is not provided or is an empty array', () => {
      const elementMock = {
        setAttribute: jasmine.createSpy('setAttribute'),
      };

      setAttribute(elementMock);

      expect(elementMock.setAttribute).not.toHaveBeenCalled();

      elementMock.setAttribute.calls.reset();
      setAttribute(elementMock, '');

      expect(elementMock.setAttribute).not.toHaveBeenCalled();

      elementMock.setAttribute.calls.reset();
      setAttribute(elementMock, []);

      expect(elementMock.setAttribute).not.toHaveBeenCalled();

      elementMock.setAttribute.calls.reset();
      setAttribute(elementMock, ['']);

      expect(elementMock.setAttribute).not.toHaveBeenCalled();
    });
  });

  /**
   * Handsontable.helper.removeAttribute
   */
  describe('removeAttribute', () => {
    let element = null;

    beforeEach(() => {
      element = document.createElement('div');
      element.setAttribute('test1', 'test1-value');
      element.setAttribute('test2', 'test2-value');
      element.setAttribute('test3', 'test3-value');
      element.setAttribute('test4', 'test4-value');
    });

    afterEach(() => {
      element = null;
    });

    it('should remove a single attribute', () => {
      removeAttribute(element, 'test1');

      expect(element.attributes.length).toBe(3);
      expect(element.getAttributeNames()).toEqual(['test2', 'test3', 'test4']);
    });

    it('should remove attributes by passing a single regex', () => {
      removeAttribute(element, /(.*)1/);

      expect(element.attributes.length).toBe(3);
      expect(element.getAttributeNames()).toEqual(['test2', 'test3', 'test4']);
    });

    it('should remove multiple attributes (delimited by an empty space)', () => {
      removeAttribute(element, 'test2 test3 test1');

      expect(element.attributes.length).toBe(1);
      expect(element.getAttributeNames()).toEqual(['test4']);
    });

    it('should remove multiple attributes (passed as an array)', () => {
      removeAttribute(element, ['test2', 'test3', 'test1']);

      expect(element.attributes.length).toBe(1);
      expect(element.getAttributeNames()).toEqual(['test4']);
    });

    it('should remove multiple attributes by passing regexes in an array', () => {
      removeAttribute(element, [/(.*)1/, /(.*)3/, /(.*)4/]);

      expect(element.attributes.length).toBe(1);
      expect(element.getAttributeNames()).toEqual(['test2']);
    });

    it('should remove multiple attributes by passing as a mix of regexes and strings in an array', () => {
      removeAttribute(element, [/(.*)1/, 'test3', /(.*)4/]);

      expect(element.attributes.length).toBe(1);
      expect(element.getAttributeNames()).toEqual(['test2']);
    });

    it('should not touch the DOM element when the passed argument is empty', () => {
      const elementMock = {
        removeAttribute: jasmine.createSpy('removeAttribute'),
      };

      removeAttribute(elementMock);

      expect(elementMock.removeAttribute).not.toHaveBeenCalled();

      elementMock.removeAttribute.calls.reset();
      removeAttribute(elementMock, '');

      expect(elementMock.removeAttribute).not.toHaveBeenCalled();

      elementMock.removeAttribute.calls.reset();
      removeAttribute(elementMock, []);

      expect(elementMock.removeAttribute).not.toHaveBeenCalled();

      elementMock.removeAttribute.calls.reset();
      removeAttribute(elementMock, ['']);

      expect(elementMock.removeAttribute).not.toHaveBeenCalled();
    });
  });

  //
  // Handsontable.helper.selectElementIfAllowed
  //
  describe('selectElementIfAllowed', () => {
    it('should focus known textarea element', () => {
      const textarea = document.createElement('textarea');

      document.body.appendChild(textarea);

      textarea.setAttribute('data-hot-input', '');
      textarea.focus();

      const spy = spyOn(textarea, 'select');

      selectElementIfAllowed(textarea);

      expect(spy).toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should not focus unknown textarea element with the same class name as HOT editor input', () => {
      const textarea = document.createElement('textarea');

      document.body.appendChild(textarea);

      textarea.className = 'handsontableInput';
      textarea.focus();

      const spy = spyOn(textarea, 'select');

      selectElementIfAllowed(textarea);

      expect(spy).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should not focus unknown input (bare input)', () => {
      const input = document.createElement('input');

      document.body.appendChild(input);

      input.focus();

      const spy = spyOn(input, 'focus');

      selectElementIfAllowed(input);

      expect(spy).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });
  });

  //
  // Handsontable.helper.fastInnerHTML
  //
  describe('fastInnerHTML', () => {
    let originalWarn;
    let warnSpy;

    beforeEach(() => {
      originalWarn = console.warn; // eslint-disable-line no-console
      warnSpy = jasmine.createSpy('warn');
      console.warn = warnSpy; // eslint-disable-line no-console
    });

    afterEach(() => {
      console.warn = originalWarn; // eslint-disable-line no-console
    });

    it('should pass the HTML through unchanged when the default sanitizer (pass-through) is used', () => {
      const elementMock = {
        innerHTML: '',
      };

      fastInnerHTML(elementMock, '<img src onerror=alert(1)>');

      expect(elementMock.innerHTML).toBe('<img src onerror=alert(1)>');

      fastInnerHTML(elementMock, '<script>alert()</script>');

      expect(elementMock.innerHTML).toBe('<script>alert()</script>');

      fastInnerHTML(elementMock, '<strong>Hello</strong> <span class="my">my <sup>world</span>2</sup>');

      expect(elementMock.innerHTML).toBe('<strong>Hello</strong> <span class="my">my <sup>world</span>2</sup>');

      fastInnerHTML(
        elementMock,
        '<meta http-equiv="refresh" content="30">This is my <a href="https://handsontable.com">link</a>'
      );

      expect(elementMock.innerHTML)
        .toBe('<meta http-equiv="refresh" content="30">This is my <a href="https://handsontable.com">link</a>');
    });

    it('should be possible to disable content sanitization', () => {
      const elementMock = {
        innerHTML: '',
      };

      fastInnerHTML(elementMock, '<img src onerror=alert(1)>', false);

      expect(elementMock.innerHTML).toBe('<img src onerror=alert(1)>');

      fastInnerHTML(elementMock, '<script>alert()</script>', false);

      expect(elementMock.innerHTML).toBe('<script>alert()</script>');

      fastInnerHTML(
        elementMock,
        '<strong>Hello</strong> <span class="my">my <sup>world</span>2</sup>',
        false,
      );

      expect(elementMock.innerHTML)
        .toBe('<strong>Hello</strong> <span class="my">my <sup>world</span>2</sup>');

      fastInnerHTML(
        elementMock,
        '<meta http-equiv="refresh" content="30">This is my <a href="https://handsontable.com">link</a>',
        false,
      );

      expect(elementMock.innerHTML)
        .toBe('<meta http-equiv="refresh" content="30">This is my <a href="https://handsontable.com">link</a>');
    });

    it('should be possible to pass a custom sanitizer function', () => {
      const elementMock = {
        innerHTML: '',
      };

      fastInnerHTML(elementMock, '<img src onerror=alert(1)>', (content) => {
        return content.replace('alert(1)', 'alert(2)');
      });

      expect(elementMock.innerHTML).toBe('<img src onerror=alert(2)>');
    });

    it('should warn once per scope when raw HTML is written with the default (implicit) sanitizer', () => {
      const elementMock = { innerHTML: '' };
      const scope = {};

      fastInnerHTML(elementMock, '<b>one</b>', true, 'header', scope);
      fastInnerHTML(elementMock, '<b>two</b>', true, 'header', scope);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/without a sanitizer/));
    });

    it('should warn again for a different scope (per-instance state)', () => {
      const elementMock = { innerHTML: '' };

      fastInnerHTML(elementMock, '<b>one</b>', true, 'header', {});
      fastInnerHTML(elementMock, '<b>two</b>', true, 'header', {});

      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it('should NOT warn when sanitization is disabled on purpose with `false`', () => {
      const elementMock = { innerHTML: '' };

      fastInnerHTML(elementMock, '<img src onerror=alert(1)>', false, 'html', {});

      expect(elementMock.innerHTML).toBe('<img src onerror=alert(1)>');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should NOT warn when a function sanitizer is provided', () => {
      const elementMock = { innerHTML: '' };

      fastInnerHTML(elementMock, '<b>x</b>', content => content, 'header', {});

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should NOT warn when the content has no HTML characters', () => {
      const element = document.createElement('div');

      fastInnerHTML(element, 'plain text', true, 'header', {});

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  //
  // Handsontable.helper.isVisible
  //
  describe('isVisible', () => {
    it('should return `false` when the element is detached from the DOM', () => {
      const element = document.createElement('div');

      expect(isVisible(element)).toBe(false);
    });

    it('should return `true` when the element is attached to the DOM', () => {
      const element = document.createElement('div');

      document.body.appendChild(element);

      expect(isVisible(element)).toBe(true);

      element.remove();
    });

    it('should return `false` when the element has "display: none"', () => {
      const element = document.createElement('div');

      element.style.display = 'none';
      document.body.appendChild(element);

      expect(isVisible(element)).toBe(false);

      element.remove();
    });

    it('should return `true` when the element has other value than "display: none"', () => {
      const element = document.createElement('div');

      document.body.appendChild(element);
      element.style.display = 'static';

      expect(isVisible(element)).toBe(true);

      element.style.display = 'absolute';

      expect(isVisible(element)).toBe(true);

      element.style.display = '';

      expect(isVisible(element)).toBe(true);

      element.remove();
    });

    it('should return `false` when the parent element has "display: none"', () => {
      const elementParent = document.createElement('div');
      const elementChild = document.createElement('div');

      elementParent.append(elementChild);
      elementParent.style.display = 'none';
      document.body.appendChild(elementParent);

      expect(isVisible(elementParent)).toBe(false);

      elementParent.remove();
    });
  });

  //
  // Handsontable.helper.isHTMLElement
  //
  describe('isHTMLElement', () => {
    it('should return `false` when the element is not na HTML Element', () => {
      const element = 3;

      expect(isHTMLElement(element)).toBe(false);
    });

    it('should return `true` when the element is an HTML Element', () => {
      const element = document.createElement('div');

      expect(isHTMLElement(element)).toBe(true);
    });
  });

  //
  // Handsontable.helper.isHTMLInputElement
  //
  describe('isHTMLInputElement', () => {
    it('should return `false` for a regular div element', () => {
      expect(isHTMLInputElement(document.createElement('div'))).toBe(false);
    });

    it('should return `false` for a textarea element', () => {
      expect(isHTMLInputElement(document.createElement('textarea'))).toBe(false);
    });

    it('should return `false` for a select element', () => {
      expect(isHTMLInputElement(document.createElement('select'))).toBe(false);
    });

    it('should return `true` for an input element', () => {
      expect(isHTMLInputElement(document.createElement('input'))).toBe(true);
    });
  });

  // Handsontable.helper.isShadowRoot
  //
  describe('isShadowRoot', () => {
    it('should return `false` for a regular HTMLElement', () => {
      expect(isShadowRoot(document.createElement('div'))).toBe(false);
    });

    it('should return `false` for a text node', () => {
      expect(isShadowRoot(document.createTextNode('hello'))).toBe(false);
    });

    it('should return `false` for a document fragment without a host', () => {
      expect(isShadowRoot(document.createDocumentFragment())).toBe(false);
    });

    it('should return `true` for a ShadowRoot attached to a host element', () => {
      const host = document.createElement('div');

      document.body.appendChild(host);
      const shadow = host.attachShadow({ mode: 'open' });

      expect(isShadowRoot(shadow)).toBe(true);

      host.remove();
    });
  });

  //
  // Handsontable.helper.outerHeight
  //
  describe('outerHeight', () => {
    // Make sure that the value is returned from the element's offsetHeight property,
    // not from getBoundingClientRect().height. The second returns a value after applying
    // the CSS transform matrix, which when passed to element.style.height for example
    // results in a different value, hence misalignments.
    it('should return value from offsetHeight', () => {
      const elementMock = {
        offsetHeight: 100,
      };

      expect(outerHeight(elementMock)).toBe(100);
    });
  });

  //
  // Handsontable.helper.outerWidth
  //
  describe('outerWidth', () => {
    // Make sure that the value is returned from the element's offsetHeight property,
    // not from getBoundingClientRect().height. The second returns a value after applying
    // the CSS transform matrix, which when passed to element.style.height for example
    // results in a different value, hence misalignments.
    it('should return value from offsetWidth', () => {
      const elementMock = {
        offsetWidth: 100,
      };

      expect(outerWidth(elementMock)).toBe(100);
    });
  });

  //
  // Handsontable.helper.getFractionalScalingCompensation
  //
  describe('getFractionalScalingCompensation', () => {
    it('should return 0 for non-Windows platforms', () => {
      const mockDocument = {
        defaultView: {
          devicePixelRatio: 1.5
        }
      };

      setPlatformMeta({ platform: 'MacIntel' });

      expect(getFractionalScalingCompensation(mockDocument)).toBe(0);
    });

    it('should return 0 for Windows with integer devicePixelRatio', () => {
      const mockDocument = {
        defaultView: {
          devicePixelRatio: 2
        }
      };

      setPlatformMeta({ platform: 'Win32' });

      expect(getFractionalScalingCompensation(mockDocument)).toBe(0);
    });

    it('should return 2 for Windows with fractional devicePixelRatio', () => {
      const mockDocument = {
        defaultView: {
          devicePixelRatio: 1.5
        }
      };

      setPlatformMeta({ platform: 'Win32' });

      expect(getFractionalScalingCompensation(mockDocument)).toBe(2);
    });
  });

  //
  // Handsontable.helper.getScrollbarWidth
  //
  describe('getScrollbarWidth', () => {
    it('should not use the `getBoundingClientRect` method to calculate the scrollbar width', () => {
      const spy = spyOn(Element.prototype, 'getBoundingClientRect');

      getScrollbarWidth();

      expect(spy).not.toHaveBeenCalled();
    });
  });
});

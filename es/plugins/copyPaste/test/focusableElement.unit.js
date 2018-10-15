import { createElement, destroyElement } from './../focusableElement';

describe('CopyPaste', function () {
      describe('focusableElement', function () {
            var fw1 = void 0;
            var fw2 = void 0;

            afterEach(function () {
                  if (fw1) {
                        destroyElement(fw1);
                        fw1 = null;
                  }
                  if (fw2) {
                        destroyElement(fw2);
                        fw2 = null;
                  }
            });

            it('should create and return instance of FocusableWrapper class', function () {
                  fw1 = createElement();

                  expect(fw1.constructor.name).toBe('FocusableWrapper');
            });

            it('should create new instance of FocusableWrapper class on every createElement call', function () {
                  fw1 = createElement();
                  fw2 = createElement();

                  fw1.useSecondaryElement();
                  fw2.useSecondaryElement();

                  expect(fw1).not.toBe(fw2);
                  expect(fw1.mainElement).toBe(fw2.mainElement);
            });

            it('should create focusable element only once when useSecondaryElement method is called multiple times', function () {
                  fw1 = createElement();
                  fw1.useSecondaryElement();

                  expect(fw1.mainElement).toBe(document.querySelector('#HandsontableCopyPaste'));

                  fw1.useSecondaryElement();

                  expect(fw1.mainElement).toBe(document.querySelector('#HandsontableCopyPaste'));

                  fw1.useSecondaryElement();

                  expect(fw1.mainElement).toBe(document.querySelector('#HandsontableCopyPaste'));
                  expect(document.querySelectorAll('#HandsontableCopyPaste').length).toBe(1);
            });

            it('should fire internal events only once when useSecondaryElement method is called multiple times', function () {
                  fw1 = createElement();

                  fw1.useSecondaryElement();
                  fw1.useSecondaryElement();
                  fw1.useSecondaryElement();

                  var spy = jasmine.createSpy();

                  fw1.addLocalHook('copy', spy);
                  fw1.mainElement.dispatchEvent(new Event('copy'));

                  expect(spy).toHaveBeenCalledTimes(1);
            });

            it('should fire internal events only once when external focusable element is passed multiple times', function () {
                  fw1 = createElement();
                  var element = document.createElement('textarea');

                  fw1.setFocusableElement(element);
                  fw1.setFocusableElement(element);
                  fw1.setFocusableElement(element);

                  var spy = jasmine.createSpy();

                  fw1.addLocalHook('copy', spy);
                  fw1.mainElement.dispatchEvent(new Event('copy'));

                  expect(fw1.mainElement).toBe(element);
                  expect(spy).toHaveBeenCalledTimes(1);
            });

            it('should return focusable element through mainElement property', function () {
                  fw1 = createElement();
                  var element = document.createElement('textarea');

                  expect(fw1.getFocusableElement()).toBe(null);

                  fw1.mainElement = element;

                  expect(fw1.getFocusableElement()).toBe(element);
            });

            it('should select focusable element and set value as an empty string when focus method is called', function () {
                  fw1 = createElement();
                  var element = document.createElement('textarea');

                  spyOn(element, 'select');
                  fw1.mainElement = element;
                  fw1.focus();

                  expect(element.select).toHaveBeenCalledTimes(1);
                  expect(element.value).toBe(' ');
            });

            it('should destroy FocusableWrapper object instance and detach secondary focusable element from DOM', function () {
                  fw1 = createElement();
                  fw2 = createElement();

                  fw1.useSecondaryElement();
                  fw2.useSecondaryElement();
                  destroyElement(fw2);

                  expect(document.querySelectorAll('#HandsontableCopyPaste').length).toBe(1);

                  destroyElement(fw1);

                  expect(document.querySelectorAll('#HandsontableCopyPaste').length).toBe(0);
            });
      });
});
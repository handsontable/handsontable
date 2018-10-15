'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _displaySwitch = require('handsontable/plugins/comments/displaySwitch');

var _displaySwitch2 = _interopRequireDefault(_displaySwitch);

var _src = require('handsontable/3rdparty/walkontable/src');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_HIDE_DELAY = 250;

describe('Comments', function () {
      describe('DisplaySwitch', function () {
            it('should fill `showDebounced` function properly after constructing object', function () {
                  var displaySwitch = new _displaySwitch2.default(200);

                  expect(_typeof(displaySwitch.showDebounced)).toBe('function');
                  expect(displaySwitch.showDebounced.name).toBe('_debounce');
            });
      });

      describe('DisplaySwitch.show', function () {
            it('should call `showDebounced` function after triggering `show` function', function () {
                  var displaySwitch = new _displaySwitch2.default(200);
                  displaySwitch.showDebounced = jasmine.createSpy('showDebounced');
                  var range = { from: new _src.CellCoords(0, 1) };

                  displaySwitch.show(range);

                  expect(displaySwitch.showDebounced).toHaveBeenCalledWith(range);
            });

            it('should set `wasLastActionShow` variable to `true`', function () {
                  var displaySwitch = new _displaySwitch2.default(200);
                  displaySwitch.showDebounced = jasmine.createSpy('showDebounced');
                  var range = { from: new _src.CellCoords(0, 1) };

                  displaySwitch.show(range);

                  expect(displaySwitch.wasLastActionShow).toBe(true);
            });

            it('should trigger `show` local hook after calling `show` function', function () {
                  var displaySwitch = new _displaySwitch2.default(700);
                  var onShow = jasmine.createSpy('onShow');
                  var range = { from: new _src.CellCoords(0, 1) };

                  jest.useFakeTimers();

                  displaySwitch.addLocalHook('show', onShow);
                  displaySwitch.show(range);

                  jest.runAllTimers();

                  expect(onShow).toHaveBeenCalledWith(0, 1);
            });

            it('should not trigger `show` local hook after calling `show` function as not last one', function () {
                  var displaySwitch = new _displaySwitch2.default(700);
                  var onShow = jasmine.createSpy('onShow');
                  var range = { from: new _src.CellCoords(0, 1) };

                  jest.useFakeTimers();

                  displaySwitch.addLocalHook('show', onShow);
                  displaySwitch.show(range);
                  displaySwitch.hide();

                  jest.runAllTimers();

                  expect(onShow).not.toHaveBeenCalled();
            });
      });

      describe('DisplaySwitch.hide', function () {
            it('should call timeout inside `hide` function after predefined delay', function () {
                  var displaySwitch = new _displaySwitch2.default(700);

                  jest.useFakeTimers();

                  displaySwitch.hide();

                  expect(setTimeout.mock.calls.length).toBe(1);
                  expect(setTimeout.mock.calls[0][1]).toBe(DEFAULT_HIDE_DELAY);
            });

            it('should set `wasLastActionShow` variable to `false`', function () {
                  var displaySwitch = new _displaySwitch2.default(200);
                  displaySwitch.showDebounced = jasmine.createSpy('showDebounced');

                  displaySwitch.hide();

                  expect(displaySwitch.wasLastActionShow).toBe(false);
            });

            it('should trigger `hide` local hook after calling `hide` function', function () {
                  var displaySwitch = new _displaySwitch2.default(700);
                  var onHide = jasmine.createSpy('onHide');

                  jest.useFakeTimers();

                  displaySwitch.addLocalHook('hide', onHide);
                  displaySwitch.hide();

                  jest.runAllTimers();

                  expect(onHide).toHaveBeenCalled();
            });

            it('should not trigger `hide` local hook after calling `hide` function as not last one', function () {
                  var displaySwitch = new _displaySwitch2.default(700);
                  var onHide = jasmine.createSpy('onHide');
                  var range = { from: new _src.CellCoords(0, 1) };

                  jest.useFakeTimers();

                  displaySwitch.addLocalHook('hide', onHide);
                  displaySwitch.hide();
                  displaySwitch.show(range);

                  jest.runAllTimers();

                  expect(onHide).not.toHaveBeenCalled();
            });

            it('should set timer properly', function () {
                  var displaySwitch = new _displaySwitch2.default(700);
                  displaySwitch.hide();

                  var savedhidingTimer = displaySwitch.hidingTimer;

                  expect(typeof savedhidingTimer === 'undefined' ? 'undefined' : _typeof(savedhidingTimer)).toBe('number');

                  displaySwitch.hide();

                  expect(savedhidingTimer).not.toEqual(displaySwitch.hidingTimer);
            });
      });

      describe('DisplaySwitch.showDebounced', function () {
            it('should call `showDebounced` function after defined delay', function () {
                  var displaySwitch = new _displaySwitch2.default(1000);
                  var range = { from: new _src.CellCoords(0, 1) };

                  jest.useFakeTimers();

                  displaySwitch.showDebounced(range);

                  expect(setTimeout.mock.calls.length).toBe(1);
                  expect(setTimeout.mock.calls[0][1]).toBe(1000);
            });
      });

      describe('DisplaySwitch.updateDelay', function () {
            it('should update `showDebounced` function delay', function () {
                  var displaySwitch = new _displaySwitch2.default(1000);
                  var range = { from: new _src.CellCoords(0, 1) };
                  var cachedShowDebounced = jasmine.createSpy('cachedShowDebounced');
                  displaySwitch.showDebounced = cachedShowDebounced;

                  jest.useFakeTimers();

                  displaySwitch.updateDelay(800);

                  expect(cachedShowDebounced).not.toBe(displaySwitch.showDebounced);

                  displaySwitch.show(range);
                  jest.runAllTimers();

                  expect(cachedShowDebounced).not.toHaveBeenCalled();
                  expect(setTimeout.mock.calls.length).toBe(1);
                  expect(setTimeout.mock.calls[0][1]).toBe(800);
            });
      });

      describe('DisplaySwitch.cancelHiding', function () {
            it('should not call function after delay', function () {
                  var displaySwitch = new _displaySwitch2.default(700);
                  var onHide = jasmine.createSpy('onHide');

                  jest.useFakeTimers();

                  displaySwitch.addLocalHook('hide', onHide);
                  displaySwitch.hide();
                  displaySwitch.cancelHiding();

                  jest.runAllTimers();

                  expect(setTimeout.mock.calls.length).toBe(1);
                  expect(onHide).not.toHaveBeenCalled();
            });

            it('should set timer value to `null`', function () {
                  var displaySwitch = new _displaySwitch2.default(700);
                  var onHide = jasmine.createSpy('onHide');

                  jest.useFakeTimers();

                  displaySwitch.addLocalHook('hide', onHide);
                  displaySwitch.hide();
                  displaySwitch.cancelHiding();

                  jest.runAllTimers();

                  expect(displaySwitch.hidingTimer).toBeNull();
            });
      });

      describe('DisplaySwitch.destroy', function () {
            it('should clear all `localHooks`', function () {
                  var displaySwitch = new _displaySwitch2.default(1000);
                  displaySwitch.clearLocalHooks = jasmine.createSpy('clearLocalHooks');

                  displaySwitch.destroy();

                  expect(displaySwitch.clearLocalHooks).toHaveBeenCalled();
            });
      });
});
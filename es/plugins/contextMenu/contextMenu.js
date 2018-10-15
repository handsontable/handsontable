var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import { arrayEach } from './../../helpers/array';
import CommandExecutor from './commandExecutor';
import EventManager from './../../eventManager';
import ItemsFactory from './itemsFactory';
import Menu from './menu';
import { registerPlugin } from './../../plugins';
import { stopPropagation, pageX, pageY } from './../../helpers/dom/event';
import { getWindowScrollLeft, getWindowScrollTop, hasClass } from './../../helpers/dom/element';
import { ROW_ABOVE, ROW_BELOW, COLUMN_LEFT, COLUMN_RIGHT, REMOVE_ROW, REMOVE_COLUMN, UNDO, REDO, READ_ONLY, ALIGNMENT, SEPARATOR } from './predefinedItems';

Hooks.getSingleton().register('afterContextMenuDefaultOptions');
Hooks.getSingleton().register('beforeContextMenuShow');
Hooks.getSingleton().register('afterContextMenuShow');
Hooks.getSingleton().register('afterContextMenuHide');
Hooks.getSingleton().register('afterContextMenuExecute');

/**
 * @description
 * This plugin creates the Handsontable Context Menu. It allows to create a new row or column at any place in the
 * grid among [other features](http://docs.handsontable.com/demo-context-menu.html).
 * Possible values:
 * * `true` (to enable default options),
 * * `false` (to disable completely)
 *
 * or array of any available strings:
 * * `'row_above'`
 * * `'row_below'`
 * * `'col_left'`
 * * `'col_right'`
 * * `'remove_row'`
 * * `'remove_col'`
 * * `'undo'`
 * * `'redo'`
 * * `'make_read_only'`
 * * `'alignment'`
 * * `'---------'` (menu item separator)
 * * `'borders'` (with {@link Options#customBorders} turned on)
 * * `'commentsAddEdit'` (with {@link Options#comments} turned on)
 * * `'commentsRemove'` (with {@link Options#comments} turned on)
 *
 * See [the context menu demo](http://docs.handsontable.com/demo-context-menu.html) for examples.
 *
 * @example
 * ```js
 * // as a boolean
 * contextMenu: true
 * // as a array
 * contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo']
 * ```
 *
 * @plugin ContextMenu
 */

var ContextMenu = function (_BasePlugin) {
  _inherits(ContextMenu, _BasePlugin);

  _createClass(ContextMenu, null, [{
    key: 'DEFAULT_ITEMS',

    /**
     * Context menu default items order when `contextMenu` options is set as `true`.
     *
     * @returns {String[]}
     */
    get: function get() {
      return [ROW_ABOVE, ROW_BELOW, SEPARATOR, COLUMN_LEFT, COLUMN_RIGHT, SEPARATOR, REMOVE_ROW, REMOVE_COLUMN, SEPARATOR, UNDO, REDO, SEPARATOR, READ_ONLY, SEPARATOR, ALIGNMENT];
    }
  }]);

  function ContextMenu(hotInstance) {
    _classCallCheck(this, ContextMenu);

    /**
     * Instance of {@link EventManager}.
     *
     * @private
     * @type {EventManager}
     */
    var _this = _possibleConstructorReturn(this, (ContextMenu.__proto__ || Object.getPrototypeOf(ContextMenu)).call(this, hotInstance));

    _this.eventManager = new EventManager(_this);
    /**
     * Instance of {@link CommandExecutor}.
     *
     * @private
     * @type {CommandExecutor}
     */
    _this.commandExecutor = new CommandExecutor(_this.hot);
    /**
     * Instance of {@link ItemsFactory}.
     *
     * @private
     * @type {ItemsFactory}
     */
    _this.itemsFactory = null;
    /**
     * Instance of {@link Menu}.
     *
     * @private
     * @type {Menu}
     */
    _this.menu = null;
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ContextMenu#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(ContextMenu, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return this.hot.getSettings().contextMenu;
    }

    /**
     * Enables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      var _this2 = this;

      if (this.enabled) {
        return;
      }
      this.itemsFactory = new ItemsFactory(this.hot, ContextMenu.DEFAULT_ITEMS);

      var settings = this.hot.getSettings().contextMenu;
      var predefinedItems = {
        items: this.itemsFactory.getItems(settings)
      };

      if (typeof settings.callback === 'function') {
        this.commandExecutor.setCommonCallback(settings.callback);
      }
      _get(ContextMenu.prototype.__proto__ || Object.getPrototypeOf(ContextMenu.prototype), 'enablePlugin', this).call(this);

      var delayedInitialization = function delayedInitialization() {
        if (!_this2.hot) {
          return;
        }

        _this2.hot.runHooks('afterContextMenuDefaultOptions', predefinedItems);

        _this2.itemsFactory.setPredefinedItems(predefinedItems.items);
        var menuItems = _this2.itemsFactory.getItems(settings);

        _this2.menu = new Menu(_this2.hot, {
          className: 'htContextMenu',
          keepInViewport: true
        });
        _this2.hot.runHooks('beforeContextMenuSetItems', menuItems);

        _this2.menu.setMenuItems(menuItems);

        _this2.menu.addLocalHook('beforeOpen', function () {
          return _this2.onMenuBeforeOpen();
        });
        _this2.menu.addLocalHook('afterOpen', function () {
          return _this2.onMenuAfterOpen();
        });
        _this2.menu.addLocalHook('afterClose', function () {
          return _this2.onMenuAfterClose();
        });
        _this2.menu.addLocalHook('executeCommand', function () {
          var _executeCommand;

          for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
            params[_key] = arguments[_key];
          }

          return (_executeCommand = _this2.executeCommand).call.apply(_executeCommand, [_this2].concat(params));
        });

        _this2.addHook('afterOnCellContextMenu', function (event) {
          return _this2.onAfterOnCellContextMenu(event);
        });

        // Register all commands. Predefined and added by user or by plugins
        arrayEach(menuItems, function (command) {
          return _this2.commandExecutor.registerCommand(command.key, command);
        });
      };

      this.callOnPluginsReady(function () {
        if (_this2.isPluginsReady) {
          setTimeout(delayedInitialization, 0);
        } else {
          delayedInitialization();
        }
      });
    }

    /**
     * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      this.disablePlugin();
      this.enablePlugin();

      _get(ContextMenu.prototype.__proto__ || Object.getPrototypeOf(ContextMenu.prototype), 'updatePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      this.close();

      if (this.menu) {
        this.menu.destroy();
        this.menu = null;
      }
      _get(ContextMenu.prototype.__proto__ || Object.getPrototypeOf(ContextMenu.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Opens menu and re-position it based on the passed coordinates.
     *
     * @param {Object|Event} position An object with `pageX` and `pageY` properties which contains values relative to
     *                                the top left of the fully rendered content area in the browser or with `clientX`
     *                                and `clientY`  properties which contains values relative to the upper left edge
     *                                of the content area (the viewport) of the browser window. This object is structurally
     *                                compatible with native mouse event so it can be used either.
     */

  }, {
    key: 'open',
    value: function open(event) {
      if (!this.menu) {
        return;
      }
      this.menu.open();
      this.menu.setPosition({
        top: parseInt(pageY(event), 10) - getWindowScrollTop(),
        left: parseInt(pageX(event), 10) - getWindowScrollLeft()
      });

      // ContextMenu is not detected HotTableEnv correctly because is injected outside hot-table
      this.menu.hotMenu.isHotTableEnv = this.hot.isHotTableEnv;
      // Handsontable.eventManager.isHotTableEnv = this.hot.isHotTableEnv;
    }

    /**
     * Closes the menu.
     */

  }, {
    key: 'close',
    value: function close() {
      if (!this.menu) {
        return;
      }
      this.menu.close();
    }

    /**
     * Execute context menu command.
     *
     * You can execute all predefined commands:
     *  * `'row_above'` - Insert row above
     *  * `'row_below'` - Insert row below
     *  * `'col_left'` - Insert column left
     *  * `'col_right'` - Insert column right
     *  * `'clear_column'` - Clear selected column
     *  * `'remove_row'` - Remove row
     *  * `'remove_col'` - Remove column
     *  * `'undo'` - Undo last action
     *  * `'redo'` - Redo last action
     *  * `'make_read_only'` - Make cell read only
     *  * `'alignment:left'` - Alignment to the left
     *  * `'alignment:top'` - Alignment to the top
     *  * `'alignment:right'` - Alignment to the right
     *  * `'alignment:bottom'` - Alignment to the bottom
     *  * `'alignment:middle'` - Alignment to the middle
     *  * `'alignment:center'` - Alignment to the center (justify)
     *
     * Or you can execute command registered in settings where `key` is your command name.
     *
     * @param {String} commandName The command name to be executed.
     * @param {...*} params
     */

  }, {
    key: 'executeCommand',
    value: function executeCommand(commandName) {
      var _commandExecutor;

      for (var _len2 = arguments.length, params = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        params[_key2 - 1] = arguments[_key2];
      }

      (_commandExecutor = this.commandExecutor).execute.apply(_commandExecutor, [commandName].concat(params));
    }

    /**
     * On contextmenu listener.
     *
     * @private
     * @param {Event} event
     */

  }, {
    key: 'onAfterOnCellContextMenu',
    value: function onAfterOnCellContextMenu(event) {
      var settings = this.hot.getSettings();
      var showRowHeaders = settings.rowHeaders;
      var showColHeaders = settings.colHeaders;

      function isValidElement(element) {
        return element.nodeName === 'TD' || element.parentNode.nodeName === 'TD';
      }
      // if event is from hot-table we must get web component element not element inside him
      var element = event.realTarget;
      this.close();

      if (hasClass(element, 'handsontableInput')) {
        return;
      }

      event.preventDefault();
      stopPropagation(event);

      if (!(showRowHeaders || showColHeaders)) {
        if (!isValidElement(element) && !(hasClass(element, 'current') && hasClass(element, 'wtBorder'))) {
          return;
        }
      }

      this.open(event);
    }

    /**
     * On menu before open listener.
     *
     * @private
     */

  }, {
    key: 'onMenuBeforeOpen',
    value: function onMenuBeforeOpen() {
      this.hot.runHooks('beforeContextMenuShow', this);
    }

    /**
     * On menu after open listener.
     *
     * @private
     */

  }, {
    key: 'onMenuAfterOpen',
    value: function onMenuAfterOpen() {
      this.hot.runHooks('afterContextMenuShow', this);
    }

    /**
     * On menu after close listener.
     *
     * @private
     */

  }, {
    key: 'onMenuAfterClose',
    value: function onMenuAfterClose() {
      this.hot.listen();
      this.hot.runHooks('afterContextMenuHide', this);
    }

    /**
     * Destroys the plugin instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.close();

      if (this.menu) {
        this.menu.destroy();
      }
      _get(ContextMenu.prototype.__proto__ || Object.getPrototypeOf(ContextMenu.prototype), 'destroy', this).call(this);
    }
  }]);

  return ContextMenu;
}(BasePlugin);

ContextMenu.SEPARATOR = {
  name: SEPARATOR
};

registerPlugin('contextMenu', ContextMenu);

export default ContextMenu;
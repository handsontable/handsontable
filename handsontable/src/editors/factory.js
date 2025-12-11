import { BaseEditor } from './baseEditor/baseEditor';
/**
 * Factory function for creating custom Handsontable editors by extending BaseEditor.
 *
 * This factory allows you to create custom editors by providing implementations for various
 * editor lifecycle methods. It handles the prototype chain setup and method delegation to
 * the BaseEditor superclass automatically.
 *
 * @param {object} params - Configuration object containing editor lifecycle methods and custom methods.
 * @param {Function} params.prepare - Called before editing begins to initialize the editor.
 * @param {Function} params.beginEditing - Called when editing starts.
 * @param {Function} params.finishEditing - Called when editing ends.
 * @param {Function} params.discardEditor - Called to discard editor changes.
 * @param {Function} params.saveValue - Called to save the edited value.
 * @param {Function} params.getValue - Called to retrieve the current editor value.
 * @param {Function} params.setValue - Called to set the editor value.
 * @param {Function} params.open - Called to open/show the editor UI.
 * @param {Function} params.close - Called to close/hide the editor UI.
 * @param {Function} params.focus - Called to focus the editor.
 * @param {Function} params.cancelChanges - Called to cancel editing changes.
 * @param {Function} params.checkEditorSection - Called to determine which section the editor belongs to.
 * @param {Function} params.enableFullEditMode - Called to enable full edit mode.
 * @param {Function} params.extend - Called to extend the editor class.
 * @param {Function} params.getEditedCell - Called to get the currently edited cell element.
 * @param {Function} params.getEditedCellRect - Called to get the edited cell's position and dimensions.
 * @param {Function} params.getEditedCellsZIndex - Called to get the z-index for the edited cell.
 * @param {Function} params.init - Called during editor initialization.
 * @param {Function} params.isInFullEditMode - Called to check if editor is in full edit mode.
 * @param {Function} params.isOpened - Called to check if editor is currently open.
 * @param {Function} params.isWaiting - Called to check if editor is waiting for input.
 *
 * @returns {Function} A custom editor class extending Handsontable's BaseEditor.
 *
 * @example
 * ```typescript
 * const MyEditor = editorBaseFactory({
 *   prepare(editor, row, col, prop, td, originalValue, cellProperties) {
 *     // Initialize your editor
 *   },
 *   open(editor) {
 *     // Show your editor UI
 *   },
 *   close(editor) {
 *     // Hide your editor UI
 *   },
 *   getValue(editor) {
 *     return editor.customValue;
 *   }
 * });
 * ```
 */
const editorBaseFactory = (params) => {
  const CustomBaseEditor = BaseEditor.prototype.extend();
  // Skip super in abstract funtions
  const skipSuperApply = [
    'close',
    'focus',
    'getValue',
    'open',
    'setValue',
  ];
  const prototypeFns = Object.getOwnPropertyNames(BaseEditor.prototype);

  // Apply editor class methods from params object
  prototypeFns.forEach((fnName) => {
    if (params[fnName]) {
      const superFn = CustomBaseEditor.prototype[fnName];

      CustomBaseEditor.prototype[fnName] = function(...args) {
        if (!skipSuperApply.includes(fnName)) {
          superFn.apply(this, args);
        }

        return params[fnName](this, ...args);
      };
    }
  });
  // Apply custom methods
  Object.keys(params).forEach((fnName) => {
    if (!prototypeFns.includes(fnName)) {
      CustomBaseEditor.prototype[fnName] = function(...args) {
        // `this` will be BaseEditor & T, as expected for custom methods.
        return params[fnName](this, ...args);
      };
    }
  });

  return CustomBaseEditor;
};

/**
 * Factory function to create a custom Handsontable editor.
 *
 * `editorFactory` helps you create modular, reusable, and fully custom editors
 * for Handsontable grid cells. The factory handles lifecycle, DOM structure, and
 * keyboard shortcuts, allowing you to focus on business-specific UI and value logic.
 *
 * @param {object} options - Configuration and lifecycle methods for the editor.
 * @param {Function} options.init - Called when this editor is constructed by the Handsontable grid.
 * @param {Function} options.afterOpen - Called after the editor is opened and made visible.
 * @param {Function} options.afterInit - Called immediately after init, useful for event binding, etc.
 * @param {Function} options.afterClose - Called when the editor is closed and made invisible.
 * @param {Function} options.beforeOpen - Called before the editor is opened so you can set its value/state.
 * @param {Function} options.getValue - Called to retrieve the current editor value.
 * @param {Function} options.setValue - Called to set the editor's value and update any UI as needed.
 * @param {Function} options.onFocus - Called to focus the editor.
 * @param {Array<object>} [options.shortcuts] - Called to register all configured keyboard shortcuts for this editor instance.
 * @param {any} options.value - The initial value for the editor input/state.
 * @param {Function} options.render - Called to render the editor UI.
 * @param {any} options.config - The configuration for the editor.
 * @param {string} options.shortcutsGroup - The group for the keyboard shortcuts.
 * @param {string} options.position - The position of the editor. Either 'container' (default) or 'portal' (for elements outside of the table container viewport).
 * @param {...object} [options.args] - Any additional custom fields or helpers you want mixed into the editor instance.
 *
 * @returns {BaseEditor} A custom editor class extending Handsontable's BaseEditor.
 */
export const editorFactory = ({
  /**
   * Called when this editor is constructed by the Handsontable grid.
   * Assigns value/config/render/etc, creates UI container, initializes with provided init.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  init,

  /**
   * Called after the editor is opened and made visible.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  afterOpen,

  /**
   * Called immediately after init, useful for event binding, etc.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  afterInit,

  /**
   * Called when the editor is closed and made invisible.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  afterClose,

  /**
   * Called before the editor is opened so you can set its value/state.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  beforeOpen,

  /**
   * Called to retrieve the current editor value.
   *
   * @param {BaseEditor} editor
   * @returns {any}
   */
  getValue,

  /**
   * Called to set the editor's value and update any UI as needed.
   *
   * @param {BaseEditor} editor
   * @param {any} value
   * @returns {void}
   */
  setValue,

  /**
   * Called to focus the editor.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  onFocus,

  shortcuts,
  value,

  /**
   * Called to render the editor UI.
   *
   * @param {BaseEditor} editor
   * @returns {void}
   */
  render,

  config,
  shortcutsGroup = 'custom-editor',
  position = 'container',

  /**
   * @param {...object} [args] Any additional custom fields or helpers you want mixed into the editor instance.
   */
  ...args

}) => {
  /**
   * Register all configured keyboard shortcuts for this editor instance.
   *
   * @param {BaseEditor} editor - The editor instance.
   * @returns {void}
   * @private
   */
  const registerShortcuts = (editor) => {
    const shortcutManager = editor.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');
    const contextConfig = {
      group: shortcutsGroup,
    };

    if (shortcuts) {
      editorContext.addShortcuts(shortcuts.map(shortcut => ({
        ...shortcut,
        relativeToGroup: shortcut.relativeToGroup ||
                    'editorManager.handlingEditor',
        position: shortcut.position || 'before',
        callback: event => shortcut.callback(editor, event),
      })),
      contextConfig);
    }
  };

  // Compose the Handsontable editor definition using the core editorBaseFactory:
  return editorBaseFactory({
    /**
     * Called when this editor is constructed by the Handsontable grid.
     * Assigns value/config/render/etc, creates UI container, initializes with provided init.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @returns {void}
     */
    init(editor) {
      Object.assign(editor, { value, config, render, position, ...args });
      editor._open = false;
      editor.container = editor.hot.rootDocument.createElement('DIV');
      editor.container.style.display = 'none';

      if (position === 'portal') {
        editor.hot.rootPortalElement.appendChild(editor.container);
      } else {
        editor.hot.rootElement.appendChild(editor.container);
      }
      init(editor);

      if (!editor.input) {
        // TODO: what should we do here?
        // console.error('input not found');
      }
      editor.container.appendChild(editor.input);

      if (typeof afterInit === 'function') {
        afterInit(editor);
      }
    },
    /**
     * Retrieve the value from the editor UI.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @returns {any}
     */
    getValue(editor) {
      if (typeof getValue === 'function') {
        return getValue(editor);
      }

      return editor.value;
    },
    /**
     * Set the editor's value and update any UI as needed.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @param {any} _value - The value to set.
     * @returns {void}
     */
    setValue(editor, _value) {
      if (typeof setValue === 'function') {
        setValue(editor, _value);
      } else {
        editor.value = _value;
      }
      if (typeof render === 'function') {
        render(editor);
      }
    },
    /**
     * Opens the editor, making the container visible and binding shortcuts.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @param {Event} event - The event that triggered the editor opening.
     * @returns {void}
     */
    open(editor, event = undefined) {

      editor.container.style.display = 'block';
      editor.container.style.position = 'absolute';

      if (editor.position === 'portal') {
        const _offset = editor.TD.getBoundingClientRect();

        editor.container.style.top = `${editor.hot.rootWindow.pageYOffset + _offset.top}px`;
        editor.container.style[editor.hot.isRtl() ? 'right' : 'left'] =
            `${editor.hot.rootWindow.pageXOffset + _offset[editor.hot.isRtl() ? 'right' : 'left']}px`;
      } else {
        const rect = editor.getEditedCellRect();

        editor.container.style.top = `${rect.top}px`;
        editor.container.style[editor.hot.isRtl() ? 'right' : 'left'] = `${rect.start}px`;
        editor.container.style.width = `${rect.width}px`;
        editor.container.style.height = `${rect.height}px`;
      }

      editor.container.classList.add('ht_editor_visible');
      editor._open = true;
      editor.hot.getShortcutManager().setActiveContextName('editor');
      registerShortcuts(editor);

      if (afterOpen) {
        afterOpen(editor, event);
      }
    },
    /**
     * Focus on the correct UI element within your editor.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @returns {void}
     */
    focus(editor) {
      if (typeof onFocus === 'function') {
        onFocus(editor);
      } else {
        // eslint-disable-next-line max-len
        editor.container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();
      }
    },
    /**
     * Close the editor UI and cleanup active shortcuts.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @returns {void}
     */
    close(editor) {
      editor._open = false;
      editor.container.style.display = 'none';
      editor.container.classList.remove('ht_editor_visible');
      const shortcutManager = editor.hot.getShortcutManager();
      const editorContext = shortcutManager.getContext('editor');

      editorContext.removeShortcutsByGroup(shortcutsGroup);

      if (typeof afterClose === 'function') {
        afterClose(editor);
      }
    },
    /**
     * Prepare the editor to start editing a new value. Invokes beforeOpen or falls back.
     *
     * @param {BaseEditor} editor - The editor instance.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @param {number|string} prop - The property name or index.
     * @param {HTMLTableCellElement} td - The table cell element.
     * @param {any} originalValue - The original value.
     * @param {object} cellProperties - The cell properties.
     * @returns {void}
     */
    prepare(editor, row, col, prop, td, originalValue, cellProperties) {
      if (typeof beforeOpen === 'function') {
        beforeOpen(editor, {
          row,
          col,
          prop,
          td,
          originalValue,
          cellProperties,
        });
      } else {
        editor.setValue(originalValue);
      }
    },
  });
};


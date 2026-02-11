import type { HotInstance } from '../common';
import { BaseEditor } from './baseEditor/baseEditor';

/**
 * Represents an extended editor instance created by the editorFactory.
 * It combines BaseEditor functionality with custom properties and methods.
 */
export type ExtendedEditor<T> = BaseEditor & {
  render: (editor: ExtendedEditor<T>) => void;
  value?: T extends { value: unknown } ? T['value'] : unknown;
  config?: T extends { config: unknown } ? T['config'] : unknown;
  container: HTMLDivElement;
} & T;

/**
 * Factory function for creating custom Handsontable editors by extending BaseEditor.
 *
 * @param {object} params Configuration object containing editor lifecycle methods and custom methods.
 * @returns {Function} A custom editor class extending Handsontable's BaseEditor.
 */
const editorBaseFactory = (params: Record<string, unknown>): unknown => {
  const CustomBaseEditor = BaseEditor.prototype.extend();
  // Skip super in abstract functions
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
      const superFn = (CustomBaseEditor as any).prototype[fnName];

      (CustomBaseEditor as any).prototype[fnName] = function(...args: unknown[]) {
        if (!skipSuperApply.includes(fnName)) {
          superFn.apply(this, args);
        }

        return (params[fnName] as Function)(this, ...args);
      };
    }
  });
  // Apply custom methods
  Object.keys(params).forEach((fnName) => {
    if (!prototypeFns.includes(fnName)) {
      (CustomBaseEditor as any).prototype[fnName] = function(...args: unknown[]) {
        // `this` will be BaseEditor & T, as expected for custom methods.
        return (params[fnName] as Function)(this, ...args);
      };
    }
  });

  return CustomBaseEditor;
};

/**
 * Factory function to create a custom Handsontable editor.
 *
 * @param {object} options Configuration and lifecycle methods for the editor.
 * @returns {BaseEditor} A custom editor class extending Handsontable's BaseEditor.
 */
export const editorFactory = ({
  init,
  afterOpen,
  afterInit,
  afterClose,
  beforeOpen,
  getValue,
  setValue,
  onFocus,
  shortcuts,
  value,
  render,
  config,
  shortcutsGroup = 'custom-editor',
  position = 'container',
  ...args
}: Record<string, unknown>) => {
  const registerShortcuts = (editor: Record<string, unknown>): void => {
    const shortcutManager = (editor.hot as HotInstance).getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');
    const contextConfig = {
      group: shortcutsGroup,
    };

    if (shortcuts) {
      editorContext.addShortcuts((shortcuts as Record<string, unknown>[]).map((shortcut: Record<string, unknown>) => ({
        ...shortcut,
        relativeToGroup: shortcut.relativeToGroup ||
                    'editorManager.handlingEditor',
        position: shortcut.position || 'before',
        callback: (event: Event) => (shortcut.callback as Function)(editor, event),
      })),
      contextConfig);
    }
  };

  // Compose the Handsontable editor definition using the core editorBaseFactory:
  return editorBaseFactory({
    init(editor: Record<string, unknown>) {
      Object.assign(editor, { value, config, render, position, ...args });
      editor._open = false;
      editor.container = (editor.hot as HotInstance).rootDocument.createElement('DIV');
      (editor.container as HTMLElement).style.display = 'none';

      if (position === 'portal') {
        (editor.hot as HotInstance).rootPortalElement.appendChild(editor.container as HTMLElement);
      } else {
        (editor.hot as HotInstance).rootElement.appendChild(editor.container as HTMLElement);
      }

      (init as Function)(editor);

      if (!editor.input) {
        // TODO: what should we do here?
      }
      (editor.container as HTMLElement).appendChild(editor.input as HTMLElement);

      if (typeof afterInit === 'function') {
        (afterInit as Function)(editor);
      }
    },
    getValue(editor: Record<string, unknown>) {
      if (typeof getValue === 'function') {
        return (getValue as Function)(editor);
      }

      return editor.value;
    },
    setValue(editor: Record<string, unknown>, _value: unknown) {
      if (typeof setValue === 'function') {
        (setValue as Function)(editor, _value);
      } else {
        editor.value = _value;
      }

      if (typeof render === 'function') {
        (render as Function)(editor);
      }
    },
    open(editor: Record<string, unknown>, event: Event = undefined) {
      const containerStyle = (editor.container as HTMLElement).style;

      containerStyle.display = 'block';
      containerStyle.position = 'absolute';

      if (editor.position === 'portal') {
        const _offset = (editor.TD as HTMLElement).getBoundingClientRect();

        containerStyle.top = `${(editor.hot as HotInstance).rootWindow.pageYOffset + _offset.top}px`;
        containerStyle[(editor.hot as HotInstance).isRtl() ? 'right' : 'left'] =
            `${(editor.hot as HotInstance).rootWindow.pageXOffset + _offset[(editor.hot as HotInstance).isRtl() ? 'right' : 'left']}px`;
      } else {
        const rect = (editor as any).getEditedCellRect();

        containerStyle.top = `${rect.top}px`;
        containerStyle[(editor.hot as HotInstance).isRtl() ? 'right' : 'left'] = `${rect.start}px`;
        containerStyle.width = `${rect.width}px`;
        containerStyle.height = `${rect.height}px`;
      }

      (editor.container as HTMLElement).classList.add('ht_editor_visible');
      editor._open = true;
      (editor.hot as HotInstance).getShortcutManager().setActiveContextName('editor');
      registerShortcuts(editor);

      if (afterOpen) {
        (afterOpen as Function)(editor, event);
      }
    },
    focus(editor: Record<string, unknown>) {
      if (typeof onFocus === 'function') {
        (onFocus as Function)(editor);
      } else {
        // eslint-disable-next-line max-len
        ((editor.container as HTMLElement).querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement | null)?.focus();
      }
    },
    close(editor: Record<string, unknown>) {
      editor._open = false;
      (editor.container as HTMLElement).style.display = 'none';
      (editor.container as HTMLElement).classList.remove('ht_editor_visible');

      const shortcutManager = (editor.hot as HotInstance).getShortcutManager();
      const editorContext = shortcutManager.getContext('editor');

      editorContext.removeShortcutsByGroup(shortcutsGroup as string);

      if (typeof afterClose === 'function') {
        (afterClose as Function)(editor);
      }
    },
    prepare(editor: Record<string, unknown>, row: number, col: number, prop: string | number, td: HTMLTableCellElement, originalValue: unknown, cellProperties: Record<string, unknown>) {
      if (typeof beforeOpen === 'function') {
        (beforeOpen as Function)(editor, {
          row,
          col,
          prop,
          td,
          originalValue,
          cellProperties,
        });
      } else {
        (editor as any).setValue(originalValue);
      }
    },
  });
};

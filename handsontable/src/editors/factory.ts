import { BaseEditor } from './baseEditor/baseEditor';
import EventManager from '../eventManager';
import { throwWithCause } from '../helpers/errors';
import { CellProperties, CellValue } from '../settings';
import { Context } from '../shortcuts/context';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EditorBaseFactoryParams<E> = Record<string, (editor: E, ...args: any[]) => unknown>;

/**
 * Factory function for creating custom Handsontable editors by extending BaseEditor.
 *
 * This factory allows you to create custom editors by providing implementations for various
 * editor lifecycle methods. It handles the prototype chain setup and method delegation to
 * the BaseEditor superclass automatically.
 *
 * @param params Configuration object containing editor lifecycle methods and custom methods.
 * @returns A custom editor class extending Handsontable's BaseEditor.
 */
type EditorWithExtendedProps = InstanceType<typeof BaseEditor> & {
  container?: HTMLElement;
  input?: HTMLElement;
  preventCloseElement?: HTMLElement | null;
  eventManager?: InstanceType<typeof EventManager>;
  refreshDimensions?: () => void;
  _opened: boolean;
  value: unknown;
  config: unknown;
};

type Shortcut = Parameters<Context['addShortcut']>[0];

export type ExtendedEditor<T> = BaseEditor & {
  render: (editor: ExtendedEditor<T>) => void;
  value?: T extends {
    value: CellValue;
  } ? T['value'] : CellValue;
  config?: T extends {
    config: CellValue;
  } ? T['config'] : CellValue;
  container: HTMLDivElement;
} & T;

const editorBaseFactory = <E>(params: EditorBaseFactoryParams<E>): typeof BaseEditor => {
  const CustomBaseEditor = BaseEditor.prototype.extend() as typeof BaseEditor;
  const skipSuperApply = [
    'close',
    'focus',
    'getValue',
    'open',
    'setValue',
  ];
  const prototypeFns = Object.getOwnPropertyNames(BaseEditor.prototype);
  const proto = CustomBaseEditor.prototype as unknown as Record<string, unknown>;

  prototypeFns.forEach((fnName) => {
    if (params[fnName]) {
      const superFn = CustomBaseEditor.prototype[fnName as keyof BaseEditor] as (...args: unknown[]) => unknown;

      proto[fnName] = function(this: E, ...args: unknown[]) {
        if (!skipSuperApply.includes(fnName)) {
          superFn.apply(this, args);
        }

        return params[fnName](this, ...args);
      };
    }
  });
  Object.keys(params).forEach((fnName) => {
    if (!prototypeFns.includes(fnName)) {
      proto[fnName] = function(this: E, ...args: unknown[]) {
        return params[fnName](this, ...args);
      };
    }
  });

  return CustomBaseEditor;
};

export interface EditorFactoryOptions {
  init: (editor: InstanceType<typeof BaseEditor>) => void;
  afterOpen?: (editor: InstanceType<typeof BaseEditor>, event?: Event) => void;
  afterInit?: (editor: InstanceType<typeof BaseEditor>) => void;
  afterClose?: (editor: InstanceType<typeof BaseEditor>) => void;
  beforeOpen?: (editor: InstanceType<typeof BaseEditor>, context: Record<string, unknown>) => void;
  getValue?: (editor: InstanceType<typeof BaseEditor>) => unknown;
  setValue?: (editor: InstanceType<typeof BaseEditor>, value: unknown) => void;
  onFocus?: (editor: InstanceType<typeof BaseEditor>) => void;
  shortcuts?: Array<Record<string, unknown>>;
  value?: unknown;
  render?: (editor: InstanceType<typeof BaseEditor>) => void;
  config?: unknown;
  shortcutsGroup?: string;
  position?: 'container' | 'portal';
  [key: string]: unknown;
}

/**
 * Factory function to create a custom Handsontable editor.
 */
export const editorFactory = <TProperties, TMethods = Record<string, unknown>>(
  { init, afterOpen, afterInit, afterClose, beforeOpen,
    getValue, setValue, onFocus, shortcuts, value, render, config, shortcutsGroup, position, ...args }:{
    value?: TProperties extends {
        value: CellValue;
    } ? TProperties['value'] : CellValue;
    config?: TProperties extends {
        config: CellValue;
    } ? TProperties['config'] : CellValue;
    render?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
    init: (editor: ExtendedEditor<TProperties & TMethods>) => void;
    afterOpen?: (editor: ExtendedEditor<TProperties & TMethods>, event?: Event) => void;
    afterClose?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
    afterInit?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
    beforeOpen?: (editor: ExtendedEditor<TProperties & TMethods>,
      { row, col, prop, td, originalValue, cellProperties, }: {
      row: number;
      col: number;
      prop: string | number;
      td: HTMLTableCellElement;
      originalValue: CellValue;
      cellProperties: CellProperties;
    }) => void;
    getValue?: (editor: ExtendedEditor<TProperties & TMethods>) => any;
    setValue?: (editor: ExtendedEditor<TProperties & TMethods>, value: CellValue) => void;
    onFocus?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
    shortcutsGroup?: string;
    shortcuts?: (Omit<Shortcut, 'callback' | 'group'> & {
      callback: (editor: ExtendedEditor<TProperties & TMethods>, event: Event) => boolean | void;
      group?: string;
    })[];
    position?: 'container' | 'portal';
  } & TMethods & Record<string, unknown>): ExtendedEditor<TProperties> => {
  type Extended = ExtendedEditor<TProperties & TMethods>;

  const registerShortcuts = (editor: EditorWithExtendedProps & Extended) => {
    const shortcutManager = editor.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');
    const contextConfig = { group: shortcutsGroup };

    if (shortcuts) {
      editorContext!.addShortcuts(shortcuts.map(shortcut => ({
        ...shortcut,
        relativeToGroup: shortcut.relativeToGroup ?? 'editorManager.handlingEditor',
        position: shortcut.position ?? 'before',
        callback: (event: Event) => shortcut.callback(editor, event),
      })), contextConfig);
    }
  };

  return editorBaseFactory<EditorWithExtendedProps & Extended>({
    init(editor) {
      Object.assign(editor, { value, config, render, position, ...args });
      editor._opened = false;
      editor.container = editor.hot.rootDocument.createElement('div');
      editor.container.style.display = 'none';

      if (position === 'portal') {
        editor.hot.rootPortalElement.appendChild(editor.container);
      } else {
        editor.hot.rootElement.appendChild(editor.container);
      }

      init(editor);

      if (!editor.input) {
        throwWithCause('Input is not assigned. Assign it in the init callback.');
      }

      editor.container.appendChild(editor.input);

      if (typeof afterInit === 'function') {
        afterInit(editor);
      }

      if (editor.preventCloseElement && editor.preventCloseElement instanceof HTMLElement) {
        editor.eventManager = new EventManager(editor.hot);
        editor.eventManager.addEventListener(editor.preventCloseElement, 'mousedown', (event: Event) => {
          event.stopPropagation();
        });
      }

      editor.addHook('afterScrollHorizontally', () => editor.refreshDimensions?.());
      editor.addHook('afterScrollVertically', () => editor.refreshDimensions?.());
    },
    getValue(editor) {
      if (typeof getValue === 'function') {
        return getValue(editor);
      }

      return editor.value;
    },
    setValue(editor, _value: unknown) {
      if (typeof setValue === 'function') {
        setValue(editor, _value);
      } else {
        (editor as EditorWithExtendedProps).value = _value;
      }
      if (typeof render === 'function') {
        render(editor);
      }
    },
    refreshDimensions(editor) {
      editor.TD = editor.getEditedCell();

      if (!editor.TD) {
        editor.close();

        return;
      }
      if (!editor._opened) {
        return;
      }
      const containerStyle = editor.container!.style;

      containerStyle.display = 'block';
      containerStyle.position = 'absolute';

      if (position === 'portal') {
        const _offset = editor.TD.getBoundingClientRect();

        containerStyle.top = `${editor.hot.rootWindow.pageYOffset + _offset.top}px`;
        containerStyle[editor.hot.isRtl() ? 'right' : 'left'] =
          `${editor.hot.rootWindow.pageXOffset + _offset[editor.hot.isRtl() ? 'right' : 'left']}px`;
      } else {
        const rect = editor.getEditedCellRect();

        if (!rect) {
          return;
        }
        containerStyle.top = `${rect.top}px`;
        containerStyle[editor.hot.isRtl() ? 'right' : 'left'] = `${rect.start}px`;
        containerStyle.width = `${rect.width}px`;
        containerStyle.height = `${rect.height}px`;
      }
    },
    open(editor, event?: Event) {
      editor.container!.classList.add('ht_clone_master');
      editor._opened = true;
      editor.refreshDimensions?.();
      editor.hot.getShortcutManager().setActiveContextName('editor');
      registerShortcuts(editor);

      if (afterOpen) {
        afterOpen(editor, event);
      }
    },
    focus(editor) {
      if (typeof onFocus === 'function') {
        onFocus(editor);
      } else {
        const focusable = editor.container?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement | null;

        focusable?.focus();
      }
    },
    close(editor) {
      editor._opened = false;
      editor.container!.style.display = 'none';
      editor.container!.classList.remove('ht_clone_master');
      const shortcutManager = editor.hot.getShortcutManager();
      const editorContext = shortcutManager.getContext('editor');

      editorContext!.removeShortcutsByGroup(shortcutsGroup ?? '');

      if (typeof afterClose === 'function') {
        afterClose(editor);
      }
    },
    prepare(editor, row: number, col: number, prop: string | number,
            td: HTMLTableCellElement, originalValue: unknown, cellProperties: CellProperties) {
      if (typeof beforeOpen === 'function') {
        beforeOpen(editor, { row, col, prop, td, originalValue, cellProperties });
      } else {
        editor.setValue(originalValue);
      }
    },
  }) as unknown as ExtendedEditor<TProperties>;
};

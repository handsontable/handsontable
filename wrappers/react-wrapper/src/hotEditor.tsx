import React, {
  DependencyList,
  FC,
  MutableRefObject,
  ReactNode,
  Ref,
  RefObject,
  createContext,
  useContext,
  useDeferredValue,
  useImperativeHandle,
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
  Dispatch,
} from 'react';
import Handsontable from 'handsontable/base';
import { HotEditorHooks, UseHotEditorImpl } from './types';

type HookPropName = keyof Handsontable.editors.BaseEditor | 'constructor';

const AbstractMethods: (keyof Handsontable.editors.BaseEditor)[] = [
  'close',
  'focus',
  'open',
];
const ExcludedMethods: (keyof Handsontable.editors.BaseEditor)[] = [
  'getValue',
  'setValue',
];

const MethodsMap: Partial<
  Record<keyof Handsontable.editors.BaseEditor, keyof HotEditorHooks>
> = {
  open: 'onOpen',
  close: 'onClose',
  prepare: 'onPrepare',
  focus: 'onFocus',
};

/**
 * Create a class to be passed to the Handsontable's settings.
 *
 * @param {RefObject<HotEditorHooks>} hooksRef Reference to component-based editor overridden hooks object.
 * @param {RefObject} instanceRef Reference to Handsontable-native custom editor class instance.
 * @returns {Function} A class to be passed to the Handsontable editor settings.
 */
export function makeEditorClass(
  hooksRef: MutableRefObject<HotEditorHooks | null>,
  instanceRef: MutableRefObject<Handsontable.editors.BaseEditor | null>
): typeof Handsontable.editors.BaseEditor {
  return class CustomEditor
    extends Handsontable.editors.BaseEditor
    implements Handsontable.editors.BaseEditor {
    private value: any;

    constructor(hotInstance: Handsontable.Core) {
      super(hotInstance);
      instanceRef.current = this;

      (
        Object.getOwnPropertyNames(
          Handsontable.editors.BaseEditor.prototype
        ) as HookPropName[]
      ).forEach((propName) => {
        if (propName === 'constructor' || ExcludedMethods.includes(propName)) {
          return;
        }

        const baseMethod = Handsontable.editors.BaseEditor.prototype[propName];
        (CustomEditor.prototype as any)[propName] = function (
          this: CustomEditor,
          ...args: any[]
        ) {
          let result;

          if (!AbstractMethods.includes(propName)) {
            result = (baseMethod as (...a: any[]) => unknown).call(this, ...args); // call super
          }

          if (
            MethodsMap[propName] &&
            hooksRef.current?.[MethodsMap[propName]!]
          ) {
            result = (hooksRef.current[MethodsMap[propName]!] as any).call(
              this,
              ...args
            );
          }

          return result;
        }.bind(this);
      });
    }

    focus() { }

    getValue() {
      return this.value;
    }

    setValue(newValue: any) {
      this.value = newValue;
    }

    open() { }

    close() { }
  };
}

interface EditorContextType {
  hooksRef: Ref<HotEditorHooks>;
  hotCustomEditorInstanceRef: RefObject<Handsontable.editors.BaseEditor>;
}

/**
 * Context to provide Handsontable-native custom editor class instance to overridden hooks object.
 */
export const EditorContext = createContext<EditorContextType | undefined>(
  undefined
);

interface EditorContextProviderProps {
  hooksRef: Ref<HotEditorHooks>;
  hotCustomEditorInstanceRef: RefObject<Handsontable.editors.BaseEditor>;
  children: ReactNode;
}

/**
 * Provider of the context that exposes Handsontable-native editor instance and passes hooks object
 * for custom editor components.
 *
 * @param {Ref} hooksRef Reference for component-based editor overridden hooks object.
 * @param {RefObject} hotCustomEditorInstanceRef  Reference to Handsontable-native editor instance.
 */
export const EditorContextProvider: FC<EditorContextProviderProps> = ({
  hooksRef,
  hotCustomEditorInstanceRef,
  children,
}) => {
  return (
    <EditorContext.Provider value={{ hooksRef, hotCustomEditorInstanceRef }}>
      {children}
    </EditorContext.Provider>
  );
};

type EditorWithPosition = Handsontable.editors.BaseEditor & { position?: string };

/**
 * Applies editor overlay position/dimensions to an element.
 * @returns true if position was applied, false if editor should close (e.g. cell no longer available).
 */
function applyEditorPosition(
  el: HTMLElement,
  editor: EditorWithPosition,
  hot: Handsontable.Core,
  td: Element | null | undefined
): boolean {
  const rootWindow = hot.rootWindow || window;
  const pageX = rootWindow.pageXOffset ?? 0;
  const pageY = rootWindow.pageYOffset ?? 0;
  const isRtl = typeof hot.isRtl === 'function' && hot.isRtl();
  const position = editor.position;

  const applyTdRect = (rect: DOMRect) => {
    el.style.top = `${pageY + rect.top - 1}px`;
    el.style.width = `${rect.width + 1}px`;
    el.style.height = `${rect.height + 1}px`;

    if (isRtl) {
      el.style.right = `${pageX + rect.right}px`;
      el.style.left = 'auto';
    } else {
      el.style.left = `${pageX + rect.left - 1}px`;
      el.style.right = 'auto';
    }
  };

  if (position === 'portal') {
    const cell = td ?? (typeof editor.getEditedCell === 'function' ? editor.getEditedCell.call(editor) : null);

    if (!cell?.getBoundingClientRect) {
      return false;
    }

    applyTdRect(cell.getBoundingClientRect());

    return true;
  }

  const getEditedCellRect = editor.getEditedCellRect;
  const rect = typeof getEditedCellRect === 'function' ? getEditedCellRect.call(editor) : null;

  if (rect) {
    const rootElement = hot.rootElement;

    if (rootElement?.getBoundingClientRect) {
      const rootRect = rootElement.getBoundingClientRect();

      el.style.top = `${pageY + rootRect.top + rect.top}px`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;

      if (isRtl) {
        el.style.right = `${pageX + rootRect.right - rect.start}px`;
        el.style.left = 'auto';
      } else {
        el.style.left = `${pageX + rootRect.left + rect.start}px`;
        el.style.right = 'auto';
      }

      return true;
    }
  }

  if (td?.getBoundingClientRect) {
    applyTdRect(td.getBoundingClientRect());

    return true;
  }

  return false;
}

/**
 * Hook that allows encapsulating custom behaviours of component-based editor by customizing passed ref with overridden hooks object.
 *
 * @param {HotEditorHooks} overriddenHooks Overrides specific for the custom editor.
 * @param {DependencyList} deps Overridden hooks object React dependency list.
 * @returns {UseHotEditorImpl} Editor API methods
 */
export function useHotEditor<T>(
  overriddenHooks?: HotEditorHooks,
  deps?: DependencyList
): UseHotEditorImpl<T> {
  const { hooksRef, hotCustomEditorInstanceRef } =
    useContext(EditorContext)!;
  const [rerenderTrigger, setRerenderTrigger] = useState(0);
  const [editorValue, setEditorValue] = useState<T>();

  // return a deferred value that allows for optimizing performance by delaying the update of a value until the next render.
  const deferredValue = useDeferredValue(editorValue);

  useImperativeHandle(
    hooksRef,
    () => ({
      ...overriddenHooks,
      onOpen() {
        setEditorValue(hotCustomEditorInstanceRef.current?.getValue() as T | undefined);
        overriddenHooks?.onOpen?.();
        setRerenderTrigger((t) => t + 1);
      },
    }),
    deps
  );

  return useMemo(
    () => ({
      get value(): T | undefined {
        return deferredValue;
      },
      setValue(newValue) {
        setEditorValue(newValue);
        hotCustomEditorInstanceRef.current?.setValue(newValue);
      },
      get isOpen() {
        return hotCustomEditorInstanceRef.current?.isOpened() ?? false;
      },
      finishEditing() {
        hotCustomEditorInstanceRef.current?.finishEditing();
      },
      get row() {
        const row = hotCustomEditorInstanceRef.current?.row;
        return row ?? undefined;
      },
      get col() {
        const col = hotCustomEditorInstanceRef.current?.col;
        return col ?? undefined;
      },
    }),
    [rerenderTrigger, hotCustomEditorInstanceRef, deferredValue]
  );
}


type EditorChildrenProps<T> = {
  value: T;
  setValue: Dispatch<T>;
  finishEditing: () => void;
  isOpen: boolean;
  row: number | undefined;
  col: number | undefined;
  mainElementRef: React.RefObject<HTMLDivElement>;
}

// Render prop function type
type EditorRenderProp<T> = (props: EditorChildrenProps<T>) => React.ReactNode;

// EditorComponent props - children typed to work with JSX syntax
type EditorComponentProps = {
  onPrepare?: (row: number, column: number, prop: string | number, TD: HTMLTableCellElement, originalValue: any, cellProperties: Handsontable.CellProperties) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onFocus?: () => void;
  shortcutsGroup?: string;
  shortcuts?: {
    keys: string[][];
    callback: (props: any, event: KeyboardEvent) => boolean | void;
    group?: string;
    runOnlyIf?: () => boolean;
    captureCtrl?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    relativeToGroup?: string;
    position?: "before" | "after";
    forwardToContext?: any;
  }[];
}


export function EditorComponent<T = any>({
  onPrepare,
  onClose,
  onOpen,
  onFocus,
  children,
  shortcutsGroup = "custom-editor",
  shortcuts,
}: EditorComponentProps & { children?: EditorRenderProp<T> }): React.ReactElement {
  const mainElementRef = useRef<HTMLDivElement>(null);
  const currentValue = useRef<T>(undefined);
  const [themeClassName, setThemeClassName] = useState<string | undefined>();
  const { hotCustomEditorInstanceRef } = useContext(EditorContext)!;

  const registerShortcuts = useCallback(() => {
    if (!hotCustomEditorInstanceRef.current?.hot) return;

    hotCustomEditorInstanceRef.current?.hot?.getShortcutManager().setActiveContextName("editor");

    const shortcutManager = hotCustomEditorInstanceRef.current?.hot?.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');
    const contextConfig = {
      group: shortcutsGroup,
    };

    if (shortcuts) {
      editorContext?.addShortcuts(shortcuts.map(shortcut => ({
        ...shortcut,
        group: shortcut.group || shortcutsGroup,
        relativeToGroup: shortcut.relativeToGroup ||
          'editorManager.handlingEditor',
        position: shortcut.position || 'before',
        callback: (event: KeyboardEvent) =>
          shortcut.callback({ value: currentValue.current, setValue, finishEditing }, event),
      })),
        //@ts-ignore
        contextConfig
      );
    }
  }, [shortcuts]);


  const unRegisterShortcuts = useCallback(() => {
    if (!hotCustomEditorInstanceRef.current?.hot) return;

    const shortcutManager = hotCustomEditorInstanceRef.current?.hot?.getShortcutManager();
    const editorContext = shortcutManager.getContext("editor")!;
    editorContext.removeShortcutsByGroup(shortcutsGroup);
  }, [shortcuts]);

  const refreshDimensions = useCallback(() => {
    const editor = hotCustomEditorInstanceRef.current as EditorWithPosition | null;
    const el = mainElementRef.current;

    if (!editor || !el) return;

    const hot = editor.hot;

    if (!hot) return;

    if (typeof editor.isOpened !== 'function' || !editor.isOpened()) return;

    if (!applyEditorPosition(el, editor, hot, null) && typeof editor.close === 'function') {
      editor.close();
    }
  }, []);

  const unRegisterScrollHooks = useCallback(() => {
    const editor = hotCustomEditorInstanceRef.current;
    const hot = editor?.hot;

    if (!hot || typeof hot.removeHook !== 'function') return;

    hot.removeHook('afterScrollHorizontally', refreshDimensions);
    hot.removeHook('afterScrollVertically', refreshDimensions);
  }, [refreshDimensions]);

  const registerScrollHooks = useCallback(() => {
    const editor = hotCustomEditorInstanceRef.current;
    const hot = editor?.hot;

    if (!hot || typeof hot.addHook !== 'function') return;

    hot.addHook('afterScrollHorizontally', refreshDimensions);
    hot.addHook('afterScrollVertically', refreshDimensions);
  }, [refreshDimensions]);

  const { value, setValue, finishEditing, isOpen, col, row } = useHotEditor<T>({
    onOpen: () => {
      if (!mainElementRef.current) return;

      const themeName = hotCustomEditorInstanceRef.current?.hot.getCurrentThemeName();

      if (themeName) setThemeClassName(themeName);
  
      mainElementRef.current.style.display = 'block';
  
      onOpen?.();

      const el = mainElementRef.current;
      const editor = hotCustomEditorInstanceRef.current as EditorWithPosition | null;

      if (el && editor?.hot) {
        applyEditorPosition(el, editor, editor.hot, null);
      }

      registerShortcuts();
      registerScrollHooks();
    },
    onClose: () => {
      if (!mainElementRef.current) return;
  
      mainElementRef.current.style.display = 'none';

      onClose?.();
      unRegisterShortcuts();
      unRegisterScrollHooks();
    },
    onPrepare: (_row, _column, _prop, TD, _originalValue, _cellProperties) => {
      onPrepare?.(_row, _column, _prop, TD, _originalValue, _cellProperties);
    },
    onFocus: () => {
      onFocus?.();
    },
  });

  useEffect(() => {
    currentValue.current = value;
  }, [value]);

  const stopMousedownPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };


  return (
    <div
      ref={mainElementRef}
      className={themeClassName}
      style={{
        display: 'none',
        position: 'absolute',
        background: '#fff',
        border: '0px',
        padding: '0px',
        zIndex: 100,
      }}
      onMouseDown={stopMousedownPropagation}
    >
      {(children as EditorRenderProp<T>)({ value: value as T, setValue, finishEditing, mainElementRef: mainElementRef as React.RefObject<HTMLDivElement>, isOpen, col, row })}
    </div>
  );
};
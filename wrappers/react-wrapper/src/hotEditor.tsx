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
    implements Handsontable.editors.BaseEditor
  {
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
            result = baseMethod.call(this, ...args); // call super
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

    focus() {}

    getValue() {
      return this.value;
    }

    setValue(newValue: any) {
      this.value = newValue;
    }

    open() {}

    close() {}
  };
}

interface EditorContextType {
  hooksRef: Ref<HotEditorHooks>;
  hotCustomEditorInstanceRef: RefObject<Handsontable.editors.BaseEditor>;
}

/**
 * Context to provide Handsontable-native custom editor class instance to overridden hooks object.
 */
const EditorContext = createContext<EditorContextType | undefined>(
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
        setEditorValue(hotCustomEditorInstanceRef.current?.getValue());
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
        return hotCustomEditorInstanceRef.current?.row;
      },
      get col() {
        return hotCustomEditorInstanceRef.current?.col;
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
    callback: (props:any, event: KeyboardEvent) => boolean | void;
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
  const instance = useRef<Handsontable.Core>(null);
  const currentValue = useRef<T>(undefined);

  const registerShortcuts = useCallback(() => {
    if (!instance.current) return;

    instance.current?.getShortcutManager().setActiveContextName("editor");

    const shortcutManager = instance.current.getShortcutManager();
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
    if (!instance.current) return;
   
    const shortcutManager = instance.current.getShortcutManager();
    const editorContext = shortcutManager.getContext("editor")!;
    editorContext.removeShortcutsByGroup(shortcutsGroup);

  }, [shortcuts]);

  const { value, setValue, finishEditing, isOpen, col, row } = useHotEditor<T>({
    onOpen: () => {
      if (!mainElementRef.current) return;
      mainElementRef.current.style.display = 'block';
      onOpen?.();
      registerShortcuts();
    },
    onClose: () => {
      if (!mainElementRef.current) return;
      mainElementRef.current.style.display = 'none';
      onClose?.();
      unRegisterShortcuts();
    },
    onPrepare: (_row, _column, _prop, TD, _originalValue, _cellProperties) => {
      //@ts-ignore
      instance.current = _cellProperties.instance;
      const tdPosition = TD.getBoundingClientRect();
      const rect = _cellProperties.editor;
      if (!mainElementRef.current) return;

      // TODO: Implement RTL support, fix wrapper to get editor instance and use `const rect = editor.getEditedCellRect();` 
      //mainElementRef.current.style[_cellProperties.instance.isRtl() ? 'right' : 'left'] = `${tdPosition.left}px`;

      mainElementRef.current.style.left = `${tdPosition.left + window.pageXOffset - 1}px`;
      mainElementRef.current.style.top = `${tdPosition.top + window.pageYOffset - 1}px`;
      mainElementRef.current.style.width = `${tdPosition.width}px`;
      mainElementRef.current.style.height = `${tdPosition.height}px`;
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
      style={{
        display: 'none',
        position: 'absolute',
        background: '#fff',
        border: '0px',
        padding: '0px',
        zIndex: 999,
      }}
      onMouseDown={stopMousedownPropagation}
    >

      {(children as EditorRenderProp<T>)({ value: value as T, setValue, finishEditing, mainElementRef: mainElementRef as React.RefObject<HTMLDivElement>, isOpen, col, row })}

    </div>
  );
};
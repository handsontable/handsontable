import React from 'react';
import Handsontable from 'handsontable/base';
import { HotEditorHooks, UseHotEditorImpl } from './types';

type HookPropName = (keyof Handsontable.editors.BaseEditor) | 'constructor';

const AbstractMethods: (keyof Handsontable.editors.BaseEditor)[] = ['close', 'focus', 'open'];
const ExcludedMethods: (keyof Handsontable.editors.BaseEditor)[] = ['getValue', 'setValue'];

const MethodsMap: Partial<Record<keyof Handsontable.editors.BaseEditor, keyof HotEditorHooks>> = {
  open: 'onOpen',
  close: 'onClose',
  prepare: 'onPrepare',
  focus: 'onFocus',
};

/**
 * Create a class to be passed to the Handsontable's settings.
 *
 * @param {React.RefObject<HotEditorHooks>} hooksRef Reference to component-based editor overridden hooks object.
 * @param {React.RefObject} instanceRef Reference to Handsontable-native custom editor class instance.
 * @returns {Function} A class to be passed to the Handsontable editor settings.
 */
export function makeEditorClass(hooksRef: React.MutableRefObject<HotEditorHooks | null>, instanceRef: React.MutableRefObject<Handsontable.editors.BaseEditor | null>): typeof Handsontable.editors.BaseEditor {
  return class CustomEditor extends Handsontable.editors.BaseEditor implements Handsontable.editors.BaseEditor {
    private value: any;

    constructor(hotInstance: Handsontable.Core) {
      super(hotInstance);
      instanceRef.current = this;

      (Object.getOwnPropertyNames(Handsontable.editors.BaseEditor.prototype) as HookPropName[]).forEach((propName) => {
        if (propName === 'constructor' || ExcludedMethods.includes(propName)) {
          return;
        }

        const baseMethod = Handsontable.editors.BaseEditor.prototype[propName];
        (CustomEditor.prototype as any)[propName] = function (this: CustomEditor, ...args: any[]) {
          let result;

          if (!AbstractMethods.includes(propName)) {
            result = baseMethod.call(this, ...args); // call super
          }

          if (MethodsMap[propName] && hooksRef.current?.[MethodsMap[propName]!]) {
            result = (hooksRef.current[MethodsMap[propName]!] as any).call(this, ...args);
          }

          return result;
        }.bind(this);
      });
    }

    focus() {
    }

    getValue() {
      return this.value;
    }

    setValue(newValue: any) {
      this.value = newValue;
    }

    open() {
    }

    close() {
    }
  }
}

interface EditorContextType {
  hooksRef: React.Ref<HotEditorHooks>
  hotCustomEditorInstanceRef: React.RefObject<Handsontable.editors.BaseEditor>
}

/**
 * Context to provide Handsontable-native custom editor class instance to overridden hooks object.
 */
const EditorContext = React.createContext<EditorContextType | undefined>(undefined);

interface EditorContextProviderProps {
  hooksRef: React.Ref<HotEditorHooks>
  hotCustomEditorInstanceRef: React.RefObject<Handsontable.editors.BaseEditor>
  children: React.ReactNode
}

/**
 * Provider of the context that exposes Handsontable-native editor instance and passes hooks object
 * for custom editor components.
 *
 * @param {React.Ref} hooksRef Reference for component-based editor overridden hooks object.
 * @param {React.RefObject} hotCustomEditorInstanceRef  Reference to Handsontable-native editor instance.
 */
export const EditorContextProvider: React.FC<EditorContextProviderProps> = ({ hooksRef, hotCustomEditorInstanceRef, children }) => {
  return <EditorContext.Provider value={{ hooksRef, hotCustomEditorInstanceRef }}>
    {children}
  </EditorContext.Provider>
}

/**
 * Hook that allows encapsulating custom behaviours of component-based editor by customizing passed ref with overridden hooks object.
 *
 * @param {HotEditorHooks} overriddenHooks Overrides specific for the custom editor.
 * @param {React.DependencyList} deps Overridden hooks object React dependency list.
 * @returns {UseHotEditorImpl} Editor API methods
 */
export function useHotEditor(overriddenHooks?: HotEditorHooks, deps?: React.DependencyList): UseHotEditorImpl {
  const { hooksRef, hotCustomEditorInstanceRef } = React.useContext(EditorContext)!;
  const [rerenderTrigger, setRerenderTrigger] = React.useState(0);

  React.useImperativeHandle(hooksRef, () => ({
    ...overriddenHooks,
    onOpen() {
      overriddenHooks?.onOpen?.();
      setRerenderTrigger((t) => t + 1);
    },
  }), deps);

  return React.useMemo(() => ({
    get value() {
      return hotCustomEditorInstanceRef.current?.getValue();
    },
    setValue(newValue) {
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
    }
  }), [rerenderTrigger, hotCustomEditorInstanceRef]);
}

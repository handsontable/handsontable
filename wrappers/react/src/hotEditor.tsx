import React from 'react';
import Handsontable from 'handsontable/base';
import { HotEditorHooks } from './types';
import { superBound } from "./helpers";

/**
 * Create a class to be passed to the Handsontable's settings.
 *
 * @param {React.RefObject<HotEditorHooks>} hooksRef Reference to component-based editor overridden hooks object.
 * @param {React.RefObject} instanceRef Reference to Handsontable-native custom editor class instance.
 * @returns {Function} A class to be passed to the Handsontable editor settings.
 */
export function makeEditorClass(hooksRef: React.MutableRefObject<HotEditorHooks>, instanceRef: React.MutableRefObject<Handsontable.editors.BaseEditor>): typeof Handsontable.editors.BaseEditor {
  return class CustomEditor extends Handsontable.editors.BaseEditor implements Handsontable.editors.BaseEditor {
    constructor(hotInstance: Handsontable.Core) {
      super(hotInstance);
      instanceRef.current = this;

      Object.getOwnPropertyNames(Handsontable.editors.BaseEditor.prototype).forEach(propName => {
        if (propName === 'constructor') {
          return;
        }

        const baseMethod = Handsontable.editors.BaseEditor.prototype[propName];
        CustomEditor.prototype[propName] = function (...args) {
          if (hooksRef.current?.[propName]) {
            return hooksRef.current[propName].call(this, ...args);
          } else {
            return baseMethod.call(this, ...args);
          }
        }.bind(this);
      });
    }

    focus() {
    }

    getValue() {
    }

    setValue() {
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
 * @param {Function} overriddenHooks Function that provides the overrides specific for the custom editor.
 *  It gets an object that emulates super calls to BaseEditor methods, if needed.
 * @param {React.DependencyList} deps Overridden hooks object React dependency list.
 * @returns {React.RefObject} Reference to Handsontable-native editor instance.
 */
export function useHotEditor(overriddenHooks?: (runSuper: () => Handsontable.editors.BaseEditor) => HotEditorHooks, deps?: React.DependencyList): React.RefObject<Handsontable.editors.BaseEditor> {
  const { hooksRef, hotCustomEditorInstanceRef } = React.useContext(EditorContext);
  const runSuper = () => superBound(hotCustomEditorInstanceRef.current);
  React.useImperativeHandle(hooksRef, () => overriddenHooks?.(runSuper) || {}, deps);
  return hotCustomEditorInstanceRef;
}

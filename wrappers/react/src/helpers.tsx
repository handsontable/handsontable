import React from 'react';
import ReactDOM from 'react-dom';
import { HotEditorElement } from './types';

let bulkComponentContainer = null;

/**
 * Warning message for the `autoRowSize`/`autoColumnSize` compatibility check.
 */
export const AUTOSIZE_WARNING = 'Your `HotTable` configuration includes `autoRowSize`/`autoColumnSize` options, which are not compatible with ' +
  ' the component-based renderers`. Disable `autoRowSize` and `autoColumnSize` to prevent row and column misalignment.';

/**
 * Message for the warning thrown if the Handsontable instance has been destroyed.
 */
export const HOT_DESTROYED_WARNING = 'The Handsontable instance bound to this component was destroyed and cannot be' +
  ' used properly.';

/**
 * Default classname given to the wrapper container.
 */
const DEFAULT_CLASSNAME = 'hot-wrapper-editor-container';

/**
 * Logs warn to the console if the `console` object is exposed.
 *
 * @param {...*} args Values which will be logged.
 */
export function warn(...args) {
  if (typeof console !== 'undefined') {
    console.warn(...args);
  }
}

/**
 * Filter out and return elements of the provided `type` from the `HotColumn` component's children.
 *
 * @param {React.ReactNode} children HotTable children array.
 * @param {String} type Either `'hot-renderer'` or `'hot-editor'`.
 * @returns {Object|null} A child (React node) or `null`, if no child of that type was found.
 */
export function getChildElementByType(children: React.ReactNode, type: string): React.ReactElement | null {
  const childrenArray: React.ReactNode[] = React.Children.toArray(children);
  const childrenCount: number = React.Children.count(children);
  let wantedChild: React.ReactNode | null = null;

  if (childrenCount !== 0) {
    if (childrenCount === 1 && (childrenArray[0] as React.ReactElement).props[type]) {
      wantedChild = childrenArray[0];

    } else {
      wantedChild = childrenArray.find((child) => {
        return (child as React.ReactElement).props[type] !== void 0;
      });
    }
  }

  return (wantedChild as React.ReactElement) || null;
}

/**
 * Get the reference to the original editor class.
 *
 * @param {React.ReactElement} editorElement React element of the editor class.
 * @returns {Function} Original class of the editor component.
 */
export function getOriginalEditorClass(editorElement: HotEditorElement) {
  if (!editorElement) {
    return null;
  }

  return editorElement.type.WrappedComponent ? editorElement.type.WrappedComponent : editorElement.type;
}

/**
 * Remove editor containers from DOM.
 *
 * @param {Document} [doc] Document to be used.
 * @param {Map} editorCache The editor cache reference.
 */
export function removeEditorContainers(doc = document): void {
  doc.querySelectorAll(`[class^="${DEFAULT_CLASSNAME}"]`).forEach((domNode) => {
    if (domNode.parentNode) {
      domNode.parentNode.removeChild(domNode);
    }
  });
}

/**
 * Create an editor portal.
 *
 * @param {Document} [doc] Document to be used.
 * @param {React.ReactElement} editorElement Editor's element.
 * @param {Map} editorCache The editor cache reference.
 * @returns {React.ReactPortal} The portal for the editor.
 */
export function createEditorPortal(doc = document, editorElement: HotEditorElement, editorCache: Map<Function, React.Component>): React.ReactPortal {
  if (editorElement === null) {
    return;
  }

  const editorContainer = doc.createElement('DIV');
  const {id, className, style} = getContainerAttributesProps(editorElement.props, false);

  if (id) {
    editorContainer.id = id;
  }

  editorContainer.className = [DEFAULT_CLASSNAME, className].join(' ');

  if (style) {
    Object.assign(editorContainer.style, style);
  }

  doc.body.appendChild(editorContainer);

  return ReactDOM.createPortal(editorElement, editorContainer);
}

/**
 * Get an editor element extended with a instance-emitting method.
 *
 * @param {React.ReactNode} children Component children.
 * @param {Map} editorCache Component's editor cache.
 * @returns {React.ReactElement} An editor element containing the additional methods.
 */
export function getExtendedEditorElement(children: React.ReactNode, editorCache: Map<Function, object>): React.ReactElement | null {
  const editorElement = getChildElementByType(children, 'hot-editor');
  const editorClass = getOriginalEditorClass(editorElement);

  if (!editorElement) {
    return null;
  }

  return React.cloneElement(editorElement, {
    emitEditorInstance: (editorInstance) => {
      editorCache.set(editorClass, editorInstance);
    },
    isEditor: true
  } as object);
}

/**
 * Create a react component and render it to an external DOM done.
 *
 * @param {React.ReactElement} rElement React element to be used as a base for the component.
 * @param {Object} props Props to be passed to the cloned element.
 * @param {Function} callback Callback to be called after the component has been mounted.
 * @param {Document} [ownerDocument] The owner document to set the portal up into.
 * @returns {{portal: React.ReactPortal, portalContainer: HTMLElement}} An object containing the portal and its container.
 */
export function createPortal(rElement: React.ReactElement, props, callback: Function, ownerDocument: Document = document): {
  portal: React.ReactPortal,
  portalContainer: HTMLElement
} {
  if (!ownerDocument) {
    ownerDocument = document;
  }

  if (!bulkComponentContainer) {
    bulkComponentContainer = ownerDocument.createDocumentFragment();
  }

  const portalContainer = ownerDocument.createElement('DIV');
  bulkComponentContainer.appendChild(portalContainer);

  const extendedRendererElement = React.cloneElement(rElement, {
    key: `${props.row}-${props.col}`,
    ...props
  });

  return {
    portal: ReactDOM.createPortal(extendedRendererElement, portalContainer, `${props.row}-${props.col}-${Math.random()}`),
    portalContainer
  };
}

/**
 * Get an object containing the `id`, `className` and `style` keys, representing the corresponding props passed to the
 * component.
 *
 * @param {Object} props Object containing the react element props.
 * @param {Boolean} randomizeId If set to `true`, the function will randomize the `id` property when no `id` was present in the `prop` object.
 * @returns An object containing the `id`, `className` and `style` keys, representing the corresponding props passed to the
 * component.
 */
export function getContainerAttributesProps(props, randomizeId: boolean = true): {id: string, className: string, style: object} {
  return {
    id: props.id || (randomizeId ? 'hot-' + Math.random().toString(36).substring(5) : void 0),
    className: props.className || '',
    style: props.style || {},
  }
}

/**
 * Add the `UNSAFE_` prefixes to the deprecated lifecycle methods for React >= 16.3.
 *
 * @param {Object} instance Instance to have the methods renamed.
 */
export function addUnsafePrefixes(instance: {
  UNSAFE_componentWillUpdate?: Function,
  componentWillUpdate: Function,
  UNSAFE_componentWillMount?: Function,
  componentWillMount: Function
}): void {
  const reactSemverArray = React.version.split('.').map((v) => parseInt(v));
  const shouldPrefix = reactSemverArray[0] >= 16 && reactSemverArray[1] >= 3;

  if (shouldPrefix) {
    instance.UNSAFE_componentWillUpdate = instance.componentWillUpdate;
    instance.componentWillUpdate = void 0;

    instance.UNSAFE_componentWillMount = instance.componentWillMount;
    instance.componentWillMount = void 0;
  }
}

import React from 'react';
import ReactDOM from 'react-dom';
import { HotTableProps } from './types';

let bulkComponentContainer = null;

/**
 * Warning message for the `autoRowSize`/`autoColumnSize` compatibility check.
 */
export const AUTOSIZE_WARNING = 'Your `HotTable` configuration includes `autoRowSize`/`autoColumnSize` options, which are not compatible with ' +
  ' the component-based renderers`. Disable `autoRowSize` and `autoColumnSize` to prevent row and column misalignment.';

/**
 * Warning message for the `hot-renderer` obsolete renderer passing method.
 */
export const OBSOLETE_HOTRENDERER_WARNING = 'Providing a component-based renderer using `hot-renderer`-annotated component is no longer supported. ' +
  'Pass your component using `renderer` prop of the `HotTable` or `HotColumn` component instead.';

/**
 * Warning message for the `hot-editor` obsolete editor passing method.
 */
export const OBSOLETE_HOTEDITOR_WARNING = 'Providing a component-based editor using `hot-editor`-annotated component is no longer supported. ' +
  'Pass your component using `editor` prop of the `HotTable` or `HotColumn` component instead.';

/**
 * Message for the warning thrown if the Handsontable instance has been destroyed.
 */
export const HOT_DESTROYED_WARNING = 'The Handsontable instance bound to this component was destroyed and cannot be' +
  ' used properly.';

/**
 * Default classname given to the wrapper container.
 */
export const DEFAULT_CLASSNAME = 'hot-wrapper-editor-container';

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
 * Detect if `hot-renderer` or `hot-editor` is defined, and if so, throw an incompatibility warning.
 */
export function displayObsoleteRenderersEditorsWarning(children: React.ReactNode): void {
  if (hasChildElementOfType(children, 'hot-renderer')) {
    warn(OBSOLETE_HOTRENDERER_WARNING);
  }
  if (hasChildElementOfType(children, 'hot-editor')) {
    warn(OBSOLETE_HOTEDITOR_WARNING);
  }
}

/**
 * Check the existence of elements of the provided `type` from the `HotColumn` component's children.
 *
 * @param {React.ReactNode} children HotTable children array.
 * @param {String} type Either `'hot-renderer'` or `'hot-editor'`.
 * @returns {boolean} `true` if the child of that type was found, `false` otherwise.
 */
function hasChildElementOfType(children: React.ReactNode, type: 'hot-renderer' | 'hot-editor'): boolean {
  const childrenArray: React.ReactNode[] = React.Children.toArray(children);

  return childrenArray.some((child) => {
      return (child as React.ReactElement).props[type] !== void 0;
  });
}

/**
 * Create an editor portal.
 *
 * @param {Document} doc Document to be used.
 * @param {React.ComponentType} Editor Editor component or render function.
 * @returns {React.ReactPortal} The portal for the editor.
 */
export function createEditorPortal(doc: Document, Editor: HotTableProps['editor'] | undefined): React.ReactPortal | null {
  if (typeof doc === 'undefined' || !Editor) {
    return null;
  }

  const editorElement = <Editor />;
  const containerProps = getContainerAttributesProps(editorElement.props, false);

  containerProps.className = `${DEFAULT_CLASSNAME} ${containerProps.className}`;

  return ReactDOM.createPortal(
    <div {...containerProps}>
      {editorElement}
    </div>
    , doc.body);
}

/**
 * Render a cell component to an external DOM node.
 *
 * @param {React.ReactElement} rElement React element to be used as a base for the component.
 * @param {Document} [ownerDocument] The owner document to set the portal up into.
 * @param {String} portalKey The key to be used for the portal.
 * @param {HTMLElement} [cachedContainer] The cached container to be used for the portal.
 * @returns {{portal: React.ReactPortal, portalContainer: HTMLElement}} An object containing the portal and its container.
 */
export function createPortal(rElement: React.ReactElement, ownerDocument: Document = document, portalKey: string, cachedContainer?: HTMLElement): {
  portal: React.ReactPortal,
  portalContainer: HTMLElement,
} {
  if (!ownerDocument) {
    ownerDocument = document;
  }

  if (!bulkComponentContainer) {
    bulkComponentContainer = ownerDocument.createDocumentFragment();
  }

  const portalContainer = cachedContainer ?? ownerDocument.createElement('DIV');
  bulkComponentContainer.appendChild(portalContainer);

  return {
    portal: ReactDOM.createPortal(rElement, portalContainer, portalKey),
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
    id: props.id || (randomizeId ? 'hot-' + Math.random().toString(36).substring(5) : undefined),
    className: props.className || '',
    style: props.style || {},
  };
}

/**
 * Checks if the environment that the code runs in is a browser.
 *
 * @returns {boolean}
 */
export function isCSR(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Creates a copy of the class instance that is still bound to this but allows calling its super (prototype) methods.
 *
 * @param {T} that An instance to look for prototype methods.
 * @returns {T} Copy of the instance with super methods access.
 */
export function superBound<T>(that: T): T {
  const proto = Object.getPrototypeOf(Object.getPrototypeOf(that));
  const superBoundObj = {} as T;

  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (typeof proto[key] === 'function') {
      superBoundObj[key] = proto[key].bind(that);
    } else {
      superBoundObj[key] = proto[key];
    }
  })

  return superBoundObj;
}

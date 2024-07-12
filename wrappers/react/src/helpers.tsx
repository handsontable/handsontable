import React from 'react';
import ReactDOM from 'react-dom';
import {
  EditorScopeIdentifier,
  HotEditorCache,
  HotEditorElement
} from './types';

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
 * String identifier for the global-scoped editor components.
 */
export const GLOBAL_EDITOR_SCOPE = 'global';

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
 * Create an editor portal.
 *
 * @param {Document} doc Document to be used.
 * @param {React.ReactElement} editorElement Editor's element.
 * @returns {React.ReactPortal} The portal for the editor.
 */
export function createEditorPortal(doc: Document, editorElement: HotEditorElement): React.ReactPortal | null {
  if (typeof doc === 'undefined' || editorElement === null) {
    return null;
  }

  const containerProps = getContainerAttributesProps(editorElement.props, false);

  containerProps.className = `${DEFAULT_CLASSNAME} ${containerProps.className}`;

  return ReactDOM.createPortal(
    <div {...containerProps}>
      {editorElement}
    </div>
    , doc.body);
}

/**
 * Get an editor element extended with an instance-emitting method.
 *
 * @param {React.ReactNode} children Component children.
 * @param {Map} editorCache Component's editor cache.
 * @param {EditorScopeIdentifier} [editorColumnScope] The editor scope (column index or a 'global' string). Defaults to
 * 'global'.
 * @returns {React.ReactElement} An editor element containing the additional methods.
 */
export function getExtendedEditorElement(children: React.ReactNode, editorCache: HotEditorCache, editorColumnScope: EditorScopeIdentifier = GLOBAL_EDITOR_SCOPE): React.ReactElement | null {
  const editorElement = getChildElementByType(children, 'hot-editor');
  const editorClass = getOriginalEditorClass(editorElement);

  if (!editorElement) {
    return null;
  }

  return React.cloneElement(editorElement, {
    emitEditorInstance: (editorInstance, editorColumnScope) => {
      if (!editorCache.get(editorClass)) {
        editorCache.set(editorClass, new Map());
      }

      const cacheEntry = editorCache.get(editorClass);

      cacheEntry.set(editorColumnScope ?? GLOBAL_EDITOR_SCOPE, editorInstance);
    },
    editorColumnScope,
    isEditor: true
  } as object);
}

/**
 * Create a react component and render it to an external DOM done.
 *
 * @param {React.ReactElement} rElement React element to be used as a base for the component.
 * @param {Object} props Props to be passed to the cloned element.
 * @param {Document} [ownerDocument] The owner document to set the portal up into.
 * @param {String} portalKey The key to be used for the portal.
 * @param {HTMLElement} [cachedContainer] The cached container to be used for the portal.
 * @returns {{portal: React.ReactPortal, portalContainer: HTMLElement}} An object containing the portal and its container.
 */
export function createPortal(rElement: React.ReactElement, props, ownerDocument: Document = document, portalKey: string, cachedContainer?: HTMLElement): {
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

  const extendedRendererElement = React.cloneElement(rElement, {
    key: `${props.row}-${props.col}`,
    ...props
  });

  return {
    portal: ReactDOM.createPortal(extendedRendererElement, portalContainer, portalKey),
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

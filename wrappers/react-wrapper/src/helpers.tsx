import React, {
  ComponentType,
  CSSProperties,
  DependencyList,
  EffectCallback,
  ReactNode,
  ReactPortal,
  useEffect,
} from 'react';
import ReactDOM from 'react-dom';
import { HotTableProps } from './types';

let bulkComponentContainer: DocumentFragment | null = null;

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
 * Warning message for the unexpected children of HotTable component.
 */
export const UNEXPECTED_HOTTABLE_CHILDREN_WARNING = 'Unexpected children nodes found in HotTable component. ' +
    'Only HotColumn components are allowed.';

/**
 * Warning message for the unexpected children of HotColumn component.
 */
export const UNEXPECTED_HOTCOLUMN_CHILDREN_WARNING = 'Unexpected children nodes found in HotColumn component. ' +
    'HotColumn components do not support any children.';

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
export function warn(...args: any[]) {
  if (typeof console !== 'undefined') {
    console.warn(...args);
  }
}

/**
 * Detect if `hot-renderer` or `hot-editor` is defined, and if so, throw an incompatibility warning.
 *
 * @returns {boolean} 'true' if the warning was issued
 */
export function displayObsoleteRenderersEditorsWarning(children: ReactNode): boolean {
  if (hasChildElementOfType(children, 'hot-renderer')) {
    warn(OBSOLETE_HOTRENDERER_WARNING);
    return true;
  }
  if (hasChildElementOfType(children, 'hot-editor')) {
    warn(OBSOLETE_HOTEDITOR_WARNING);
    return true;
  }

  return false
}

/**
 * Detect if children of specified type are defined, and if so, throw an incompatibility warning.
 *
 * @param {ReactNode} children Component children nodes
 * @param {ComponentType} Component Component type to check
 * @returns {boolean} 'true' if the warning was issued
 */
export function displayChildrenOfTypeWarning(children: ReactNode, Component: ComponentType): boolean {
  const childrenArray: ReactNode[] = React.Children.toArray(children);

  if (childrenArray.some((child) => (child as React.ReactElement).type !== Component)) {
    warn(UNEXPECTED_HOTTABLE_CHILDREN_WARNING);
    return true;
  }

  return false
}

/**
 * Detect if children is defined, and if so, throw an incompatibility warning.
 *
 * @param {ReactNode} children Component children nodes
 * @returns {boolean} 'true' if the warning was issued
 */
export function displayAnyChildrenWarning(children: ReactNode): boolean {
  const childrenArray: ReactNode[] = React.Children.toArray(children);

  if (childrenArray.length) {
    warn(UNEXPECTED_HOTCOLUMN_CHILDREN_WARNING);
    return true;
  }

  return false
}

/**
 * Check the existence of elements of the provided `type` from the `HotColumn` component's children.
 *
 * @param {ReactNode} children HotTable children array.
 * @param {String} type Either `'hot-renderer'` or `'hot-editor'`.
 * @returns {boolean} `true` if the child of that type was found, `false` otherwise.
 */
function hasChildElementOfType(children: ReactNode, type: 'hot-renderer' | 'hot-editor'): boolean {
  const childrenArray: ReactNode[] = React.Children.toArray(children);

  return childrenArray.some((child) => {
      return (child as React.ReactElement).props[type] !== void 0;
  });
}

/**
 * Create an editor portal.
 *
 * @param {Document} doc Document to be used.
 * @param {ComponentType} Editor Editor component or render function.
 * @returns {ReactPortal} The portal for the editor.
 */
export function createEditorPortal(doc: Document | null, Editor: HotTableProps['editor'] | undefined): ReactPortal | null {
  if (!doc || !Editor) {
    return null;
  }

  const editorElement = <Editor />;
  const containerProps = getContainerAttributesProps({}, false);

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
 * @returns {{portal: ReactPortal, portalContainer: HTMLElement}} An object containing the portal and its container.
 */
export function createPortal(rElement: React.ReactElement, ownerDocument: Document | null = document, portalKey: string, cachedContainer?: HTMLElement): {
  portal: ReactPortal,
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
 * @param {HotTableProps} props Object containing the React element props.
 * @param {Boolean} randomizeId If set to `true`, the function will randomize the `id` property when no `id` was present in the `prop` object.
 * @returns An object containing the `id`, `className` and `style` keys, representing the corresponding props passed to the
 * component.
 */
export function getContainerAttributesProps(props: HotTableProps, randomizeId: boolean = true): {id?: string, className: string, style: CSSProperties} {
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
 * A variant of useEffect hook that does not trigger on initial mount, only updates
 *
 * @param effect Effect function
 * @param deps Effect dependencies
 */
export function useUpdateEffect(effect: EffectCallback, deps?: DependencyList): void {
  const notInitialRender = React.useRef(false);

  useEffect(() => {
    if (notInitialRender.current) {
      return effect();
    } else {
      notInitialRender.current = true;
    }
  }, deps);
}

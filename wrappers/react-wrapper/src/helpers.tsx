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
import Handsontable from 'handsontable/base';
import { getEditor } from 'handsontable/editors/registry';
import { HotRendererProps, HotTableProps } from './types';

let bulkComponentContainer: DocumentFragment | null = null;

/**
 * Warning message for the `autoRowSize`/`autoColumnSize` compatibility check.
 */
export const AUTOSIZE_WARNING = 'Your `HotTable` configuration includes `autoRowSize`/`autoColumnSize` options, ' +
  'which are not compatible with the component-based renderers. Disable `autoRowSize` and `autoColumnSize` to ' +
  'prevent row and column misalignment.';

/**
 * Warning message for the `hot-renderer` obsolete renderer passing method.
 */
export const OBSOLETE_HOTRENDERER_WARNING = 'Providing a component-based renderer using `hot-renderer`-annotated ' +
  'component is no longer supported. Pass your component using `renderer` prop of the `HotTable` or `HotColumn` ' +
  'component instead.';

/**
 * Warning message for the `hot-editor` obsolete editor passing method.
 */
export const OBSOLETE_HOTEDITOR_WARNING = 'Providing a component-based editor using `hot-editor`-annotated ' +
  'component is no longer supported. Pass your component using `editor` prop of the `HotTable` or `HotColumn` ' +
  'component instead.';

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
 * Warning when a Handsontable function renderer is passed to the React `renderer` prop.
 *
 * That prop is a React component. A classic function renderer belongs on `hotRenderer`.
 */
export const CLASSIC_FUNCTION_RENDERER_WARNING = 'The `renderer` prop expects a React component. ' +
  'Pass a Handsontable function renderer to `hotRenderer` instead.';

/**
 * Warning when a Handsontable editor (an editor class or a registered editor name) is passed to the
 * React `editor` prop.
 *
 * That prop is a React component. A Handsontable editor belongs on `hotEditor`.
 */
export const NATIVE_EDITOR_IN_EDITOR_PROP_WARNING = 'The `editor` prop expects a React component. ' +
  'Pass a Handsontable editor class or editor name to `hotEditor` instead.';

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
 * Classname for the stable host that holds React editor portals.
 * Distinct from `DEFAULT_CLASSNAME` so page CSS and `querySelector` do not hit both nodes.
 */
export const EDITOR_PORTAL_HOST_CLASSNAME = 'hot-wrapper-editor-portal-host';

/**
 * Warning when the editor portal host cannot be moved into `rootPortalElement`.
 */
export const MISSING_ROOT_PORTAL_WARNING = 'The React editor portal host could not be attached to ' +
  '`rootPortalElement`. The editor stays on `document.body` and clicks on it may fail to commit.';

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
 * Function renderers that already produced `CLASSIC_FUNCTION_RENDERER_WARNING`.
 * Keyed by the function, so one function warns once no matter how many cells render it.
 */
const warnedClassicFunctionRenderers = new WeakSet<object>();

/**
 * Warn when `renderer` holds a Handsontable function renderer.
 *
 * A React component is called with one props object, so its `length` stays below 3.
 * A classic renderer declares `(instance, td, row, col, prop, value, cellProperties)`,
 * so its `length` is at least 3. The prop is still rendered as a component. Picking
 * the call style from `length` would change behavior, because a component with default
 * parameters reports `length` 0.
 *
 * @param {ComponentType} renderer Component passed through the `renderer` prop.
 */
export function warnAboutClassicFunctionRenderer(renderer: ComponentType<HotRendererProps>): void {
  if (typeof renderer !== 'function' || renderer.length < 3) {
    return;
  }

  if (warnedClassicFunctionRenderers.has(renderer)) {
    return;
  }

  warnedClassicFunctionRenderers.add(renderer);
  warn(CLASSIC_FUNCTION_RENDERER_WARNING);
}

/**
 * Detect if `hot-renderer` or `hot-editor` is defined, and if so, throw an incompatibility warning.
 *
 * @param {ReactNode} children Component children nodes.
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

  return false;
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

  if (childrenArray.some(child => (child as React.ReactElement).type !== Component)) {
    warn(UNEXPECTED_HOTTABLE_CHILDREN_WARNING);

    return true;
  }

  return false;
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

  return false;
}

/**
 * Check the existence of elements of the provided `type` from the `HotColumn` component's children.
 *
 * @param {ReactNode} children HotTable children array.
 * @param {string} type Either `'hot-renderer'` or `'hot-editor'`.
 * @returns {boolean} `true` if the child of that type was found, `false` otherwise.
 */
function hasChildElementOfType(children: ReactNode, type: 'hot-renderer' | 'hot-editor'): boolean {
  const childrenArray: ReactNode[] = React.Children.toArray(children);

  return childrenArray.some((child) => {
    return (child as React.ReactElement).props[type] !== undefined;
  });
}

/**
 * Check whether the `editor` prop holds a component editor, as opposed to a boolean flag or a
 * Handsontable editor passed there by mistake.
 *
 * Both editor props accept a boolean, so a truthy check alone is not enough to tell a component
 * apart from a bare `editor={true}`. An editor class or editor name is not a component either (see
 * `isNativeEditor()`).
 *
 * @param {HotTableProps['editor']} editor The `editor` prop.
 * @returns {boolean} `true` when the prop carries a React component to render.
 */
export function isComponentEditor(editor: HotTableProps['editor']): boolean {
  return !!editor && typeof editor !== 'boolean' && !isNativeEditor(editor);
}

/**
 * Methods every Handsontable editor class inherits from `BaseEditor`.
 */
const NATIVE_EDITOR_METHODS = ['prepare', 'beginEditing', 'getValue', 'setValue', 'open', 'close'];

/**
 * Check whether a value is a Handsontable editor: a registered editor name or an editor class.
 *
 * A class is recognized by the `BaseEditor` methods on its prototype rather than with `instanceof`,
 * so a class built on another copy of Handsontable is still recognized. A React class component
 * carries `prototype.isReactComponent`, and a function component does not have these methods, so
 * neither one matches.
 *
 * @param {*} editor The value to check.
 * @returns {boolean} `true` when the value is a Handsontable editor.
 */
export function isNativeEditor(editor: unknown): boolean {
  if (typeof editor === 'string') {
    return editor !== '';
  }

  if (typeof editor !== 'function') {
    return false;
  }

  const prototype = editor.prototype;

  if (!prototype || prototype.isReactComponent) {
    return false;
  }

  return NATIVE_EDITOR_METHODS.every(method => typeof prototype[method] === 'function');
}

/**
 * Check whether an editor is registered under a name.
 *
 * It asks `getEditor()`, which throws for an unknown name, instead of `hasEditor()`: the UMD build
 * maps the editor registry to `Handsontable.editors`, which exposes `getEditor()` only.
 *
 * @param {string} name The editor name.
 * @returns {boolean} `true` when an editor is registered under the name.
 */
function isRegisteredEditorName(name: string): boolean {
  try {
    getEditor(name);

    return true;

  } catch {
    return false;
  }
}

/**
 * Editor classes that already produced `NATIVE_EDITOR_IN_EDITOR_PROP_WARNING`.
 */
const warnedNativeEditorClasses = new WeakSet<object>();

/**
 * Editor names that already produced `NATIVE_EDITOR_IN_EDITOR_PROP_WARNING`.
 */
const warnedNativeEditorNames = new Set<string>();

/**
 * Warn once per value that a Handsontable editor was passed to the `editor` prop.
 *
 * @param {Function|string} editor The editor class or editor name.
 */
function warnAboutNativeEditorInEditorProp(editor: object | string): void {
  if (typeof editor === 'string') {
    if (warnedNativeEditorNames.has(editor)) {
      return;
    }

    warnedNativeEditorNames.add(editor);

  } else {
    if (warnedNativeEditorClasses.has(editor)) {
      return;
    }

    warnedNativeEditorClasses.add(editor);
  }

  warn(NATIVE_EDITOR_IN_EDITOR_PROP_WARNING);
}

/**
 * Resolve the Handsontable `editor` setting from the two editor props.
 *
 * `editor` carries the component editor and `hotEditor` the Handsontable-native one, but both accept
 * a boolean:
 *
 * - `false` disables editing.
 * - `true` names no editor, so it is treated as if the prop were not provided. It must never reach
 *   the core, which accepts only a string or a constructor and throws on anything else.
 * - Any other nullish or falsy value (`null`, `0`, `''`) is also treated as "not provided", so a
 *   column written as `editor={cond ? MyEditor : null}` inherits instead of locking.
 *
 * `hotEditor` is resolved before a falsy `editor`, so an editor named there still wins over a bare
 * `editor={false}` — the behavior in every released version, where `editor={false}` fell through to
 * the `hotEditor` value. A component `editor` outranks both: it is picked by `isComponentEditor()`
 * before this function is reached, so `editor={MyComponent} hotEditor={false}` keeps the component.
 *
 * A Handsontable editor (a class or a registered name) passed to `editor` is a mistake: that prop
 * renders a React component. It is used as if it were passed to `hotEditor`, with a one-time
 * warning. A `hotEditor` value that names an editor or disables editing still wins over it. A name
 * that no editor is registered under is dropped after the warning, so a typo does not make the core
 * throw.
 *
 * @param {HotTableProps['editor']} editor The `editor` prop.
 * @param {HotTableProps['hotEditor']} hotEditor The `hotEditor` prop.
 * @returns {*} The editor setting, or `undefined` when neither prop names one.
 */
export function resolveEditorSetting(
  editor: HotTableProps['editor'],
  hotEditor: HotTableProps['hotEditor']
): Handsontable.GridSettings['editor'] | undefined {
  if (hotEditor === false) {
    return false;
  }

  // `true` names no editor, so it must fall through to "not provided" rather than hard-setting the
  // default one — otherwise it would override the editor a column's `type` or the grid supplies.
  if (hotEditor && hotEditor !== true) {
    return hotEditor as Handsontable.GridSettings['editor'];
  }

  if (isNativeEditor(editor)) {
    warnAboutNativeEditorInEditorProp(editor as unknown as object | string);

    // An unregistered name (a typo) would make the core throw on every selection of the cell, so
    // it is dropped and the cell keeps the editor its column type or the grid supplies.
    if (typeof editor === 'string' && !isRegisteredEditorName(editor)) {
      return undefined;
    }

    return editor as unknown as Handsontable.GridSettings['editor'];
  }

  return editor === false ? false : undefined;
}

/**
 * Create an editor portal.
 *
 * @param {Document} doc Document to be used.
 * @param {ComponentType} Editor Editor component or render function.
 * @param {HTMLElement} portalHost Host element to portal into. Required – do not fall back to `doc.body`.
 * @returns {ReactPortal} The portal for the editor.
 */
export function createEditorPortal(
  doc: Document | null,
  Editor: HotTableProps['editor'] | undefined | boolean,
  portalHost?: HTMLElement | null
): ReactPortal | null {
  if (!doc || !portalHost || !isComponentEditor(Editor)) {
    return null;
  }

  const EditorComponent = Editor as ComponentType;
  const editorElement = <EditorComponent />;
  const containerProps = getContainerAttributesProps({}, false);

  containerProps.className = `${DEFAULT_CLASSNAME} ${containerProps.className}`;

  return ReactDOM.createPortal(
    <div {...containerProps}>
      {editorElement}
    </div>,
    portalHost);
}

/**
 * Render a cell component to an external DOM node.
 *
 * @param {React.ReactElement} rElement React element to be used as a base for the component.
 * @param {Document} [ownerDocument] The owner document to set the portal up into.
 * @param {string} portalKey The key to be used for the portal.
 * @param {HTMLElement} [cachedContainer] The cached container to be used for the portal.
 * @returns {{portal: ReactPortal, portalContainer: HTMLElement}} An object containing the portal and its
 * container.
 */
export function createPortal(
  rElement: React.ReactElement,
  ownerDocument: Document | null = document,
  portalKey: string,
  cachedContainer?: HTMLElement
): {
  portal: ReactPortal,
  portalContainer: HTMLElement,
} {
  if (!ownerDocument) {
    ownerDocument = document;
  }

  let portalContainer = cachedContainer;

  // A new container needs an anchor before React mounts into it. A cached
  // container is already attached (typically inside its TD) and must be
  // left in place to avoid wiping the DOM on every grid render.
  if (!portalContainer) {
    if (!bulkComponentContainer) {
      bulkComponentContainer = ownerDocument.createDocumentFragment();
    }
    portalContainer = ownerDocument.createElement('DIV');
    bulkComponentContainer.appendChild(portalContainer);
  }

  return {
    portal: ReactDOM.createPortal(rElement, portalContainer, portalKey),
    portalContainer,
  };
}

/**
 * Get an object containing the `id`, `className` and `style` keys, representing the corresponding props passed to the
 * component.
 *
 * @param {HotTableProps} props Object containing the React element props.
 * @param {boolean} randomizeId If set to `true`, the function will randomize the `id` property when no `id` was
 * present in the `prop` object.
 * @returns {{id?: string, className: string, style: CSSProperties}} An object containing the `id`, `className`
 * and `style` keys, representing the corresponding props passed to the component.
 */
export function getContainerAttributesProps(
  props: HotTableProps,
  randomizeId = true
): { id?: string, className: string, style: CSSProperties } {
  return {
    id: props.id || (randomizeId ? `hot-${Math.random().toString(36).substring(5)}` : undefined),
    className: props.className || '',
    style: props.style || {},
  };
}

/**
 * Checks if the environment that the code runs in is a browser.
 *
 * @returns {boolean} `true` when running in a browser environment.
 */
export function isCSR(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Checks whether the value is an object or `null`.
 *
 * @param {unknown} value Value to check.
 * @returns {boolean} `true` when the value is an object.
 */
function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Checks whether the value is a plain object (an object literal or one created with `Object.create(null)`).
 *
 * @param {unknown} value Value to check.
 * @returns {boolean} `true` when the value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObjectLike(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * Checks whether the value is an array.
 *
 * @param {unknown} value Value to check.
 * @returns {boolean} `true` when the value is an array.
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Deep-compare plain objects and arrays used by wrapper settings. Functions, class instances and any
 * other value are compared by reference, and a `RegExp` by its source and flags. A pair of objects
 * already being compared higher up reads as equal, so a value with a cycle (tree rows with a `parent`
 * link) ends instead of overflowing the stack.
 *
 * @param {unknown} previousValue Previous value.
 * @param {unknown} currentValue Current value.
 * @param {WeakMap<object, WeakSet<object>>} [visited] The object pairs on the current comparison path.
 * @returns {boolean} `true` if values are equivalent.
 */
export function areEquivalentSettingsValue(
  previousValue: unknown,
  currentValue: unknown,
  visited: WeakMap<object, WeakSet<object>> = new WeakMap(),
): boolean {
  if (previousValue === currentValue) {
    return true;
  }

  if (previousValue instanceof RegExp || currentValue instanceof RegExp) {
    if (!(previousValue instanceof RegExp) || !(currentValue instanceof RegExp)) {
      return false;
    }

    return previousValue.source === currentValue.source &&
      previousValue.flags === currentValue.flags;
  }

  const bothArrays = isArray(previousValue) && isArray(currentValue);
  const bothPlainObjects = !isArray(previousValue) && !isArray(currentValue) &&
    isPlainObject(previousValue) && isPlainObject(currentValue);

  if (!bothArrays && !bothPlainObjects) {
    return false;
  }

  const previousObject = previousValue as Record<string, unknown>;
  const currentObject = currentValue as Record<string, unknown>;
  const comparedWith = visited.get(previousObject);

  if (comparedWith?.has(currentObject)) {
    return true;
  }

  if (comparedWith) {
    comparedWith.add(currentObject);
  } else {
    visited.set(previousObject, new WeakSet([currentObject]));
  }

  const previousKeys = Object.keys(previousObject);

  return previousKeys.length === Object.keys(currentObject).length &&
    previousKeys.every(key => Object.prototype.hasOwnProperty.call(currentObject, key) &&
      areEquivalentSettingsValue(previousObject[key], currentObject[key], visited));
}

/**
 * Copies the plain objects and arrays of a settings value, keeping every other value (functions, class
 * instances) by reference. The copy is what an update compares the next value with, so a value the app
 * changes in place reads as changed. A value with a cycle is copied with the same cycle.
 *
 * @param {unknown} value The value to copy.
 * @param {WeakMap<object, unknown>} [copies] The copies made so far, by original.
 * @returns {unknown} The copy.
 */
export function copySettingsValue(value: unknown, copies: WeakMap<object, unknown> = new WeakMap()): unknown {
  if (!isArray(value) && !isPlainObject(value)) {
    return value;
  }

  if (copies.has(value)) {
    return copies.get(value);
  }

  if (isArray(value)) {
    const copy: unknown[] = [];

    copies.set(value, copy);
    value.forEach((item) => {
      copy.push(copySettingsValue(item, copies));
    });

    return copy;
  }

  const copy: Record<string, unknown> = {};

  copies.set(value, copy);
  Object.keys(value).forEach((key) => {
    copy[key] = copySettingsValue(value[key], copies);
  });

  return copy;
}

/**
 * A variant of useEffect hook that does not trigger on initial mount, only updates
 *
 * @param {EffectCallback} effect Effect function
 * @param {DependencyList} [deps] Effect dependencies
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

/**
 * The class of the wrapper the grid puts around a cell's content in a row rendered at an exact height.
 */
const CELL_CLIP_CLASS = 'htCellClip';

/**
 * Returns the element a cell's content belongs in: the grid's clipping wrapper when the cell holds
 * exactly that wrapper, and the cell itself otherwise.
 *
 * @param {HTMLElement} TD The table cell.
 * @returns {Element}
 */
export function getCellContentRoot(TD: HTMLElement): Element {
  const firstChild = TD.firstElementChild;

  if (firstChild !== null && TD.childNodes.length === 1 && firstChild.classList.contains(CELL_CLIP_CLASS)) {
    return firstChild;
  }

  return TD;
}

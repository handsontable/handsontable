import { addClass, removeClass, setAttribute, removeAttribute } from '../../../../helpers/dom/element';

export type SelectionAttribute = [string, string | number | boolean];

/**
 * What the selection pass wrote on one element: the class names and the attributes, encoded as one
 * string so two passes can be compared with a single equality check.
 *
 * The store is keyed by the element, so it follows the reused TD/TH nodes for free. The cell and
 * header renderers call `clearAppliedSelection` whenever they wipe an element, which turns a
 * repainted element into "nothing applied" and makes the next pass write it again.
 */
const appliedSignatures = new WeakMap<HTMLElement, string>();

const CLASS_ATTRIBUTE_SEPARATOR = '|';
const LIST_SEPARATOR = ' ';
const ATTRIBUTE_VALUE_SEPARATOR = '=';

/**
 * Builds the signature of a class name list and an attribute list.
 *
 * @param {string[]} classNames The class names the pass wants on the element.
 * @param {Array<[string, string|number|boolean]>} attributes The attributes the pass wants on the element.
 * @returns {string}
 */
export function buildSelectionSignature(classNames: string[], attributes: SelectionAttribute[]): string {
  const attributesPart = attributes
    .map(([name, value]) => `${name}${ATTRIBUTE_VALUE_SEPARATOR}${String(value)}`)
    .join(LIST_SEPARATOR);

  return `${classNames.join(LIST_SEPARATOR)}${CLASS_ATTRIBUTE_SEPARATOR}${attributesPart}`;
}

/**
 * Expands the per-class occurrence counts a layered selection produced into the class name list:
 * one occurrence is the class itself, each further occurrence adds `<className>-<n>`.
 *
 * @param {Map<string, number>} classNamesLayers The class name → occurrence count map.
 * @returns {string[]}
 */
export function expandLayeredClassNames(classNamesLayers: Map<string, number>): string[] {
  const classNames: string[] = [];

  classNamesLayers.forEach((occurrences, className) => {
    classNames.push(className);

    for (let layer = 1; layer < occurrences; layer++) {
      classNames.push(`${className}-${layer}`);
    }
  });

  return classNames;
}

/**
 * Returns the signature the selection pass last applied to the element, or `undefined` when the
 * element carries nothing (never selected, or wiped by a renderer since).
 *
 * @param {HTMLElement} element The cell or header element.
 * @returns {string|undefined}
 */
export function getAppliedSelection(element: HTMLElement): string | undefined {
  return appliedSignatures.get(element);
}

/**
 * Writes the classes and attributes on the element and records their signature.
 *
 * @param {HTMLElement} element The cell or header element.
 * @param {string[]} classNames The class names to add.
 * @param {Array<[string, string|number|boolean]>} attributes The attributes to set.
 * @param {string} signature The signature built from the same class names and attributes.
 */
export function applySelection(
  element: HTMLElement,
  classNames: string[],
  attributes: SelectionAttribute[],
  signature: string,
): void {
  addClass(element, classNames);

  if (attributes.length > 0) {
    setAttribute(element, attributes);
  }

  appliedSignatures.set(element, signature);
}

/**
 * Removes the classes and attributes recorded in the element's signature and forgets it. A no-op
 * for an element that carries nothing.
 *
 * @param {HTMLElement} element The cell or header element.
 */
export function removeAppliedSelection(element: HTMLElement): void {
  const signature = appliedSignatures.get(element);

  if (signature === undefined) {
    return;
  }

  const [classesPart, attributesPart] = signature.split(CLASS_ATTRIBUTE_SEPARATOR);

  if (classesPart) {
    removeClass(element, classesPart.split(LIST_SEPARATOR));
  }

  if (attributesPart) {
    removeAttribute(element, attributesPart
      .split(LIST_SEPARATOR)
      .map(attribute => attribute.split(ATTRIBUTE_VALUE_SEPARATOR)[0]));
  }

  appliedSignatures.delete(element);
}

/**
 * Forgets what the selection pass applied to the element without touching the DOM. The renderers
 * call it right after they reset an element's classes and attributes, so the record matches the
 * (now empty) element again.
 *
 * @param {HTMLElement} element The cell or header element that was just wiped.
 */
export function clearAppliedSelection(element: HTMLElement): void {
  appliedSignatures.delete(element);
}

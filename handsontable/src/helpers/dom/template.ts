/**
 * Declarative DOM templates.
 *
 * These replace the `html` tagged template literal, which parsed an HTML string by
 * assigning it to `template.innerHTML`. That is a Trusted Types sink, so every UI built
 * through it - the pagination bar, dialogs, the empty data state, the license branding -
 * threw under `require-trusted-types-for 'script'`, and no amount of care at the call
 * sites could change that. Building the nodes instead touches no sink at all, and behaves
 * identically on browsers that do not implement Trusted Types.
 *
 * The structures these templates describe were always data: a tag, a class, a few fixed
 * attributes, and a `data-ref` name, with every piece of content filled in later through
 * the refs. Writing that data as an object rather than as a string to be parsed also makes
 * it type-checked, which an HTML string never was.
 */

/**
 * One element in a template tree.
 */
export interface TemplateSpec {
  /**
   * The tag name to create.
   */
  tag: string;
  /**
   * Collects the created element into the returned `refs` under this name. Mirrors the
   * `data-ref` attribute the string templates used, except that nothing is written to the
   * DOM and then deleted again.
   */
  ref?: string;
  /**
   * The element's class attribute.
   */
  className?: string;
  /**
   * Attributes to set. Values are set through `setAttribute`, which cannot escape the
   * attribute it is setting - unlike interpolating a value into a quoted attribute inside
   * an HTML string, which a quote in the value breaks out of.
   */
  attrs?: Record<string, string | number>;
  /**
   * Text content. Set through `textContent`, so markup in the value is shown, never parsed.
   */
  text?: string;
  /**
   * Child elements. Falsy entries are skipped, so a conditional child can be written
   * inline as `condition && spec` without the caller filtering first.
   */
  children?: (TemplateSpec | null | false | undefined)[];
  /**
   * Namespace URI for the element, for SVG content. Inherited by descendants, so only the
   * `<svg>` root needs it. Without a namespace an `<svg>` built through `createElement` is
   * an unknown HTML element and never renders.
   */
  ns?: string;
}

/**
 * The SVG namespace, for `TemplateSpec.ns`.
 */
export const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * A built template: the fragment to insert, and the elements collected by `ref` name.
 */
export interface BuiltTemplate<R = Record<string, HTMLElement>> {
  fragment: DocumentFragment;
  refs: R;
}

/**
 * Creates one element from its spec, collecting refs as it recurses.
 *
 * @param {TemplateSpec} spec The element to create.
 * @param {Document} rootDocument The document to create the element in.
 * @param {object} refs The ref collection being filled.
 * @param {string} [inheritedNs] Namespace inherited from the parent element.
 * @returns {Element} The created element.
 */
function createElementFromSpec(
  spec: TemplateSpec, rootDocument: Document, refs: Record<string, HTMLElement>, inheritedNs?: string
): Element {
  const ns = spec.ns ?? inheritedNs;
  const element = ns ? rootDocument.createElementNS(ns, spec.tag) : rootDocument.createElement(spec.tag);

  if (spec.className !== undefined) {
    // `className` on an SVG element is a read-only `SVGAnimatedString`, so the class has to
    // go through `setAttribute` there.
    if (ns) {
      element.setAttribute('class', spec.className);
    } else {
      (element as HTMLElement).className = spec.className;
    }
  }

  if (spec.attrs) {
    Object.keys(spec.attrs).forEach((name) => {
      element.setAttribute(name, String(spec.attrs![name]));
    });
  }

  if (spec.text !== undefined) {
    element.textContent = spec.text;
  }

  spec.children?.forEach((child) => {
    if (child) {
      element.appendChild(createElementFromSpec(child, rootDocument, refs, ns));
    }
  });

  if (spec.ref !== undefined) {
    // Refs are declared on HTML elements throughout; an SVG node is decoration the callers
    // never reach for.
    refs[spec.ref] = element as HTMLElement;
  }

  return element;
}

/**
 * Builds a template into a document fragment, and collects every element that declared a
 * `ref` name.
 *
 * `rootDocument` is required rather than defaulting to the global `document`, which is
 * what the string-parsing version used. A grid hosted in an iframe would otherwise build
 * its nodes in the loading window's realm instead of its own.
 *
 * @param {TemplateSpec|TemplateSpec[]} spec The template, or several sibling templates.
 * @param {Document} rootDocument The document to build the nodes in.
 * @returns {{ fragment: DocumentFragment, refs: object }} The fragment and its refs.
 */
export function buildTemplate<R = Record<string, HTMLElement>>(
  spec: TemplateSpec | (TemplateSpec | null | false | undefined)[], rootDocument: Document
): BuiltTemplate<R> {
  const fragment = rootDocument.createDocumentFragment();
  const refs: Record<string, HTMLElement> = {};
  const roots = Array.isArray(spec) ? spec : [spec];

  roots.forEach((root) => {
    if (root) {
      fragment.appendChild(createElementFromSpec(root, rootDocument, refs));
    }
  });

  return { fragment, refs: refs as R };
}

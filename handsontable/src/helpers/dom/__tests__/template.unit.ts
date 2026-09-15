import { buildTemplate, SVG_NS, type TemplateSpec } from 'handsontable/helpers/dom/template';

describe('buildTemplate', () => {
  it('should build the element tree and collect refs by name', () => {
    const { fragment, refs } = buildTemplate({
      tag: 'div',
      ref: 'container',
      className: 'wrapper',
      attrs: { id: 'built', 'aria-label': 'click me' },
      children: [
        { tag: 'p', text: 'Counter: ' },
        { tag: 'span', ref: 'counter', text: '1' },
      ],
    }, document);

    const container = fragment.firstElementChild as HTMLElement;

    expect(container.outerHTML).toBe(
      '<div class="wrapper" id="built" aria-label="click me"><p>Counter: </p><span>1</span></div>'
    );
    expect(refs).toEqual({
      container,
      counter: container.querySelector('span'),
    });
  });

  it('should skip falsy children so a conditional child needs no filtering', () => {
    const { fragment } = buildTemplate({
      tag: 'div',
      children: [
        { tag: 'span', text: 'kept' },
        false && { tag: 'span', text: 'dropped' },
        null,
        undefined,
      ],
    }, document);

    expect((fragment.firstElementChild as HTMLElement).children.length).toBe(1);
  });

  it('should accept several sibling roots', () => {
    const { fragment, refs } = buildTemplate([
      { tag: 'span', ref: 'first', text: 'a' },
      { tag: 'span', ref: 'second', text: 'b' },
    ], document);

    expect(fragment.children.length).toBe(2);
    expect(refs.first.textContent).toBe('a');
    expect(refs.second.textContent).toBe('b');
  });

  it('should build SVG content in the SVG namespace, inherited by descendants', () => {
    const { fragment } = buildTemplate({
      tag: 'svg',
      ns: SVG_NS,
      className: 'icon',
      children: [{ tag: 'path', attrs: { d: 'M0 0' } }],
    }, document);

    const svg = fragment.firstElementChild!;

    expect(svg.namespaceURI).toBe(SVG_NS);
    expect(svg.firstElementChild!.namespaceURI).toBe(SVG_NS);
    // `className` on an SVG element is a read-only SVGAnimatedString, so it must be set as an
    // attribute — assigning the property silently does nothing.
    expect(svg.getAttribute('class')).toBe('icon');
  });

  it('should write text as text, never as markup', () => {
    const { refs } = buildTemplate({
      tag: 'div', ref: 'root', text: '<img src=x onerror=alert(1)>',
    }, document);

    expect(refs.root.children.length).toBe(0);
    expect(refs.root.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('should keep an attribute value inside its attribute', () => {
    // The string templates this replaced interpolated values into quoted attributes, where a
    // quote in the value escaped the attribute and everything after it parsed as more attributes.
    const { refs } = buildTemplate({
      tag: 'button',
      ref: 'root',
      className: 'ht-button ht-button--" onclick="alert(1)',
    }, document) as { refs: Record<string, HTMLElement> };

    expect(refs.root.getAttribute('onclick')).toBe(null);
    expect(refs.root.attributes.length).toBe(1);
  });

  it('should build the nodes in the document it is given', () => {
    const otherDocument = document.implementation.createHTMLDocument('other');
    const { refs } = buildTemplate({ tag: 'div', ref: 'root' }, otherDocument);

    expect(refs.root.ownerDocument).toBe(otherDocument);
  });
});

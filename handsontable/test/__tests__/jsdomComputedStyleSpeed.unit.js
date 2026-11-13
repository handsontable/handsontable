const { patchCssStyleDeclaration, hashSource } = require('../helpers/cssStyleDeclarationPatch');

/**
 * Pins the Jest-only `cssstyle` speed patch (see `test/jsdomComputedStyleSpeed.js`).
 */
describe('jsdom computed style speed patch', () => {
  it('should be applied to the cssstyle jsdom ships (a changed cssstyle must re-derive the patch)', () => {
    // `patchCssStyleDeclaration()` reports `false` when the prototype is already patched, so read
    // the marker instead. When this fails after a `cssstyle` upgrade, `_setProperty` has a new
    // source: re-read it, update the copy in `test/helpers/cssStyleDeclarationPatch.js` and its hash.
    expect(window.CSSStyleDeclaration.prototype._setProperty.__htFast).toBe(true);
  });

  it('should skip the cssText build for the declaration getComputedStyle fills', () => {
    // The marker above only proves the prototype is patched. If cssstyle reformats its default
    // callback, or jsdom starts passing one, the no-op match fails and every read is slow again.
    // Keep the rule longhand-only: a shorthand builds `cssText` through the unpatched `removeProperty`.
    const host = document.createElement('div');
    const style = document.createElement('style');
    const proto = window.CSSStyleDeclaration.prototype;
    const cssText = Object.getOwnPropertyDescriptor(proto, 'cssText');
    let builds = 0;

    style.textContent = '.a { color: red; visibility: hidden }';
    host.className = 'a';
    document.head.appendChild(style);
    document.body.appendChild(host);
    Object.defineProperty(proto, 'cssText', {
      ...cssText,
      get() {
        builds += 1;

        return cssText.get.call(this);
      },
    });

    try {
      expect(window.getComputedStyle(host).getPropertyValue('color')).toBe('red');
    } finally {
      Object.defineProperty(proto, 'cssText', cssText);
      host.remove();
      style.remove();
    }

    expect(builds).toBe(0);
  });

  it('should refuse to patch a `_setProperty` whose source it does not know', () => {
    function CSSStyleDeclaration() {}
    const unknown = function(name) {
      return name;
    };

    CSSStyleDeclaration.prototype._setProperty = unknown;

    expect(hashSource(unknown)).not.toBe(hashSource(window.CSSStyleDeclaration.prototype._setProperty));
    expect(patchCssStyleDeclaration(CSSStyleDeclaration)).toBe(false);
    expect(CSSStyleDeclaration.prototype._setProperty).toBe(unknown);
  });

  it('should return the same computed style as before the patch', () => {
    const host = document.createElement('div');
    const style = document.createElement('style');
    const child = document.createElement('span');

    style.textContent = '.a { color: red; margin: 1px 2px; visibility: hidden } .a .b { display: none }';
    host.className = 'a';
    child.className = 'b';
    host.appendChild(child);
    document.head.appendChild(style);
    document.body.appendChild(host);

    const hostStyle = window.getComputedStyle(host);
    const childStyle = window.getComputedStyle(child);

    expect(hostStyle.getPropertyValue('color')).toBe('red');
    expect(hostStyle.getPropertyValue('margin-top')).toBe('1px');
    expect(hostStyle.getPropertyValue('margin-left')).toBe('2px');
    expect(hostStyle.getPropertyValue('visibility')).toBe('hidden');
    expect(hostStyle.getPropertyValue('display')).toBe('block');
    expect(childStyle.getPropertyValue('display')).toBe('none');
    // Inherited through jsdom's own resolution, not through the patched write.
    expect(childStyle.getPropertyValue('visibility')).toBe('hidden');
    // The properties and their text stay in step, since only the callback was skipped.
    expect(hostStyle.cssText).toContain('color: red;');
    expect(hostStyle.length).toBeGreaterThan(0);

    host.remove();
    style.remove();
  });

  it('should keep a declaration that has a change callback reporting every change', () => {
    const calls = [];
    const declaration = new window.CSSStyleDeclaration(cssText => calls.push(cssText));

    declaration.setProperty('color', 'red');
    declaration.setProperty('visibility', 'hidden');
    declaration.setProperty('color', 'blue');

    expect(calls).toEqual([
      'color: red;',
      'color: red; visibility: hidden;',
      'color: blue; visibility: hidden;',
    ]);
  });

  it('should keep writing the `style` attribute of an element', () => {
    const element = document.createElement('div');

    element.style.setProperty('color', 'red');
    element.style.setProperty('display', 'none');

    expect(element.getAttribute('style')).toBe('color: red; display: none;');

    element.style.removeProperty('color');

    expect(element.getAttribute('style')).toBe('display: none;');
  });

  it('should still drop an empty value and overwrite an existing property in a no-callback declaration', () => {
    const declaration = new window.CSSStyleDeclaration();

    declaration.setProperty('color', 'red');
    declaration.setProperty('visibility', 'hidden');
    declaration.setProperty('color', 'blue');
    // A property setter reaches `_setProperty` with the empty value; `setProperty()` would remove it first.
    declaration.visibility = '';

    expect(declaration.length).toBe(1);
    expect(declaration.getPropertyValue('color')).toBe('blue');
    expect(declaration.getPropertyValue('visibility')).toBe('');
    expect(declaration.cssText).toBe('color: blue;');
  });

  it('should keep the priority of a custom property in a no-callback declaration', () => {
    const declaration = new window.CSSStyleDeclaration();

    declaration.setProperty('--gap', '1px', 'important');

    expect(declaration.getPropertyValue('--gap')).toBe('1px');
    expect(declaration.getPropertyPriority('--gap')).toBe('important');
  });
});

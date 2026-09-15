import { getSanitizer, sanitizeHTML } from '../sanitizer';

/**
 * Builds the smallest object both helpers read: the settings and the element the
 * "warn once" state is bound to. A fresh element per call keeps the `WeakMap`
 * inside `warnOnce` from leaking state between tests.
 *
 * @param {object} settings The grid settings to expose through `getSettings()`.
 * @returns {object} A stand-in for a Handsontable instance.
 */
function createHot(settings = {}) {
  return {
    rootElement: document.createElement('div'),
    getSettings: () => settings,
  };
}

describe('sanitizer', () => {
  describe('.getSanitizer', () => {
    it('should return `true` when no sanitizer is configured', () => {
      expect(getSanitizer(createHot())).toBe(true);
    });

    it('should return `true` when the sanitizer is explicitly `undefined`', () => {
      expect(getSanitizer(createHot({ sanitizer: undefined }))).toBe(true);
    });

    it('should return the configured sanitizer function', () => {
      const sanitizer = () => '';

      expect(getSanitizer(createHot({ sanitizer }))).toBe(sanitizer);
    });
  });

  describe('.sanitizeHTML', () => {
    it('should pass plain text to a configured sanitizer as well', () => {
      // A sanitizer is not always an XSS filter. Both call sites passed every payload through
      // before this helper existed, so skipping plain text would silently narrow the contract.
      const sanitizer = jasmine.createSpy('sanitizer').and.returnValue('clean');

      expect(sanitizeHTML(createHot({ sanitizer }), 'plain text', 'header')).toBe('clean');
      expect(sanitizer).toHaveBeenCalledWith('plain text', 'header');
    });

    it('should return an empty string when the sanitizer returns nothing', () => {
      // Returning the raw input instead would undo the sanitizing; writing `undefined` would put
      // the literal word into the DOM.
      const sanitizer = () => undefined;

      expect(sanitizeHTML(createHot({ sanitizer }), '<b>x</b>', 'header')).toBe('');
    });

    it('should not warn for plain text when no sanitizer is configured', () => {
      const warnSpy = spyOn(console, 'warn');

      sanitizeHTML(createHot(), 'plain text', 'header');

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should pass the content and the context to the configured sanitizer', () => {
      const sanitizer = jasmine.createSpy('sanitizer').and.returnValue('clean');

      expect(sanitizeHTML(createHot({ sanitizer }), '<b>x</b>', 'header')).toBe('clean');
      expect(sanitizer).toHaveBeenCalledWith('<b>x</b>', 'header');
    });

    it('should treat an HTML entity as markup', () => {
      const sanitizer = jasmine.createSpy('sanitizer').and.returnValue('clean');

      sanitizeHTML(createHot({ sanitizer }), 'a &amp; b', 'CopyPaste.paste');

      expect(sanitizer).toHaveBeenCalledWith('a &amp; b', 'CopyPaste.paste');
    });

    it('should not warn for prose that merely contains `&` and `;`', () => {
      // The warning is gated on the same test `fastInnerHTML` uses to pick a write path. Prose
      // like this is not markup, so warning about it was noise on grids that write ordinary
      // labels - and it pointed at a raw write that should never have been raw.
      const warnSpy = spyOn(console, 'warn');

      expect(sanitizeHTML(createHot(), 'Smith & Sons, Ltd.; est. 1920', 'header'))
        .toBe('Smith & Sons, Ltd.; est. 1920');
      expect(sanitizeHTML(createHot(), 'R&D; notes', 'header')).toBe('R&D; notes');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should not warn for prose that merely contains `<` and `>`', () => {
      const warnSpy = spyOn(console, 'warn');

      expect(sanitizeHTML(createHot(), 'Score < 50 > threshold', 'header'))
        .toBe('Score < 50 > threshold');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should still warn for prose that also holds a real character reference', () => {
      // The test is unanchored, so the reference is what it matches on. This content genuinely
      // reaches `innerHTML`, so the warning still belongs.
      const warnSpy = spyOn(console, 'warn');

      sanitizeHTML(createHot(), 'Smith & Sons; &amp; more', 'header');

      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/without a sanitizer/));
    });

    it('should pass prose to a configured sanitizer regardless of the markup test', () => {
      // Only the warning is gated. A configured sanitizer runs above the gate, so an auditing or
      // length-capping one still sees every payload.
      const sanitizer = jasmine.createSpy('sanitizer').and.returnValue('clean');

      expect(sanitizeHTML(createHot({ sanitizer }), 'R&D; notes', 'header')).toBe('clean');
      expect(sanitizer).toHaveBeenCalledWith('R&D; notes', 'header');
    });

    it('should return the content unchanged and warn when no sanitizer is configured', () => {
      const warnSpy = spyOn(console, 'warn');

      expect(sanitizeHTML(createHot(), '<b>x</b>', 'header')).toBe('<b>x</b>');
      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/\("header"\) without a sanitizer/));
    });

    it('should warn only once per instance, regardless of the context', () => {
      const warnSpy = spyOn(console, 'warn');
      const hot = createHot();

      sanitizeHTML(hot, '<b>x</b>', 'header');
      sanitizeHTML(hot, '<b>y</b>', 'CopyPaste.paste');

      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('should warn again for a different instance', () => {
      const warnSpy = spyOn(console, 'warn');

      sanitizeHTML(createHot(), '<b>x</b>', 'header');
      sanitizeHTML(createHot(), '<b>x</b>', 'header');

      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });
});

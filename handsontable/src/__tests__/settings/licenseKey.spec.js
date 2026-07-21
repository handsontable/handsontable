/* eslint no-console: off */
describe('settings', () => {
  describe('licenseKey', () => {
    const id = 'testContainer';

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    it('should print information about key invalidation right after the Handsontable root element', async() => {
      handsontable({}, true);

      const info = spec().$container[0].querySelector('.hot-display-license-info');

      // `ht-slot-element` is added because the notification is registered on the bottom layout slot.
      expect(info.classList.contains('handsontable')).toBe(true);
      expect(info.classList.contains('hot-display-license-info')).toBe(true);
      expect(info.classList.contains('ht-slot-element')).toBe(true);
      expect(info.innerText).toBe([
        'The license key for Handsontable is missing. Use your purchased key to activate the product. ',
        'Alternatively, you can activate Handsontable to use for non-commercial purposes ',
        'by passing the key: \'non-commercial-and-evaluation\'. ',
        'Read more about it in the documentation or contact us at support@handsontable.com.',
      ].join(''));
    });

    it('should destroy all DOM elements related to the invalidation information for specific HoT instance only', async() => {
      const element2 = $('<div id="hot2"></div>').appendTo('body');

      const hot1 = handsontable({}, true);
      const hot2 = new Handsontable(element2[0], {});

      expect(document.querySelectorAll('.hot-display-license-info').length).toBe(2);

      hot1.destroy();

      expect(document.querySelectorAll('.hot-display-license-info').length).toBe(1);

      hot2.destroy();
      element2.remove();

      expect(document.querySelectorAll('.hot-display-license-info').length).toBe(0);
    });

    describe('corner badge for non-typed license states', () => {
      it('should show the badge with the missing-key hover tooltip when no key is passed', async() => {
        handsontable({}, true);

        const overlays = hot().rootOverlaysElement;
        const badge = overlays.querySelector('.ht-license-badge');
        const popover = overlays.querySelector('.ht-license-popover');

        expect(badge).not.toBe(null);
        expect(popover.getAttribute('role')).toBe('tooltip');
        expect(popover.querySelector('.ht-license-popover__title').innerText).toBe('Missing license key');
        // A hover tooltip: not auto-open, no close button.
        expect(popover.classList.contains('is-open')).toBe(false);
        expect(popover.querySelector('.ht-license-popover__close')).toBe(null);
        // The legacy missing-key bottom bar stays exactly as it always was.
        expect(spec().$container[0].querySelector('.hot-display-license-info')).not.toBe(null);
      });

      it('should show the badge alone for the non-commercial key - no popover at all', async() => {
        handsontable({ licenseKey: 'non-commercial-and-evaluation' }, true);

        const overlays = hot().rootOverlaysElement;
        const badge = overlays.querySelector('.ht-license-badge');

        // The Non-Commercial and Evaluation License permits the usage - the badge is the only
        // marker, with no tooltip and no purchase messaging.
        expect(badge).not.toBe(null);
        expect(badge.getAttribute('aria-label'))
          .toBe('You\'re using the Non-Commercial and Evaluation License of Handsontable');
        expect(overlays.querySelector('.ht-license-popover')).toBe(null);
        // Non-commercial use renders no bottom bar - unchanged.
        expect(spec().$container[0].querySelector('.hot-display-license-info')).toBe(null);
      });

      it('should show the badge with the invalid-key hover tooltip for an unrecognizable key', async() => {
        handsontable({ licenseKey: 'non-commercial-and-evaluationdddd' }, true);

        const overlays = hot().rootOverlaysElement;
        const badge = overlays.querySelector('.ht-license-badge');
        const popover = overlays.querySelector('.ht-license-popover');

        expect(badge).not.toBe(null);
        expect(popover.getAttribute('role')).toBe('tooltip');
        expect(popover.querySelector('.ht-license-popover__title').innerText).toBe('Invalid license key');
        expect(popover.classList.contains('is-open')).toBe(false);
        expect(popover.querySelector('.ht-license-popover__close')).toBe(null);
        // The legacy invalid-key bottom bar stays exactly as it always was.
        const bar = spec().$container[0].querySelector('.hot-display-license-info');

        expect(bar).not.toBe(null);
        expect(bar.innerText).toContain('The license key for Handsontable is invalid');
      });

      it('should hide the badge and re-anchor the popover when there is no corner cell (no row headers)', async() => {
        handsontable({
          licenseKey: 'd0134-95841-770f2-c4f21-3751d', // expired 23/05/2011
          colHeaders: true,
        }, true);

        const wrapper = hot().rootOverlaysElement.querySelector('.ht-license-badge-wrapper');
        const badge = wrapper.querySelector('.ht-license-badge');
        const popover = wrapper.querySelector('.ht-license-popover');

        // No corner -> nothing for the badge to sit on and nothing for the tail to point at.
        expect(wrapper.classList.contains('is-cornerless')).toBe(true);
        expect(getComputedStyle(badge).display).toBe('none');
        // The auto-open popover attaches to the table's inline-start edge instead.
        expect(popover.classList.contains('is-open')).toBe(true);
        expect(popover.getBoundingClientRect().left)
          .toBe(hot().rootWrapperElement.getBoundingClientRect().left);

        // Turning the headers on restores the corner badge.
        await updateSettings({ rowHeaders: true });

        expect(wrapper.classList.contains('is-cornerless')).toBe(false);
        expect(getComputedStyle(badge).display).not.toBe('none');
      });

      it('should auto-open a closable expired popover for an expired legacy key, keeping the legacy bar', async() => {
        // A real legacy key that expired on 23/05/2011 - expired against any modern build date.
        handsontable({ licenseKey: 'd0134-95841-770f2-c4f21-3751d' }, true);

        const overlays = hot().rootOverlaysElement;
        const wrapper = overlays.querySelector('.ht-license-badge-wrapper');
        const popover = overlays.querySelector('.ht-license-popover');
        const closeButton = popover.querySelector('.ht-license-popover__close');

        expect(popover.getAttribute('role')).toBe('dialog');
        expect(popover.querySelector('.ht-license-popover__title').innerText).toBe('Expired license key');
        expect(popover.querySelector('.ht-license-popover__body').innerText)
          .toContain('expired on May 24, 2011');
        expect(popover.classList.contains('is-open')).toBe(true);
        expect(closeButton).not.toBe(null);

        closeButton.click();

        expect(popover.classList.contains('is-open')).toBe(false);
        expect(wrapper.classList.contains('is-dismissed')).toBe(true);
        // The legacy expired bottom bar stays exactly as it always was.
        const bar = spec().$container[0].querySelector('.hot-display-license-info');

        expect(bar).not.toBe(null);
        expect(bar.innerText).toContain('The license key for Handsontable expired');
      });
    });
  });
});

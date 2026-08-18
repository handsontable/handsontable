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

    describe('license states outside the entitlement format show no corner badge', () => {
      // The corner badge is reserved for a trial. Every other state keeps only its notification-path
      // output (the legacy console message and bottom bar), unchanged.
      it('should show no badge for a missing key, keeping the legacy missing-key bottom bar', async() => {
        handsontable({}, true);

        const overlays = hot().rootOverlaysElement;

        expect(overlays.querySelector('.ht-license-badge')).toBe(null);
        expect(overlays.querySelector('.ht-license-popover')).toBe(null);
        expect(hot().rootElement.classList.contains('ht-license-badge-on')).toBe(false);
        // The legacy missing-key bottom bar stays exactly as it always was.
        expect(spec().$container[0].querySelector('.hot-display-license-info')).not.toBe(null);
      });

      it('should show no badge and no bar for the non-commercial key', async() => {
        handsontable({ licenseKey: 'non-commercial-and-evaluation' }, true);

        const overlays = hot().rootOverlaysElement;

        // The Non-Commercial and Evaluation License permits the usage - no badge, no bar, silent.
        expect(overlays.querySelector('.ht-license-badge')).toBe(null);
        expect(hot().rootElement.classList.contains('ht-license-badge-on')).toBe(false);
        expect(spec().$container[0].querySelector('.hot-display-license-info')).toBe(null);
      });

      it('should show no badge for an invalid key, keeping the legacy invalid-key bottom bar', async() => {
        handsontable({ licenseKey: 'non-commercial-and-evaluationdddd' }, true);

        const overlays = hot().rootOverlaysElement;

        expect(overlays.querySelector('.ht-license-badge')).toBe(null);
        expect(overlays.querySelector('.ht-license-popover')).toBe(null);
        // The legacy invalid-key bottom bar stays exactly as it always was.
        const bar = spec().$container[0].querySelector('.hot-display-license-info');

        expect(bar).not.toBe(null);
        expect(bar.innerText).toContain('The license key for Handsontable is invalid');
      });

      it('should show no badge for an expired legacy key, keeping the legacy expired bottom bar', async() => {
        // A real legacy key that expired on 23/05/2011 - expired against any modern build date.
        handsontable({ licenseKey: 'd0134-95841-770f2-c4f21-3751d' }, true);

        const overlays = hot().rootOverlaysElement;

        expect(overlays.querySelector('.ht-license-badge')).toBe(null);
        expect(overlays.querySelector('.ht-license-popover')).toBe(null);
        // The legacy expired bottom bar stays exactly as it always was.
        const bar = spec().$container[0].querySelector('.hot-display-license-info');

        expect(bar).not.toBe(null);
        expect(bar.innerText).toContain('The license key for Handsontable expired');
      });
    });
  });
});

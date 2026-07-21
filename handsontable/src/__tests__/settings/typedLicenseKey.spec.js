import {
  TRIAL_KEY,
  FREEMIUM_KEY,
  SUBSCRIPTION_KEY,
  SUBSCRIPTION_SAAS_KEY,
  FIXTURE_EXPIRY_TIMESTAMP,
} from '../../utils/typedLicenseKey/__tests__/fixtures';

/* eslint no-console: off */
describe('settings', () => {
  describe('licenseKey (typed keys)', () => {
    const id = 'testContainer';
    const DAY = 24 * 60 * 60 * 1000;
    // TRIAL_KEY expires on FIXTURE_EXPIRY_TIMESTAMP with a 15-day grace.
    const WITHIN_TRIAL = FIXTURE_EXPIRY_TIMESTAMP - (10 * DAY);
    const WITHIN_GRACE = FIXTURE_EXPIRY_TIMESTAMP + (5 * DAY); // soft stop (0..-15d)
    const AFTER_GRACE = FIXTURE_EXPIRY_TIMESTAMP + (20 * DAY); // hard stop (>15d)
    // The subscription fixtures carry a 90-day grace.
    const SUB_AFTER_GRACE = FIXTURE_EXPIRY_TIMESTAMP + (95 * DAY); // subscription hard stop (>90d)

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
      // The hard-stop path logs a console error; keep the test output clean.
      spyOn(console, 'error');
      spyOn(console, 'warn');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('active trial', () => {
      it('should show the corner badge with the trial tooltip and no dialog or bottom bar', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_TRIAL);

        handsontable({ licenseKey: TRIAL_KEY }, true);

        const badge = hot().rootOverlaysElement.querySelector('.ht-license-badge');
        const popover = hot().rootOverlaysElement.querySelector('.ht-license-popover');

        expect(badge).not.toBe(null);
        expect(popover.querySelector('.ht-license-popover__title').innerText).toBe('Handsontable Trial');
        // A hover tooltip is not auto-open.
        expect(popover.classList.contains('is-open')).toBe(false);
        expect(getPlugin('dialog').isVisible()).toBe(false);
        expect(spec().$container[0].querySelector('.hot-display-license-info')).toBe(null);
      });

      it('should render the glyph inside the corner header cell, never overflowing it', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_TRIAL);

        handsontable({ licenseKey: TRIAL_KEY, rowHeaders: true, colHeaders: true }, true);

        // The popover anchor measurement arrives asynchronously (the observer delivers after layout).
        await sleep(50);

        const wrapper = hot().rootOverlaysElement.querySelector('.ht-license-badge-wrapper');
        const corner = spec().$container[0].querySelector('.ht_clone_top_inline_start_corner');
        const cornerCell = corner.querySelector('thead tr:first-child th:first-child');
        const glyph = getComputedStyle(cornerCell, '::after');

        // The glyph is CSS-rendered inside the corner cell itself, so it cannot leave the corner.
        expect(hot().rootElement.classList.contains('ht-license-badge-on')).toBe(true);
        expect(glyph.maskImage).not.toBe('none');
        expect(parseFloat(glyph.width)).toBeLessThanOrEqual(cornerCell.offsetWidth);
        expect(parseFloat(glyph.height)).toBeLessThanOrEqual(cornerCell.offsetHeight);
        // The popover anchor tracks the measured corner width.
        expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width'))
          .toBe(`${corner.offsetWidth}px`);
      });

      it('should scale the glyph down inside a corner narrower than the glyph', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_TRIAL);

        handsontable({
          licenseKey: TRIAL_KEY,
          rowHeaders: true,
          colHeaders: true,
          rowHeaderWidth: 16,
        }, true);

        const cornerCell = spec().$container[0]
          .querySelector('.ht_clone_top_inline_start_corner thead tr:first-child th:first-child');
        const glyph = getComputedStyle(cornerCell, '::after');

        // `min(20px, 100%)` clamps the glyph to the cell - a 16px corner must not spill a 20px glyph.
        expect(cornerCell.offsetWidth).toBeLessThan(20);
        expect(parseFloat(glyph.width)).toBeLessThanOrEqual(cornerCell.offsetWidth);
      });

      it('should not pop the tooltip over frozen data cells when there are no headers', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_TRIAL);

        handsontable({ licenseKey: TRIAL_KEY, fixedRowsTop: 2, fixedColumnsStart: 2 }, true);

        const wrapper = hot().rootOverlaysElement.querySelector('.ht-license-badge-wrapper');
        const popover = wrapper.querySelector('.ht-license-popover');
        // Without headers the corner clone still exists - it holds the user's frozen DATA cells.
        const frozenCell = spec().$container[0].querySelector('.ht_clone_top_inline_start_corner tbody td');

        expect(wrapper.classList.contains('is-cornerless')).toBe(true);
        expect(frozenCell).not.toBe(null);

        frozenCell.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

        expect(wrapper.classList.contains('is-corner-hover')).toBe(false);
        expect(getComputedStyle(popover).display).toBe('none');
      });
    });

    describe('freemium', () => {
      it('should show the corner badge with the freemium tooltip and no bottom bar', async() => {
        handsontable({ licenseKey: FREEMIUM_KEY }, true);

        const badge = hot().rootOverlaysElement.querySelector('.ht-license-badge');
        const popover = hot().rootOverlaysElement.querySelector('.ht-license-popover');

        expect(badge).not.toBe(null);
        expect(popover.querySelector('.ht-license-popover__title').innerText)
          .toContain('Freemium plan');
        expect(popover.querySelector('.ht-license-popover__link').innerText).toBe('Learn more');
        expect(spec().$container[0].querySelector('.hot-display-license-info')).toBe(null);
      });

      it('should remove the badge when a commercial key is swapped in at runtime', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_TRIAL);

        handsontable({ licenseKey: FREEMIUM_KEY }, true);

        expect(hot().rootOverlaysElement.querySelector('.ht-license-badge')).not.toBe(null);

        // "Upgrading to a commercial key removes it" - the docs' promise must hold at runtime,
        // without destroying and rebuilding the grid.
        await updateSettings({ licenseKey: SUBSCRIPTION_KEY });

        expect(hot().rootOverlaysElement.querySelector('.ht-license-badge')).toBe(null);
        expect(hot().rootElement.classList.contains('ht-license-badge-on')).toBe(false);
      });
    });

    describe('soft stop (expired, within grace)', () => {
      it('should show the bottom bar and the auto-open badge popover, and no dialog', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_GRACE);

        handsontable({ licenseKey: TRIAL_KEY }, true);

        const bar = spec().$container[0].querySelector('.hot-display-license-info');
        const popover = hot().rootOverlaysElement.querySelector('.ht-license-popover');

        expect(getPlugin('dialog').isVisible()).toBe(false);
        expect(bar).not.toBe(null);
        expect(bar.innerText).toContain('Your Handsontable license has expired');
        // The soft-stop popover auto-opens and is dismissible.
        expect(popover.classList.contains('is-open')).toBe(true);
        expect(popover.querySelector('.ht-license-popover__close')).not.toBe(null);
      });

      it('should hide the popover on close even while hovered, and re-arm it once the pointer leaves', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_GRACE);

        handsontable({ licenseKey: TRIAL_KEY, rowHeaders: true, colHeaders: true }, true);

        const wrapper = hot().rootOverlaysElement.querySelector('.ht-license-badge-wrapper');
        const popover = hot().rootOverlaysElement.querySelector('.ht-license-popover');
        const corner = spec().$container[0]
          .querySelector('.ht_clone_top_inline_start_corner thead th');

        // The pointer hovers the popover when the close button is clicked - `is-dismissed` must gate
        // the hover-driven visibility, so the popover really disappears.
        popover.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
        popover.querySelector('.ht-license-popover__close').click();

        expect(popover.classList.contains('is-open')).toBe(false);
        expect(wrapper.classList.contains('is-dismissed')).toBe(true);
        expect(getComputedStyle(popover).display).toBe('none');

        // Dismissal is purely pointer-driven now (the popover is a floating visual, never focused):
        // it re-arms as soon as the pointer leaves the popover and the corner...
        popover.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
        spec().$container[0].querySelector('td')
          .dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

        expect(wrapper.classList.contains('is-dismissed')).toBe(false);

        // ...and hovering the corner shows it again as a plain tooltip.
        corner.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

        expect(wrapper.classList.contains('is-corner-hover')).toBe(true);
        expect(getComputedStyle(popover).display).not.toBe('none');
      });

      it('should keep the corner select-all click working underneath the badge', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_GRACE);

        handsontable({ licenseKey: TRIAL_KEY, rowHeaders: true, colHeaders: true }, true);

        const badge = hot().rootOverlaysElement.querySelector('.ht-license-badge');
        const badgeRect = badge.getBoundingClientRect();
        const hitTarget = document.elementFromPoint(
          badgeRect.x + (badgeRect.width / 2),
          badgeRect.y + (badgeRect.height / 2),
        );

        // The badge is click-through (`pointer-events: none`): the hit target under it is the corner
        // header, so its native select-all behavior stays intact.
        expect(badge.contains(hitTarget)).toBe(false);

        await simulateClick(spec().$container.find('.ht_clone_top_inline_start_corner thead th').eq(0));

        expect(getSelected()).toEqual([[-1, -1, countRows() - 1, countCols() - 1]]);
      });
    });

    describe('hard stop (grace elapsed): the Core-owned lock screen', () => {
      it('should mount a blocking, non-closable lock over the grid and move focus into it', async() => {
        spyOn(Date, 'now').and.returnValue(AFTER_GRACE);

        handsontable({ licenseKey: TRIAL_KEY }, true);

        const lock = hot().rootOverlaysElement.querySelector('.ht-license-lock');

        expect(lock).not.toBe(null);
        expect(lock.getAttribute('role')).toBe('alertdialog');
        expect(lock.innerText).toContain('Your Handsontable license has expired.');
        expect(lock.innerText).toContain('Contact Sales');
        // Non-closable: no Close button, and Escape (through the real shortcut pipeline - the
        // lock's shortcuts context is active while focus is inside it) does nothing.
        expect(lock.innerText).not.toContain('Close');

        await keyDownUp('escape');

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);
        // The modal focus scope moved focus to the lock's primary action.
        expect(document.activeElement.innerText).toBe('Contact Sales');
      });

      it('should keep the lock across settings updates', async() => {
        spyOn(Date, 'now').and.returnValue(AFTER_GRACE);

        handsontable({ licenseKey: TRIAL_KEY }, true);

        await updateSettings({ rowHeaders: true });

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);
      });

      it('should not be affected by the app using the Dialog plugin for its own dialogs', async() => {
        spyOn(Date, 'now').and.returnValue(AFTER_GRACE);

        handsontable({ licenseKey: TRIAL_KEY, dialog: true }, true);

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);

        // The lock does not live on the shared Dialog plugin surface: the app showing and hiding
        // its own dialogs neither replaces nor dismisses the license lock.
        getPlugin('dialog').show({ content: 'An app dialog' });
        getPlugin('dialog').hide();

        await sleep(10);

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);
      });

      it('should remove the lock when the instance is destroyed', async() => {
        spyOn(Date, 'now').and.returnValue(AFTER_GRACE);

        handsontable({ licenseKey: TRIAL_KEY }, true);

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);

        destroy();

        expect(document.querySelector('.ht-license-lock')).toBe(null);
      });

      it('should release the lock when updateSettings fixes the license key, even with dialog: true', async() => {
        spyOn(Date, 'now').and.returnValue(AFTER_GRACE);

        // `dialog: true` used to keep the plugin-based lock alive through updates - the Core-owned
        // lock releases regardless of any Dialog plugin configuration.
        handsontable({ licenseKey: TRIAL_KEY, dialog: true }, true);

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);

        await updateSettings({ licenseKey: 'non-commercial-and-evaluation' });

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
      });
    });

    describe('subscription hard stop (grace elapsed)', () => {
      it('should mount a closable lock for an Internal-mode key, with no bar and no badge', async() => {
        spyOn(Date, 'now').and.returnValue(SUB_AFTER_GRACE);

        handsontable({ licenseKey: SUBSCRIPTION_KEY }, true);

        const lock = hot().rootOverlaysElement.querySelector('.ht-license-lock');

        expect(lock).not.toBe(null);
        expect(lock.getAttribute('role')).toBe('dialog');
        expect(lock.innerText).toContain('Your Handsontable subscription has expired.');
        expect(lock.innerText).toContain('Contact Sales');
        expect(lock.innerText).toContain('Close');
        // The lock is the only subscription surface - no bottom bar, no corner badge.
        expect(spec().$container[0].querySelector('.hot-display-license-info')).toBe(null);
        expect(hot().rootOverlaysElement.querySelector('.ht-license-badge')).toBe(null);
      });

      it('should let the end user dismiss the lock, and keep it dismissed across settings updates', async() => {
        spyOn(Date, 'now').and.returnValue(SUB_AFTER_GRACE);

        handsontable({ licenseKey: SUBSCRIPTION_KEY }, true);

        const lock = hot().rootOverlaysElement.querySelector('.ht-license-lock');
        const closeButton = Array.from(lock.querySelectorAll('button'))
          .find(button => button.innerText === 'Close');

        expect(closeButton).not.toBe(undefined);

        closeButton.click();

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);

        // The user's dismissal sticks: a settings update must not bring the lock back.
        await updateSettings({ rowHeaders: true });

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
      });

      it('should dismiss the lock on Escape through the shortcut pipeline', async() => {
        spyOn(Date, 'now').and.returnValue(SUB_AFTER_GRACE);

        handsontable({ licenseKey: SUBSCRIPTION_KEY }, true);

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);

        // Focus sits inside the lock (its modal scope activated on init), so its shortcuts context
        // is the active one.
        await keyDownUp('escape');

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
      });

      it('should keep the lock up after updateSettings when it was NOT dismissed', async() => {
        spyOn(Date, 'now').and.returnValue(SUB_AFTER_GRACE);

        handsontable({ licenseKey: SUBSCRIPTION_KEY }, true);

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);

        // The Core-owned lock does not live on any plugin surface, so a settings update cannot
        // tear it down as a side effect.
        await updateSettings({ rowHeaders: true });

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);
      });

      it('should release the lock when updateSettings fixes the license key', async() => {
        spyOn(Date, 'now').and.returnValue(SUB_AFTER_GRACE);

        handsontable({ licenseKey: SUBSCRIPTION_KEY }, true);

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);

        // A renewed key swapped in at runtime must stand the lock down.
        await updateSettings({ licenseKey: 'non-commercial-and-evaluation' });

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
      });

      it('should stay console-only for a SaaS-mode key: no lock, no bar, no badge', async() => {
        spyOn(Date, 'now').and.returnValue(SUB_AFTER_GRACE);

        handsontable({ licenseKey: SUBSCRIPTION_SAAS_KEY }, true);

        // The expiry signal is developer-facing only (Case 3b of the license spec): the console
        // error (asserted in the unit tests - it logs once per page, so a prior spec may have
        // already consumed it here) with no frontend surface at all.
        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
        expect(spec().$container[0].querySelector('.hot-display-license-info')).toBe(null);
        expect(hot().rootOverlaysElement.querySelector('.ht-license-badge')).toBe(null);
      });
    });
  });
});

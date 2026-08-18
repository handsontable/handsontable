import {
  TRIAL_KEY,
  SUBSCRIPTION_KEY,
  SUBSCRIPTION_EXTERNAL_KEY,
} from '../../utils/entitlementLicenseKey/__tests__/fixtures';

/* eslint no-console: off */
describe('settings', () => {
  describe('licenseKey (entitlement keys)', () => {
    const id = 'testContainer';
    // TRIAL_KEY runs to 2026-09-26 with a 45-day notice and a 15-day grace.
    const WITHIN_TRIAL = Date.parse('2026-09-16T00:00:00Z');
    const WITHIN_GRACE = Date.parse('2026-10-01T00:00:00Z'); // soft stop, inside the grace period
    const AFTER_GRACE = Date.parse('2026-10-12T00:00:00Z'); // hard stop, the grace period is over
    // The subscription fixtures run to 2027-08-12 with a 90-day grace.
    const SUB_AFTER_GRACE = Date.parse('2027-12-01T00:00:00Z');

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

      it('should not leak the corner glyph into a nested grid (handsontable cell type)', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_TRIAL);

        handsontable({
          licenseKey: TRIAL_KEY,
          rowHeaders: true,
          colHeaders: true,
          columns: [
            {
              type: 'handsontable',
              handsontable: { data: [['a', 'b'], ['c', 'd']], rowHeaders: true, colHeaders: true },
            },
            {}, {},
          ],
        }, true);

        // Open the handsontable-cell-type editor so the nested grid renders its own corner clone
        // inside this root - the corner a root-scoped CSS selector would wrongly match.
        await selectCell(0, 0);
        await keyDownUp('enter');
        await sleep(50);

        const nestedHot = getActiveEditor().htEditor;
        const outerCorner = hot().view._wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.TABLE;
        const nestedCorner = nestedHot.view._wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.TABLE;

        // The nested corner really sits inside the branded root (otherwise there is nothing to leak into).
        expect(hot().rootElement.contains(nestedCorner)).toBe(true);

        // Only this grid's own corner carries the marker and paints the glyph...
        expect(outerCorner.classList.contains('ht-license-badge-corner')).toBe(true);
        expect(getComputedStyle(outerCorner.querySelector('thead tr:first-child th:first-child'), '::after')
          .maskImage).not.toBe('none');

        // ...the nested grid's corner gets neither the marker nor a stray "H." glyph.
        expect(nestedCorner.classList.contains('ht-license-badge-corner')).toBe(false);
        expect(getComputedStyle(nestedCorner.querySelector('thead tr:first-child th:first-child'), '::after')
          .maskImage).toBe('none');
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

    describe('soft stop (expired, within grace)', () => {
      it('should show the bottom bar and the auto-open badge popover, and no dialog', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_GRACE);

        handsontable({ licenseKey: TRIAL_KEY }, true);

        const bar = spec().$container[0].querySelector('.hot-display-license-info');
        const popover = hot().rootOverlaysElement.querySelector('.ht-license-popover');

        expect(getPlugin('dialog').isVisible()).toBe(false);
        expect(bar).not.toBe(null);
        expect(bar.innerText).toContain('Your Handsontable license key has expired');
        // Exactly one badge wrapper - a duplicate would mean a mount ran twice.
        expect(hot().rootOverlaysElement.querySelectorAll('.ht-license-badge-wrapper').length).toBe(1);
        // The soft-stop popover auto-opens and is dismissible.
        expect(popover.classList.contains('is-open')).toBe(true);
        expect(popover.querySelector('.ht-license-popover__close')).not.toBe(null);
      });

      it('should hide the badge and re-anchor the auto-open popover when there is no corner cell', async() => {
        spyOn(Date, 'now').and.returnValue(WITHIN_GRACE);

        handsontable({ licenseKey: TRIAL_KEY, rowHeaders: false, colHeaders: true }, true);

        const wrapper = hot().rootOverlaysElement.querySelector('.ht-license-badge-wrapper');
        const badge = wrapper.querySelector('.ht-license-badge');
        const popover = wrapper.querySelector('.ht-license-popover');

        // No corner -> nothing for the badge to sit on and nothing for the tail to point at.
        expect(wrapper.classList.contains('is-cornerless')).toBe(true);
        expect(getComputedStyle(badge).display).toBe('none');
        // The auto-open soft-stop popover attaches to the table's inline-start edge instead.
        expect(popover.classList.contains('is-open')).toBe(true);
        expect(popover.getBoundingClientRect().left)
          .toBe(hot().rootWrapperElement.getBoundingClientRect().left);

        // Turning the row headers on restores the corner badge.
        await updateSettings({ rowHeaders: true });

        expect(wrapper.classList.contains('is-cornerless')).toBe(false);
        expect(getComputedStyle(badge).display).not.toBe('none');
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
        expect(lock.innerText).toContain('Your Handsontable trial license key expired on 2026-09-26.');
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
    });

    describe('subscription hard stop (grace elapsed)', () => {
      // A hard-stopped subscription is developer-facing only, however the key was issued: the console
      // error (asserted in the unit tests - it logs once per page, so a prior spec may have already
      // consumed it here) with no frontend surface at all - no lock, no bottom bar, no corner badge.
      it.each([
        ['internal-use', SUBSCRIPTION_KEY],
        ['external-use', SUBSCRIPTION_EXTERNAL_KEY],
      ])('should stay console-only for an %s key: no lock, no bar, no badge', async(_label, key) => {
        spyOn(Date, 'now').and.returnValue(SUB_AFTER_GRACE);

        handsontable({ licenseKey: key }, true);

        expect(hot().rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
        expect(spec().$container[0].querySelector('.hot-display-license-info')).toBe(null);
        expect(hot().rootOverlaysElement.querySelector('.ht-license-badge')).toBe(null);
      });
    });
  });
});

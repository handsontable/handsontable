// Every other test of the `{before,after}RefreshDimensions` hooks was migrated to
// `tests/e2e/refresh-dimensions.spec.ts` (DEV-2744) - the fixed `sleep(50)` waits here were on
// DEV-2668's flake ledger. The dvh loop-guard spec below is the deliberate leftover: it cannot be
// made honestly green until DEV-2740 fixes the guard in `resizeMonitor.ts` (the `=== 300`
// consecutive count with a 100 ms wall-clock reset never trips on a loaded runner), and migrating
// it before that fix would only move the red. Migrate it together with the DEV-2740 fix.
describe('Hook', () => {
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

  describe('afterRefreshDimensions', () => {
    it('should not be stuck in an infinite loop when the parent container is sized with dynamic units (`dvh`) and' +
      ' additional elements were added to the parent container - it should break the cycle and display an' +
      ' appropriate warning message', async() => {
      spyOn(console, 'warn');
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');
      const $parentContainer = $('<div id="parentContainer"></div>').appendTo('body');

      spec().$container.detach().appendTo($parentContainer);
      $parentContainer
        .css('width', '100%')
        .css('min-height', '100dvh')
        .css('overflow', 'hidden')
        .append('<div id="additionalElement">Test</div>');

      handsontable({
        data: [[1, 2], [3, 4]],
        afterRefreshDimensions,
      });

      await sleep(6000);

      const callsWhenGuardTripped = afterRefreshDimensions.calls.count();

      // The guard warns and disconnects on the 300th successive callback, but every
      // ResizeObserver invocation already queued at that moment still runs its
      // `requestAnimationFrame` and is counted, so the exact total depends on how the browser
      // batched them (a loaded CI runner reaches ~355). What the guard promises is that the cycle
      // stops, which is what the second sample below checks.
      expect(callsWhenGuardTripped).toBeGreaterThanOrEqual(300);
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        'The ResizeObserver callback was fired too many times in direct succession.' +
        '\nThis may be due to an infinite loop caused by setting a dynamic height/width (for example, ' +
        'with the `dvh` units) to a Handsontable container\'s parent. ' +
        '\nThe observer will be disconnected.'
      );

      await sleep(500);

      expect(afterRefreshDimensions.calls.count()).toBe(callsWhenGuardTripped);

      destroy();
      $parentContainer.remove();
    });
  });
});

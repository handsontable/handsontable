import { isFirefox } from '../../../../../../helpers/browser';
import { DifferBasedRendererAdapter } from './differBasedRendererAdapter';
import { DirectDomRendererAdapter } from './directDomRendererAdapter';

/**
 * Factory function to create the appropriate renderer adapter based on the browser.
 *
 * @param {OrderView} orderView The OrderView instance.
 * @returns {DifferBasedRendererAdapter|DirectDomRendererAdapter}
 */
export function createRendererAdapter(orderView) {
  if (isFirefox()) {
    return new DirectDomRendererAdapter(orderView);
  }

  return new DifferBasedRendererAdapter(orderView);
}


import { isFirefox } from '../../../../../../helpers/browser';
import { StandardRendererAdapter } from './standardRendererAdapter';
import { FirefoxRendererAdapter } from './firefoxRendererAdapter';

/**
 * Factory function to create the appropriate renderer adapter based on the browser.
 *
 * @param {OrderView} orderView The OrderView instance.
 * @returns {StandardRendererAdapter|FirefoxRendererAdapter}
 */
export function createRendererAdapter(orderView) {
  if (isFirefox()) {
    return new FirefoxRendererAdapter(orderView);
  }

  return new StandardRendererAdapter(orderView);
}


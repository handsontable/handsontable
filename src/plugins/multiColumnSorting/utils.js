/* eslint-disable import/prefer-default-export */

import { warn } from '../../helpers/console';

/**
 * Warn users about problems when using `columnSorting` and `multiColumnSorting` plugins simultaneously.
 */
export function warnAboutPluginsConflict() {
  warn('Plugins `columnSorting` and `multiColumnSorting` should not be enabled simultaneously.');
}

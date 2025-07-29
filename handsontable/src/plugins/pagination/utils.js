import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';

const CONFLICTING_OPTIONS = [
  // plugins
  'nestedRows',
  'mergeCells',
  // options
  'fixedRowsTop',
  'fixedRowsBottom',
];

/**
 * Warns about the conflict between the pagination plugin and other plugins and/or options.
 *
 * @param {object} settings The settings object of the Handsontable.
 * @returns {boolean} Returns `true` if there is a conflict, `false` otherwise.
 */
export function checkPluginSettingsConflict(settings) {
  return CONFLICTING_OPTIONS.some((optionName) => {
    const isOptionEnabled = !!settings[optionName];

    if (isOptionEnabled) {
      warn(toSingleLine`The \`pagination\` plugin cannot be used with the \`${optionName}\` option.\x20
                        This combination is not supported. The plugin will remain disabled.`);
    }

    return isOptionEnabled;
  });
}

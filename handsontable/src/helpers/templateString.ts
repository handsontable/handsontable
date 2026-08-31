/**
 * Substitute strings placed between square brackets into value defined in `variables` object. String names defined in
 * square brackets must be the same as property name of `variables` object.
 *
 * Lives in its own module, not in `helpers/string`, so that `helpers/console` can use it without
 * importing `helpers/string` — `helpers/string` needs `deprecatedWarnOnce` from `helpers/console`,
 * and the resulting cycle would leave one of the two modules reading an uninitialized binding.
 *
 * @param {string} template Template string.
 * @param {object} variables Object which contains all available values which can be injected into template.
 * @returns {string}
 */
export function substitute(template: string, variables: Record<string, unknown> = {}): string {
  return (`${template}`).replace(/(?:\\)?\[([^[\]]+)]/g, (match, name) => {
    if (match.charAt(0) === '\\') {
      return match.substr(1, match.length - 1);
    }

    return variables[name] === undefined ? '' : String(variables[name]);
  });
}

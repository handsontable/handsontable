import { memberName, propertyName, stringValue, unwrapNode } from './ast.mjs';

/**
 * Wrapper tags whose attributes are grid or column options: Vue and Angular `<hot-table>` and `<hot-column>`, and
 * the PascalCase forms of Vue and React.
 */
const HOT_TAG = '(?:hot-table|hot-column|HotTable|HotColumn)';

/**
 * Attributes of a tag: a name, and an optional quoted or bare value.
 */
const ATTRIBUTE = '[^\\s"\'<>/=]+(?:\\s*=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s"\'<>]+))?';

/**
 * One opening tag of a wrapper element with its attribute text, which can hold `>` inside a quoted value.
 */
const OPENING_TAG = new RegExp(`<(${HOT_TAG})((?:\\s+${ATTRIBUTE})*)\\s*/?>`, 'g');

/**
 * Binding names that carry a whole settings object instead of one option.
 */
const SETTINGS_ATTRIBUTES = new Set(['settings', 'v-bind', 'bind']);

/**
 * One place in a template where a wrapper element sets an option.
 *
 * @typedef {object} TemplateSite
 * @property {string} name The option, in camel case (`numericFormat`).
 * @property {number} line One-based line of the attribute.
 * @property {string} tag The tag name as written (`hot-column`).
 * @property {string} attribute The attribute name as written (`:numeric-format`).
 * @property {string|null} value The attribute value without its quotes, or `null` for a bare attribute.
 */

/**
 * Turn an attribute name into the option it binds: `:numeric-format`, `v-bind:numeric-format`,
 * `[numericFormat]`, `bind-numeric-format`, and `numericFormat` all give `numericFormat`.
 *
 * @param {string} attribute The attribute as written in the template.
 * @returns {string} The camel-case name.
 */
export function optionOfAttribute(attribute) {
  const bare = attribute
    .replace(/^(?:v-bind:|bind-|:|\[\(|\[)/, '')
    .replace(/(?:\)\]|\])$/, '');

  return bare.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * One-based line of a character offset.
 *
 * @param {string} source Text.
 * @param {number} index Offset.
 * @returns {number} The line.
 */
function lineAt(source, index) {
  let line = 1;

  for (let at = source.indexOf('\n'); at !== -1 && at < index; at = source.indexOf('\n', at + 1)) {
    line += 1;
  }

  return line;
}

/**
 * Find the attributes of `<hot-table>`, `<hot-column>`, `<HotTable>`, and `<HotColumn>` tags in template text that
 * set one of the options. An attribute counts when its name binds the option (see `optionOfAttribute`), or when it
 * is a `settings` or `v-bind` binding whose value names the option as a word. The text is never parsed: the match
 * is by regular expression, on wrapper tags only.
 *
 * @param {string} source Template text.
 * @param {Iterable<string>} names Option names in camel case.
 * @returns {TemplateSite[]} The sites in source order.
 */
export function templateOptionSites(source, names) {
  const wanted = new Set(names);
  const sites = [];

  for (const tag of source.matchAll(OPENING_TAG)) {
    const attributesStart = tag.index + 1 + tag[1].length;

    for (const attribute of tag[2].matchAll(new RegExp(`(${ATTRIBUTE})`, 'g'))) {
      const [text] = attribute;
      const split = /^([^\s=]+)(?:\s*=\s*(.*))?$/s.exec(text);
      const written = split[1];
      const value = split[2] === undefined ? null : split[2].replace(/^(["'])([\s\S]*)\1$/, '$2');
      const name = optionOfAttribute(written);
      const line = lineAt(source, attributesStart + attribute.index);

      if (wanted.has(name)) {
        sites.push({ name, line, tag: tag[1], attribute: written, value });
      } else if (SETTINGS_ATTRIBUTES.has(name) && value) {
        [...wanted].filter(option => new RegExp(`(?<![\\w$])${option}(?![\\w$])`).test(value))
          .forEach(option => sites.push({ name: option, line, tag: tag[1], attribute: written, value }));
      }
    }
  }

  return sites;
}

/**
 * One place where code sets an option without writing an options object.
 *
 * @typedef {object} DynamicSite
 * @property {string} name The option or key that is set.
 * @property {string|null} parent For `a.numericFormat.pattern = x`, the name before the last one (`numericFormat`).
 * @property {number|undefined} line One-based line.
 * @property {object|null} value The value node, or `null` when it is not known.
 * @property {'assignment'|'setCellMeta'} form How the option is set.
 */

/**
 * Find the places that set an option dynamically: an assignment to a member (`column.numericFormat = {...}`,
 * `settings['correctFormat'] = true`), `setCellMeta(row, col, 'name', value)`, and the keys of an object literal
 * passed to `setCellMetaObject(row, col, {...})`. The caller decides which names matter and whether the file
 * belongs to Handsontable.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} root The parsed Collection.
 * @returns {DynamicSite[]} The sites in source order of discovery.
 */
export function dynamicOptionSites(j, root) {
  const sites = [];

  root.find(j.AssignmentExpression).forEach((path) => {
    const { left, right, operator } = path.node;

    if (operator !== '=' || !['MemberExpression', 'OptionalMemberExpression'].includes(left.type)) {
      return;
    }

    const name = memberName(left);
    const holder = unwrapNode(left.object);
    const parent = ['MemberExpression', 'OptionalMemberExpression'].includes(holder.type) ? memberName(holder) : null;

    if (name !== null) {
      sites.push({ name, parent, line: path.node.loc?.start.line, value: right, form: 'assignment' });
    }
  });

  root.find(j.CallExpression).forEach((path) => {
    const callee = unwrapNode(path.node.callee);

    if (!['MemberExpression', 'OptionalMemberExpression'].includes(callee.type)) {
      return;
    }

    const method = memberName(callee);
    const [, , third, fourth] = path.node.arguments;
    const line = path.node.loc?.start.line;

    if (method === 'setCellMeta' && third) {
      const name = stringValue(third);

      if (name !== null) {
        sites.push({ name, parent: null, line, value: fourth ?? null, form: 'setCellMeta' });
      }
    }

    if (method === 'setCellMetaObject' && third && unwrapNode(third).type === 'ObjectExpression') {
      unwrapNode(third).properties.forEach((property) => {
        const name = propertyName(property);

        if (name !== null) {
          sites.push({ name, parent: null, line, value: property.value ?? null, form: 'setCellMeta' });
        }
      });
    }
  });

  return sites;
}

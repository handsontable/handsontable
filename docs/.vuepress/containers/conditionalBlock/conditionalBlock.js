/**
 * Container used to display/hide blocks of content relevant to specific frameworks.
 * It relies on providing the framework name(s) as arguments to the container (see 'Usage' below) and setting a
 * `framework` field in front matter as the framework name, for example:
 *
 * ```
 * ---
 * framework: vue
 * ---
 * ```
 *
 * Usage:
 * ```
 * ::: only-for react
 * Content to be displayed only for React documentation.
 * :::
 *
 * ::: only-for js react vue
 * Content to be displayed only for JS, React and Vue documentation.
 * :::
 * ```
 */
module.exports = {
  type: 'only-for',
  render(tokens, index, opts, env) {
    const framework = env.frontmatter.framework || 'js';
    const args = tokens[index].info.trim().split(' ');
    const firstBlockTokenIndex = index + 1;
    let lastBlockTokenIndex = firstBlockTokenIndex;

    while (tokens[lastBlockTokenIndex + 1].markup !== ':::') {
      lastBlockTokenIndex += 1;
    }

    if (tokens[index].nesting === 1 && !args.includes(framework)) {
      tokens.splice(firstBlockTokenIndex, lastBlockTokenIndex - firstBlockTokenIndex + 1);
    }

    return '';
  }
};

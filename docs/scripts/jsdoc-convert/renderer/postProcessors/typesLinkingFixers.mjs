const genDocsUrl = (type, anchor) =>
  `@/api/${type.charAt(0).toLowerCase()}${type.substring(1)}.md${anchor ? `#${anchor}` : ''}`;

export const buildTypesLinkingFixers = ({ parsedTypes }) => {
  const fixTypes = text => text.replace(
    /(::: signame |\*\*Returns\*\*:|\*\*See\*\*:|\*\*Emits\*\*:)( ?[^\n-]*)/g,
    (_, part, signame) => {
      let suffix = '';
      let prefix = part;

      if (part === '::: signame ') {
        prefix = '_';
        suffix = '_';
      }

      return prefix + signame
      // todo dynamically
        .replace(/([^\w`[#])(`)?(Hooks)((#)(event:)?(\w*))?(`)?/g, '$1[$2$3$4$8](@/api/hooks.md$5$7)')
        .replace(/([^\w`[#])(`)?(Handsontable)(#\w*)?(`)?/g, '$1[$2$3$4$5](@/api/core.md$4)')
        .replace(/([^\w`[#])(`)?([a-zA-Z][a-zA-Z0-9]*)(#\w*)?(`)?/g,
          (all, pre = '', quoteOp = '', type = '', anchor = '', quoteCl = '') => {
            if (!parsedTypes.includes(type)) {
              return all;
            }

            return `${pre}[${quoteOp}${type}${anchor}${quoteCl}](${genDocsUrl(type, anchor)})`;
          })
        .replace(/\.</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/`\\\*`/, '`*`')
        + suffix;
    }
  );

  const fixCategories = text => text.replace(
    /(\*\*Category\*\*: ?)([^\n- ]*)/g,
    (_, part, signame) => `${part}[${signame}](${genDocsUrl(signame)})`
  );

  return [fixTypes, fixCategories];
};

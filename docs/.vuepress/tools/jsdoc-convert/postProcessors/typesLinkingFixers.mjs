
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
      .replace(/([^\w`\[#])(`)?(IndexMapper)(#\w*)?(`)?/g, '$1[$2$3$4$5](@/api/indexMapper.md$4)')
      .replace(/([^\w`\[#])(`)?(Handsontable|Core)(#\w*)?(`)?/g, '$1[$2$3$4$5](@/api/core.md$4)')
      .replace(/([^\w`\[#])(`)?(Hooks)((#)(event:)?(\w*))?(`)?/g, '$1[$2$3$4$8](@/api/pluginHooks.md$5$7)')
      .replace(/([^\w`\[#])(`)?(BaseEditor)(#\w*)?(`)?/g, '$1[$2$3$4$5](@/api/baseEditor.md$4)')
      .replace(/([^\w`\[#])(`)?(CellCoords)(#\w*)?(`)?/g, '$1[$2$3$4$5](@/api/coords.md$4)')
      .replace(/([^\w`\[#])(`)?(FocusableWrapper)(#\w*)?(`)?/g, '$1[$2$3$4$5](@/api/focusableElement.md$4)')
      .replace(/\.</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/`\\\*`/, '`*`')
      + suffix;
  }
);

const fixCategories = text => text.replace(
  /(\*\*Category\*\*: ?)([^\n- ]*)/g,
  (_, part, signame) => `${part}[${signame}](@/api/${signame.charAt(0).toLowerCase()}${signame.substring(1)}.md)`
);

export const typesLinkingFixers = [fixTypes, fixCategories];

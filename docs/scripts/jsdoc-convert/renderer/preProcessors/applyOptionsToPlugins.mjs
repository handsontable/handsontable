import { isJsdocOptions, isJsdocPlugin } from '../predictors.mjs';

const optionsPerPlugin = {};
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toApiFileName = plugin => `${plugin.replace(/^([A-Z])/, (_, upper) => upper.toLowerCase())}.md`;
const toOptionAnchor = anchor => anchor.toLowerCase();
const removeSelfLinkListItems = (description, pluginApiFileName) => {
  const selfLinkPattern = new RegExp(`^\\s*- .*\\]\\(@/api/${escapeRegExp(pluginApiFileName)}(?:#[^)]+)?\\)`);

  return description.split('\n')
    .filter(line => !selfLinkPattern.test(line))
    .join('\n');
};
const removeSelfLinks = (description, pluginApiFileName) => {
  const selfLinkPattern = new RegExp(`\\[([^\\]]+)\\]\\(@/api/${escapeRegExp(pluginApiFileName)}(?:#[^)]+)?\\)`, 'g');

  return description.replace(selfLinkPattern, '$1');
};
const rewriteLocalOptionAnchors = (description) => {
  return description.replace(/\]\(#([^)]+)\)/g, (_, anchor) => {
    return `](@/api/options.md#${toOptionAnchor(anchor)})`;
  });
};
const normalizeInjectedOptionDescription = (description, plugin) => {
  if (!description) {
    return description;
  }

  const pluginApiFileName = toApiFileName(plugin);
  const withoutSelfLinkListItems = removeSelfLinkListItems(description, pluginApiFileName);
  const withoutSelfLinks = removeSelfLinks(withoutSelfLinkListItems, pluginApiFileName);

  return rewriteLocalOptionAnchors(withoutSelfLinks);
};
const getPluginName = (data) => {
  const plugin = data[0].customTags
    ?.filter(tag => tag.tag === 'plugin').pop()
    ?.value;

  if (plugin) {
    return plugin;
  }

  return data
    .map(member => member.memberof)
    .find(memberof => optionsPerPlugin[memberof]);
};
const memorizeOptions = data => (!isJsdocOptions(data) ? data : data.map((x) => {
  if (x.category) {
    const cat = x.category.trim();

    optionsPerPlugin[cat] = optionsPerPlugin[cat] || [];
    optionsPerPlugin[cat].push(x);
  }

  return x;
}));

const applyPluginOptions = (data) => {
  if (isJsdocPlugin(data) || data.some(member => optionsPerPlugin[member.memberof])) {
    const plugin = getPluginName(data);
    const options = optionsPerPlugin[plugin]?.map((option) => {
      return {
        ...option,
        description: normalizeInjectedOptionDescription(option.description, plugin),
        isOption: true,
        category: undefined,
        memberof: plugin // workaround to force print as a member.
      };
    }) ?? [];

    const index = data.findIndex(x => x.kind === 'constructor');

    data.splice(index + 1, 0, ...options);
  }

  return data;
};

export const applyOptionsToPlugins = [memorizeOptions, applyPluginOptions];

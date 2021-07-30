import { isJsdocOptions, isJsdocPlugin } from '../predictors.mjs';

const optionsPerPlugin = {};
const memorizeOptions = data => (!isJsdocOptions(data) ? data : data.map((x) => {
  if (x.category) {
    const cat = x.category.trim();

    optionsPerPlugin[cat] = optionsPerPlugin[cat] || [];
    optionsPerPlugin[cat].push(x);
  }

  return x;
}));

const applyPluginOptions = (data) => {
  if (isJsdocPlugin(data)) {
    const plugin = data[0].customTags
      ?.filter(tag => tag.tag === 'plugin').pop()
      ?.value;

    const options = optionsPerPlugin[plugin]?.map((option) => {
      return {
        ...option,
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

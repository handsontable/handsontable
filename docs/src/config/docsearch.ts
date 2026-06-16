import type { DocSearchClientOptions } from '@astrojs/starlight-docsearch';

export default {
  appId: 'MMN6OTJMGX',
  apiKey: 'c2430302c91e0162df988d4b383c9d8b',
  indexName: 'handsontable',
  transformItems(items: any[]) {
    return items.map((item) => {
      const url: string = item.url ?? '';
      const framework = url.includes('/react-data-grid/')
        ? 'React'
        : url.includes('/angular-data-grid/')
          ? 'Angular'
          : url.includes('/vue-data-grid/')
            ? 'Vue'
            : 'JavaScript';

      const suffix = ` · ${framework}`;
      const lvl1 = item.hierarchy?.lvl1;
      const snippetLvl1 = item._snippetResult?.hierarchy?.lvl1;

      return {
        ...item,
        // DocSearch reads hierarchy.lvl1 as the raw fallback
        hierarchy: {
          ...item.hierarchy,
          lvl1: lvl1 ? `${lvl1}${suffix}` : framework,
        },
        // DocSearch renders _snippetResult.hierarchy.lvl1.value first (it sends
        // attributesToSnippet: ["hierarchy.lvl1:N", ...] in every search query),
        // so we must update this field too or the suffix never appears.
        _snippetResult: item._snippetResult
          ? {
              ...item._snippetResult,
              hierarchy: item._snippetResult.hierarchy
                ? {
                    ...item._snippetResult.hierarchy,
                    lvl1: snippetLvl1
                      ? {
                          ...snippetLvl1,
                          value: snippetLvl1.value
                            ? `${snippetLvl1.value}${suffix}`
                            : framework,
                        }
                      : undefined,
                  }
                : undefined,
            }
          : undefined,
      };
    });
  },
} satisfies DocSearchClientOptions;

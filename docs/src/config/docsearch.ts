import type { DocSearchClientOptions } from '@astrojs/starlight-docsearch';

// The Algolia crawler stores hierarchy.lvl0 as raw HTML text, so ampersands
// and other special characters arrive encoded (e.g. "Data &amp; tools").
// DocSearch renders lvl0 as plain React children (not dangerouslySetInnerHTML),
// so the browser never decodes the entities — we must do it here.
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&apos;': "'",
};
const decodeHtml = (str: string | null | undefined): string | null | undefined =>
  str ? str.replace(/&(?:amp|lt|gt|quot|#039|apos);/g, (e) => HTML_ENTITIES[e] ?? e) : str;

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

      const highlightLvl0 = item._highlightResult?.hierarchy?.lvl0;

      return {
        ...item,
        hierarchy: {
          ...item.hierarchy,
          // lvl0 is the section header — decode entities (fallback path).
          lvl0: decodeHtml(item.hierarchy?.lvl0),
          // lvl1 is the breadcrumb; append the framework label.
          lvl1: lvl1 ? `${lvl1}${suffix}` : framework,
        },
        // The section title is built from _highlightResult.hierarchy.lvl0.value
        // (see the go() function in @docsearch/js), so we must decode there too.
        _highlightResult: item._highlightResult
          ? {
              ...item._highlightResult,
              hierarchy: item._highlightResult.hierarchy
                ? {
                    ...item._highlightResult.hierarchy,
                    lvl0: highlightLvl0
                      ? { ...highlightLvl0, value: decodeHtml(highlightLvl0.value) }
                      : undefined,
                  }
                : undefined,
            }
          : undefined,
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

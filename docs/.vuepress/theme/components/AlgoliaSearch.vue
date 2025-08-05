<template>
  <div id="algolia-search"></div>
</template>

<script>
import docsearch from '@docsearch/js';
import '@docsearch/css';

export default {
  name: 'AlgoliaSearch',
  props: ['options'],
  mounted() {
    this.initialize(this.options, this.$lang);
  },
  methods: {
    initialize(userOptions, lang) {

      if (this.$page.currentVersion === 'next') {
        // Disable search for next version as it's not crawled by Algolia
        return;
      }
      
      const isLatestReleasedVersion = this.$page.currentVersion === this.$page.latestVersion

      docsearch({
        container: '#algolia-search',
        ...userOptions,
        indexName: isLatestReleasedVersion ? 'handsontable' : 'handsontable-with-versions',

        placeholder: this.$site.themeConfig.searchPlaceholder || 'Search',
        translations: {
          button: {
            buttonText: this.$site.themeConfig.searchPlaceholder || 'Search',
            buttonAriaLabel:
              this.$site.themeConfig.searchPlaceholder || 'Search',
          },
        },
        searchParameters: {
          // eslint-disable-next-line max-len
          facetFilters: isLatestReleasedVersion ? [`lang:${lang}`, `tags:${this.$page.currentFramework}`] : [`lang:${lang}`, `tags:${this.$page.currentFramework}`, `version:${this.$page.currentVersion}`],
        },
      });
    },
  },
};
</script>

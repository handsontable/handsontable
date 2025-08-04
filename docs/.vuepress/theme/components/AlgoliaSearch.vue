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
    // this.options = {
    //   indexName: 'handsontable-with-versions',
    //   apiKey: 'c2430302c91e0162df988d4b383c9d8b',
    //   appId: 'MMN6OTJMGX',
    //   searchParameters: {
    //     facetFilters: [`version:15.3`]
    //   },
    // }
    this.initialize(this.options, this.$lang);
  },
  methods: {
    initialize(userOptions, lang) {

      if (this.$page.currentVersion === 'next') {
        // Disable search for next version as it's not crawled by Algolia
        return;
      }

      const latestReleasedVersion = this.$page.versions.find(version => !isNaN(parseInt(version, 10)));
      const isLatestReleasedVersion = latestReleasedVersion === this.$page.currentVersion;

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

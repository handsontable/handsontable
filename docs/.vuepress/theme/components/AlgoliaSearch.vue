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
      docsearch({
        container: '#algolia-search',
        ...userOptions,
        placeholder: this.$site.themeConfig.searchPlaceholder || 'Search',
        translations: {
          button: {
            buttonText: this.$site.themeConfig.searchPlaceholder || 'Search',
            buttonAriaLabel:
              this.$site.themeConfig.searchPlaceholder || 'Search',
          },
        },
        searchParameters: {
          facetFilters: [`lang:${lang}`, `tags:${this.$page.currentFramework}`],
        },
      });
    },
  },
};
</script>

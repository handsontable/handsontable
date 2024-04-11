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

<style lang="stylus">
#algolia-search {
  display: inline-block;
  position: relative;
  margin-right: 1.5rem;
  vertical-align: middle;
}

.DocSearch-Container {
  z-index: 9999;
}

.DocSearch-Button-Container {
  display: flex !important;
}

.DocSearch-Button {
  border: 1px solid #cfdbe4;
  border-radius: 6px;
  margin: 0;
  height: 34px;

  &:hover {
    box-shadow: none;
  }
  &:focus-visible {
    box-shadow: none;
    outline: -webkit-focus-ring-color auto 1px;
  }
}

.DocSearch-Button-Keys {
  display: flex !important;
}

html.theme-dark {
  .DocSearch-Button {
    border-color: #43464d;
  }
  --docsearch-searchbox-background: transparent;
  --docsearch-searchbox-focus-background: transparent;
  --docsearch-text-color: #e5ebf1;
  --docsearch-muted-color: #e5ebf1;
}

:root {
  --docsearch-searchbox-background: transparent;
  --docsearch-searchbox-focus-background: transparent;
  --docsearch-text-color: $textColor;
  --docsearch-muted-color: $textColor;
}

@media (max-width: $extraLarge) {
  .DocSearch-Button {
    border: none;
  }

  .DocSearch-Button-Keys {
    display: none !important;
  }

  .DocSearch-Button-Placeholder {
    display: none !important;
  }
}

@media (max-width: $medium) {
  #algolia-search {
    margin-right: 0;
  }
}
</style>

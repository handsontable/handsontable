<template>
  <form id="search-form" class="search-box" role="search">
    <input
      ref="input"
      id="algolia-search-input"
      class="search-query"
      aria-label="Search"
      autocomplete="off"
      spellcheck="false"
      :placeholder="placeholder"
      @focus="focused = true"
      @blur="focused = false"
    />
    <Transition>
      <span
        class="kbd-hint"
        title="press / or S to focus the search field"
        v-if="!focused"
      >
        <kbd @click="focusInput()">/</kbd>
        <kbd @click="focusInput()">S</kbd>
      </span>
    </Transition>
  </form>
</template>

<script>
/* global SEARCH_HOTKEYS */
const ALLOWED_TAGS = ['BODY', 'A', 'BUTTON'];

export default {
  name: 'AlgoliaSearch',
  props: ['options'],
  data() {
    return {
      placeholder: undefined,
      focused: false,
    };
  },
  watch: {
    $lang(newValue) {
      this.update(this.options, newValue);
    },

    options(newValue) {
      this.update(newValue, this.$lang);
    },
    $route() {
      this.$refs.input.value = '';
    },
  },
  mounted() {
    this.initialize(this.options, this.$lang);
    this.placeholder = this.$site.themeConfig.searchPlaceholder || '';
    document.addEventListener('keydown', this.onHotkey);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.onHotkey);
  },
  methods: {
    initialize(userOptions, lang) {
      Promise.all([
        import(
          // eslint-disable-next-line
          /* webpackChunkName: "docsearch" */ "docsearch.js/dist/cdn/docsearch.min.js"
        ),
        import(
          /* webpackChunkName: "docsearch" */ 'docsearch.js/dist/cdn/docsearch.min.css'
        ),
      ]).then(([docsearch]) => {
        docsearch = docsearch.default;
        const { algoliaOptions = {} } = userOptions;

        docsearch({
          ...userOptions,
          inputSelector: '#algolia-search-input',
          // #697 Make docsearch work well at i18n mode.
          algoliaOptions: {
            ...algoliaOptions,
            facetFilters: [
              `lang:${lang}`,
              `tags:${this.$page.currentFramework}`,
            ].concat(algoliaOptions.facetFilters || []),
          },
          handleSelected: (input, event, suggestion) => {
            const { pathname, hash } = new URL(suggestion.url);
            const routepath = pathname.replace(this.$site.base, '/');
            const _hash = decodeURIComponent(hash);
            const newPath = `${routepath}${_hash}`;
            const currentPath = window.location.href.replace(
              `${this.$page.hostname}${this.$site.base}`,
              '/'
            );

            if (newPath !== currentPath) {
              this.$router.push(newPath);
            }
          },
        });
      });
    },
    update(options, lang) {
      this.$el.innerHTML =
        '<input id="algolia-search-input" class="search-query">';
      this.initialize(options, lang);
    },
    onHotkey(event) {
      const isValidElement =
        ALLOWED_TAGS.includes(event.srcElement.tagName) ||
        event.srcElement.id === 'slider'; // theme switcher;

      if (isValidElement && SEARCH_HOTKEYS.includes(event.key)) {
        this.$refs.input.focus();
        event.preventDefault();
      }
    },
    focusInput() {
      this.$refs.input.focus();
    },
  },
};
</script>

<style lang="stylus">
.search-box.search-box {
  display: inline-block;
  position: relative;
  margin-right: 1.5rem;
  min-width: 100px;
  height: 22px;

  .algolia-autocomplete {
    position: absolute !important;
    top: 0;
    right: 0;
  }

  input {
    cursor: text;
    width: 7rem;
    height: 2rem;
    display: inline-block;
    border: 1px solid #cfdbe4;
    border-radius: 6px;
    font-size: 14px;
    line-height: 2rem;
    padding: 0 3.5rem 0 2.2rem;
    outline: none;
    /* Fallback for IE, should work in production */
    background: #fff url('{{$basePath}}/img/search.svg') 0.6rem 0.5rem no-repeat;
    background-size: 1rem;

    &:focus {
      color: $textColor;
      cursor: auto;
      border-color: $accentColor;
    }
  }

  .kbd-hint {
    position: absolute;
    right: 7px;
    top: -1px;
    cursor: pointer;
    transition: all 0.2s linear;

    kbd {
      margin: 0 2px;
    }
  }
}

@media (max-width: $extraLarge) {
  .search-box.search-box {
    margin-right: 0;

    input {
      cursor: pointer;
      width: 0;
      background-color: transparent;
      border-color: transparent;
      position: absolute;
      right: 10px;
      z-index: 20;
      font-size: 14px;
      padding: 0 1rem;

      &:focus {
        cursor: text;
        left: auto;
        width: 5.5rem;
        // The browser will zoom if the font-size is less than 16px so this is to prevent that.
        font-size: 16px;
        background-color: #fff;
        padding: 0 0.5rem 0 2.2rem;
      }
    }

    .kbd-hint {
      display: none;
    }
  }
}

@media (max-width: $medium) {
  input {
    right: 0 !important;
  }
}

.algolia-autocomplete {
  .ds-dropdown-menu {
    margin: 8px 0 0 !important;

    .ds-suggestions {
      max-height: 80vh;
      margin-top: 0 !important;
    }
  }

  .algolia-docsearch-suggestion {
    padding: 0 !important;

    &--wrapper {
      padding: 5px 0 0 !important;
    }

    .algolia-docsearch-suggestion {
      &--category-header {
        padding: 5px;

        .algolia-docsearch-suggestion--highlight {
          font-size: 14px !important;
          line-height: 1.4em;
        }
      }

      &--highlight {
        padding: 0 !important;
        font-size: 12px !important;
        line-height: 1.4em;
      }

      &--subcategory-column {
        display: none !important;
      }

      &--subcategory-column-text {
        font-size: 12px !important;
        line-height: 1.4em;
      }

      &--content {
        width: 100%;
        float: none;
        padding: 5px;

        &:before {
          display: none;
        }
      }

      &--title {
        font-size: 12px !important;
        line-height: 1.4em;
        margin-bottom: 0;
      }
    }
  }

  .aa-suggestion-title-separator {
    padding: 0 4px;
  }
}

@media (max-width: $large) {
  .algolia-search-wrapper .ds-dropdown-menu {
    min-width: 440px !important;
  }
}

@media (max-width: $medium) {
  .algolia-search-wrapper .ds-dropdown-menu {
    min-width: calc(100vw - 4rem) !important;
    max-width: calc(100vw - 4rem) !important;
  }
}

.v-enter-active, .v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from, .v-leave-to {
  opacity: 0;
}
</style>

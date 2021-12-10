<template>
  <div class="search-box">
    <input
      ref="input"
      aria-label="Search"
      :value="query"
      :class="{ 'focused': focused }"
      :placeholder="placeholder"
      autocomplete="off"
      spellcheck="false"
      @input="query = $event.target.value"
      @focus="focused = true"
      @blur="focused = false"
      @keyup.enter="go(focusIndex)"
      @keyup.up="onUp"
      @keyup.down="onDown"
    >
    <span class="kbd-hint" title="press / or S to focus the search field">
      <kbd @click="focusInput()">/</kbd>
      <kbd @click="focusInput()">S</kbd>
    </span>
    <ul
      v-if="showSuggestions"
      class="suggestions"
      :class="{ 'align-right': alignRight }"
      @mouseleave="unfocus"
    >
      <template v-for="(s, i) in suggestions">
        <li v-if="s.category!==(suggestions[i-1] || {}).category"> {{ s.category }}: </li>
        <li
          :key="i"
          class="suggestion"
          :class="{ focused: i === focusIndex }"
          @mousedown="go(i)"
          @mouseenter="focus(i)"
        >
          <a
            :href="s.path"
            @click.prevent
          >
            <span class="page-title">{{ s.title || s.path }}</span>
            <span
              v-if="s.header"
              class="header"
            >&gt; {{ s.header.title }}</span>
          </a>
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
/* global SEARCH_MAX_SUGGESTIONS, SEARCH_HOTKEYS */
import get from 'lodash/get';

const ALLOWED_TAGS = ['BODY', 'A', 'BUTTON'];

const priorityCompare = (a, b) => {
  if (a.priority > b.priority) {
    return -1;

  } else if (a.priority < b.priority) {
    return 1;
  }

  return 0;
};

const matchTest = (query, domain, isFuzzySearch = false) => {
  const escapeRegExp = str => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

  // eslint-disable-next-line no-control-regex
  const nonASCIIRegExp = new RegExp('[^\x00-\x7F]');

  const words = query
    .split(/\s+/g)
    .map(str => str.trim())
    .filter(str => !!str);

  if (isFuzzySearch || nonASCIIRegExp.test(query)) {
    return words.some(word => domain.toLowerCase().indexOf(word) > -1);
  } else {
    // if the query only has ASCII chars, treat as English
    const hasTrailingSpace = query.endsWith(' ');
    const searchRegex = new RegExp(
      `${words
        .map((word, index) => {
          if (words.length === index + 1 && !hasTrailingSpace) {
            // The last word - ok with the word being "startswith"-like
            return `(?=.*\\b${escapeRegExp(word)})`;
          } else {
            // Not the last word - expect the whole word exactly
            return `(?=.*\\b${escapeRegExp(word)}\\b)`;
          }
        })
        .join('')}.+`,
      'gi'
    );

    return searchRegex.test(domain);
  }
};

const matchQuery = (query, page, additionalStr = null, fuzzySearchDomains = []) => {
  let domain = get(page, 'title', '');

  if (get(page, 'frontmatter.tags')) {
    domain += ` ${page.frontmatter.tags.join(' ')}`;
  }

  if (additionalStr) {
    domain += ` ${additionalStr}`;
  }

  const isFuzzySearch = fuzzySearchDomains.includes(domain.split(' ')[0]);

  return matchTest(query, domain, isFuzzySearch);
};

const apiRegex = /^(\/(next|(\d*\.\d*)))?\/api\//;

export default {
  name: 'SearchBox',

  data() {
    return {
      query: '',
      focused: false,
      focusIndex: 0,
      placeholder: undefined
    };
  },

  computed: {
    showSuggestions() {
      return (
        this.focused
        && this.suggestions
        && this.suggestions.length
      );
    },

    suggestions() {
      const query = this.query.trim().toLowerCase();

      if (!query) {
        return;
      }

      const { pages } = this.$site;

      const {
        apiMaxSuggestions = SEARCH_MAX_SUGGESTIONS,
        guidesMaxSuggestions = SEARCH_MAX_SUGGESTIONS,
        fuzzySearchDomains = [],
        apiSearchDomainPriorityList = [],
        guidesSearchDomainPriorityList = [],
      } = this.$site.themeConfig.searchOptions;

      const apiPriorityList = [...apiSearchDomainPriorityList].reverse();
      const guidesPriorityList = [...guidesSearchDomainPriorityList].reverse();
      const resAPI = [];
      const resGuides = [];
      const isSearchable = (page) => {
        // filter out results that do not match current locale
        if (this.getPageLocalePath(page) !== this.$localePath) {
          return false;
        }

        // filter out results that do not match searchable paths
        return this.isSearchable(page);
      };

      // At first, search for the phrase in the API reference main categories
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];

        if (!isSearchable(p) || !apiRegex.test(p.path)) {
          continue; // eslint-disable-line
        }

        const category = 'API Reference';
        const priority = apiPriorityList.indexOf(get(p, 'title', ''));

        if (matchQuery(query, p, null, fuzzySearchDomains)) {
          resAPI.push({
            ...p,
            category,
            priority,
          });
        }

        if (p.headers) {
          for (let j = 0; j < p.headers.length; j++) {
            const h = p.headers[j];

            if (h.title && matchQuery(query, p, h.title, fuzzySearchDomains)) {
              resAPI.push({
                ...p,
                path: `${p.path}#${h.slug}`,
                header: h,
                category,
                priority,
              });
            }
          }
        }
      }

      // The same for non-API pages.
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];

        if (!isSearchable(p) || apiRegex.test(p.path)) {
          continue; // eslint-disable-line
        }

        const category = 'Guides';
        const priority = guidesPriorityList.indexOf(get(p, 'title', ''));

        if (matchQuery(query, p, null, fuzzySearchDomains)) {
          resGuides.push({
            ...p,
            category,
            // Give the higher priority for the main pages as with a lot of results
            // the main pages are more relevant to the query
            priority: priority + 1,
          });
        }

        if (p.headers) {
          for (let j = 0; j < p.headers.length; j++) {
            const h = p.headers[j];

            if (h.title && matchQuery(query, p, h.title, fuzzySearchDomains)) {
              resGuides.push({
                ...p,
                path: `${p.path}#${h.slug}`,
                header: h,
                category,
                priority,
              });
            }
          }
        }
      }

      resAPI.sort(priorityCompare);
      resGuides.sort(priorityCompare);

      const res = [].concat(resAPI.splice(0, apiMaxSuggestions), resGuides.splice(0, guidesMaxSuggestions));

      res.sort((a, b) => b.category.localeCompare(a.category));

      return res;
    },

    // make suggestions align right when there are not enough items
    alignRight() {
      const navCount = (this.$site.themeConfig.nav || []).length;
      const repo = this.$site.repo ? 1 : 0;

      return navCount + repo <= 2;
    }
  },

  mounted() {
    this.placeholder = this.$site.themeConfig.searchOptions.placeholder || '';
    document.addEventListener('keydown', this.onHotkey);
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.onHotkey);
  },

  methods: {
    getPageLocalePath(page) {
      // eslint-disable-next-line no-restricted-syntax
      for (const localePath in Object.keys(this.$site.locales || {})) {
        if (localePath !== '/' && page.path.indexOf(localePath) === 0) {
          return localePath;
        }
      }

      return '/';
    },

    isSearchable(page) {
      return page.regularPath.startsWith(`/${this.$page.currentVersion}/`);
    },

    onHotkey(event) {
      const isValidElement = ALLOWED_TAGS.includes(event.srcElement.tagName)
        || event.srcElement.id === 'slider'; // theme switcher;

      if (isValidElement && SEARCH_HOTKEYS.includes(event.key)) {
        this.$refs.input.focus();
        event.preventDefault();
      }
    },

    onUp() {
      if (this.showSuggestions) {
        if (this.focusIndex > 0) {
          this.focusIndex -= 1;
        } else {
          this.focusIndex = this.suggestions.length - 1;
        }
      }
    },

    onDown() {
      if (this.showSuggestions) {
        if (this.focusIndex < this.suggestions.length - 1) {
          this.focusIndex += 1;
        } else {
          this.focusIndex = 0;
        }
      }
    },

    go(i) {
      if (!this.showSuggestions) {
        return;
      }

      if (this.$route.fullPath !== this.suggestions[i].path) {
        this.$router.push(this.suggestions[i].path);
      }

      this.query = '';
      this.focusIndex = 0;
    },

    focus(i) {
      this.focusIndex = i;
    },

    unfocus() {
      this.focusIndex = -1;
    },

    focusInput() {
      this.$refs.input.focus();
    }
  }
};
</script>

<style lang="stylus">
.search-box.search-box
  display inline-block
  position relative
  margin-right 2rem
  input
    cursor text
    width 12rem
    height: 2rem
    display inline-block
    border 1px solid #cfdbe4
    border-radius 8px
    font-size 0.9rem
    line-height 2rem
    padding 0 0.5rem 0 2rem
    outline none
    background #fff url('/docs/img/search.svg') 0.6rem 0.5rem no-repeat
    background-size 1rem
    &:focus
      color #104bcd
      cursor auto
      border-color $accentColor
      + .kbd-hint
          opacity 0
  .kbd-hint
    position relative
    left -57px
    top -13px
    cursor pointer
    transition all 0.2s linear
    kbd
      position absolute
      line-height 1
      box-sizing border-box
      padding: 0.1em 0.25em;
      &:first-child
        left 24px
  .suggestions
    background #fff
    max-width calc(100vw - 4rem)
    width 26rem
    position absolute
    top 1.6rem
    border 1px solid darken($borderColor, 10%)
    border-radius 6px
    padding 0.4rem
    list-style-type none
    &.align-right
      right 0
    li:not(.suggestion) {
      padding 0.4rem 0.6rem
      margin-bottom 0.4rem
      font-weight 600
      font-size 13px
      border-bottom 1px solid #e9eef2
    }
  .suggestion
    line-height 1.4
    padding 0.4rem 0.6rem
    border-radius 4px
    cursor pointer
    a
      white-space normal
      color lighten($textColor, 25%)
      font-weight 500
      .page-title

      .header
        font-size 0.9em
        margin-left 0.25em
    &.focused
      background-color #f3f4f9
      a
        color $accentColor

@media (max-width: $MQNavbarNarrow)
  .search-box.search-box
    margin-right 0
    input
      cursor pointer
      width 0
      background-color transparent
      border-color transparent
      position relative
      font-size 16px
      &:focus
        cursor text
        left 0
        width 8rem
        margin-right 1rem
    .kbd-hint *
      display none

@media (max-width: $MQMobile)
  .search-box.search-box
    input
      left 1rem
      &:focus
        margin-right 0
// Match IE11
@media all and (-ms-high-contrast: none)
  .search-box input
    height 2rem

@media (max-width: $MQNavbarNarrow) and (min-width: $MQMobile)
  .search-box
    .suggestions
      left 0

@media (max-width: $MQMobile)
  .search-box
    margin-right 0
    input
    .suggestions
      right 0

@media (max-width: $MQMobileNarrow)
  .search-box
    .suggestions
      width calc(100vw - 4rem)
    input:focus
      width 8rem

</style>

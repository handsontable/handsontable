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
import get from 'lodash/get'

const matchQuery =  (query, page, additionalStr = null, fuzzySearchDomains = []) => {
  let domain = get(page, 'title', '')

  if (get(page, 'frontmatter.tags')) {
    domain += ` ${page.frontmatter.tags.join(' ')}`
  }

  if (additionalStr) {
    domain += ` ${additionalStr}`
  }

  const isFuzzySearch = fuzzySearchDomains.includes(domain.split(' ')[0])

  return matchTest(query, domain, isFuzzySearch)
}

const matchTest = (query, domain, isFuzzySearch = false) => {
  const escapeRegExp = str => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')

  // eslint-disable-next-line no-control-regex
  const nonASCIIRegExp = new RegExp('[^\x00-\x7F]')

  const words = query
    .split(/\s+/g)
    .map(str => str.trim())
    .filter(str => !!str)

  if (isFuzzySearch || nonASCIIRegExp.test(query)) {
    return words.some(word => domain.toLowerCase().indexOf(word) > -1)
  } else {
    // if the query only has ASCII chars, treat as English
    const hasTrailingSpace = query.endsWith(' ')
    const searchRegex = new RegExp(
      words
        .map((word, index) => {
          if (words.length === index + 1 && !hasTrailingSpace) {
            // The last word - ok with the word being "startswith"-like
            return `(?=.*\\b${escapeRegExp(word)})`
          } else {
            // Not the last word - expect the whole word exactly
            return `(?=.*\\b${escapeRegExp(word)}\\b)`
          }
        })
        .join('') + '.+',
      'gi'
    )

    return searchRegex.test(domain)
  }
}
const apiRegex = /^(\/(next|(\d*\.\d*)))?\/api\//
/* global SEARCH_MAX_SUGGESTIONS, SEARCH_PATHS, SEARCH_HOTKEYS */
export default {
  name: 'SearchBox',

  data () {
    return {
      query: '',
      focused: false,
      focusIndex: 0,
      placeholder: undefined
    }
  },

  computed: {
    showSuggestions () {
      return (
        this.focused
        && this.suggestions
        && this.suggestions.length
      )
    },

    suggestions () {
      const query = this.query.trim().toLowerCase()
      if (!query) {
        return
      }

      const { pages } = this.$site
      const maxAPI = this.$site.themeConfig.searchMaxAPISuggestions || SEARCH_MAX_SUGGESTIONS
      const maxGuides = this.$site.themeConfig.searchMaxGuidesSuggestions || SEARCH_MAX_SUGGESTIONS
      const fuzzySearchDomains = this.$site.themeConfig.fuzzySearchDomains || []
      const resAPI = []
      const resGuides = []
      const isSearchable = (page) => {
        // filter out results that do not match current locale
        if (this.getPageLocalePath(page) !== this.$localePath) {
          return false
        }

        // filter out results that do not match searchable paths
        return this.isSearchable(page)
      }

      // At first, search for the phrase in the API reference main categories
      for (let i = 0; i < pages.length; i++) {
        if (resAPI.length >= maxAPI) break
        const p = pages[i]

        if (!isSearchable(p) || !apiRegex.test(p.path)) {
          continue
        }

        if (matchQuery(query, p, null, fuzzySearchDomains)) {
          resAPI.push(Object.assign({}, p, {
            category: 'API Reference'
          }))
        }
      }

      // Then, if the array with results has not been filled to the limit, search
      // the phrase in the API reference subcategories.
      if (resAPI.length < maxAPI) {
        for (let i = 0; i < pages.length; i++) {
          if (resAPI.length >= maxAPI) break
          const p = pages[i]

          if (!isSearchable(p) || !apiRegex.test(p.path)) {
            continue
          }

          if (p.headers) { //todo add headers at end of the result list
            for (let j = 0; j < p.headers.length; j++) {
              if (resAPI.length >= maxAPI) break
              const h = p.headers[j]

              if (h.title && matchQuery(query, p, h.title, fuzzySearchDomains)) {
                resAPI.push(Object.assign({}, p, {
                  path: p.path + '#' + h.slug,
                  header: h,
                  category: 'API Reference'
                }))
              }
            }
          }
        }
      }

      // The same for non-API pages. Search for the phrase in categories at first
      for (let i = 0; i < pages.length; i++) {
        if (resGuides.length >= maxGuides) break
        const p = pages[i]

        if (!isSearchable(p) || apiRegex.test(p.path)) {
          continue
        }

        if (matchQuery(query, p, null, fuzzySearchDomains)) {
          resGuides.push(Object.assign({}, p, {
            category: 'Guides'
          }))
        }
      }

      // Then, if the array with results has not been filled to the limit, search
      // the phrase in the subcategories.
      if (resGuides.length < maxGuides) {
        for (let i = 0; i < pages.length; i++) {
          if (resGuides.length >= maxGuides) break
          const p = pages[i]

          if (!isSearchable(p) || apiRegex.test(p.path)) {
            continue
          }

          if (p.headers) { //todo add headers at end of the result list
            for (let j = 0; j < p.headers.length; j++) {
              if (resGuides.length >= maxGuides) break
              const h = p.headers[j]

              if (h.title && matchQuery(query, p, h.title, fuzzySearchDomains)) {
                resGuides.push(Object.assign({}, p, {
                  path: p.path + '#' + h.slug,
                  header: h,
                  category: 'Guides'
                }))
              }
            }
          }
        }
      }

      const res = [].concat(resAPI, resGuides)

      res.sort((a,b)=>b.category.localeCompare(a.category))

      return res
    },

    // make suggestions align right when there are not enough items
    alignRight () {
      const navCount = (this.$site.themeConfig.nav || []).length
      const repo = this.$site.repo ? 1 : 0
      return navCount + repo <= 2
    }
  },

  mounted () {
    this.placeholder = this.$site.themeConfig.searchPlaceholder || ''
    document.addEventListener('keydown', this.onHotkey)
  },

  beforeDestroy () {
    document.removeEventListener('keydown', this.onHotkey)
  },

  methods: {
    getPageLocalePath (page) {
      for (const localePath in this.$site.locales || {}) {
        if (localePath !== '/' && page.path.indexOf(localePath) === 0) {
          return localePath
        }
      }
      return '/'
    },

    isSearchable (page) {
      return page.regularPath.startsWith('/'+this.$page.currentVersion+'/');
    },

    onHotkey (event) {
      if (event.srcElement === document.body && SEARCH_HOTKEYS.includes(event.key)) {
        this.$refs.input.focus()
        event.preventDefault()
      }
    },

    onUp () {
      if (this.showSuggestions) {
        if (this.focusIndex > 0) {
          this.focusIndex--
        } else {
          this.focusIndex = this.suggestions.length - 1
        }
      }
    },

    onDown () {
      if (this.showSuggestions) {
        if (this.focusIndex < this.suggestions.length - 1) {
          this.focusIndex++
        } else {
          this.focusIndex = 0
        }
      }
    },

    go (i) {
      if (!this.showSuggestions) {
        return
      }
      this.$router.push(this.suggestions[i].path)
      this.query = ''
      this.focusIndex = 0
    },

    focus (i) {
      this.focusIndex = i
    },

    unfocus () {
      this.focusIndex = -1
    }
  }
}
</script>

<style lang="stylus">
.search-box
  display inline-block
  position relative
  margin-right 2rem
  input
    cursor text
    width 12rem
    height: 2rem
    display inline-block
    border 1px solid #cfdbe4
    border-radius 2rem
    font-size 0.9rem
    line-height 2rem
    padding 0 0.5rem 0 2rem
    outline none
    transition all .2s ease
    background #fff url(search.svg) 0.6rem 0.5rem no-repeat
    background-size 1rem
    &:focus
      color #104bcd
      cursor auto
      border-color $accentColor
  .suggestions
    background #fff
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

@media (max-width: $MQNarrow)
  .search-box
    input
      cursor pointer
      width 0
      border-color transparent
      position relative
      font-size 16px
      &:focus
        cursor text
        left 0
        width 10rem

// Match IE11
@media all and (-ms-high-contrast: none)
  .search-box input
    height 2rem

@media (max-width: $MQNarrow) and (min-width: $MQMobile)
  .search-box
    .suggestions
      left 0

@media (max-width: $MQMobile)
  .search-box
    margin-right 0
    input
      left 1rem
    .suggestions
      right 0

@media (max-width: $MQMobileNarrow)
  .search-box
    .suggestions
      width calc(100vw - 4rem)
    input:focus
      width 8rem
</style>

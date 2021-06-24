<template>
  <header class="navbar">
    <SidebarButton @toggle-sidebar="$emit('toggle-sidebar')" />

    <RouterLink
        :to="versionedUrl($localePath)"
        class="home-link"
    >

    <Logo />

    </RouterLink>
    <Versions></Versions>

    <ThemeSwitcher />

    <div
        class="links"
        :style="linksWrapMaxWidth ? {
        'max-width': linksWrapMaxWidth + 'px'
      } : {}"
    >
      <AlgoliaSearchBox
          v-if="isAlgoliaSearch"
          :options="algolia"
      />

      <SearchBox />

      <NavLinks class="can-hide" />
    </div>
  </header>
</template>

<script>
import AlgoliaSearchBox from '@AlgoliaSearchBox';
import SearchBox from '@theme/components/SearchBox';
import SidebarButton from '@theme/components/SidebarButton.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import Versions from '@theme/components/Versions.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import { ensureExt } from './util';
import Logo from './Logo.vue';

export default {
  name: 'Navbar',
  components: {
    SidebarButton,
    NavLinks,
    SearchBox,
    AlgoliaSearchBox,
    Versions,
    ThemeSwitcher,
    Logo
  },
  methods: {
    versionedUrl(url) {
      if (this.$page.currentVersion === this.$page.latestVersion) {
        return ensureExt(url);
      } else {
        return ensureExt(`/${this.$page.currentVersion}${url}`);
      }
    }
  },
  data() {
    return {
      linksWrapMaxWidth: null
    };
  },
  computed: {
    algolia() {
      return this.$themeLocaleConfig.algolia || this.$site.themeConfig.algolia || {};
    },
    isAlgoliaSearch() {
      return this.algolia && this.algolia.apiKey && this.algolia.indexName;
    }
  },
  mounted() {
    const MOBILE_DESKTOP_BREAKPOINT = 719; // refer to config.styl
    const paddingLeft = css(this.$el, 'paddingLeft');
    const paddingRight = css(this.$el, 'paddingRight');
    const NAVBAR_VERTICAL_PADDING = parseInt(paddingLeft, 10) + parseInt(paddingRight, 10);
    const handleLinksWrapWidth = () => {
      if (document.documentElement.clientWidth < MOBILE_DESKTOP_BREAKPOINT) {
        this.linksWrapMaxWidth = null;
      } else {
        this.linksWrapMaxWidth = this.$el.offsetWidth - NAVBAR_VERTICAL_PADDING
            - (this.$refs.siteName && this.$refs.siteName.offsetWidth || 0);
      }
    };

    handleLinksWrapWidth();
    window.addEventListener('resize', handleLinksWrapWidth, false);
  }
};
/**
 * @param {Element} el The element to check.
 * @param {string} property The property the gather.
 * @returns {CSSStyleDeclaration}
 */
function css(el, property) {
  // NOTE: Known bug, will return 'auto' if style value is 'auto'
  const win = el.ownerDocument.defaultView;

  // null means not to return pseudo styles
  return win.getComputedStyle(el, null)[property];
}
</script>

<style lang="stylus">
$navbar-vertical-padding = 0.65rem
$navbar-horizontal-padding = 1.5rem

.navbar
  padding $navbar-vertical-padding $navbar-horizontal-padding
  line-height $navbarHeight - 1.4rem
  z-index 2000
  border-color: #e9eef2
  a, span, img
    display inline-block
    font-weight 500
    font-size: 14px
  .home-link
    margin-right 2rem
    position relative
    top .6rem
    @media (max-width: $MQMobile) {
      margin-right 1.5rem
      top .4rem
    }
  #handsontable-logo
    height $navbarHeight - 2.2rem
    @media (max-width: $MQMobile) {
      height 1rem
    }
  .links
    box-sizing border-box
    background-color white
    white-space nowrap
    font-size 0.9rem
    position absolute
    right $navbar-horizontal-padding
    top $navbar-vertical-padding
    display flex
    align-items center
    .search-box
      flex: 0 0 auto
      vertical-align top
@media (max-width: $MQMobile)
  .navbar
    padding-left 4rem
    .can-hide
      display none

</style>

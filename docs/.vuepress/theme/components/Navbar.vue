<template>
  <header class="navbar">
    <div class="navbar-wrapper">
      <SidebarButton @toggle-sidebar="$emit('toggle-sidebar')" />
  
      <RouterLink
          :to="frameworkUrlPrefix"
          class="home-link"
      >
  
      <Logo />
  
      </RouterLink>
      <VersionsDropdown></VersionsDropdown>
      <FrameworksDropdown></FrameworksDropdown>
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
    </div>
  </header>
</template>

<script>
import AlgoliaSearchBox from '@AlgoliaSearchBox';
import SearchBox from '@theme/components/SearchBox';
import SidebarButton from '@theme/components/SidebarButton.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import VersionsDropdown from '@theme/components/VersionsDropdown.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';
import Logo from './Logo.vue';

export default {
  name: 'Navbar',
  components: {
    FrameworksDropdown,
    SidebarButton,
    NavLinks,
    SearchBox,
    AlgoliaSearchBox,
    VersionsDropdown,
    ThemeSwitcher,
    Logo
  },
  data() {
    return {
      linksWrapMaxWidth: null
    };
  },
  computed: {
    frameworkUrlPrefix() {
      return `/${this.$page.currentFramework}${this.$page.frameworkSuffix}/`;
    },
    algolia() {
      return this.$themeLocaleConfig.algolia || this.$site.themeConfig.algolia || {};
    },
    isAlgoliaSearch() {
      return this.algolia && this.algolia.apiKey && this.algolia.indexName;
    }
  },
  mounted() {
    const MOBILE_DESKTOP_BREAKPOINT = 769; // refer to config.styl
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

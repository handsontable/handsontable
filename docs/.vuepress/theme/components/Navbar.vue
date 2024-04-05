<template>
  <header class="navbar">
    <div class="navbar-wrapper">
      <RouterLink
          :to="frameworkUrlPrefix"
          class="home-link"
      >
        <Logo />
      </RouterLink>
      
      <div class="top-bar">
        <div class="top-bar_left">
          <div class="framework-and-version">
            <FrameworksDropdown/>
            <!--<VersionsDropdown></VersionsDropdown>-->
          </div>
        </div>

        <AlgoliaSearch
          v-if="isAlgoliaSearch"
          :options="algolia"
        />

        <div class="menu">
          <NavLinks/>
          <ExternalNavLinks/>
        
          <nav class="icons-nav">
            <!--<ThemeSwitcher />-->
            <span class="news"><i class="ico i-bell"></i></span>
            <a href="https://github.com/handsontable/handsontable" class="github-stars"><i class="ico i-github"></i> 18921</a>

            <button @click="$emit('toggle-sidebar')" class="menuButton">
              <i class="ico i-menu"></i>
              <i class="ico i-close"></i>
            </button>
          </nav>
        </div>
      </div>
      
    </div>
  </header>
</template>

<script>
import AlgoliaSearch from '@theme/components/AlgoliaSearch.vue';
import Logo from '@theme/components/Logo.vue';
import SidebarButton from '@theme/components/SidebarButton.vue';
import NavLinks from '@theme/components/NavLinks.vue';
//import VersionsDropdown from '@theme/components/VersionsDropdown.vue';
//import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';
import ExternalNavLinks from '@theme/components/ExternalNavLinks.vue';
import SidebarLinks from '@theme/components/SidebarLinks.vue';

export default {
  name: 'Navbar',
  components: {
    Logo,
    FrameworksDropdown,
    SidebarButton,
    NavLinks,
    AlgoliaSearch,
    // VersionsDropdown,
    // ThemeSwitcher,
    Logo,
    ExternalNavLinks,
    SidebarLinks
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
    },
    frameworkUrlPrefix() {
      return `/${this.$page.currentFramework}${this.$page.frameworkSuffix}/`;
    }
  },
  mounted() {
    // Initialize Headway widget
    var config = {
      selector: ".news",
      account: "xaD6ry"
    };
    Headway.init(config);
  }
};
</script>

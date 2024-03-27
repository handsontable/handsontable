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

      <NavLinks class="can-hide" />

      <FrameworksDropdown></FrameworksDropdown>

      <div class="nav-links-right">
        <AlgoliaSearch
          v-if="isAlgoliaSearch"
          :options="algolia"
        />
        <VersionsDropdown class="can-hide"></VersionsDropdown>
        <ExternalNavLinks class="can-hide" />
        <ThemeSwitcher />
      </div>
    </div>
  </header>
</template>

<script>
import AlgoliaSearch from '@theme/components/AlgoliaSearch.vue';
import SidebarButton from '@theme/components/SidebarButton.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import VersionsDropdown from '@theme/components/VersionsDropdown.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';
import Logo from '@theme/components/Logo.vue';
import ExternalNavLinks from '@theme/components/ExternalNavLinks.vue';

export default {
  name: 'Navbar',
  components: {
    FrameworksDropdown,
    SidebarButton,
    NavLinks,
    AlgoliaSearch,
    VersionsDropdown,
    ThemeSwitcher,
    Logo,
    ExternalNavLinks
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
  }
};
</script>

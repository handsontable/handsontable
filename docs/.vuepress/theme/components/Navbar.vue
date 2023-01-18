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
        <SearchBox />
        <VersionsDropdown class="can-hide"></VersionsDropdown>
        <ExternalNavLinks class="can-hide" />
        <ThemeSwitcher />
      </div>
    </div>
  </header>
</template>

<script>
import SearchBox from '@theme/components/SearchBox';
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
    SearchBox,
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
    frameworkUrlPrefix() {
      return `/${this.$page.currentFramework}${this.$page.frameworkSuffix}/`;
    }
  }
};
</script>

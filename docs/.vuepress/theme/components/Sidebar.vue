<template>
  <aside class="sidebar">
    <InfoBox />
    <slot name="top" />

    <div class="sidebar-nav">
      <div class="mobile-nav">
        <FrameworksDropdown />
        <NavLinks />
      </div>
      <SidebarLinks :depth="0" :items="items" />
    </div>
    <slot name="bottom" />
  </aside>
</template>

<script>
import SidebarLinks from '@theme/components/SidebarLinks.vue';
import Logo from '@theme/components/Logo.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import VersionsDropdown from '@theme/components/VersionsDropdown.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';
import ExternalNavLinks from '@theme/components/ExternalNavLinks.vue';
import InfoBox from '@theme/components/InfoBox.vue';

export default {
  name: 'Sidebar',
  components: {
    Logo,
    SidebarLinks,
    FrameworksDropdown,
    NavLinks,
    VersionsDropdown,
    ThemeSwitcher,
    ExternalNavLinks,
    InfoBox,
  },
  props: ['items'],
  data() {
    return {
      osInstance: undefined,
    };
  },
  computed: {
    frameworkUrlPrefix() {
      return `/${this.$page.currentFramework}${this.$page.frameworkSuffix}/`;
    },
  },
  methods: {
    scrollToActiveElement(path) {
      const sidebar = document.querySelector('.sidebar-nav');
      const { scrollTop, offsetHeight } = sidebar;

      const element = `.sidebar-links .sidebar-link[href='/docs${path}']`;
      const top = document?.querySelector(element)?.closest('.sidebar-group')?.offsetTop || 0;

      if (top > scrollTop + offsetHeight - 50) {
        setTimeout(() => {
          sidebar.scrollTo({ top, behavior: 'smooth' });
        }, 500);
      }
    },
  },
  mounted() {
    this.scrollToActiveElement(this.$route.path);
  },
  watch: {
    $route(to, from) {
      if (from.path !== to.path) {
        this.scrollToActiveElement(to.path);
      }
    },
  },
};
</script>

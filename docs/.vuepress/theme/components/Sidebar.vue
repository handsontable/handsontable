<template>
  <aside class="sidebar">
    <InfoBox />
    <slot name="top" />

    <div class="sidebar-nav">
      <div class="mobile-nav">
        <FrameworksDropdown/>
        <NavLinks/>
      </div>
      <SidebarLinks :depth="0" :items="items" />
    </div>
    <slot name="bottom" />
  </aside>
</template>

<script>
import SidebarLinks from '@theme/components/SidebarLinks.vue';
import Logo from '@theme/components/Logo.vue';
// import SearchBox from '@theme/components/SearchBox';
import NavLinks from '@theme/components/NavLinks.vue';
import VersionsDropdown from '@theme/components/VersionsDropdown.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';
import ExternalNavLinks from '@theme/components/ExternalNavLinks.vue';
import InfoBox from '@theme/components/InfoBox.vue';
import 'overlayscrollbars/styles/overlayscrollbars.css';
import { OverlayScrollbars } from 'overlayscrollbars';

export default {
  name: 'Sidebar',

  components: {
    Logo,
    SidebarLinks,
    FrameworksDropdown,
    NavLinks,
    // SearchBox,
    VersionsDropdown,
    ThemeSwitcher,
    ExternalNavLinks,
    InfoBox,
  },
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
      const { viewport } = this.osInstance.elements();
      const { scrollTop, offsetHeight } = viewport;

      const element = `.sidebar-links .sidebar-link[href='/docs${path}']`;
      const top = document?.querySelector(element)?.offsetTop;

      if (top > scrollTop + offsetHeight - 50) {
        setTimeout(() => {
          viewport.scrollTo({ top });
        }, 200);
      }
    },
  },
  mounted() {
    this.osInstance = OverlayScrollbars(
      document.querySelector('.sidebar-nav'),
      {
        overflow: {
          x: 'hidden',
        },
        scrollbars: {
          autoHide: 'leave',
        },
      }
    );

    this.scrollToActiveElement(this.$route.path);
  },
  watch: {
    $route(to, from) {
      if (from.path !== to.path) {
        this.scrollToActiveElement(to.path);
      }
    },
  },

  props: ['items'],
};
</script>

<template>
  <aside class="sidebar">

    <div class="framework-switcher-item">
     <FrameworksDropdown class="sidebar-mode"/>
    </div>
    <NavLinks />

    <InfoBox />
    <slot name="top" />

    <div class="sidebar-nav">
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
    // TEMP Tags
    // eslint-disable-next-line max-len
    const selector1 = document.querySelector(
      '.sidebar .sidebar-nav .sidebar-links > li:first-child li:nth-child(2) a '
    );

    if (selector1) {
      // selector1.appendChild(chips1);
      // chips1.classList.add('tag-new');
      // chips1.classList.add('tag-update');
      // chips1.classList.add('tag-deprecated');
      // chips1.textContent = 'Updated';
    } else {
      // eslint-disable-next-line no-console
      console.error('Element not found with the given selector');
    }

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

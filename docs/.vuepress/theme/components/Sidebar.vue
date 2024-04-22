<template>
  <aside class="sidebar">
    <InfoBox />
    <slot name="top" />

    <div class="sidebar-nav">
    <SidebarLinks
      :depth="0"
      :items="items"
    />
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
    InfoBox
  },
  computed: {
    frameworkUrlPrefix() {
      return `/${this.$page.currentFramework}${this.$page.frameworkSuffix}/`;
    }
  },
  mounted() {
    // TEMP Tags
    // eslint-disable-next-line max-len
    const selector1 = document.querySelector('.sidebar .sidebar-nav .sidebar-links > li:first-child li:nth-child(2) a ');
    const chips1 = document.createElement('span');

    if (selector1) {
      selector1.appendChild(chips1);
      // chips1.classList.add('tag-new');
      chips1.classList.add('tag-update');
      // chips1.classList.add('tag-deprecated');
      chips1.textContent = 'Updated';
    } else {
      console.error('Element not found with the given selector');
    }

    OverlayScrollbars(document.querySelector('.sidebar-nav'), {
      overflow: {
        x: 'hidden',
      },
      scrollbars: {
        autoHide: 'leave'
      }
    });
  },

  props: ['items']
};
</script>

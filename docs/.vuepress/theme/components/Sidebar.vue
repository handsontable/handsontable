<template>
  <aside class="sidebar">

    <div class="framework-switcher-item">
      <span>Framework</span> <FrameworksDropdown class="sidebar-mode"/>
    </div>

    <NavLinks class="sidebar-mode additional-menu" />

    <slot name="top" />

    <SidebarLinks
      :depth="0"
      :items="items"
    />
    <slot name="bottom" />

    <VersionsDropdown class="can-hide additional-menu"></VersionsDropdown>

    <ExternalNavLinks class="can-hide additional-menu" />

    <div class="theme-switcher-item">
      Dark mode <ThemeSwitcher />
    </div>
  </aside>
</template>

<script>
import SidebarLinks from '@theme/components/SidebarLinks.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import VersionsDropdown from '@theme/components/VersionsDropdown.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';
import ExternalNavLinks from '@theme/components/ExternalNavLinks.vue';

export default {
  name: 'Sidebar',

  components: {
    SidebarLinks,
    NavLinks,
    ThemeSwitcher,
    FrameworksDropdown,
    VersionsDropdown,
    ExternalNavLinks
  },

  props: ['items']
};
</script>

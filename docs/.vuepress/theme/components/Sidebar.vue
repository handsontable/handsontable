<template>
  <aside class="sidebar">

    <NavLinks class="sidebar-mode context-switcher" />
    
    <div class="framework-switcher-item">
      <span>Framework</span> <FrameworksDropdown class="sidebar-mode"/>
    </div>

    <slot name="top" />

    <SidebarLinks
      :depth="0"
      :items="items"
    />
    <slot name="bottom" />

    <div class="theme-switcher-item">
      Dark mode <ThemeSwitcher />
    </div>
  </aside>
</template>

<script>
import SidebarLinks from '@theme/components/SidebarLinks.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';

export default {
  name: 'Sidebar',

  components: { SidebarLinks, NavLinks, ThemeSwitcher, FrameworksDropdown },

  props: ['items']
};
</script>

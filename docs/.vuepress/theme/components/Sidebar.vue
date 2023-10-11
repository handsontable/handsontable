<template>
  <aside class="sidebar">
    <RouterLink
        :to="frameworkUrlPrefix"
        class="home-link"
    >
      <Logo />
    </RouterLink>

    <div class="info-box">
      <span><i class="ico i-bell"></i></span>
      <div>
        <p>v13.1.0 is out</p>
        <a>Read more</a>
      </div>
      <a class="close" @click="closeInfoBox"><i class="ico i-close"></i></a>
    </div>

    <slot name="top" />

    <SidebarLinks
      :depth="0"
      :items="items"
    />
    <slot name="bottom" />

    

  </aside>
</template>

<script>
import SidebarLinks from '@theme/components/SidebarLinks.vue';
import Logo from '@theme/components/Logo.vue';
import SearchBox from '@theme/components/SearchBox';
import NavLinks from '@theme/components/NavLinks.vue';
import VersionsDropdown from '@theme/components/VersionsDropdown.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';
import ExternalNavLinks from '@theme/components/ExternalNavLinks.vue';

export default {
  name: 'Sidebar',

  components: {
    Logo,
    SidebarLinks,
    FrameworksDropdown,
    NavLinks,
    SearchBox,
    VersionsDropdown,
    ThemeSwitcher,
    ExternalNavLinks
  },
  computed: {
    frameworkUrlPrefix() {
      return `/${this.$page.currentFramework}${this.$page.frameworkSuffix}/`;
    }
  },
  methods: {
    //Close InfoBox
    closeInfoBox() {
      const infobox = document.querySelector('.sidebar .info-box');
        infobox.style.display = 'none'; // Hide the info-box
    }
  },

  mounted() {
    // TEMP Tags 
    const selector1 = document.querySelector('.sidebar > ul > li:first-child li:first-child a');
    const selector2 = document.querySelector('.sidebar > ul > li:first-child li:nth-child(2) a ');
    const chips1 = document.createElement('span');
    const chips2 = document.createElement('span');
    
    selector1.appendChild(chips1);
    selector2.appendChild(chips2);

    chips1.classList.add('tag-update');
    chips2.classList.add('tag-new');
    chips1.textContent = 'Updated';
    chips2.textContent = 'New';
  },

  props: ['items']
};
</script>

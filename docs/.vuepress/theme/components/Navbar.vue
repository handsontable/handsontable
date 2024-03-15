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
          <SearchBox/>
        </div>

        <div class="menu">
          <NavLinks/>
          <ExternalNavLinks/>
        
          <nav class="icons-nav">
            <!--<ThemeSwitcher />-->
            <a href="https://github.com/handsontable/handsontable"><i class="ico i-bell"></i></a>
            <a href="https://github.com/handsontable/handsontable"><i class="ico i-github"></i></a>

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
import SearchBox from '@theme/components/SearchBox';
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
    SearchBox,
    //VersionsDropdown,
    //ThemeSwitcher,
    ExternalNavLinks,
    SidebarLinks
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

<template>
  <header class="navbar">
    <div class="navbar-wrapper">
      <Logo />
      
      <!--<div class="framework-and-version">
        <FrameworksDropdown/>
        <VersionsDropdown></VersionsDropdown>
      </div>
    -->

      <SearchBox/>

      <div class="menu">
      <!--
        <NavLinks/>
        <ExternalNavLinks/>
      -->
        
        <nav class="icons-nav">
          
          <ThemeSwitcher />
          <a href="https://github.com/handsontable/handsontable"><i class="ico i-github"></i></a>
          
          <button @click="$emit('toggle-sidebar')" class="menuButton">
            <i class="ico i-menu"></i>
            <i class="ico i-close"></i>
          </button>
        </nav>
      </div>
      
    </div>
  </header>
</template>

<script>
import SearchBox from '@theme/components/SearchBox';
import Logo from '@theme/components/Logo.vue';
import SidebarButton from '@theme/components/SidebarButton.vue';
import NavLinks from '@theme/components/NavLinks.vue';
import VersionsDropdown from '@theme/components/VersionsDropdown.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
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
    VersionsDropdown,
    ThemeSwitcher,
    ExternalNavLinks,
    SidebarLinks
  },
  data() {
    return {
      linksWrapMaxWidth: null
    };
  }
};
</script>

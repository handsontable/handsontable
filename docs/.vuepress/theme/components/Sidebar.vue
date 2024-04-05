<template>
  


  <aside class="sidebar">

    <div class="info-box">
      <span><i class="ico i-bell"></i></span>
      <div>
        <p>v13.1.0 is out</p>
        <a>Read more</a>
      </div>
      <a class="close" @click="closeInfoBox"><i class="ico i-close"></i></a>
    </div>

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
import 'overlayscrollbars/styles/overlayscrollbars.css';
import { 
  OverlayScrollbars,
  ScrollbarsHidingPlugin, 
  SizeObserverPlugin, 
  ClickScrollPlugin
} from 'overlayscrollbars';


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
    const selector1 = document.querySelector('.sidebar .sidebar-nav .sidebar-links > li:first-child li:nth-child(2) a ');
    const chips1 = document.createElement('span');
    
    if (selector1) {
      selector1.appendChild(chips1);

        chips1.classList.add('tag-new');
        chips1.textContent = 'New';
    } else {
        console.error("Element not found with the given selector");
    }
    
    const osInstance = OverlayScrollbars(document.querySelector('.sidebar-nav'), {
      overflow: {
        x: 'hidden',
      },
      scrollbars: {
        autoHide: 'leave'
      }
    })
    
  },

  props: ['items']
};
</script>

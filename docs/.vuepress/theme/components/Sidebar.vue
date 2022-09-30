<template>
  <aside class="sidebar">
    <div class="version-switcher-item">
      Version: <VersionsDropdown class="sidebar-mode"/>
    </div>
    <div class="framework-switcher-item">
      Framework: <FrameworksDropdown class="sidebar-mode"/>
    </div>
    <div class="theme-switcher-item">
      Choose a theme: <ThemeSwitcher />
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
import NavLinks from '@theme/components/NavLinks.vue';
import ThemeSwitcher from '@theme/components/ThemeSwitcher.vue';
import FrameworksDropdown from '@theme/components/FrameworksDropdown.vue';
import VersionsDropdown from '@theme/components/VersionsDropdown.vue';

export default {
  name: 'Sidebar',

  components: {
    SidebarLinks,
    NavLinks,
    ThemeSwitcher,
    FrameworksDropdown,
    VersionsDropdown,
  },

  props: ['items']
};
</script>

<style lang="stylus">
.theme-switcher-item {
    position relative
    display inline-block
    margin-left 1.5rem
    line-height 2rem
    font-weight 600
    margin-top 10px

    @media (min-width: $MQNarrow) {
      display none
    }
}

.version-switcher-item
  width 235px
  position relative
  display inline-block
  margin-left 1.5rem
  line-height 2rem
  font-weight 600
  margin-top 10px

  .nav-versions
    float right
    margin-left 0

    .nav-dropdown
      left unset

      @media (max-width: $MQMobile) {
        right -35px
      }

  @media (min-width: $MQMobileNarrow)
    display none

.framework-switcher-item
  width 235px
  position relative
  display inline-block
  margin-left 1.5rem
  line-height 2rem
  font-weight 600
  margin-top 10px

  .nav-frameworks
    float right
    margin-left 0

    .nav-dropdown
      left unset

      @media (max-width: $MQMobile) {
        right -35px
      }

  @media (min-width: $MQNarrow)
    display none

.sidebar
  width 17rem
  z-index 1000
  border-color #e9eef2
  background-color #fff

  @media (max-width: $MQMobile) {
    width 18rem
  }

  ul
    padding 0
    margin 0
    list-style-type none
  a
    display inline-block
  & > .sidebar-links
    padding 1.5rem 0
    @media (max-width: $MQNarrow) {
      padding-top 10px
    }
    & > li > a.sidebar-link
      padding 0.35rem 1.5rem 0.35rem 1.25rem
      font-weight 500
    & > li:not(:first-child)
      margin-top .75rem

  a.sidebar-link
    padding 0.3rem 1rem 0.3rem 2rem
    font-size 14px

  a.sidebar-link.active, a.sidebar-link:hover
    color #104bcd

  .sidebar-sub-headers a.sidebar-link
    color #4d6379

  a.sidebar-link.active
    font-weight 500;
    border-color #104bcd
    background-color #edf3fd

  .sidebar-heading
    position relative
    font-size 15px
    font-weight 500

  .sidebar-heading .arrow
    padding 3px
    position absolute
    top 40%
    right 1.3rem
    left auto
    border solid #cfdbe4
    border-width 0 2px 2px 0
    transform rotate(315deg)
    -webkit-transform rotate(315deg)

    &.down
      transform rotate(45deg)
      -webkit-transform rotate(45deg)

.sidebar > .sidebar-links > li:not(:first-child)
  margin-top 0

</style>

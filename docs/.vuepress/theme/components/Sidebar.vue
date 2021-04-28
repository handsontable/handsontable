<template>
  <aside class="sidebar">
    <NavLinks />

    <slot name="top" />

    <SidebarLinks
      :depth="0"
      :items="items"
    />
    <slot name="bottom" />
  </aside>
</template>

<script>
import SidebarLinks from '@theme/components/SidebarLinks.vue'
import NavLinks from '@theme/components/NavLinks.vue'

export default {
  name: 'Sidebar',

  components: { SidebarLinks, NavLinks },

  props: ['items']
}
</script>


<style lang="stylus">
  .sidebar
    width 18rem
    border-color #e9eef2
    background-color #fafbff

    @media (max-width: $MQMobile) {
      width 18rem
    }
    ul
      padding 0
      margin 0
      list-style-type none
    a
      display inline-block
    .nav-links
      display none
      border-bottom 1px solid $borderColor
      padding 0.5rem 0 0.75rem 0
      a
        font-weight 600
        @media (max-width: $MQMobile) {
          font-size 15px
        }
      .nav-item, .repo-link
        display block
        line-height 1.25rem
        font-size 1.1em
        padding 0.5rem 0 0.5rem 1.5rem
    & > .sidebar-links
      padding 1.5rem 0
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

  @media (max-width: $MQMobile)
    .sidebar
      .nav-links
        .mobile-dropdown-title
          font-size 15px
        display block
        .dropdown-wrapper .nav-dropdown .dropdown-item a.router-link-active::after
          top calc(1rem - 2px)
      & > .sidebar-links
        padding 1rem 0
</style>

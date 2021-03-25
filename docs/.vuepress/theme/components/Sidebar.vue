<template>
  <aside class="sidebar" v-bind:style="{bottom: this.offset+'px'}">
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
  data:()=>({
    offset:0
  }),
  components: { SidebarLinks, NavLinks },
  mounted() {
    if(window) {
      window.addEventListener('scroll', this.handleScroll);
    }
  },
  destroyed() {
    if(window) {
      window.removeEventListener('scroll', this.handleScroll);
    }
  },
  watch:{},
  methods: {
    handleScroll(){
      const offset =  Math.max(0,(window.innerHeight || document.documentElement.clientHeight) - document.querySelector('footer.footer').getBoundingClientRect().top);
      this.$el.scrollBy(0,offset-this.offset);
      this.offset = offset;
    }
  },

  props: ['items']
}
</script>

<style lang="stylus">
.sidebar
  border-color: #e9eef2;
  background-color: #fafbff;
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
    .nav-item, .repo-link
      display block
      line-height 1.25rem
      font-size 1.1em
      padding 0.5rem 0 0.5rem 1.5rem
  & > .sidebar-links
    padding 1.5rem 0
    & > li > a.sidebar-link
      font-size 1.1em
      line-height 1.7
      font-weight bold
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
    border-color #104bcd

  .sidebar-heading
    position relative
    font-size 15px
    
  .sidebar-heading .arrow
    padding 3px
    position absolute
    top 40%
    right 1.3rem
    left auto
    border solid #cfd4db
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
      display block
      .dropdown-wrapper .nav-dropdown .dropdown-item a.router-link-active::after
        top calc(1rem - 2px)
    & > .sidebar-links
      padding 1rem 0
</style>

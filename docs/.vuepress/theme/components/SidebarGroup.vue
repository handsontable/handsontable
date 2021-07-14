<template>
  <section
    class="sidebar-group"
    :class="[
      {
        collapsable,
        'is-sub-group': depth !== 0
      },
      `depth-${depth}`
    ]"
  >
    <RouterLink
      v-if="item.path"
      class="sidebar-heading clickable"
      :class="{
        open:isOpen,
        'active': isActive($route, item.path)
      }"
      :to="item.path"
      @click.native="toggleOpen()"
    >
      <span>{{ item.title }}</span>
      <span
        v-if="collapsable"
        class="arrow"
        :class="isOpen ? 'down' : 'right'"
      />
    </RouterLink>

    <p
      v-else
      class="sidebar-heading"
      :class="{ open:isOpen }"
      @click="toggleOpen()"
    >
      <span>{{ item.title }}</span>
      <span
        v-if="collapsable"
        class="arrow"
        :class="isOpen ? 'down' : 'right'"
      />
    </p>

    <DropdownTransition>
      <SidebarLinks
        v-if="isOpen || !collapsable"
        class="sidebar-group-items"
        :items="item.children"
        :sidebar-depth="item.sidebarDepth"
        :initial-open-group-index="item.initialOpenGroupIndex"
        :depth="depth + 1"
      />
    </DropdownTransition>
  </section>
</template>

<script>
import DropdownTransition from '@theme/components/DropdownTransition.vue';
import { isActive } from './util';

export default {
  name: 'SidebarGroup',

  components: {
    DropdownTransition
  },

  props: [
    'item',
    'open',
    'collapsable',
    'depth'
  ],

  // ref: https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
  beforeCreate() {
    // eslint-disable-next-line global-require
    this.$options.components.SidebarLinks = require('@theme/components/SidebarLinks.vue').default;
  },
  data() {
    return {
      isOpen: this.open
    };
  },
  methods: {
    isActive,
    toggleOpen() {
      this.isOpen = !this.isOpen;
    }
  },
  watch: {
    open(val) {
      if (val) {
        this.isOpen = val;
      }
    }
  }
};
</script>

<style lang="stylus">
.sidebar-group
  .sidebar-group
    padding-left 0.5em
  &:not(.collapsable)
    .sidebar-heading:not(.clickable)
      cursor auto
      color inherit
  // refine styles of nested sidebar groups
  &.is-sub-group
    padding-left 0
    & > .sidebar-heading
      font-size 0.95em
      line-height 1.4
      font-weight normal
      padding-left 2rem
      &:not(.clickable)
        opacity 0.5
    & > .sidebar-group-items
      padding-left 1rem
      & > li > .sidebar-link
        font-size: 0.95em;
        border-left none
  &.depth-2
    & > .sidebar-heading
      border-left none

.sidebar-heading
  color $textColor
  cursor pointer
  font-size 1.1em
  font-weight bold
  padding 0.35rem 1.5rem 0.35rem 1.25rem
  width 100%
  box-sizing border-box
  margin 0
  border-left 0.25rem solid transparent
  &.open, &:hover
    color inherit
  .arrow
    position relative
    top -0.12em
    left 0.5em
  &.clickable
    &.active
      font-weight 600
      color $accentColor
      border-left-color $accentColor
    &:hover
      color $accentColor

.sidebar-group-items
  transition height .1s ease-out
  font-size 0.95em
  overflow hidden

</style>

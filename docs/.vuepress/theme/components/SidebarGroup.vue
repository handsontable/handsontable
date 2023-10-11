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
      <i 
        class="ico"
        :class="item.children[0].key "
      />
      <span>{{ item.title }}</span>
      <i
          v-if="collapsable"
          class="ico i-arrow"
          :class="isOpen ? 'down' : 'right'"
        />
    </RouterLink>

    <p
      v-else
      class="sidebar-heading"
      :class="{ open:isOpen }"
      @click="toggleOpen()"
    >
      <i 
        class="ico"
        :class="item.children[0].key "
      />
      <span>{{ item.title }}</span>

      <i
        v-if="collapsable"
        class="ico i-arrow"
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
import { isActive } from '@vuepress/theme-default/util';

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
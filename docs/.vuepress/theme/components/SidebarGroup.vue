<template>
  <section
    class="sidebar-group"
    :class="[
      {
        collapsable,
        open: isOpen || Boolean(item.path),
        'is-sub-group': depth !== 0,
      },
      `depth-${depth}`,
    ]"
  >
    <RouterLink
      v-if="item.path"
      class="sidebar-heading clickable"
      :class="{
        active: isActive($route, item.path),
      }"
      :to="item.path"
      @click.native="toggleOpen()"
    >
      <i class="ico" :class="item.children[0].key" />
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
      @click="toggleOpen()"
      @keyup.enter="toggleOpen"
      tabindex="0"
      role="button"
    >
      <i class="ico" :class="item.children[0].key" />
      <span>{{ item.title }}</span>

      <i
        v-if="collapsable"
        class="ico i-arrow"
        :class="isOpen ? 'down' : 'right'"
      />
    </p>

    <!-- Node: Workaround for filtering an empty item element from an items array. Some warn is logged
        in the console otherwise -->
    <SidebarLinks
      :class="{ 'd-none': isOpen === false, 'sidebar-group-items': true }"
      :items="item.children.filter((child) => child.path)"
      :sidebar-depth="item.sidebarDepth"
      :initial-open-group-index="item.initialOpenGroupIndex"
      :depth="depth + 1"
    />
  </section>
</template>

<script>
import { isActive } from '@vuepress/theme-default/util';

export default {
  name: 'SidebarGroup',

  props: ['item', 'open', 'collapsable', 'depth'],

  // ref: https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
  beforeCreate() {
    // eslint-disable-next-line global-require
    this.$options.components.SidebarLinks = require('@theme/components/SidebarLinks.vue').default;
  },
  data() {
    return {
      isOpen: this.open,
    };
  },
  methods: {
    isActive,
    toggleOpen() {
      this.isOpen = !this.isOpen;
    },
    setTabIndex() {
      setTimeout(() => {
        const lists = document.querySelectorAll('.sidebar-group-items');

        lists.forEach((element) => {
          if ([...element.classList].includes('d-none')) {
            [...element.children].forEach((li) => {
              li.firstChild.setAttribute('tabindex', '-1');
            });
          } else {
            [...element.children].forEach((li) => {
              li.firstChild.setAttribute('tabindex', '0');
            });
          }
        });
      }, 100);
    },
  },
  mounted() {
    this.setTabIndex();
  },
  watch: {
    open(val) {
      if (val) {
        this.isOpen = val;
      }
    },
    isOpen() {
      this.setTabIndex();
    },
  },
};
</script>

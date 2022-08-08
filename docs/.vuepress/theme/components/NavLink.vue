<template>
  <RouterLink
    v-if="isRouterLink"
    class="nav-link"
    :to="link"
    :exact="exact"
    @focusout.native="focusoutAction"
  >
    {{ item.text }}
  </RouterLink>
  <a
    v-else
    :href="link"
    class="nav-link external"
    :target="target"
    :rel="rel"
    @focusout="focusoutAction"
  >
    {{ item.text }}
    <OutboundLink v-if="isBlankTarget" />
  </a>
</template>

<script>
import { isExternal, isMailto, isTel, ensureExt } from '@vuepress/theme-default/util';

export default {
  name: 'NavLink',

  props: {
    item: {
      required: true
    }
  },

  computed: {
    link() {
      return ensureExt(this.item.link);
    },
    isHtmlLink() {
      return !!this.item.isHtmlLink;
    },
    exact() {
      if (this.$site.locales) {
        return Object.keys(this.$site.locales).some(rootLink => rootLink === this.link);
      }

      return this.link === `/${this.$page.currentFramework}${this.$page.frameworkSuffix}/`;
    },

    isNonHttpURI() {
      return isMailto(this.link) || isTel(this.link);
    },

    isBlankTarget() {
      return this.target === '_blank';
    },

    isInternal() {
      return !isExternal(this.link) && !this.isBlankTarget;
    },
    isRouterLink() {
      return this.isInternal && !this.isHtmlLink;
    },
    target() {
      if (this.isNonHttpURI) {
        return null;
      }
      if (this.item.target) {
        return this.item.target;
      }

      return isExternal(this.link) ? '_blank' : '';
    },

    rel() {
      if (this.isNonHttpURI) {
        return null;
      }
      if (this.item.rel === false) {
        return null;
      }
      if (this.item.rel) {
        return this.item.rel;
      }

      return this.isBlankTarget ? 'noopener noreferrer' : null;
    }
  },

  methods: {
    focusoutAction() {
      this.$emit('focusout');
    }
  }
};
</script>

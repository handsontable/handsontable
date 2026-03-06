<template>
  <transition name="slide-fade">
    <div class="info-box" v-if="show && getVersion">
      <span><i class="ico i-bell"></i></span>
      <div>
        <p>What's new in {{ getVersion }}</p>
        <RouterLink :to="getVersionUrl">
          Learn more <span class="visually-hidden">Learn more about new version</span>
        </RouterLink>
      </div>
      <button type="button" aria-label="Close info box" class="close" @click="closeInfoBox">
        <i class="ico i-close"></i>
      </button>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'InfoBox',
  data() {
    return {
      show: false,
    };
  },
  methods: {
    // Close InfoBox
    closeInfoBox() {
      this.show = false;
      localStorage.setItem('docsVersion', this.getVersion);
    },
  },
  computed: {
    getVersion() {
      // return latest version in a format major.minor.patch
      const versions = this.$page.versionsWithPatches?.size
        ? [...this.$page.versionsWithPatches]
        : [];

      if (versions.length && versions[0].length >= 2 && versions[0][1].length) {
        return `${versions[0][1][0]}`;
      }

      if (versions.length && versions[1].length >= 2 && versions[1][1].length) {
        return `${versions[1][1][0]}`;
      }

      return 'Next';
    },
    getVersionUrl() {
      // eslint-disable-next-line max-len
      return `/${this.$page.currentFramework}${this.$page.frameworkSuffix}/changelog/#_${this.getVersion.replaceAll('.', '-')}`;
    },
  },
  mounted() {
    const docsVersion = localStorage.getItem('docsVersion');

    if (!docsVersion || docsVersion !== this.getVersion) {
      this.show = true;
    }
  },
};
</script>

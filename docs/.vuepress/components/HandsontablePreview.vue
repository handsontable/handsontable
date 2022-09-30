<template>
<div>
  <div ref="slotContainer" style="display: none;">
    <slot></slot>
  </div>
  <script ref="hotScript"></script>
</div>
</template>

<script>
export default {
  name: 'HandsontablePreview',
  props: ['scriptContent'],
  computed: {
    currentVersion() {
      return this.$page.currentVersion;
    }
  },
  mounted() {
    const slotContent = this.$slots.default[0].elm.innerText;

    this.$refs.slotContainer.parentNode.removeChild(this.$refs.slotContainer);

    this.$refs.hotScript.innerHTML = `\
useHandsontable('${this.currentVersion}', () => {
${slotContent}
});
`;
  }
};
</script>

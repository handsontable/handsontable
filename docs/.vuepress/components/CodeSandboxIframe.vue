<template>
  <iframe
    :src="srcUrl"
    :title="title"
    class="codeSandboxIframe"
    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone;
      midi; payment; usb; vr; xr-spatial-tracking"
    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
  ></iframe>
</template>

<script>
export default {
  name: 'CodeSandboxIframe',
  props: ['id', 'title', 'selectedFile'],
  computed: {
    srcUrl() {
      const theme = 'light';
      const urlStart = 'https://codesandbox.io/embed/';
      const selectedFile = encodeURIComponent(this.selectedFile);
      const urlEnd = `?fontsize=13&hidenavigation=1&&module=${selectedFile}&theme=${theme}&view=preview&runonclick=1`;

      return `${urlStart}${this.id}${urlEnd}`;
    }
  }
};
</script>

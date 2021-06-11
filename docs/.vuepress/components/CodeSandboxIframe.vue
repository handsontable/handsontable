<template>
  <iframe
    :src="srcUrl"
    :title="title"
    style="width: 100%; height: 500px; border: 0; border-radius: 4px; overflow: hidden;"
    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; 
      midi; payment; usb; vr; xr-spatial-tracking"
    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
  ></iframe>
</template>

<script>
export default {
  name: 'CodeSandboxIframe',
  props: ['id', 'title'],
  computed: {
    srcUrl() {
      return 'https://codesandbox.io/embed/' + this.id + 
        '?fontsize=14&hidenavigation=1&theme=dark&view=preview&runonclick=1';
    }
  }
}
</script>

<template>
</template>

<script>
const decode = (base64data) => {
  return decodeURI(base64data);
};

const useCodePreview = (code) => {
  const scriptElement = document.createElement('script');

  scriptElement.type = 'text/javascript';
  scriptElement.innerHTML = code;

  return [
    (container) => {
      container.appendChild(scriptElement);

      return () => { scriptElement.parentElement.removeChild(scriptElement); };
    },
  ];
};

export default {
  name: 'ScriptLoader',
  props: ['code'],
  mounted() {
    const [append] = useCodePreview(decode(this.$props.code));

    this.removeScript = append(this.$el);
  },
  beforeDestroy() {
    this.removeScript();
  },
  methods: {
    decode
  }
};
</script>

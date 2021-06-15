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
    (container) => { container.append(scriptElement); },
    () => { scriptElement.remove(); },
  ];
};

export default {
  name: 'ScriptLoader',
  props: ['code'],
  mounted() {
    const [append, remove] = useCodePreview(decode(this.$props.code));

    append(this.$el);
    remove();
  },
  methods: {
    decode
  }
};
</script>

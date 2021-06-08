<template>
  <button v-on:click="toggleTheme" >Yo! {{current}}</button>
</template>

<script>
const CLASS_THEME_DARK = 'theme-dark';
const DEFAULT_THEME_CLASS = 'theme-light';

const getBodyElement = () => {
  return document.querySelector('body');
}

const getBodyThemeClass = () => {
  return getBodyElement().classList.contains(CLASS_THEME_DARK) ? CLASS_THEME_DARK : DEFAULT_THEME_CLASS;
}

const toggleClassOnBody = () => {
  const body = getBodyElement();
  const isDefaultTheme = body.classList.contains(DEFAULT_THEME_CLASS);

  body.classList.remove(isDefaultTheme ? DEFAULT_THEME_CLASS : CLASS_THEME_DARK);
  body.classList.add(isDefaultTheme ? CLASS_THEME_DARK : DEFAULT_THEME_CLASS);
}

const setClassOnBody = (className) => {
  getBodyElement().classList.add(className);
}

export default {
  name: 'ThemeSwitcher',
  methods:{
    toggleTheme(){
      toggleClassOnBody();
      this.current = getBodyThemeClass();
    }
  },
  data(){
    return {
      current: DEFAULT_THEME_CLASS
    }
  },
  beforeMount() {
    setClassOnBody(DEFAULT_THEME_CLASS);
  }
};
</script>

<style lang="stylus">

</style>

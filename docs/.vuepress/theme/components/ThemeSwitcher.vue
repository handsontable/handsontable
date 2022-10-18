<template>
  <label id="switch" class="switch" :class="{ ready: isReady }">
    <div class="inner" v-show="isReady">
      <input type="checkbox" v-on:change="toggleTheme" :checked="isDarkTheme">
      <span class="slider round"></span>
    </div>
  </label>
</template>

<script>
const CLASS_THEME_DARK = 'theme-dark';
const STORAGE_KEY = 'handsontable/docs::color-scheme';
// The "SELECTED_COLOR_SCHEME" const is defined in the script that is injected in the VuePress config.js file.
// The script executes the logic before the VuePress app is initialized to prevent page flickering #8288.
const SELECTED_THEME = typeof window === 'undefined' ? undefined : window.SELECTED_COLOR_SCHEME;

export default {
  name: 'ThemeSwitcher',
  methods: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;

      localStorage.setItem(STORAGE_KEY, this.isDarkTheme ? 'dark' : 'light');

      if (this.isDarkTheme) {
        document.documentElement.classList.add(CLASS_THEME_DARK);
      } else {
        document.documentElement.classList.remove(CLASS_THEME_DARK);
      }
    }
  },
  data() {
    return {
      isDarkTheme: false,
      isReady: false,
    };
  },
  mounted() {
    this.isDarkTheme = SELECTED_THEME === 'dark';
    this.isReady = typeof SELECTED_THEME === 'string';
  },
};
</script>

<style lang="stylus">
/* Hide the theme switcher in the sidebar on wide screen and show on narrow screen */
.sidebar.sidebar .switch {
  display: none;
  margin-bottom: 0;

  @media (max-width: $large) {
    & {
      display: inline-block;
      left: 50px;
    }
  }

  @media (max-width: $medium) {
    & {
      left: 10px;
    }
  }
}
</style>

<style lang="stylus" scoped>
.switch {
  width: 60px;
  height: 32px;
  margin-left: 9px;
  position relative
  display inline-block
  top: 1px;

  /* Hide the theme switcher on narrow screen */
  @media (max-width: $large) {
    display none
  }
}
/* The switch - the box around the slider */
.inner {
  position: relative;
  width: 40px;
  height: 22px;
  left: 10px;
  top: 5px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
}

.switch.ready {
  & .slider {
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }
}

.slider:before {
  position: absolute;
  content: "";
  height: 21px;
  width: 21px;
  left: 0;
  top: 0;
  bottom: 0;
  margin: auto 0;
  /* Fallback for IE, should work in production */
  background: #ffffff url('{{$basePath}}/img/light-theme-icon.svg');
  background-size: 70%;
  background-repeat: no-repeat;
  background-position: center;
}

.switch.ready {
  & .slider:before {
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }
}

input:checked + .slider {
  background-color: #2196f3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196f3;
}

input:checked + .slider:before {
  transform: translateX(18px);
  /* Fallback for IE, should work in production */
  background: #ffffff url('{{$basePath}}/img/dark-theme-icon.svg');
  background-size: 70%;
  background-repeat: no-repeat;
  background-position: center;
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

</style>

<template>
  <div
    class="dropdown-wrapper"
    :class="{ open }"
  >
    <button
      class="dropdown-title"
      type="button"
      :aria-label="dropdownAriaLabel"
      @click="handleDropdown"
    >
      <span class="title">{{ item.text }}</span>
      <i
        class="ico i-arrow down"
      />
    </button>

    <DropdownTransition>
      <ul
        v-show="open"
        class="nav-dropdown"
      >
        <li
          v-for="(subItem, index) in item.items"
          :key="subItem.link || index"
          class="dropdown-item"
        >
          <h4 v-if="subItem.type === 'links'">
            {{ subItem.text }}
          </h4>

          <ul
            v-if="subItem.type === 'links'"
            class="dropdown-subitem-wrapper"
          >
            <li
              v-for="childSubItem in subItem.items"
              :key="childSubItem.link"
              class="dropdown-subitem"
            >
              <NavLink
                :item="childSubItem"
                @focusout="
                  isLastItemOfArray(childSubItem, subItem.items) &&
                    isLastItemOfArray(subItem, item.items) &&
                    setOpen(false)
                "
              />
            </li>
          </ul>

          <NavLink
            v-else
            :item="subItem"
            @click.native="itemClick(subItem)"
            @focusout="isLastItemOfArray(subItem, item.items) && setOpen(false)"
          />
        </li>
      </ul>
    </DropdownTransition>
  </div>
</template>

<script>
import NavLink from '@theme/components/NavLink.vue';
import DropdownTransition from '@theme/components/DropdownTransition.vue';
import last from 'lodash/last';

export default {
  name: 'DropdownLink',

  components: {
    NavLink,
    DropdownTransition
  },

  props: {
    item: {
      required: true
    },
  },

  data() {
    return {
      open: false
    };
  },

  computed: {
    dropdownAriaLabel() {
      return this.item.ariaLabel || this.item.text;
    }
  },

  watch: {
    $route() {
      this.open = false;
    }
  },

  methods: {
    itemClick(item) {
      this.$emit('item-click', item);
    },
    setOpen(value) {
      this.open = value;
    },

    isLastItemOfArray(item, array) {
      return last(array) === item;
    },

    /**
     * Open the dropdown when user tab and click from keyboard.
     *
     * Use event.detail to detect tab and click from keyboard. Ref: https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/detail
     * The Tab + Click is UIEvent > KeyboardEvent, so the detail is 0.
     *
     * @param {Event} event The click event.
     */

    handleDropdown(event) {
      const isTriggerByTab = event.detail === 0;

      if (isTriggerByTab || !isTriggerByTab) {
        this.setOpen(!this.open);
      }
    },

    handleClickOutside(event) {
      // Check if the clicked element is outside of the dropdown
      if (this.$el && !this.$el.contains(event.target)) {
        this.open = false;
      }
    }
  },
  mounted() {
    // Add global click event listener to detect clicks outside of the dropdown
    document.addEventListener('click', this.handleClickOutside);
  }
};
</script>

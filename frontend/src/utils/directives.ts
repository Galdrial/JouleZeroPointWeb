import type { Directive } from 'vue';

/**
 * Click-Outside Directive
 * Triggers a callback when a click event occurs outside the bound element.
 * Useful for closing modals, dropdowns, and context menus.
 */
export const vClickOutside: Directive = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      // Check if the click was outside the element and its children
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event);
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el: any) {
    document.body.removeEventListener('click', el.clickOutsideEvent);
  },
};

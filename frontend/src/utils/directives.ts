import type { Directive, DirectiveBinding } from 'vue';

type ClickOutsideElement = HTMLElement & { clickOutsideEvent?: (event: Event) => void };

/**
 * Click-Outside Directive
 * Triggers a callback when a click event occurs outside the bound element.
 * Useful for closing modals, dropdowns, and context menus.
 */
export const vClickOutside: Directive = {
  mounted(el: ClickOutsideElement, binding: DirectiveBinding) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event);
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el: ClickOutsideElement) {
    if (el.clickOutsideEvent) {
      document.body.removeEventListener('click', el.clickOutsideEvent);
    }
  },
};

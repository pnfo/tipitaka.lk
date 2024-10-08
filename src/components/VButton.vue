<template>
    <button class="flex items-center px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
        <component :is="prependIcon" class="w-5 h-5 mr-3" />
        <span class="pt-1"><slot></slot></span>
        <component :is="appendIcon" class="w-5 h-5 ml-3" />
    </button>
</template>

<script setup>
const props = defineProps({
    prependIcon: {
      type: Function,
      default: null
    },
    appendIcon: {
      type: Function,
      default: null
    },
  });

</script>
<template>
    <div
      class="flex items-center p-4 mb-4 rounded-lg bg-opacity-20"
      :class="[
        borderClass,
        colorClass
      ]"
    >
      <component 
        :is="iconComponent"
        class="flex-shrink-0 w-5 h-5 mr-3" 
      />
      <div class="flex-1">
        <slot></slot>
      </div>
    </div>
</template>
  
<script setup>
  import { computed } from 'vue';
  import { AlertTriangle, AlertOctagon, CheckCircle, Info, Bell } from 'lucide-vue-next';
  
  const props = defineProps({
    border: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: 'gray'
    }
  });
  
  const borderClass = computed(() => props.border ? 'border-l-4' : '');
  
  const colorClass = computed(() => {
    switch (props.color) {
      case 'warning':
        return 'bg-yellow-500 text-yellow-800 border-yellow-500 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700';
      case 'error':
        return 'bg-red-500 text-red-800 border-red-500 dark:bg-red-900 dark:text-red-100 dark:border-red-700';
      case 'success':
        return 'bg-green-500 text-green-800 border-green-500 dark:bg-green-900 dark:text-green-100 dark:border-green-700';
      case 'info':
        return 'bg-blue-500 text-blue-800 border-blue-500 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700';
      default:
        return 'bg-gray-500 text-gray-800 border-gray-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700';
    }
  });
  
  const iconComponent = computed(() => {
    switch (props.color) {
      case 'warning':
        return AlertTriangle;
      case 'error':
        return AlertOctagon;
      case 'success':
        return CheckCircle;
      case 'info':
        return Info;
      default:
        return Bell;
    }
  });

</script>
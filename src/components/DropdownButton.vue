<template>
<div> <!-- div to accept classes from the parent component -->
  <div class="relative inline-block" ref="dropdownRef">
    <!-- Dropdown Button -->
    <button
      class="flex items-center rounded-full focus:outline-none bg-opacity-90"
      :class="`${bgColor}-color ${buttonClasses}`"
      @click.stop="toggleDropdown">

      <slot name="button"></slot>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen && items.length && !disableDropdown"
      class="absolute flex flex-col w-max z-10 mt-2 rounded-md shadow-lg bg-[var(--bg-color)] 
      border-solid border-2 border-sky-400 dark:border-sky-700 border-solid border-2 focus:outline-none"
      :class="dropdownClasses">

      
        <button v-for="(item, index) in items"
            :key="index"
            @click="handleItemClick(item)"
            class="flex items-center px-4 py-2 text-md hover:bg-[var(--hover-color)] text-left">
          <slot name="item" :item="item">
            {{ item }}
          </slot>
        </button>
      
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  bgColor: {
    type: String,
    default: 'green', // Customizable background color
  },
  items: {
    type: Array,
    default: () => ['Item 1', 'Item 2', 'Item 3'],
  },
  disableDropdown: {
    type: Boolean,
    default: false,
  },
  dropdownClasses: { // positioning for the dropdown
    type: String,
    default: 'right-0',
  },
  buttonClasses: {
    type: String,
    default: 'px-4 py-2 text-white dark:text-black'
  }
})

// State
const isOpen = ref(false)
const dropdownRef = ref(null)

// Methods
const toggleDropdown = () => {
    if (props.disableDropdown) return
    isOpen.value = !isOpen.value
}

const handleItemClick = (item) => {
    emit('item-click', item)
    isOpen.value = false
}

// Emit event
const emit = defineEmits(['item-click'])

// Click outside handler using the ref
const closeDropdownIfClickedOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

// Lifecycle hooks for registering/unregistering the document click handler
onMounted(() => {
  document.addEventListener('click', closeDropdownIfClickedOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdownIfClickedOutside)
})
</script>

<style scoped>
/* Add custom styles if needed */
.green-color { @apply bg-green-700 dark:bg-green-300 hover:bg-green-900 hover:dark:bg-green-100 }
.gray-color { @apply bg-gray-700 dark:bg-gray-300 hover:bg-gray-900 hover:dark:bg-gray-100 }
</style>

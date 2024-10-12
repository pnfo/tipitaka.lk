<script setup>
// import { useSinhalaStore, dictionaryInfos } from '@/stores/sinhala'
// import { useSettingsStore } from '@/stores/savedStore'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, reactive, watch, onMounted } from 'vue';
import TextTab from '@/components/TextTab.vue'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, XIcon } from 'lucide-vue-next';
import { useTreeStore } from '@/stores/treeStore'
import { useTextStore } from '@/stores/textStore'

const route = useRoute(), router = useRouter(), treeStore = useTreeStore(), textStore = useTextStore()

const isSplit = false
const node = computed(() => treeStore.nodes[route.params.key])
const isActive = (i) => {
  return isSplit || i == textStore.activeTab
}

onMounted(async () => {
    if (!textStore.tabs.length) {
        await treeStore.openUpto(route.params.key) // make sure that the tree is loaded before
        textStore.addTab(route.params.key)
    }
});

</script>

<template>
  <div style="">
    <!-- Tab Handles -->
    <div v-if="textStore.tabs.length > 1" class="tabs flex space-x-4">
      <button v-for="(tab, i) in textStore.tabs" :key="i" class="cursor-pointer flex items-center justify-center  relative px-4 py-2"
        :class="{'tab-handle': !isActive(i), 'tab-handle-active': isActive(i), 'flex-1': isSplit}" @click="textStore.makeActive(i)">
        <span>{{ tab.node.text }}</span>
        <XIcon @click.stop="textStore.removeTab(i)" class="ml-2 w-5"></XIcon>
        <span class="bottom-border"></span>
      </button>
    </div>

    <!-- Tab Content Panels -->
    <div v-if="!isSplit" class="bg-white dark:bg-gray-800 p-4 border-t-2 border-blue-500 dark:border-blue-400 rounded-b-lg">
      <TextTab v-if="textStore.activeTab >= 0" :tabIndex="textStore.activeTab"></TextTab>
    </div>
    <div v-else class="flex space-x-4 bg-white dark:bg-gray-800 p-4 border-t-2 border-blue-500 dark:border-blue-400 rounded-b-lg">
      <div v-for="(tab, i) in textStore.tabs" :key="i" class="flex-1 p-2 min-w-[200px]" >
        <TextTab :tabIndex="i"></TextTab>
      </div>
    </div>

    <div class="flex space-x-4">
      <!-- <RouterLink :to="`/bookpage/${dictInfo.id}/${1}`"><VButton :prependIcon="ChevronFirst" class="nav-button"><span>මුල් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum - 1}`"><VButton :prependIcon="ChevronLeft" class="nav-button"><span>කළින් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum + 1}`"><VButton :appendIcon="ChevronRight" class="nav-button"><span>ඊළඟ පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${numberOfPages}`"><VButton :appendIcon="ChevronLast" class="nav-button"><span>අවසාන පිටුව</span></VButton></RouterLink> -->
    </div>

    <div class="container">
        
    </div>

  </div>
</template>

<style scoped>
.tab-handle {
  @apply text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white
            bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
            border-b-2 border-transparent hover:border-gray-400 dark:hover:border-gray-500
            rounded-t-lg transition-colors duration-200;
}
.tab-handle .bottom-border {
  @apply absolute left-0 right-0 bottom-0 h-1 bg-gray-300 dark:bg-gray-600;
}

.tab-handle-active {
  @apply text-gray-800 dark:text-white bg-white dark:bg-gray-800 border-b-2 border-blue-500 dark:border-blue-400
            rounded-t-lg transition-colors duration-200;
}
.tab-handle-active .bottom-border {
  @apply absolute left-0 right-0 bottom-0 h-1 bg-blue-500 dark:bg-blue-400;
}
</style>
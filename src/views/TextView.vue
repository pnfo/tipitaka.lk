<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, reactive, watch, onMounted } from 'vue';
import TextTab from '@/components/TextTab.vue'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, XIcon } from 'lucide-vue-next';
import { useTreeStore } from '@/stores/treeStore'
import { useTextStore } from '@/stores/textStore'
import { useSettingsStore } from '@/stores/savedStore'
import { Script, convert } from '@/pali-converter';

const route = useRoute(), router = useRouter(), treeStore = useTreeStore(), textStore = useTextStore(), settingsStore = useSettingsStore()

const node = computed(() => treeStore.nodes[route.params.key])
const isActive = (i) => {
  return settingsStore.settings.splitType != 'tabs' || i == textStore.activeTab
}

onMounted(async () => {
    if (!textStore.tabs.length) {
        await treeStore.openUpto(route.params.key) // make sure that the tree is loaded before
        textStore.addTab(route.params.key, route.params.script)
    }
});

</script>

<template>
  <div style="">
    <!-- Tab Handles -->
    <div v-if="textStore.tabs.length > 1 && settingsStore.settings.splitType != 'single'" class="relative">
      <div class="tabs flex space-x-4">
        <button v-for="(tab, i) in textStore.tabs" :key="i" class="cursor-pointer flex items-center justify-center  relative px-4 py-2"
          :class="{'tab-handle': !isActive(i), 'tab-handle-active z-10': isActive(i), 'flex-1': settingsStore.settings.splitType == 'columns'}" 
          @click="textStore.makeActive(i)">
          <span>{{ convert(tab.node.text, tab.paliScript, Script.SI) }}</span>
          <XIcon @click.stop="textStore.removeTab(i)" class="ml-2 w-5"></XIcon>
        </button>
      </div>
      <span class="absolute left-0 right-0 bottom-0 h-1 bg-blue-500 dark:bg-blue-400"></span>
    </div>

    <!-- Tab Content Panels -->
    <div v-if="settingsStore.settings.splitType != 'columns'" class="p-2 rounded-b-lg h-[calc(100vh-120px)] overflow-y-auto">
      <TextTab v-if="textStore.activeTab >= 0" :tabIndex="textStore.activeTab"></TextTab>
    </div>
    <div v-else class="flex space-x-4 rounded-b-lg">
      <div v-for="(tab, i) in textStore.tabs" :key="i" class="flex-1 p-2 min-w-[200px] h-[calc(100vh-120px)] overflow-y-auto" >
        <TextTab :tabIndex="i"></TextTab>
      </div>
    </div>

    <div class="flex space-x-4">
      <!-- <RouterLink :to="`/bookpage/${dictInfo.id}/${1}`"><VButton :prependIcon="ChevronFirst" class="nav-button"><span>මුල් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum - 1}`"><VButton :prependIcon="ChevronLeft" class="nav-button"><span>කළින් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum + 1}`"><VButton :appendIcon="ChevronRight" class="nav-button"><span>ඊළඟ පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${numberOfPages}`"><VButton :appendIcon="ChevronLast" class="nav-button"><span>අවසාන පිටුව</span></VButton></RouterLink> -->
    </div>
  </div>
</template>

<style scoped>
.tab-handle {
  @apply text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white
            hover:bg-gray-300 dark:hover:bg-gray-600
            rounded-t-lg transition-colors duration-200;
}

.tab-handle-active {
  @apply text-gray-800 dark:text-white bg-[var(--bg-color)] border-2 border-b-0 border-blue-500 dark:border-blue-400
            rounded-t-lg transition-colors duration-200;
}
</style>
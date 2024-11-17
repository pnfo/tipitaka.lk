<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, reactive, watch, onMounted } from 'vue';
import TextTab from '@/components/TextTab.vue'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, XIcon } from 'lucide-vue-next';
import { useTreeStore } from '@/stores/treeStore'
import { useTextStore } from '@/stores/textStore'
import { useSettingsStore } from '@/stores/savedStore'
import { Script, convert, isScript } from '@/pali-converter';
import DropdownButton from '@/components/DropdownButton.vue';
import { TranslationInfo } from '@/utils';

const route = useRoute(), router = useRouter(), treeStore = useTreeStore(), textStore = useTextStore(), settingsStore = useSettingsStore()

const node = computed(() => treeStore.nodes[route.params.key])
const isActive = (i) => {
  return settingsStore.settings.splitType != 'tabs' || i == textStore.activeTab
}
const getTabHandleText = (tab) => {
  const coll0 = tab.collections[0] // use the script of the first collection
  const scriptToUse = isScript(coll0) ? coll0 : TranslationInfo[coll0].script
  return convert(tab.node.text, scriptToUse, Script.SI)
}

onMounted(async () => {
    // if (!textStore.tabs.length) {
        await treeStore.openUpto(route.params.key) // make sure that the tree is loaded before
        const isFullSutta = route.params.offset == 'full'
        if (route.params.collection) {
          textStore.addTab(route.params.key, {collections: [route.params.collection], isFullSutta})
        } else {
          // shouldn't get here due to router 
        }
    // } else {
    //     console.log('come here')
    // }
});

</script>

<template>
  <div style="">
    <!-- Tab Handles -->
    <div v-if="textStore.tabs.length > 1 && settingsStore.settings.splitType != 'single'" class="relative">

      <template v-if="settingsStore.windowXY.X > 640">
        <div class="tabs flex space-x-4">
          <button v-for="(tab, i) in textStore.tabs" :key="i" class="cursor-pointer flex items-center justify-center  relative px-4 py-2"
            :class="{'tab-handle': !isActive(i), 'tab-handle-active z-10': isActive(i), 'flex-1': settingsStore.settings.splitType == 'columns'}" 
            @click="textStore.makeActive(i)">
            <span>{{ getTabHandleText(tab) }}</span>
            <XIcon @click.stop="textStore.removeTab(i)" class="ml-2 w-5 text-gray-500 hover:text-red-500"></XIcon>
          </button>
        </div>
        <span class="absolute left-0 right-0 bottom-0 h-1 bg-blue-500 dark:bg-blue-400"></span>
      </template>

      <DropdownButton v-else class="absolute top-2 left-1 z-10" bgColor="gray"
        :items="textStore.tabs.map((t, i) => i).filter(i => i != textStore.activeTab)"
        :disableDropdown="false" dropdownClasses="left-0 max-w-70" buttonClasses="px-4 py-2 text-white dark:text-black max-w-56 max-h-fit"
        @item-click="(i) => textStore.makeActive(i)">

        <template #button>
          <p class="truncate hover:text-clip">{{ getTabHandleText(textStore.tabs[textStore.activeTab]) }}</p>
          <XIcon @click="textStore.removeTab(textStore.activeTab)" class="ml-2 hover:text-red-500 cursor-pointer min-w-5 w-5" />
        </template>

        <template #item="{ item }">
          {{ getTabHandleText(textStore.tabs[item]) }}
        </template>
      </DropdownButton>
      
    </div>

    <!-- Tab Content Panels -->
    <div v-if="settingsStore.settings.splitType != 'columns' || settingsStore.windowXY.X <= 640" class="p-2 rounded-b-lg h-[calc(100vh-120px)] overflow-y-auto">
      <TextTab v-if="textStore.activeTab >= 0" :tabIndex="textStore.activeTab"></TextTab>
    </div>
    <div v-else class="flex space-x-4 rounded-b-lg">
      <div v-for="(tab, i) in textStore.tabs" :key="i" class="flex-1 p-2 min-w-[200px] h-[calc(100vh-120px)] overflow-y-auto" >
        <TextTab :tabIndex="i"></TextTab>
      </div>
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
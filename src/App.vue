<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import TreeNode from '@/components/TreeNode.vue';
import { ref, onMounted, computed } from 'vue'
import VButton from '@/components/VButton.vue'
import { BeakerIcon, StarIcon } from '@heroicons/vue/24/solid'
import { MenuIcon, XIcon, HomeIcon, MoonIcon, SunIcon, SettingsIcon, UsersIcon, BookOpenIcon, GithubIcon, BracketsIcon, CircleHelpIcon, ExternalLinkIcon, FoldersIcon, Columns2Icon, SmartphoneIcon, Smartphone, Folders, Columns2, Languages, LanguagesIcon, ChevronDownIcon} from 'lucide-vue-next'

const isLeftNavOpen = ref(false), isRightNavOpen = ref(false), isScriptSelectOpen = ref(false)
const toggleLeftNav = () => isLeftNavOpen.value = !isLeftNavOpen.value
const toggleRightNav = () => isRightNavOpen.value = !isRightNavOpen.value
const closeAbsoluteNavbars = () => {
  if (window.innerWidth < 1024) isLeftNavOpen.value = false //lg
  if (window.innerWidth < 1536) isRightNavOpen.value = false //2xl
  isScriptSelectOpen.value = false
}

import { useSettingsStore } from '@/stores/savedStore'
const settingsStore = useSettingsStore()
settingsStore.loadSettings()

import { useTreeStore } from '@/stores/treeStore'
import { paliScriptInfo } from '@/pali-converter';
//useTreeStore().initialize()
const rootTreeNodes = computed(() => Object.values(useTreeStore().nodes).filter(node => !node.parent))

const searchTerm = ref('')
// prevent multiple searches that makes the UI sluggish when typing fast in the search box, also prevent too many network requests
let timeoutId
const router = useRouter(), route = useRoute()
function doSearch() {
    const term = searchTerm.value.trim().toLowerCase().replace(/[^a-z\u0D80-\u0DFF \.%\-\u200d]/g, '')
    if (!term.length) return
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => router.push('/search/' + term), 500)
}
function checkSearch(focused) {
    if (focused && searchTerm.value.length && route && !route.path.includes('search')) doSearch()
}

import { useTextStore } from './stores/textStore';
function changeScript(newScript) {
    settingsStore.setSetting('paliScript', newScript)
    useTextStore().changeScript(newScript)
}
const scriptInfo = computed(() => paliScriptInfo.get(settingsStore.settings.paliScript))

const splitTypes = [
  { type: 'single', icon: Smartphone },
  { type: 'tabs', icon: Folders },
  { type: 'columns', icon: Columns2 },
]

onMounted(() => {
    isLeftNavOpen.value = window.innerWidth > 1024; 
    isRightNavOpen.value = window.innerWidth > 1536;
});
</script>

<template>
  <div class="flex flex-col h-screen overflow-y-hidden bg-[var(--bg-color)] text-[var(--text-color)]" @click="closeAbsoluteNavbars">

    <!-- Top App Bar -->
    <div class="px-4 py-1 flex justify-between items-center bg-yellow-600 dark:bg-yellow-900"> 
      <button @click.stop="toggleLeftNav" >
        <MenuIcon></MenuIcon>  
      </button>

      <div class="relative w-full max-w-[400px] mx-3">
        <!-- Search Box -->
        <input type="text"
          class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
              dark:bg-yellow-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-300 dark:focus:ring-blue-400"
          placeholder="සෙවුම් පද මෙතැන යොදන්න"
          v-model="searchTerm"
          @input="doSearch"
          @focus="checkSearch"
        />
        
        <!-- Clear button (X) -->
        <button @click="searchTerm = ''"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white focus:outline-none">
          <XIcon size="15"/>
        </button>
      </div>

      <button @click.stop="toggleRightNav" >
        <SettingsIcon />
      </button>
    </div> 

    <div class="flex-1 flex flex-col lg:flex-row relative">

      <!-- Left Tree View -->
      <div :class="isLeftNavOpen ? 'w-72 min-w-72' : 'w-0'" 
        class="absolute lg:static shadow-xl top-0 left-0 z-10 bg-[var(--bg-color)] h-[calc(100vh-50px)] overflow-y-auto transition-all duration-300">
        <div class="flex flex-col text-nowrap ml-3 my-2">
          <TreeNode v-for="(node, i) in rootTreeNodes" :key="i" :id="node.key" />
        </div>
      </div>
      
      <!-- Main contents -->
      <div class="p-1">
        <RouterView /> 
      </div>

      <!-- Right Tree View -->
      <div v-if="isRightNavOpen" @click.stop="isScriptSelectOpen = false"
        class="absolute w-64 min-w-64 2xl:static shadow-xl top-0 right-0 z-10 bg-[var(--bg-color)]">
        <div class="flex flex-col text-nowrap">
          <button @click="settingsStore.toggleDarkMode" class="right-nav-item">
            {{ settingsStore.settings.darkMode ? 'Light' : 'Dark' }} Mode
            <SunIcon v-if="settingsStore.settings.darkMode" class="ml-2"></SunIcon>
            <MoonIcon v-else class="ml-2"></MoonIcon>
          </button>
          <button class="right-nav-item relative" @click.stop="isScriptSelectOpen = !isScriptSelectOpen">
            <ChevronDownIcon class="mx-2 text-green-500" /><img :src="'/flags/' + scriptInfo[3].f" class="h-6 mx-2 dark:brightness-120">
            {{ scriptInfo[1] }}<LanguagesIcon class="ml-2 text-blue-500"/>
            <div v-if="isScriptSelectOpen" class="absolute top-10 left-0 flex flex-col bg-[var(--bg-color)] z-20
              shadow-xl rounded-md border-solid border-2 border-sky-400 dark:border-sky-700">
              <button v-for="([script, info], i) of paliScriptInfo" :key="i" @click="changeScript(script)" 
                class="p-2 hover:bg-[var(--hover-color)] flex items-center">
                <img :src="'/flags/' + info[3].f" class="h-6 mx-2 dark:brightness-120">
                {{ info[1] }}
              </button>
            </div>
          </button>
          <div class="px-5 py-1 flex items-center w-full justify-around">
            <button v-for="({type, icon}, i) in splitTypes" :key="i"
              class="flex-1 rounded-lg p-4 flex justify-center active:bg-blue-200 active:dark:bg-blue-800 hover:bg-[var(--hover-color)]" 
              :class="{'bg-blue-200 dark:bg-blue-800': settingsStore.settings.splitType == type}"
              @click="settingsStore.setSetting('splitType', type)">
              <component :is="icon" class="hover:text-blue-500" />
            </button>
          </div>
          <RouterLink :to="'/' + route.params.script || ''" class="right-nav-item">Home<HomeIcon class="ml-2 text-green-700" size="20"/></RouterLink>
          <RouterLink :to="useTextStore().getActiveLink()" class="right-nav-item">Text<BookOpenIcon class="ml-2" size="20"/></RouterLink>
          <RouterLink to="/about" class="right-nav-item">
            Help<CircleHelpIcon class="ml-2 text-blue-500" size="20"/></RouterLink>
          <RouterLink to="/abbreviations/sankshiptha" class="right-nav-item">
            Bookmarks<StarIcon class="ml-2 w-5 text-yellow-500"/></RouterLink>
          
          <a href="https://github.com/pnfo/tipitaka.lk" target="blank" class="right-nav-item">
            GitHub Repo<GithubIcon class="ml-2" size="20"/><ExternalLinkIcon class="ml-2 text-blue-500" size="20"/></a>
        </div>
      </div>
    </div>

     <!-- Snackbar -->
    <div v-if="settingsStore.snackbar.model"
      class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white px-4 py-1 rounded-xl shadow-lg transition-opacity duration-300 ease-in-out"
      :class="settingsStore.snackbar.model ? 'opacity-100' : 'opacity-0'">
      {{ settingsStore.snackbar.message }}
    </div>

  </div>

</template>

<style scoped>
.right-nav-item {
  @apply px-5 py-3 flex items-center justify-end w-full hover:bg-[var(--hover-color)]
}
</style>
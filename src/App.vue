<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import { ref, onMounted } from 'vue'
import { BeakerIcon, AcademicCapIcon, StarIcon } from '@heroicons/vue/24/solid'
import { MenuIcon, XIcon, HomeIcon, MoonIcon, SunIcon, SettingsIcon, UsersIcon, BookOpenIcon, GithubIcon, BracketsIcon, CircleHelpIcon, ExternalLinkIcon} from 'lucide-vue-next'

const isSidebarOpen = ref(false)
const toggleSidebar = () => isSidebarOpen.value = !isSidebarOpen.value
const closeSidebar = () => isSidebarOpen.value = false
const closeAbsoluteSidebar = () => (window.innerWidth < 1024) ? isSidebarOpen.value = false : ''

import { useSettingsStore } from '@/stores/savedStore'
const settingsStore = useSettingsStore()
settingsStore.loadSettings()

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

onMounted(() => {
    isSidebarOpen.value = window.innerWidth > 1024; // Adjust 768 to your desired breakpoint
});
</script>

<template>

  <div class="flex flex-col h-full bg-[var(--bg-color)] text-[var(--text-color)]" @click="closeAbsoluteSidebar">
    <div class="px-4 py-1 flex justify-between items-center bg-yellow-600 dark:bg-yellow-900"> 
      <button @click.stop="toggleSidebar" >
        <MenuIcon></MenuIcon>  
      </button>

      <div class="relative w-full max-w-[400px] mx-3">
        <!-- Input field -->
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

      <button @click="settingsStore.toggleDarkMode" >
        <SunIcon v-if="settingsStore.settings.darkMode"></SunIcon>
        <MoonIcon v-else></MoonIcon>
      </button>
    </div> 

    <div class="flex-1 flex flex-col lg:flex-row relative">
      <div :class="isSidebarOpen ? 'w-64 min-w-64' : 'w-0'" 
        class="transition-all duration-300 overflow-hidden absolute lg:static shadow-xl top-0 left-0 z-10 bg-[var(--bg-color)]">
        <div class="flex flex-col text-nowrap">
          <RouterLink to="/" class="px-4 py-3 hover:bg-[var(--hover-color)] flex items-center">
            <HomeIcon class="mr-2 text-green-700" size="20"/>මුල් පිටුව / Home</RouterLink>
          <RouterLink to="/about" class="px-4 py-3 hover:bg-[var(--hover-color)] flex items-center">
            <CircleHelpIcon class="mr-2 text-blue-500" size="20"/><AcademicCapIcon class="mr-2 text-blue-500 w-5"/>උපදෙස් / Help</RouterLink>
          <RouterLink to="/abbreviations/sankshiptha" class="px-4 py-3 hover:bg-[var(--hover-color)] flex items-center">
            <StarIcon class="mr-2 w-5 text-yellow-500"/>සංකේත නිරූපණය</RouterLink>
          <RouterLink to="/bookpage/sankshiptha/1" class="px-4 py-3 hover:bg-[var(--hover-color)] flex items-center">
            <BookOpenIcon class="mr-2" size="20"/>පොත් අන්තර්ගතය</RouterLink>
          <a href="https://github.com/pnfo/arutha.lk" target="blank" class="px-4 py-3 hover:bg-[var(--hover-color)] flex items-center">
            <GithubIcon class="mr-2" size="20"/>GitHub Repo<ExternalLinkIcon class="ml-2 text-blue-500" size="20"/></a>
          <RouterLink to="/settings" class="px-4 py-3 hover:bg-[var(--hover-color)] flex items-center"><SettingsIcon class="mr-2" size="20"/>සැකසුම් / Settings</RouterLink>
        </div>
      </div>
      
      <div class="p-4">
        <RouterView /> 
      </div>
    </div>

     <!-- Snackbar -->
    <div v-if="settingsStore.snackbar.model"
      class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white px-4 py-1 rounded-xl shadow-lg transition-opacity duration-300 ease-in-out"
      :class="{ 'opacity-0': !settingsStore.snackbar.model, 'opacity-100': settingsStore.snackbar.model }">
      {{ settingsStore.snackbar.message }}
    </div>

  </div>

</template>
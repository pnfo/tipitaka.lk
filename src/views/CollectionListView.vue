<script setup>
import VAlert from '@/components/VAlert.vue';
import {AtSignIcon, SendIcon, MenuIcon, SettingsIcon, BookTextIcon, WifiOffIcon} from 'lucide-vue-next'
import { computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router'
import { queryDb, TranslationInfo } from '../utils';
import { convert, Script, isScript, PaliScriptInfo } from '../pali-converter';
import CollectionName from '@/components/CollectionName.vue';

const route = useRoute()


onMounted(async () => {

})

</script>

<template>
  <div class="m-1 h-[calc(100vh-70px)] overflow-y-auto">
      
      <h1 class="text-5xl text-center my-5 text-yellow-700 dark:text-yellow-400 font-mono font-bold">tipitaka.lk</h1>

      <ul class="p-3 list-[circle] list-inside">
        <li>Type your search terms into the search box at the top.</li>
        <li>To browse the Sutta list in a hierarchy, tap the <MenuIcon class="inline text-blue-500" size="20" /> icon, then select a Sutta.</li>
        <li>To change the display script, open the settings by tapping the <SettingsIcon class="inline text-blue-500" size="20" /> icon in the top right corner.</li>
      </ul>

      <div class="p-3 space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed text-justify">
        <p>
          Following is the list of Pali Scripts supported by this website. You may click any of the links below to read the Sri Lankan Tipitaka in that script.  
        </p>
      </div>

      <div class="m-5 md:columns-2 lg:columns-3 space-y-2">
        <div v-for="([script, info], i) in PaliScriptInfo" :key="i" class="flex items-start space-x-2">
          <span class="font-bold text-gray-700 font-mono">
            {{ (i+1).toString().padStart(2, '0') }}.
          </span>
          <span></span>
          <RouterLink :to="`/${script}/`" class="flex">
            <CollectionName :collName="script" />
          </RouterLink>
        </div>
      </div>

      <div class="p-3 space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed text-justify">
        <p>Following is a list of Tipitaka Translations we have managed to add to the website so far.</p>
      </div>
      
      <div class="m-5 md:columns-2 lg:columns-3 space-y-2">
        <div v-for="([trans, info], i) in Object.entries(TranslationInfo)" :key="i" class="flex items-start space-x-2">
          <span class="font-bold text-gray-700 font-mono">
            {{ (i+1).toString().padStart(2, '0') }}.
          </span>
          <span></span>
          <RouterLink :to="`/${trans}/`" class="flex">
            <CollectionName :collName="trans" />
          </RouterLink>
        </div>
      </div>


      <VAlert :border="true" color="warning">
        <div>
          To report errors, ask questions or provide suggestions {{ route.params.script }}
          <SendIcon class="inline" size="18"/> path.nirvana <AtSignIcon class="inline" size="18" /> gmail.com.
        </div>
      </VAlert>

      <VAlert color="info">Download offline software which can be used without Internet <WifiOffIcon class="inline" size="18"/> below.</VAlert>
      <div class="flex flex-wrap gap-3 download-software-list">
          <!-- <a href="https://play.google.com/store/apps/details?id=lk.tipitaka.main" target="_blank"><img src="/images/android2.png"></a> -->
          <a href="https://github.com/pnfo/tipitaka.lk/releases/" target="_blank"><img src="/images/windows.png"></a>
          <a href="https://github.com/pnfo/tipitaka.lk/releases/" target="_blank"><img src="/images/macos2.png"></a>
          <a href="https://github.com/pnfo/tipitaka.lk/releases/" target="_blank"><img src="/images/linux.png"></a>
      </div>
  </div>
</template>

<style lang="css" scoped>
a {
  @apply text-blue-600 dark:text-blue-400
}
.download-software-list img { 
  @apply h-14 invert-[.95] dark:invert-0 mx-2;
}

</style>

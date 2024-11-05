<script setup>
import VAlert from '@/components/VAlert.vue';
import {AtSignIcon, SendIcon, MenuIcon, SettingsIcon, BookTextIcon, WifiOffIcon} from 'lucide-vue-next'
import { computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router'
import { queryDb, TranslationInfo } from '../utils';
import { convert, Script, isScript } from '../pali-converter';

const route = useRoute()

onMounted(async () => {

})

</script>

<template>
  <div class="m-1 h-[calc(100vh-70px)] overflow-y-auto">

      <VAlert :border="true" color="warning">
        COMING SOON > Search, Bookmarks and Audio Chanting
      </VAlert>

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

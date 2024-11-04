<script setup>
import VAlert from '@/components/VAlert.vue';
import {AtSignIcon, SendIcon, MenuIcon, SettingsIcon, BookTextIcon} from 'lucide-vue-next'
import { computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router'
import { queryDb, TranslationInfo } from '../utils';
import { convert, Script, isScript } from '../pali-converter';

const route = useRoute()
const collection = computed(() => route.params.collection)
const script = computed(() => isScript(collection.value) ? collection.value : TranslationInfo[collection.value].script)

const booksList = reactive([])
async function getBooks() {
  try {
    let query = 'SELECT * FROM book'
    if (!isScript(collection.value)) query += ` WHERE EXISTS (
      SELECT 1 FROM tree WHERE tree.book_id = book.id AND tree.translations LIKE '%${collection.value}%'
    ) ORDER BY book.id ASC;`
    const rows = await queryDb(query)
    booksList.push(...rows)
  } catch (e) {
    
  }
}
getBooks()

onMounted(async () => {

})

</script>

<template>
  <div class="m-1 h-[calc(100vh-70px)] overflow-y-auto">
      
      <h1 class="text-7xl text-center my-6 text-yellow-700 dark:text-yellow-400 font-mono font-bold">tipitaka.lk</h1>

      <ul class="mx-2 mt-4 list-[circle] list-inside">
        <li>Type your search terms into the search box at the top.</li>
        <li>To browse the Sutta list in a hierarchy, tap the <MenuIcon class="inline text-blue-500" size="20" /> icon, then select a Sutta.</li>
        <li>To change the display script, open the settings by tapping the <SettingsIcon class="inline text-blue-500" size="20" /> icon in the top right corner.</li>
      </ul>

      <div v-if="isScript(collection)" class="p-4 space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed">
        <p>
          The Tipitaka was first written down in Sri Lanka over 2,000 years ago on ancient palm-leaf manuscripts. For centuries, these manuscripts were preserved and protected by monastic communities in various temples and forest hermitages across the country.
        </p>
        <p>
          To mark the 2,500th year since the Buddha’s enlightenment, a team of renowned Sri Lankan scholar-monks initiated a major project in 1956. This project sought to gather manuscripts from all corners of Sri Lanka, along with previously printed works, to compile an authoritative printed edition of the Tipitaka, known as the Buddha Jayanthi Tripitaka (BJT).
        </p>
        <p>
          We are pleased to present this Tipitaka according to the Sri Lankan tradition, which we have meticulously digitized and proofread to ensure accuracy. Here, you can access the Pali canon and explore its teachings in multiple Indic scripts. The printed Buddha Jayanthi Tipitaka collection contains 57 volumes, covering the comprehensive teachings of the Buddha.
        </p>
        <p>
          Our goal is to offer a trusted, accessible resource for anyone interested in exploring the timeless wisdom of the Tipitaka.
        </p>
      </div>
      <div v-else-if="collection == 'sin_bjt'" class="m-3">
        <p>This is about BJT sinhala.</p>
      </div>
      <div v-else-if="collection == 'eng_thani'" class="m-3">
        <p>This is about Thanissaro English Translation. Add license info too</p>
      </div>

      <div class="m-5 md:columns-2 lg:columns-3 space-y-2" :class="`script-${script}`">
        <div v-for="(book, index) in booksList" :key="index" class="flex items-start space-x-2">
          <span class="font-bold text-gray-700 font-mono">
            {{ (book.id).toString().padStart(2, '0') }}.
          </span>
          <span></span>
          <RouterLink :to="`/${collection}/book/${book.id}`" class="flex">
            <BookTextIcon class="mr-2 w-5 min-w-5 text-yellow-500"/>
            {{ convert(book.name, script, Script.SINH) }}
          </RouterLink>
        </div>
      </div>

      <VAlert :border="true" color="warning">
        <div>
          To report errors, ask questions or provide suggestions {{ route.params.script }}
          <SendIcon class="inline" size="18"/> path.nirvana <AtSignIcon class="inline" size="18" /> gmail.com.
        </div>
      </VAlert>

      <!-- <VAlert color="info">අන්තර්ජාලය නැතිව Offline භාවිතා කළ හැකි මෘදුකාංග පහතින් බාගත කරගන්න.</VAlert>
      <div class="flex flex-wrap gap-3 download-software-list">
          <a href="https://play.google.com/store/apps/details?id=lk.tipitaka.main" target="_blank"><img src="/images/android2.png"></a>
          <a href="https://github.com/pnfo/arutha.lk/releases/" target="_blank"><img src="/images/windows.png"></a>
          <a href="https://github.com/pnfo/arutha.lk/releases/" target="_blank"><img src="/images/macos2.png"></a>
          <a href="https://github.com/pnfo/arutha.lk/releases/" target="_blank"><img src="/images/linux.png"></a>
      </div> -->
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

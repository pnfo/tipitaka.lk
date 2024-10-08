<script setup>
// import { useSinhalaStore, dictionaryInfos } from '@/stores/sinhala'
// import { useSettingsStore } from '@/stores/savedStore'
import { useRoute, useRouter } from 'vue-router'
import { queryDb } from '@/utils';
import { watchEffect, computed, ref } from 'vue';
import VAlert from '@/components/VAlert.vue';
import VSkeleton from '@/components/VSkeleton.vue';
import VButton from '@/components/VButton.vue';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-vue-next';

const resultsPerPage = 50
const route = useRoute(), router = useRouter()
// const dictInfo = computed(() => dictionaryInfos.find(({id}) => route.params.dictId == id))
// const pageNum = computed(() => {
//   const page = parseInt(route.params.page.trim(), 10)
//   return isNaN(page) ? 1 : Math.max(page, 1)
// })

// const selectedDict = computed({
//   get: () => dictInfo.value.index,
//   set: (i) => router.replace(`/bookpage/${dictionaryInfos[i].id}/${pageNum.value}`) // this will change the addressbar without refreshing the whole page
// })

// const numberOfPages = computed(() => Math.ceil(useSinhalaStore().entryCounts[dictInfo.value.id] / resultsPerPage))

const isLoading = ref(false), pageResults = ref([]), searchError = ref('')
const fetchPageResults = async () => {
    isLoading.value = true
    try {
        //const {index, id} = dictInfo.value
        const query = `SELECT * FROM text WHERE book_id = 22 ORDER BY page ASC, seq ASC LIMIT ${resultsPerPage}`
        console.log(query)

        const rows = await queryDb(query)
        pageResults.value = rows || [] // null sent when zero results
    } catch(e) {
        console.log(e)
        pageResults.value = []
        searchError.value = e.message
    } finally {
        isLoading.value = false
    }
}
watchEffect(fetchPageResults)

const pageStatus = computed(() => {
  if (isLoading.value) {
    return { text: 'දත්ත ලැබෙන තුරු මොහොතක් රැඳී සිටින්න.', type: 'warning' }
  } else if (searchError.value) {
    return { text: searchError.value, type: 'error' }
  } else if (pageResults.value.length) {
    return { text: `පොතේ xx පිටුවේ “${pageResults.value[0].page}” වචනයේ සිට “${pageResults.value.slice(-1)[0].page}” වචනය දක්වා වචන ${pageResults.value.length} ක තේරුම් පහතින් බලන්න.`, type: 'success' }
  } else {
    return { text: `පිටු අංකයේ වරදක් ඇත. 1 සිට ${numberOfPages.value} අතර විය යුතුය.`, type: 'error'}
  }
})

</script>

<template>
  <div style="">

    <div class="flex items-center gap-2 mb-3">
        <label>ශබ්දකෝෂය </label>
        <!-- <select v-model="selectedDict" class="block px-3 py-2 dark:bg-black border border-gray-300 rounded-md">
            <option v-for="info in dictionaryInfos" :key="info.index" :value="info.index">
                {{ info.title }}
            </option>
        </select> -->
    </div>

    <VAlert :border="true" :color="pageStatus.type">
      <div>{{ pageStatus.text }}</div>
    </VAlert>

    <div class="flex gap-1">
      <!-- <RouterLink :to="`/bookpage/${dictInfo.id}/${1}`"><VButton :prependIcon="ChevronFirst" class="nav-button"><span>මුල් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum - 1}`"><VButton :prependIcon="ChevronLeft" class="nav-button"><span>කළින් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum + 1}`"><VButton :appendIcon="ChevronRight" class="nav-button"><span>ඊළඟ පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${numberOfPages}`"><VButton :appendIcon="ChevronLast" class="nav-button"><span>අවසාන පිටුව</span></VButton></RouterLink> -->
    </div>

    <div v-if="isLoading">
      <VSkeleton></VSkeleton>
    </div>
    <div v-else class="container"> 
      <div class="sm:columns-2 xl:columns-3">
          <div v-for="(entry, i) in pageResults" :entry="entry" :key="i" class="break-inside-avoid-column">{{ entry.text }}</div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.nav-button {
  @apply bg-sky-400 dark:bg-sky-800 bg-opacity-50 min-h-10;
}
.nav-button span {
  @apply hidden sm:block;
}
</style>
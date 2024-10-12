<script setup>
// import { useSinhalaStore, dictionaryInfos } from '@/stores/sinhala'
// import { useSettingsStore } from '@/stores/savedStore'
import { useRoute, useRouter } from 'vue-router'
import { queryDb } from '@/utils';
import { watchEffect, computed, ref, reactive, watch, onMounted } from 'vue';
import VAlert from '@/components/VAlert.vue';
import VSkeleton from '@/components/VSkeleton.vue';
import VButton from '@/components/VButton.vue';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { useTextStore } from '@/stores/textStore'

const resultsPerPage = 50
const route = useRoute(), router = useRouter(), textStore = useTextStore()

const props = defineProps({
    tabIndex: Number,
});
const tab = computed(() => textStore.tabs[props.tabIndex])
const node = computed(() => textStore.tabs[props.tabIndex]?.node)

const pageStatus = computed(() => {
  if (tab.value.isLoading) {
    return { text: 'දත්ත ලැබෙන තුරු මොහොතක් රැඳී සිටින්න.', type: 'warning' }
  } else if (tab.value.error) {
    return { text: tab.value.error, type: 'error' }
  } else if (tab.value.text.length) {
    return { text: `පොතේ xx පිටුවේ “${tab.value.text[0].page}” වචනයේ සිට “${tab.value.text.slice(-1)[0].page}” වචනය දක්වා වචන ${tab.value.text.length} ක තේරුම් පහතින් බලන්න.`, type: 'success' }
  } else {
    return { text: `පිටු අංකයේ වරදක් ඇත. 1 සිට අතර විය යුතුය.`, type: 'error'}
  }
})

const loadingTrigger = ref(null);

onMounted(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !tab.isLoading) {
      textStore.fetchTextSection(props.tabIndex)
    }
  }, { threshold: 1.0 });

  if (loadingTrigger.value) {
    observer.observe(loadingTrigger.value);
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

    <div class="container">
      <div class="sm:columns-1 xl:columns-2">
          <div v-for="(entry, i) in tab.text" :entry="entry" :key="i" class="break-inside-avoid-column">{{ entry.text }}</div>
      </div>

      <div ref="loadingTrigger" class="h-10 mt-4 flex items-center justify-center">
        <p v-if="tab.isLoading" class="text-gray-500">Loading more items...</p>
        <div v-if="tab.isLoading">
          <VSkeleton></VSkeleton>
        </div>
      </div>
    </div>

    <!-- <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Infinite Scroll Example</h1>
      <div class="space-y-4">
        <div v-for="item in displayedItems" :key="item.id" class="bg-white shadow rounded-lg p-4">
          <h2 class="text-lg font-semibold">{{ item.title }}</h2>
          <p class="text-gray-600">{{ item.description }}</p>
        </div>
      </div>
      
    </div> -->

  </div>
</template>

<style scoped>

</style>
<script setup>
// import { useSinhalaStore, dictionaryInfos } from '@/stores/sinhala'
// import { useSettingsStore } from '@/stores/savedStore'
import { useRoute, useRouter } from 'vue-router'
import { watchEffect, computed, ref, reactive, watch, onMounted } from 'vue';
import VAlert from '@/components/VAlert.vue';
import TextRow from '@/components/TextRow.vue';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, XIcon } from 'lucide-vue-next';
import { useTextStore } from '@/stores/textStore'
import footnoteAbbreviations from '@/stores/footnote-abbreviations.json';
import { convert, Script } from '../pali-converter';
import { XCircleIcon } from '@heroicons/vue/20/solid';

const route = useRoute(), router = useRouter(), textStore = useTextStore()

const props = defineProps({
    tabIndex: Number,
});
const tab = computed(() => textStore.tabs[props.tabIndex])
const node = computed(() => textStore.tabs[props.tabIndex]?.node)
const zippedRows = computed(() => {
  const data = tab.value.data, maxLength = Math.max(...data.map(({rows}) => rows.length)), 
    zippedRows = Array.from({ length: maxLength }, () => []);
  for (let i = 0; i < maxLength; i++) {
    for (let j = 0; j < data.length; j++)
      zippedRows[i][j] = data[j].rows[i] || {}
  }
  return zippedRows
})

const collectionStatuses = computed(() => {
  return tab.value.data.map(data => {
    if (data.isLoading) {
      return { text: 'දත්ත ලැබෙන තුරු මොහොතක් රැඳී සිටින්න.', type: 'warning' }
    } else if (data.error) {
      return { text: data.error, type: 'error' }
    } else if (data.rows.length) {
      return { text: `පොතේ xx පිටුවේ “${data.rows[0].page}” වචනයේ සිට “${data.rows.slice(-1)[0].page}” වචනය දක්වා වචන ${data.rows.length} ක තේරුම් පහතින් බලන්න.`, type: 'success' }
    } else {
      return { text: `පිටු අංකයේ වරදක් ඇත. 1 සිට අතර විය යුතුය.`, type: 'error'}
    }
  })
})

const containerRef = ref(null);
const handleContainerClick = (event) => {
  if (event.target.classList.contains('fn-pointer')) {
    document.querySelectorAll('span.inline-footnote,span.inline-abbreviation').forEach(e => e.remove());
    const text = event.target.textContent, page = Number(event.target.getAttribute('page')), coll = event.target.getAttribute('coll')
    const footnote = document.createElement('span');
    footnote.classList.add('inline-footnote');
    const collIndex = tab.value.collections.indexOf(coll)
    footnote.innerHTML = tab.value.data[collIndex].footnotes[page][text].content; // todo need to get coll too to find the footnote
    event.target.appendChild(footnote);
    adjustPosition(footnote)
  } else if (event.target.classList.contains('abbr-pointer')) { // only for pali columns
    document.querySelectorAll('span.inline-abbreviation').forEach(e => e.remove());
    const abbreviation = document.createElement('span'), coll = event.target.getAttribute('coll') // coll must be a pali script
    abbreviation.classList.add('inline-abbreviation')
    const sinhText = convert(event.target.textContent, Script.SINH, coll) // TODO PTS does not work in Roman
    abbreviation.innerHTML = convert(footnoteAbbreviations[sinhText][0], coll, Script.SINH)
    event.target.appendChild(abbreviation);
    adjustPosition(abbreviation)
  } else {
    document.querySelectorAll('span.inline-footnote,span.inline-abbreviation').forEach(e => e.remove());
  }
}

/** normally the footnote is shown on the right of the pointer, 
 * however if the footnote is going off the right edge of the viewport, adjust it to the left */
function adjustPosition(tooltip) {
  const rect = tooltip.getBoundingClientRect(), containerRect = containerRef.value.getBoundingClientRect()
  if (rect.right > containerRect.right) {
    tooltip.style.left = 'auto' // unset the left style from footnote class
    tooltip.style.right = '0px' 
  }
}


const loadingTrigger = ref(null);

onMounted(() => {
  containerRef.value.addEventListener('click', handleContainerClick)

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
  <div class="">

    <div class="flex gap-1">
      <!-- <RouterLink :to="`/bookpage/${dictInfo.id}/${1}`"><VButton :prependIcon="ChevronFirst" class="nav-button"><span>මුල් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum - 1}`"><VButton :prependIcon="ChevronLeft" class="nav-button"><span>කළින් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum + 1}`"><VButton :appendIcon="ChevronRight" class="nav-button"><span>ඊළඟ පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${numberOfPages}`"><VButton :appendIcon="ChevronLast" class="nav-button"><span>අවසාන පිටුව</span></VButton></RouterLink> -->
    </div>

    <div ref="containerRef" class="container">
      <table>
          <!-- <div v-for="(entry, i) in tab.rows" :entry="entry" :key="i" class="break-inside-avoid-column">{{ entry.text }}</div> -->
        <thead>
          <tr class="flex gap-5">
            <th v-for="(collName, i) in tab.collections" :key="i" class="relative flex-1">
              {{ collName }}
              <VAlert v-if="!!collectionStatuses[i].text" :border="true" :color="collectionStatuses[i].type">
                <div>{{ collectionStatuses[i].text }}</div>
              </VAlert>
              <button @click="textStore.removeCollection(props.tabIndex, i)" 
                class="absolute top-1 right-1 text-gray-500 hover:text-red-500 z-10 cursor-pointer w-5"><XIcon /></button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(zippedRow, i) in zippedRows" :key="i" class="flex gap-5">
            <TextRow :zippedRow="zippedRow" />
          </tr>
        </tbody>
      </table>

      <div ref="loadingTrigger" class="h-10 mt-4 flex items-center justify-center">
        <p v-if="tab.section >= 0" class="text-gray-500 animate-pulse">Fetching More Text...</p>
        <p v-else>End of the Book.</p>
      </div>
    </div>

  </div>
</template>

<style>

</style>
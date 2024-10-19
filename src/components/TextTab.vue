<script setup>
// import { useSinhalaStore, dictionaryInfos } from '@/stores/sinhala'
// import { useSettingsStore } from '@/stores/savedStore'
import { useRoute, useRouter } from 'vue-router'
import { watchEffect, computed, ref, reactive, watch, onMounted } from 'vue';
import VAlert from '@/components/VAlert.vue';
import TextRow from '@/components/TextRow.vue';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { useTextStore } from '@/stores/textStore'
import footnoteAbbreviations from '@/stores/footnote-abbreviations.json';
import { convert, Script } from '../pali-converter';

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
  } else if (tab.value.rows.length) {
    return { text: `පොතේ xx පිටුවේ “${tab.value.rows[0].page}” වචනයේ සිට “${tab.value.rows.slice(-1)[0].page}” වචනය දක්වා වචන ${tab.value.rows.length} ක තේරුම් පහතින් බලන්න.`, type: 'success' }
  } else {
    return { text: `පිටු අංකයේ වරදක් ඇත. 1 සිට අතර විය යුතුය.`, type: 'error'}
  }
})

const containerRef = ref(null);
const handleContainerClick = (event) => {
  if (event.target.classList.contains('fn-pointer')) {
    document.querySelectorAll('span.inline-footnote,span.inline-abbreviation').forEach(e => e.remove());
    const text = event.target.textContent, page = Number(event.target.getAttribute('page'))
    const footnote = document.createElement('span');
    footnote.classList.add('inline-footnote');
    footnote.innerHTML = tab.value.footnotes[page][text].content;
    event.target.appendChild(footnote);
    adjustPosition(footnote)
  } else if (event.target.classList.contains('abbr-pointer')) {
    document.querySelectorAll('span.inline-abbreviation').forEach(e => e.remove());
    const abbreviation = document.createElement('span')
    abbreviation.classList.add('inline-abbreviation')
    const sinhText = convert(event.target.textContent, Script.SINH, tab.value.paliScript) // TODO PTS does not work in Roman
    abbreviation.innerHTML = convert(footnoteAbbreviations[sinhText][0], tab.value.paliScript, Script.SINH)
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
    <VAlert v-if="!!pageStatus.text" :border="true" :color="pageStatus.type">
      <div>{{ pageStatus.text }}</div>
    </VAlert>

    <div class="flex gap-1">
      <!-- <RouterLink :to="`/bookpage/${dictInfo.id}/${1}`"><VButton :prependIcon="ChevronFirst" class="nav-button"><span>මුල් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum - 1}`"><VButton :prependIcon="ChevronLeft" class="nav-button"><span>කළින් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum + 1}`"><VButton :appendIcon="ChevronRight" class="nav-button"><span>ඊළඟ පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${numberOfPages}`"><VButton :appendIcon="ChevronLast" class="nav-button"><span>අවසාන පිටුව</span></VButton></RouterLink> -->
    </div>

    <div ref="containerRef" class="container">
      <table>
          <!-- <div v-for="(entry, i) in tab.rows" :entry="entry" :key="i" class="break-inside-avoid-column">{{ entry.text }}</div> -->
        <tr v-for="(row, i) in tab.rows" :key="i">
          <TextRow :row="row" />
        </tr>
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
<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted } from 'vue';
import VAlert from '@/components/VAlert.vue';
import TextRow from '@/components/TextRow.vue';
import { XIcon } from 'lucide-vue-next';
import { useTextStore } from '@/stores/textStore'
import { useSettingsStore } from '@/stores/savedStore'
import footnoteAbbreviations from '@/stores/footnote-abbreviations.json';
import { convert, Script } from '@/pali-converter';
import CollectionName from '@/components/CollectionName.vue';
import DropdownButton from '@/components/DropdownButton.vue';
import { getScriptForCollection } from '@/utils';

const route = useRoute(), router = useRouter(), textStore = useTextStore(), settingsStore = useSettingsStore()

const props = defineProps({
    tabIndex: Number,
});
const tab = computed(() => textStore.tabs[props.tabIndex])
const zippedRows = computed(() => {
  const data = tab.value.data, maxLength = Math.max(...data.map(({rows}) => rows.length)), 
    zippedRows = Array.from({ length: maxLength }, () => []);
  for (let i = 0; i < maxLength; i++) {
    for (let j = 0; j < data.length; j++)
      zippedRows[i][j] = data[j].rows[i] || {}
  }
  return zippedRows
})
function removeCollection(collName) {
  if (settingsStore.settings.translation == collName) {
    settingsStore.setSetting('translation', '')
  }
  textStore.removeCollection(props.tabIndex, collName)
}

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

const isSmHidden = (i) => tab.value.xsVisibleCollection != i ? 'hidden sm:block' : ''
const collectionScripts = computed(() => tab.value.collections.map(coll => getScriptForCollection(coll)))
</script>

<template>
  <div v-if="tab" class="relative">

    <div ref="containerRef">
      <table>
        <thead class="sticky top-0">
          <tr class="flex gap-5">
            <td v-for="(collName, i) in tab.collections" :key="i" class="relative flex-1" :class="isSmHidden(i)">
                <DropdownButton class="absolute top-0 right-1" bgColor="green"
                  :items="tab.collections.filter(c => c != collName)" dropdownClasses="right-0 max-w-70"
                  :disableDropdown="settingsStore.windowXY.X > 640"
                  @item-click="(coll) => tab.xsVisibleCollection = tab.collections.indexOf(coll)">

                  <template #button>
                    <CollectionName :collName="collName"/>
                    <XIcon v-if="tab.collections.length > 1" @click="removeCollection(collName)" class="ml-2 hover:text-red-500 cursor-pointer w-5" />
                  </template>

                  <template #item="{ item }">
                    <CollectionName :collName="item"/>
                  </template>
                </DropdownButton>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr class="flex gap-5 mt-10 sm:mt-0">
            <td v-for="(collName, i) in tab.collections" :key="i" class="flex-1" :class="isSmHidden(i)">
              <VAlert v-if="collectionStatuses[i].type != 'success'" :border="true" :color="collectionStatuses[i].type">
                <div>{{ collectionStatuses[i].text }}</div>
              </VAlert>
            </td>
          </tr>
          <tr v-for="(zippedRow, i) in zippedRows" :key="i" class="flex gap-5">
            <td v-for="(row, j) of zippedRow" class="entry flex-1 w-1/2 align-top text-justify py-1" :class="isSmHidden(j)">
              <TextRow :row="row" :key="j" :script="collectionScripts[j]"/>
            </td>
          </tr>
        </tbody>
      </table>

      <div ref="loadingTrigger" class="h-10 mt-4 flex items-center justify-center">
        <p v-if="tab.data.some(d => !d.hasEnded)" class="text-gray-500 animate-pulse">Fetching More Text...</p>
        <p v-else>End of the Text.</p>
      </div>
    </div>

  </div>
</template>

<style>

</style>
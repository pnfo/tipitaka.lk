<script setup>
// import { useSinhalaStore, dictionaryInfos } from '@/stores/sinhala'
// import { useSettingsStore } from '@/stores/savedStore'
import { useRoute, useRouter } from 'vue-router'
import { watchEffect, computed, ref, reactive, watch, onMounted } from 'vue';
import VButton from '@/components/VButton.vue'
import { useTextStore } from '@/stores/textStore'

const route = useRoute(), router = useRouter(), textStore = useTextStore()

const props = defineProps({
    row: Object,
});

onMounted(() => {

})

</script>

<template>
  <td class="entry w-1/2 align-top relative text-justify py-1">
    <div :class="props.row.type" :level="props.row.level" class="html" v-html="props.row.text">
    </div>
  </td>
</template>

<style scoped>
/** Need to use em instead of rem because dynamic font-size is set at td */
.text { font-size: 1.1em; line-height: 130%; word-break: break-word;  /*white-space: pre-wrap;*/ }

.heading { @apply font-bold text-orange-800 dark:text-orange-300 text-center; }
.heading[level="5"] { @apply text-4xl } /* sn-2 */
.heading[level="4"] { @apply text-3xl } /* sn-2-1-9 */
.heading[level="3"] { @apply text-2xl }
.heading[level="2"] { @apply text-xl }
.heading[level="1"] { @apply text-lg }

.paragraph { @apply indent-6 pl-0 }

.gatha { @apply indent-0 pl-6 text-left }
.gatha[level="2"] { @apply pl-20 }

.unindented { @apply indent-0 pl-0 text-left }

.centered { @apply text-center font-bold }
.centered[level="5"] { @apply text-3xl }
.centered[level="4"] { @apply text-2xl }
.centered[level="3"] { @apply text-xl }
.centered[level="2"] { @apply text-lg }
.centered[level="1"] { @apply text-base } /* normal text size here */
.centered[level="0"] { @apply font-normal } /* non bold, just centered */

.audio-playing { background-color: var(--v-highlight-base); }
</style>

<style> /* need without the scoped */
.html .fn-pointer { @apply text-sm text-sky-800 dark:text-sky-300 hover:text-sky-500 cursor-pointer px-1 align-super relative }
.html .underlined { @apply underline underline-offset-4 decoration-red-900 dark:decoration-red-300 }
.html .strike { text-decoration: line-through; text-decoration-color: var(--v-accent-base); }
.html .bold { @apply font-bold }
.html .highlight { background-color: var(--v-highlight-base); } /* fts */

/* need to undo all parents' styles here */
span.inline-footnote { @apply absolute text-base align-baseline indent-0 top-5 left-[-2rem] text-[var(--text-color)] bg-white dark:bg-black
  text-nowrap p-2 z-10 rounded-lg shadow-md border border-slate-600 }
span.abbr-pointer { @apply relative text-sky-800 dark:text-sky-300 hover:text-sky-500 }
span.inline-abbreviation { @apply absolute px-3 py-2 z-20 top-7 left-[-2rem] text-[var(--text-color)] bg-white dark:bg-black
  rounded-lg shadow-md border border-slate-600 }
</style>
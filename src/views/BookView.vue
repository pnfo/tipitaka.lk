<script setup>
import { useRoute, RouterLink } from 'vue-router'
import { computed, ref, reactive, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/savedStore'
import { queryDb, TranslationInfo } from '@/utils';
import { convert, Script, isScript } from '@/pali-converter';
import { FolderOpenIcon, TextIcon } from 'lucide-vue-next';
import VAlert from '@/components/VAlert.vue'

const route = useRoute(), settingsStore = useSettingsStore()
const bookId = computed(() => route.params.book),
  collection = computed(() => route.params.collection)
const script = computed(() => isScript(collection.value) ? collection.value : TranslationInfo[collection.value].script)

const nodes = reactive([]), highestLevel = ref(0), book = reactive({})
async function loadBook() {
    try {
        const transFilter = isScript(collection.value) ? '' : ` AND translations LIKE '%${collection.value}%'`
        const [rows, books] = await Promise.all([
            queryDb(`SELECT * FROM tree WHERE book_id = ${bookId.value} ${transFilter}`),
            queryDb(`SELECT * FROM book WHERE id = ${bookId.value}`)
        ]);
        nodes.push(...rows)
        highestLevel.value = Math.max(...rows.map(row => row.level))
        Object.assign(book, books[0])
    } catch (error) {
        console.error(`Error load book ${bookId}`, error);
    }
}
loadBook()

onMounted(async () => {
    
});
const classNames = ['ml-0', 'ml-2', 'ml-4', 'ml-6', 'ml-8', 'ml-10', 'ml-12'] //tailwind needs all class names in full
</script>

<template>
  <div class="m-1 h-[calc(100vh-70px)] overflow-y-auto">
    
    <VAlert color="success" v-if="book.name">
      The book “{{ convert(book.name, script, Script.SINH) }}” has {{ book.max_page }} pages with the following content.
    </VAlert>

    <div class="m-3 text-base md:columns-2 lg:columns-3" :class="`script-${script}`">
      <div v-for="(row, i) in nodes" :class="classNames[highestLevel - row.level]">
        <RouterLink :to="`/${collection}/${row.key}/` + (row.leaf ? 'full' : '')" class="flex items-center">
          <FolderOpenIcon v-if="!row.leaf" class="w-5 text-yellow-600 mr-2"/>
          <TextIcon v-else class="w-5 text-gray-500 mr-2" />
          {{ convert(row.text, script, Script.SINH) }}
        </RouterLink>
      </div>
      <!-- <TreeNode v-for="key in bookRootKeys" :key="key" :id="key" :forBook="bookId" /> -->
    </div>

    <div class="flex space-x-4">
      <!-- <RouterLink :to="`/bookpage/${dictInfo.id}/${1}`"><VButton :prependIcon="ChevronFirst" class="nav-button"><span>මුල් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum - 1}`"><VButton :prependIcon="ChevronLeft" class="nav-button"><span>කළින් පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${pageNum + 1}`"><VButton :appendIcon="ChevronRight" class="nav-button"><span>ඊළඟ පිටුව</span></VButton></RouterLink>
      <RouterLink :to="`/bookpage/${dictInfo.id}/${numberOfPages}`"><VButton :appendIcon="ChevronLast" class="nav-button"><span>අවසාන පිටුව</span></VButton></RouterLink> -->
    </div>
  </div>
</template>

<style scoped>
a {
  @apply text-blue-600 dark:text-blue-400
}
</style>
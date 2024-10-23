<template>
    <div class="flex flex-col bg-gray-100 dark:bg-gray-900" @keyup="handleKeyup">

      <table class="table-auto w-full border-collapse border border-gray-300">
        <thead>
            <tr>
                <th class="px-4 py-2 border border-gray-300">Pali SQLite</th>
                <th class="px-4 py-2 border border-gray-300">Scraped</th>
                <th></th>
            </tr>
        </thead>
        <tbody id="data-table">
            <tr>
                <td class="px-4 py-2 border border-gray-300 flex items-center">
                  <label>Rows:</label><input v-model="pali.rowsPerSection" type="number" class="border p-1 m-1 mr-2 max-w-14"/>
                  <label>Key:</label><input v-model="pali.key" type="text" class="border p-1 m-1"/>
                  <button @click="loadSqlite(0)" class="bg-blue-700 text-white px-2 py-1 m-1">Load</button>
                  <button @click="resetPali" class="bg-red-700 text-white px-2 py-1 m-1"><EraserIcon /></button>
                  <button @click="toggleScript" class="bg-green-700 text-white px-2 py-1 m-1"><LanguagesIcon /></button>
                  <span>Num Rows: {{ pali.rows.length }}, Section: {{ pali.section }}</span>
                </td>
                <td></td>
                <td class="px-4 py-2 border border-gray-300 flex items-center">
                  <label>Url:</label><input v-model="eng.url" type="text" class="border p-1 m-1 min-w-80"/>
                  <button @click="scrapeWebData" class="bg-blue-700 text-white px-2 py-1 m-1">Scrape</button>
                  <span>Num Rows: {{ eng.text.length }}</span>
                </td>
            </tr>
            <!-- Rows will be dynamically added here -->
            <tr v-for="(row, i) in pali.rows" :key="i" class="">
              <td v-html="row.text" class="html border p-2" :class="intToType[row.type] + ' ' + pali.script"></td>
              <td class="border align-middle">
                <div class="flex flex-col items-center gap-1" :class="{'bg-red-100': eng.editingIndex == i}">
                  <Trash2Icon @click="eng.text.splice(i, 1)" class="w-4 text-gray-500 hover:text-red-500 cursor-pointer"/>
                  <PencilIcon @click="eng.editingIndex = eng.editingIndex != i ? i : -1" :class="{'text-red-600': eng.editingIndex == i}" 
                      class="w-5 text-gray-500 hover:text-red-500 cursor-pointer"/>
                  <MergeIcon @click="mergeEng(i)" class="w-4 text-gray-500 hover:text-red-500 cursor-pointer"/>
                </div>
              </td>
              <td class="border p-2">
                <textarea v-if="eng.editingIndex == i && i < eng.text.length" v-model="eng.text[i]" @input="checkEngSplit(i)" rows="5" class="p-1 w-full"></textarea>
                <div v-else v-html="engTextToHtml(eng.text[i] || '')" @click="eng.editingIndex = i" :class="intToType[row.type]" class="html"></div>
              </td>
            </tr>
            <tr>
              <td><button @click="loadSqlite(pali.section + 1)" class="bg-blue-500 text-white px-4 py-2 mt-5">Load Next Section</button></td>
            </tr>
        </tbody>
      </table>

      <div>
          <button @click="saveAlignmentToJson" class="bg-blue-500 text-white px-4 py-2 mt-5 rounded">Save Alignment</button>
          <!-- File input to load JSON -->
          <input @change="loadAlignmentFromFile" type="file" id="load-file" accept=".json" class="mt-5 bg-gray-200 px-3 py-2">
      </div>
    
    </div>
  </template>
  
<script setup>
import { reactive, ref } from 'vue'
import { intToType, queryDb, textToHtml } from '../../src/utils';
import { Script, TextProcessor, convert } from '../../src/pali-converter';
import { EraserIcon, LanguagesIcon, MergeIcon, PencilIcon, Trash2Icon } from 'lucide-vue-next';

const pali = reactive({rows: [], section: 0, key: 'dn-1-2', script: Script.SINH, rowsPerSection: 50})
const eng = reactive({text: [], editingIndex: -1, url: 'https://www.dhammatalks.org/suttas/DN/DN02.html',})

const resetPali = () => {
  pali.rows = []
  pali.section = 0
}
const mergeEng = (i) => {
  eng.text[i] = eng.text[i] + ' ' + eng.text[i+1]
  eng.text.splice(i+1, 1)
}
const checkEngSplit = (i) => {
  const parts = eng.text[i].split('#')
  if (parts.length == 1) return
  eng.text[i] = parts[0]
  eng.text.splice(i+1, 0, parts[1])
}
const toggleScript = () => {
  pali.script = pali.script == Script.SINH ? Script.LATN : Script.SINH
  resetPali()
  loadSqlite(0)
}
const handleKeyup = (event) => {
  if (eng.editingIndex < 0 || document.activeElement.tagName != 'TEXTAREA') return
  if (event.key === 'F2') {
      document.execCommand('insertText', false, '#')
  } else if (event.key == 'F1') {
    document.execCommand('insertText', false, '[missing translation]')
  }
}

// Function to load alignment.json file and display it in the table
function loadAlignmentFromFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = JSON.parse(e.target.result);
            eng.text = data.eng.text
            Object.keys(pali).forEach(k => pali[k] = data.pali[k])
        };
        reader.readAsText(file);
    }
}
// Function to save the alignment to a JSON file
function saveAlignmentToJson() {
    const json = JSON.stringify({eng, pali}, null, '\t');
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'alignment.json';
    link.click();
    link.remove()
}

async function scrapeWebData() {
    const proxyUrl = 'https://cors-proxy.fringe.zone/'
    const response = await fetch(proxyUrl + eng.url);
    const html = await response.text()
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html')
    const sutta = doc.getElementById('sutta')
    const paragraphs = Array.from(sutta.querySelectorAll('p,h1,h2,h3,h4,h5')).map(p => p.innerText);
    //console.log(paragraphs)
    eng.text = paragraphs
}

function engTextToHtml(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, '<span class="bold">$1</span>') // using the markdown styles
  text = text.replace(/__(.*?)__/g, '<span class="underlined">$1</span>') // underline
  text = text.replace(/(\[missing translation\])/g, '<span class="red">$1</span>')
  return text.replace(/\n/g, '<br>')
}


async function loadSqlite(section) {
  pali.section = section
  try {
    const treeNodes = await queryDb(`SELECT * FROM tree WHERE key = '${pali.key}'`)
    console.assert(treeNodes.length == 1, `expected one tree node for ${pali.key} but got ${treeNodes.length}`)
    const node = treeNodes[0]

    const query = `SELECT * FROM sinh WHERE book_id = ${node.book_id} AND 
      (page = ${node.page} AND seq >= ${node.seq} OR page > ${node.page}) 
      ORDER BY page ASC, seq ASC LIMIT ${pali.rowsPerSection} OFFSET ${pali.rowsPerSection * pali.section}`

    let rows = await queryDb(query)
    rows = rows.filter(row => intToType[row.type] != 'footnote') // remove footnotes
    rows.forEach(row => row.text = textToHtml(row.text, row.page))
    if (pali.script != Script.SINH) {
        rows.forEach(row => row.text = convert(row.text, pali.script, Script.SINH))
    } else {
        rows.forEach(row => row.text = TextProcessor.beautify(row.text, Script.SINH))
    }
    if (pali.section > 0) {
      pali.rows = [...pali.rows, ...rows]
    } else {
      pali.rows = rows
    }
    
  } catch(e) {
    console.error(e)
  }
}
</script>
  
<style scoped>
.centered { @apply text-center font-bold }
.heading { @apply font-bold text-orange-800 dark:text-orange-300 text-center; }
.paragraph { @apply indent-6 pl-0 }

.gatha { @apply indent-0 pl-6 text-left }
.gatha[level="2"] { @apply pl-20 }

.unindented { @apply indent-0 pl-0 text-left }
.html.sinh { font-family: 'sinhala'; font-size: 17px;}
</style>

<style>
.html .fn-pointer { @apply text-sm text-sky-800 dark:text-sky-300 hover:text-sky-500 cursor-pointer px-1 align-super relative }
.html .underlined { @apply underline underline-offset-4 decoration-red-900 dark:decoration-red-300 }
.html .strike { text-decoration: line-through; text-decoration-color: var(--v-accent-base); }
.html .bold { @apply font-bold }
.html .red { @apply text-red-700 }
</style>
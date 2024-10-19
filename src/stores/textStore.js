import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { queryDb, intToType, textToHtml } from '@/utils';
import { useTreeStore } from './treeStore';
import { useRouter } from 'vue-router'
import { convert, Script } from '@/pali-converter'
import { useSettingsStore } from '@/stores/savedStore'
import { TextProcessor } from '../pali-converter';

const pagesPerSection = 3

export const useTextStore = defineStore('textStore', () => {
    const tabs = reactive([]), activeTab = ref(-1)
    const treeStore = useTreeStore()
    const router = useRouter()

    async function addTab(key, script = null) {
        const node = treeStore.nodes[key], settingsStore = useSettingsStore()
        const newTab = {node, rows: [], footnotes: {}, error: '', isLoading: ref(false), section: 0, 
            paliScript: script || settingsStore.settings.paliScript}
        if (settingsStore.settings.splitType == 'single' && tabs.length) {
            tabs[tabs.length - 1] = newTab // replace the last tab
        } else {
            tabs.push(newTab)
        }
        activeTab.value = tabs.length - 1
        await fetchTextSection(tabs.length - 1)
    }

    const getTabLink = (tabIndex) => `/${tabs[tabIndex].paliScript}/${tabs[tabIndex].node.key}`
    function getActiveLink() {
        if (activeTab.value >= 0) {
            return getTabLink(activeTab.value)
        }
        return `/${useSettingsStore().settings.paliScript}` // all tabs closed or no tabs opened
    }

    function removeTab(tabIndex) {
        tabs.splice(tabIndex, 1)
        if (tabIndex == activeTab.value) {
            activeTab.value = tabs.length - 1 // make the last tab active
        } else if (activeTab.value >= tabIndex) {
            activeTab.value--
        } // else do nothing

        router.replace(getActiveLink())
        console.log(`activeTab ${activeTab.value}, tabs length ${tabs.length}`)
    }
    
    function makeActive(tabIndex) {
        activeTab.value = tabIndex
        router.replace(getTabLink(tabIndex))
    }
    
    

    async function fetchTextSection(tabIndex) {
        const tab = tabs[tabIndex]
        if (!tab.node || tab.section < 0 || tab.isLoading) return
        
        try {
            const {book_id, page, seq = 0} = tab.node
            const firstSectionSelect = tab.section ? '' : `page = ${page} AND seq >= ${seq} OR `,
                sectionStartPage = page + tab.section * pagesPerSection + 1

            const query = `SELECT * FROM text WHERE book_id = ${book_id} AND language = 0 AND 
                (${firstSectionSelect} page BETWEEN ${sectionStartPage} and ${sectionStartPage + pagesPerSection - 1}) ORDER BY page ASC, seq ASC`
            console.log(query)
    
            tab.isLoading = true
            const rows = await queryDb(query)
            if (!rows.length) {
                tab.section = -1 // can not fetch further - book finished
            } else {
                appendRows(tab, rows)
                tab.section++
            }
            tab.error = ''
        } catch(e) {
            console.log(e)
            tab.error = e.message
        } finally {
            tab.isLoading = false
        }
    }

    // mostly doing footnotes processing
    function appendRows(tab, rows) {
        if (tab.paliScript != Script.SINH) {
            rows.forEach(row => row.text = convert(row.text, tab.paliScript, Script.SINH))
        } else {
            rows.forEach(row => row.text = TextProcessor.beautify(row.text, Script.SINH))
        }
        rows.forEach(row => {
            row.text = textToHtml(row.text, row.page)
            row.type = intToType[row.type]
        })
        rows = rows.filter(row => {
            if (row.type == 'footnote') {
                const match = /^([^\s\.\{\}]+)[\.\s]([\s\S]+)$/.exec(row.text) // [\s\S]+ needed for matching new lines
                if (!match) return false // footnote will be ignored and will not accessible
                let [_0, number, content] = match
                if (row.language == 0 && content) { // find available abbr and create spans for those
                    const abbrs = content.split(';').map(variant => variant.split('–')).filter(vpart => vpart.length > 1)
                        .map(vpart => vpart[1].split(',')).flat().map(a => a.trim())
                        //.filter(a => footnoteAbbreviationKeys.includes(a)) - can't check because the abbr are already in another script
                    if (abbrs.length) content = content.replace(new RegExp(`(${abbrs.join('|')})`, 'g'), '<span class="abbr-pointer">$1</span>')
                }
                tab.footnotes[row.page] = tab.footnotes[row.page] || {}
                tab.footnotes[row.page][number] = {content, row}
                return false
            }
            return true
        })
        tab.rows = [...tab.rows, ...rows]
    }

    async function changeScript(newScript) {
        if (activeTab.value < 0) return
        const tab = tabs[activeTab.value]
        if (tab.paliScript == newScript) return
        tab.paliScript = newScript
        tab.section = 0
        tab.rows = []
        router.replace(`/${newScript}/${tab.node.key}`)
        await fetchTextSection(activeTab.value)
        // instead of converting again which could cause conversion errors, we refetch the text from server 
        //tab.rows.forEach(row => row.text = convert(row.text, newScript, tab.paliScript))
    }

    return {
        tabs,
        activeTab,
        addTab,
        removeTab,
        makeActive,
        fetchTextSection,
        changeScript,
        getActiveLink,
    };
});

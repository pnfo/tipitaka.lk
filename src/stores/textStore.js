import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { queryDb, intToType, textToHtml } from '@/utils';
import { useTreeStore } from './treeStore';
import { useRouter } from 'vue-router'
import { convert, Script, isScript } from '@/pali-converter'
import { useSettingsStore } from '@/stores/savedStore'
import { TextProcessor } from '../pali-converter';

const pagesPerSection = 8

export const useTextStore = defineStore('textStore', () => {
    const tabs = reactive([]), activeTab = ref(-1)
    const treeStore = useTreeStore()
    const router = useRouter()

    function addTab(key, options = {}) {
        const node = treeStore.nodes[key], settingsStore = useSettingsStore()
        const collections = node.translations.includes(settingsStore.settings.translation) ? // default to use if not provided in the options
            [settingsStore.settings.paliScript, settingsStore.settings.translation] : [settingsStore.settings.paliScript]
        const newTab = {node, data: [], section: 0, collections, xsVisibleCollection: 0, ...options}

        if (settingsStore.settings.splitType == 'single' && tabs.length) {
            tabs[tabs.length - 1] = newTab // replace the last tab
        } else {
            tabs.push(newTab)
        }
        activeTab.value = tabs.length - 1
        fetchTextSection(tabs.length - 1) // no need to await
        return getTabLink(tabs.length - 1)
    }

    const getTabLink = (tabIndex) => `/${tabs[tabIndex].collections[0]}/${tabs[tabIndex].node.key}`
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
    function removeCollection(tabIndex, collName) {
        const collIndex = tabs[tabIndex].collections.indexOf(collName)
        if (tabs[tabIndex].collections.length < 2 || collIndex < 0) return
        if (collIndex == tabs[tabIndex].xsVisibleCollection) tabs[tabIndex].xsVisibleCollection = 0 // make the first coll visible
        tabs[tabIndex].collections.splice(collIndex, 1)
        tabs[tabIndex].data.splice(collIndex, 1)
        if (collIndex == 0) router.replace(getActiveLink())
    }
    

    async function fetchTextSection(tabIndex) {
        const tab = tabs[tabIndex]
        if (!tab.node || tab.section < 0) return
        
        const {book_id, page, seq = 0, end_page, end_seq} = tab.node, nextSection = tab.section + 1
        tab.collections.forEach(async (coll, i) => {
            if (!tab.data[i]) tab.data[i] = { rows: [], footnotes: {}, isLoading: false, error: '', hasEnded: false, }
            if (tab.data[i].isLoading || tab.data[i].hasEnded) return
            try {
                const tableName = isScript(coll) ? 'pali' : coll

                const pageSeqFilter = []
                if (tab.isFullSutta) {
                    if (end_page - page > 1) pageSeqFilter.push(`page BETWEEN ${page + 1} and ${end_page - 1}`)
                    if (end_page == page) {
                        pageSeqFilter.push(`page = ${page} AND seq >= ${seq} AND seq <= ${end_seq}`)
                    } else {
                        pageSeqFilter.push(`page = ${page} AND seq >= ${seq}`)
                        pageSeqFilter.push(`page = ${end_page} AND seq <= ${end_seq}`)
                    }
                } else {
                    if (tab.section == 0) pageSeqFilter.push(`page = ${page} AND seq >= ${seq}`)
                    const sectionStartPage = page + tab.section * pagesPerSection + 1
                    pageSeqFilter.push(`page BETWEEN ${sectionStartPage} and ${sectionStartPage + pagesPerSection - 1}`)
                }
                
                const query = `SELECT * FROM ${tableName} WHERE book_id = ${book_id} AND (${pageSeqFilter.join(' OR ')}) ORDER BY page ASC, seq ASC;`
                console.log(query)
        
                tab.data[i].isLoading = true
                const rows = await queryDb(query)
                if (rows.length) {
                    appendRows(tab.data[i], rows, coll)
                    tab.section = nextSection // only if at least one collection still has more data
                }
                if (!rows.length || tab.isFullSutta) {
                    tab.data[i].hasEnded = true
                    //tab.section = -1 // can not fetch further - book finished
                }
                tab.data[i].error = ''
            } catch(e) {
                console.log(e)
                tab.data[i].error = e.message
            } finally {
                tab.data[i].isLoading = false
            }
        })
    }

    // mostly doing footnotes processing
    function appendRows(data, rows, coll) {
        if (isScript(coll)) {
            if (coll != Script.SINH) {
                rows.forEach(row => row.text = convert(row.text, coll, Script.SINH))
            } else {
                rows.forEach(row => row.text = TextProcessor.beautify(row.text, Script.SINH))
            }
        }
        rows.forEach(row => {
            row.text = textToHtml(row.text, row.page, coll)
            row.type = intToType[row.type]
        })
        rows = rows.filter(row => {
            if (row.type == 'footnote') {
                const match = /^([^\s\.\{\}]+)[\.\s]([\s\S]+)$/.exec(row.text) // [\s\S]+ needed for matching new lines
                if (!match) return false // footnote will be ignored and will not accessible
                let [_0, number, content] = match
                if (content) { // find available abbr and create spans for those
                    const abbrs = content.split(';').map(variant => variant.split('–')).filter(vpart => vpart.length > 1)
                        .map(vpart => vpart[1].split(',')).flat().map(a => a.trim())
                        //.filter(a => footnoteAbbreviationKeys.includes(a)) - can't check because the abbr are already in another script
                    if (abbrs.length && isScript(coll)) 
                        content = content.replace(new RegExp(`(${abbrs.join('|')})`, 'g'), `<span class="abbr-pointer" coll="${coll}">$1</span>`)
                }
                data.footnotes[row.page] = data.footnotes[row.page] || {}
                data.footnotes[row.page][number] = {content, row}
                return false
            }
            return true
        })
        data.rows = [...data.rows, ...rows]
    }

    async function changeScript(newScript) {
        if (activeTab.value < 0) return
        const tab = tabs[activeTab.value]
        if (tab.collections.every(coll => coll == newScript)) return // same as newscript
        if (tab.collections.every(coll =>!isScript(coll))) { // not script
            tab.collections.push(newScript) // add as a new collection
        } else {
            tab.collections = tab.collections.map(coll => isScript(coll) ? newScript : coll)
        }
        await reloadData(tab, tab.collections.indexOf(newScript))
        // instead of converting again which could cause conversion errors, we refetch the text from server 
        //tab.rows.forEach(row => row.text = convert(row.text, newScript, tab.paliScript))
    }
    async function addCollection(coll) {
        if (activeTab.value < 0) return
        const tab = tabs[activeTab.value]
        if (!isScript(coll) && !tab.node.translations.includes(coll)) return // this trans is not available
        if (tab.collections.includes(coll)) {
            tab.xsVisibleCollection = tab.collections.indexOf(coll) // make it visible to user before 
            return
        }
        tab.collections.push(coll)
        await reloadData(tab, tab.collections.length - 1)
    }
    async function reloadData(tab, changedCollIndex) {
        tab.section = 0 // clear out the data
        tab.data = []
        tab.xsVisibleCollection = changedCollIndex // make the new coll visible on small screens
        router.replace(getTabLink(activeTab.value))
        await fetchTextSection(activeTab.value)
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
        removeCollection,
        addCollection,
    };
});
